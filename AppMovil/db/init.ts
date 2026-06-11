import { File, Paths } from "expo-file-system";
import { type SQLiteDatabase } from "expo-sqlite";

const CURRENT_VERSION = 2;

async function getVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    return row?.user_version ?? 0;
  } catch { return 0; }
}

async function setVersion(db: SQLiteDatabase, v: number): Promise<void> {
  try { await db.runAsync(`PRAGMA user_version = ${v}`); } catch { /* ok */ }
}

/** Check if a column exists in a table */
async function hasColumn(db: SQLiteDatabase, table: string, column: string): Promise<boolean> {
  try {
    const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    return cols.some((c) => c.name === column);
  } catch { return false; }
}

export async function ensureDatabaseSchema(db: SQLiteDatabase): Promise<void> {
  const version = await getVersion(db);

  if (version >= CURRENT_VERSION) {
    await logTables(db);
    return;
  }

  // ── v1: FTS standalone (only if source tables have expected columns) ───
  if (version < 1) {
    const youcatHasId = await hasColumn(db, "youcat", "id");
    const cicHasId = await hasColumn(db, "catecismo_cic", "id");

    if (!youcatHasId || !cicHasId) {
      console.warn(
        "Migration v1 SKIPPED – source tables missing expected columns. " +
        "Run 'EXPAND DATABASE' from the test page to fix.",
      );
    } else {
      console.log("Migration v1: recreating FTS tables as standalone…");

      for (const t of [
        "youcat_ai", "youcat_ad", "youcat_au",
        "catecismo_cic_ai", "catecismo_cic_ad", "catecismo_cic_au",
      ]) {
        try { await db.runAsync(`DROP TRIGGER IF EXISTS ${t}`); } catch { /* ok */ }
      }

      for (const t of ["youcat_fts", "catecismo_cic_fts"]) {
        try { await db.runAsync(`DROP TABLE IF EXISTS ${t}`); } catch { /* ok */ }
      }

      try {
        await db.runAsync(
          "CREATE VIRTUAL TABLE youcat_fts USING fts5(id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo)",
        );
        const youcatRows = await db.getAllAsync<any>("SELECT rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo FROM youcat");
        for (const r of youcatRows) {
          await db.runAsync(
            "INSERT INTO youcat_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [r.rowid, r.id, r.pregunta_nro, r.pregunta_texto, r.respuesta_texto, r.parte, r.capitulo],
          );
        }
      } catch (e) {
        console.warn("Failed to create youcat_fts:", e);
      }

      try {
        await db.runAsync(
          "CREATE VIRTUAL TABLE catecismo_cic_fts USING fts5(id, parte, seccion, capitulo, articulo, texto)",
        );
        const cicRows = await db.getAllAsync<any>("SELECT rowid, id, parte, seccion, capitulo, articulo, texto FROM catecismo_cic");
        for (const r of cicRows) {
          await db.runAsync(
            "INSERT INTO catecismo_cic_fts(rowid, id, parte, seccion, capitulo, articulo, texto) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [r.rowid, r.id, r.parte, r.seccion, r.capitulo, r.articulo, r.texto],
          );
        }
      } catch (e) {
        console.warn("Failed to create catecismo_cic_fts:", e);
      }
    }

    await setVersion(db, 1);
  }

  // ── v2: Add `parte` column if missing ─────────────────────────────────
  if (version < 2) {
    console.log("Migration v2: ensuring parte column…");
    try { await db.runAsync("ALTER TABLE youcat ADD COLUMN parte TEXT"); }
    catch { /* already exists */ }
    await setVersion(db, 2);
  }

  await logTables(db);
}

/** Delete the database file so the next open copies fresh from assets */
export async function forceReCopy(): Promise<void> {
  const dbFile = new File(Paths.document, "SQLite", "iglesia_digital.db");
  if (dbFile.exists) {
    dbFile.delete();
    console.log("DB deleted, will re-copy from assets on next open");
  }
  // delete WAL and SHM too
  for (const ext of ["-wal", "-shm"]) {
    const extraFile = new File(Paths.document, "SQLite", `iglesia_digital.db${ext}`);
    if (extraFile.exists) {
      try { extraFile.delete(); } catch { /* ok */ }
    }
  }
}

/** Return a diagnosis string describing table/column state */
export async function diagnose(db: SQLiteDatabase): Promise<string> {
  const lines: string[] = [];
  try {
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    lines.push(`Tablas (${tables.length}): ${tables.map(t => t.name).join(", ")}`);

    for (const table of ["youcat", "catecismo_cic"]) {
      if (tables.some(t => t.name === table)) {
        const cols = await db.getAllAsync<{ name: string; type: string }>(
          `PRAGMA table_info(${table})`,
        );
        lines.push(`${table}: ${cols.map(c => `${c.name} (${c.type})`).join(", ")}`);
        lines.push(`  → tiene 'id'? ${cols.some(c => c.name === "id") ? "SÍ" : "NO"}`);
      }
    }

    for (const table of ["youcat_fts", "catecismo_cic_fts"]) {
      lines.push(`${table}: ${tables.some(t => t.name === table) ? "EXISTE" : "NO EXISTE"}`);
    }
  } catch (e: any) {
    lines.push(`Error en diagnóstico: ${e.message}`);
  }
  return lines.join("\n");
}

export async function logTables(db: SQLiteDatabase): Promise<void> {
  try {
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    console.log("DB tables:", tables.map((t) => t.name).join(", "));
  } catch { /* ignore */ }
}

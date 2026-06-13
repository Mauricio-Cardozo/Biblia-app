import { File, Paths } from "expo-file-system";
import { type SQLiteDatabase } from "expo-sqlite";

const CURRENT_VERSION = 3;

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

  // ══════════════════════════════════════════════════════════════════════════
  // Schema migrations (versioned, one-time)
  // ══════════════════════════════════════════════════════════════════════════

  // ── v1: Drop old content-sync triggers + FTS tables ───────────────────
  if (version < 1) {
    console.log("Migration v1: cleaning old content-sync triggers…");
    for (const t of [
      "youcat_ai", "youcat_ad", "youcat_au",
      "catecismo_cic_ai", "catecismo_cic_ad", "catecismo_cic_au",
    ]) {
      try { await db.runAsync(`DROP TRIGGER IF EXISTS ${t}`); } catch { /* ok */ }
    }
    for (const t of ["youcat_fts", "catecismo_cic_fts"]) {
      try { await db.runAsync(`DROP TABLE IF EXISTS ${t}`); } catch { /* ok */ }
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

  // ── v3: Add `novenas` + `novena_dias` tables if missing ──────────────
  if (version < 3) {
    console.log("Migration v3: adding novenas tables…");
    try {
      await db.runAsync(
        "CREATE TABLE IF NOT EXISTS novenas (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, url TEXT)",
      );
      await db.runAsync(
        "CREATE TABLE IF NOT EXISTS novena_dias (id INTEGER PRIMARY KEY AUTOINCREMENT, novena_id INTEGER NOT NULL, dia INTEGER NOT NULL, titulo TEXT, texto TEXT NOT NULL, FOREIGN KEY (novena_id) REFERENCES novenas(id))",
      );
    } catch (e) {
      console.warn("Migration v3 failed:", e);
    }
    await setVersion(db, 3);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FTS tables: auto-recover on every launch if missing
  // ══════════════════════════════════════════════════════════════════════════
  await ensureFTS(db);
  await logTables(db);
}

async function ensureFTS(db: SQLiteDatabase): Promise<void> {
  const fts = await areFTSReady(db);

  if (!fts.youcat) {
    console.log("Rebuilding youcat_fts (missing)…");
    try {
      await db.runAsync(
        "CREATE VIRTUAL TABLE IF NOT EXISTS youcat_fts USING fts5(id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo)",
      );
      const rows = await db.getAllAsync<any>(
        "SELECT rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo FROM youcat",
      );
      for (const r of rows) {
        await db.runAsync(
          "INSERT INTO youcat_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [r.rowid, r.id, r.pregunta_nro, r.pregunta_texto, r.respuesta_texto, r.parte, r.capitulo],
        );
      }
    } catch (e) {
      console.warn("Failed to rebuild youcat_fts:", e);
    }
  }

  if (!fts.cic) {
    console.log("Rebuilding catecismo_cic_fts (missing)…");
    try {
      await db.runAsync(
        "CREATE VIRTUAL TABLE IF NOT EXISTS catecismo_cic_fts USING fts5(id, parte, seccion, capitulo, articulo, texto)",
      );
      const rows = await db.getAllAsync<any>(
        "SELECT rowid, id, parte, seccion, capitulo, articulo, texto FROM catecismo_cic",
      );
      for (const r of rows) {
        await db.runAsync(
          "INSERT INTO catecismo_cic_fts(rowid, id, parte, seccion, capitulo, articulo, texto) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [r.rowid, r.id, r.parte, r.seccion, r.capitulo, r.articulo, r.texto],
        );
      }
    } catch (e) {
      console.warn("Failed to rebuild catecismo_cic_fts:", e);
    }
  }
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

/** Quick check: are FTS5 tables available for search? */
export async function areFTSReady(db: SQLiteDatabase): Promise<{
  youcat: boolean;
  cic: boolean;
}> {
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('youcat_fts', 'catecismo_cic_fts')",
  );
  const names = tables.map(t => t.name);
  return {
    youcat: names.includes("youcat_fts"),
    cic: names.includes("catecismo_cic_fts"),
  };
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

    const ftsStatus = await areFTSReady(db);
    if (ftsStatus.youcat && ftsStatus.cic) {
      lines.push(`\n✅ FTS5 disponible: YOUCAT + CIC`);
    } else {
      const missing = [ftsStatus.youcat ? "" : "YOUCAT", ftsStatus.cic ? "" : "CIC"].filter(Boolean);
      lines.push(`\n❌ FTS5 NO disponible: faltan ${missing.join(", ")}`);
      lines.push(`   → Andá a "Rebuild FTS" para recrearlas.`);
      lines.push(`   → Si el rebuild falla, tu dispositivo no soporta FTS5.`);
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

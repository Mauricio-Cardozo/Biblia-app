import { File, Paths } from "expo-file-system";
import { type SQLiteDatabase } from "expo-sqlite";

const CURRENT_VERSION = 5;

async function getVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    return row?.user_version ?? 0;
  } catch { return 0; }
}

async function setVersion(db: SQLiteDatabase, v: number): Promise<void> {
  try { await db.runAsync(`PRAGMA user_version = ${v}`); } catch { /* ok */ }
}

export async function ensureDatabaseSchema(db: SQLiteDatabase): Promise<void> {
  const version = await getVersion(db);

  // ══════════════════════════════════════════════════════════════════════════
  // Schema migrations (versioned, one-time)
  // ══════════════════════════════════════════════════════════════════════════

  // ── v1: Drop old content-sync triggers + FTS tables ───────────────────
  if (version < 1) {
    if (__DEV__) console.log("Migration v1: cleaning old content-sync triggers…");
    try {
      for (const t of [
        "catecismo_cic_ai", "catecismo_cic_ad", "catecismo_cic_au",
      ]) {
        await db.runAsync(`DROP TRIGGER IF EXISTS ${t}`);
      }
      for (const t of ["catecismo_cic_fts"]) {
        await db.runAsync(`DROP TABLE IF EXISTS ${t}`);
      }
      await setVersion(db, 1);
    } catch { /* retry on next launch */ }
  }

  // ── v3: Add `novenas` + `novena_dias` tables if missing ──────────────
  if (version < 3) {
    if (__DEV__) console.log("Migration v3: adding novenas tables…");
    try {
      await db.runAsync(
        "CREATE TABLE IF NOT EXISTS novenas (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, url TEXT)",
      );
      await db.runAsync(
        "CREATE TABLE IF NOT EXISTS novena_dias (id INTEGER PRIMARY KEY AUTOINCREMENT, novena_id INTEGER NOT NULL, dia INTEGER NOT NULL, titulo TEXT, texto TEXT NOT NULL, FOREIGN KEY (novena_id) REFERENCES novenas(id))",
      );
      await setVersion(db, 3);
    } catch (e) {
      if (__DEV__) console.warn("Migration v3 failed:", e);
    }
  }

  // ── v4: Add `lecturas` table if missing ─────────────────────────────
  if (version < 4) {
    if (__DEV__) console.log("Migration v4: adding lecturas table…");
    try {
      await db.runAsync(
        "CREATE TABLE IF NOT EXISTS lecturas (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT NOT NULL UNIQUE, url TEXT, titulo_misa TEXT, primera_lectura_ref TEXT, primera_lectura TEXT, salmo TEXT, aleluia TEXT, evangelio_ref TEXT, evangelio TEXT, comentario_papal TEXT, creado_en TEXT DEFAULT (datetime('now','localtime')))",
      );
      await setVersion(db, 4);
    } catch (e) {
      if (__DEV__) console.warn("Migration v4 failed:", e);
    }
  }

  // ── v5: Add Misal Romano tables ──────────────────────────────────
  if (version < 5) {
    if (__DEV__) console.log("Migration v5: adding misal tables…");
    try {
      await db.runAsync("CREATE TABLE IF NOT EXISTS misal_ordinario (id INTEGER PRIMARY KEY AUTOINCREMENT, seccion TEXT NOT NULL, subseccion TEXT, rol TEXT NOT NULL DEFAULT 'rubrica', texto TEXT NOT NULL, orden INTEGER NOT NULL)");
      await db.runAsync("CREATE TABLE IF NOT EXISTS misal_propio (id INTEGER PRIMARY KEY AUTOINCREMENT, temporada TEXT NOT NULL, temporada_label TEXT, dia TEXT, colecta TEXT, oracion_ofrendas TEXT, postcomunion TEXT, prefacio TEXT, antifona_entrada TEXT, antifona_comunion TEXT)");
      await db.runAsync("CREATE TABLE IF NOT EXISTS misal_prefacios (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, texto TEXT NOT NULL)");
      await db.runAsync("CREATE TABLE IF NOT EXISTS misal_plegarias (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, texto TEXT NOT NULL)");
      await setVersion(db, 5);
    } catch (e) {
      if (__DEV__) console.warn("Migration v5 failed:", e);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FTS tables: auto-recover on every launch if missing
  // ══════════════════════════════════════════════════════════════════════════
  await ensureFTS(db);
  await logTables(db);
}

async function ensureFTS(db: SQLiteDatabase): Promise<void> {
  const fts = await areFTSReady(db);

  if (!fts.cic) {
    if (__DEV__) console.log("Rebuilding catecismo_cic_fts (missing)…");
    try {
      await db.runAsync("DROP TABLE IF EXISTS catecismo_cic_fts");
      await db.runAsync(
        "CREATE VIRTUAL TABLE IF NOT EXISTS catecismo_cic_fts USING fts5(id, parte, seccion, capitulo, articulo, texto)",
      );
      const rows = await db.getAllAsync<any>(
        "SELECT rowid as id, parte, seccion, capitulo, articulo, texto FROM catecismo_cic",
      );
      for (const r of rows) {
        await db.runAsync(
          "INSERT INTO catecismo_cic_fts(rowid, id, parte, seccion, capitulo, articulo, texto) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [r.id, r.id, r.parte, r.seccion, r.capitulo, r.articulo, r.texto],
        );
      }
    } catch (e) {
      if (__DEV__) console.warn("Failed to rebuild catecismo_cic_fts:", e);
    }
  }
}

/** Delete the database file so the next open copies fresh from assets */
export async function forceReCopy(): Promise<void> {
  const dbFile = new File(Paths.document, "SQLite", "iglesia_digital.db");
  if (dbFile.exists) {
    dbFile.delete();
    if (__DEV__) console.log("DB deleted, will re-copy from assets on next open");
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
async function areFTSReady(db: SQLiteDatabase): Promise<{ cic: boolean }> {
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = 'catecismo_cic_fts'",
  );
  return { cic: tables.some(t => t.name === "catecismo_cic_fts") };
}

/** Return a diagnosis string describing table/column state */
export async function diagnose(db: SQLiteDatabase): Promise<string> {
  const lines: string[] = [];
  try {
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    lines.push(`Tablas (${tables.length}): ${tables.map(t => t.name).join(", ")}`);

    for (const table of ["catecismo_cic"]) {
      if (tables.some(t => t.name === table)) {
        const cols = await db.getAllAsync<{ name: string; type: string }>(
          `PRAGMA table_info(${table})`,
        );
        lines.push(`${table}: ${cols.map(c => `${c.name} (${c.type})`).join(", ")}`);
        lines.push(`  → tiene 'id'? ${cols.some(c => c.name === "id") ? "SÍ" : "NO"}`);
      }
    }

    for (const table of ["catecismo_cic_fts"]) {
      lines.push(`${table}: ${tables.some(t => t.name === table) ? "EXISTE" : "NO EXISTE"}`);
    }

    // --- Parte distribution ---
    try {
      const cp = await db.getAllAsync<{ parte: string; cnt: number }>(
        "SELECT parte, COUNT(*) as cnt FROM catecismo_cic GROUP BY parte ORDER BY id",
      );
      lines.push(`\nCIC partes:`);
      for (const r of cp) {
        const label = r.parte === "" ? "(vacío)" : r.parte;
        lines.push(`  · "${label}" → ${r.cnt} numerales`);
      }
    } catch (e: any) { lines.push(`\nCIC partes: ERROR ${e.message}`); }

    // --- FTS5 status ---
    const ftsStatus = await areFTSReady(db);
    if (ftsStatus.cic) {
      lines.push(`\n✅ FTS5 disponible: CIC`);
    } else {
      lines.push(`\n❌ FTS5 NO disponible: CIC`);
      lines.push(`   → Andá a "Rebuild FTS" para recrearlas.`);
      lines.push(`   → Si el rebuild falla, tu dispositivo no soporta FTS5.`);
    }
  } catch (e: any) {
    lines.push(`Error en diagnóstico: ${e.message}`);
  }
  return lines.join("\n");
}

/** CIC repair is no longer needed — data is correct from scraper. */

export async function logTables(db: SQLiteDatabase): Promise<void> {
  try {
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    if (__DEV__) console.log("DB tables:", tables.map((t) => t.name).join(", "));
  } catch { /* ignore */ }
}

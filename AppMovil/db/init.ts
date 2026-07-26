import { File, Paths } from "expo-file-system";
import { type SQLiteDatabase } from "expo-sqlite";

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

  // ── v2 (skipped): youcat.parte column — no-op, YOUCAT tables dropped in v4
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

  // ── v6: Add santos table ─────────────────────────────────────
  if (version < 6) {
    if (__DEV__) console.log("Migration v6: adding santos table…");
    try {
      await db.runAsync(
        "CREATE TABLE IF NOT EXISTS santos (id INTEGER PRIMARY KEY AUTOINCREMENT, mes INTEGER NOT NULL, dia INTEGER NOT NULL, nombre TEXT NOT NULL, titulo TEXT, biografia TEXT NOT NULL)",
      );
      await setVersion(db, 6);
    } catch {}
  }

  // ── v7: Add misal_santos table ───────────────────────────────
  if (version < 7) {
    if (__DEV__) console.log("Migration v7: adding misal_santos table…");
    try {
      await db.runAsync(
        "CREATE TABLE IF NOT EXISTS misal_santos (id INTEGER PRIMARY KEY AUTOINCREMENT, mes INTEGER NOT NULL, dia INTEGER NOT NULL, nombre TEXT NOT NULL, titulo TEXT, rango TEXT, antifona_entrada TEXT, colecta TEXT, oracion_ofrendas TEXT, prefacio TEXT, antifona_comunion TEXT, postcomunion TEXT)",
      );
      await setVersion(db, 7);
    } catch {}
  }

  // ── v8: Add YOUCAT table ─────────────────────────────────────
  if (version < 8) {
    if (__DEV__) console.log("Migration v8: adding youcat table…");
    try {
      await db.runAsync("CREATE TABLE IF NOT EXISTS youcat (id INTEGER PRIMARY KEY, parte_id INTEGER NOT NULL, parte TEXT NOT NULL, seccion TEXT NOT NULL DEFAULT '', capitulo TEXT NOT NULL DEFAULT '', pregunta TEXT NOT NULL, respuesta TEXT NOT NULL, comentario TEXT NOT NULL DEFAULT '')");
      await setVersion(db, 8);
    } catch (e: unknown) {
      if (__DEV__) console.warn("Migration v8 failed:", e);
    }
  }

  // ── v9: Add misal_guia table ────────────────────────────────────
  if (version < 9) {
    if (__DEV__) console.log("Migration v9: adding misal_guia table…");
    try {
      await db.runAsync("CREATE TABLE IF NOT EXISTS misal_guia (id INTEGER PRIMARY KEY AUTOINCREMENT, seccion TEXT NOT NULL, titulo TEXT NOT NULL, texto TEXT NOT NULL, orden INTEGER NOT NULL)");
      await setVersion(db, 9);
    } catch (e: unknown) {
      if (__DEV__) console.warn("Migration v9 failed:", e);
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

  if (!fts.misalPropio) {
    if (__DEV__) console.log("Rebuilding misal_propio_fts (missing)…");
    try {
      await db.runAsync("DROP TABLE IF EXISTS misal_propio_fts");
      await db.runAsync(
        "CREATE VIRTUAL TABLE IF NOT EXISTS misal_propio_fts USING fts5(id, dia, colecta, oracion_ofrendas, postcomunion, prefacio, antifona_entrada, antifona_comunion)",
      );
      const rows = await db.getAllAsync<any>("SELECT rowid as id, dia, colecta, oracion_ofrendas, postcomunion, prefacio, antifona_entrada, antifona_comunion FROM misal_propio");
      for (const r of rows) {
        await db.runAsync("INSERT INTO misal_propio_fts(rowid, id, dia, colecta, oracion_ofrendas, postcomunion, prefacio, antifona_entrada, antifona_comunion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [r.id, r.id, r.dia, r.colecta, r.oracion_ofrendas, r.postcomunion, r.prefacio, r.antifona_entrada, r.antifona_comunion]);
      }
    } catch (e) {
      if (__DEV__) console.warn("Failed to rebuild misal_propio_fts:", e);
    }
  }

  if (!fts.misalOrdinario) {
    if (__DEV__) console.log("Rebuilding misal_ordinario_fts (missing)…");
    try {
      await db.runAsync("DROP TABLE IF EXISTS misal_ordinario_fts");
      await db.runAsync(
        "CREATE VIRTUAL TABLE IF NOT EXISTS misal_ordinario_fts USING fts5(id, seccion, subseccion, texto)",
      );
      const rows = await db.getAllAsync<any>("SELECT rowid as id, seccion, subseccion, texto FROM misal_ordinario");
      for (const r of rows) {
        await db.runAsync("INSERT INTO misal_ordinario_fts(rowid, id, seccion, subseccion, texto) VALUES (?, ?, ?, ?, ?)",
          [r.id, r.id, r.seccion, r.subseccion, r.texto]);
      }
    } catch (e) {
      if (__DEV__) console.warn("Failed to rebuild misal_ordinario_fts:", e);
    }
  }

  if (!fts.misalPrefacios) {
    if (__DEV__) console.log("Rebuilding misal_prefacios_fts (missing)…");
    try {
      await db.runAsync("DROP TABLE IF EXISTS misal_prefacios_fts");
      await db.runAsync(
        "CREATE VIRTUAL TABLE IF NOT EXISTS misal_prefacios_fts USING fts5(id, titulo, texto)",
      );
      const rows = await db.getAllAsync<any>("SELECT rowid as id, titulo, texto FROM misal_prefacios");
      for (const r of rows) {
        await db.runAsync("INSERT INTO misal_prefacios_fts(rowid, id, titulo, texto) VALUES (?, ?, ?, ?)",
          [r.id, r.id, r.titulo, r.texto]);
      }
    } catch (e) {
      if (__DEV__) console.warn("Failed to rebuild misal_prefacios_fts:", e);
    }
  }

  if (!fts.misalPlegarias) {
    if (__DEV__) console.log("Rebuilding misal_plegarias_fts (missing)…");
    try {
      await db.runAsync("DROP TABLE IF EXISTS misal_plegarias_fts");
      await db.runAsync(
        "CREATE VIRTUAL TABLE IF NOT EXISTS misal_plegarias_fts USING fts5(id, nombre, texto)",
      );
      const rows = await db.getAllAsync<any>("SELECT rowid as id, nombre, texto FROM misal_plegarias");
      for (const r of rows) {
        await db.runAsync("INSERT INTO misal_plegarias_fts(rowid, id, nombre, texto) VALUES (?, ?, ?, ?)",
          [r.id, r.id, r.nombre, r.texto]);
      }
    } catch (e) {
      if (__DEV__) console.warn("Failed to rebuild misal_plegarias_fts:", e);
    }
  }

  if (!fts.biblia) {
    if (__DEV__) console.log("Rebuilding biblia_pueblo_dios_fts (missing)…");
    try {
      await db.runAsync("DROP TABLE IF EXISTS biblia_pueblo_dios_fts");
      await db.runAsync(
        "CREATE VIRTUAL TABLE IF NOT EXISTS biblia_pueblo_dios_fts USING fts5(libro, texto)",
      );
      const rows = await db.getAllAsync<any>("SELECT rowid, libro, texto FROM biblia_pueblo_dios");
      for (const r of rows) {
        await db.runAsync("INSERT INTO biblia_pueblo_dios_fts(rowid, libro, texto) VALUES (?, ?, ?)",
          [r.rowid, r.libro, r.texto]);
      }
    } catch (e) {
      if (__DEV__) console.warn("Failed to rebuild biblia_pueblo_dios_fts:", e);
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
async function areFTSReady(db: SQLiteDatabase): Promise<{ misalPropio: boolean; misalOrdinario: boolean; misalPrefacios: boolean; misalPlegarias: boolean; biblia: boolean }> {
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('misal_propio_fts','misal_ordinario_fts','misal_prefacios_fts','misal_plegarias_fts','biblia_pueblo_dios_fts')",
  );
  return {
    misalPropio: tables.some(t => t.name === "misal_propio_fts"),
    misalOrdinario: tables.some(t => t.name === "misal_ordinario_fts"),
    misalPrefacios: tables.some(t => t.name === "misal_prefacios_fts"),
    misalPlegarias: tables.some(t => t.name === "misal_plegarias_fts"),
    biblia: tables.some(t => t.name === "biblia_pueblo_dios_fts"),
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

    // --- YOUCAT stats ---
    if (tables.some(t => t.name === "youcat")) {
      const yc = await db.getAllAsync<{ parte_id: number; parte: string; cnt: number }>(
        "SELECT parte_id, parte, COUNT(*) as cnt FROM youcat GROUP BY parte_id ORDER BY parte_id",
      );
      lines.push(`\nYOUCAT partes:`);
      for (const r of yc) {
        lines.push(`  · "${r.parte}" → ${r.cnt} preguntas`);
      }
    }

    for (const table of ["misal_propio_fts", "misal_ordinario_fts", "misal_prefacios_fts", "misal_plegarias_fts", "biblia_pueblo_dios_fts"]) {
      lines.push(`${table}: ${tables.some(t => t.name === table) ? "EXISTE" : "NO EXISTE"}`);
    }

    // --- FTS5 status ---
    const ftsStatus = await areFTSReady(db);
    if (ftsStatus.misalPropio) lines.push(`✅ FTS5 disponible: Misal Propio`);
    else lines.push(`❌ FTS5 NO disponible: Misal Propio`);
    if (ftsStatus.misalOrdinario) lines.push(`✅ FTS5 disponible: Misal Ordinario`);
    else lines.push(`❌ FTS5 NO disponible: Misal Ordinario`);
    if (ftsStatus.misalPrefacios) lines.push(`✅ FTS5 disponible: Prefacios`);
    else lines.push(`❌ FTS5 NO disponible: Prefacios`);
    if (ftsStatus.misalPlegarias) lines.push(`✅ FTS5 disponible: Plegarias`);
    else lines.push(`❌ FTS5 NO disponible: Plegarias`);
    if (ftsStatus.biblia) lines.push(`✅ FTS5 disponible: Biblia`);
    else lines.push(`❌ FTS5 NO disponible: Biblia`);
  } catch (e: any) {
    lines.push(`Error en diagnóstico: ${e.message}`);
  }
  return lines.join("\n");
}

/** CIC repair is no longer needed — data is correct from scraper. */

async function logTables(db: SQLiteDatabase): Promise<void> {
  try {
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    if (__DEV__) console.log("DB tables:", tables.map((t) => t.name).join(", "));
  } catch { /* ignore */ }
}

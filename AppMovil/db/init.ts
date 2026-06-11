import { type SQLiteDatabase } from "expo-sqlite";

const CURRENT_VERSION = 2;

interface VersionRow {
  user_version: number;
}

async function getVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<VersionRow>("PRAGMA user_version;");
  return row?.user_version ?? 0;
}

async function setVersion(db: SQLiteDatabase, v: number): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${v};`);
}

export async function ensureDatabaseSchema(db: SQLiteDatabase): Promise<void> {
  const version = await getVersion(db);

  if (version >= CURRENT_VERSION) {
    await logTables(db);
    return;
  }

  // ── v1: FTS standalone (external content → standalone) ────────────────
  if (version < 1) {
    console.log("Migration v1: recreating FTS tables as standalone…");

    // Drop triggers that reference old external-content FTS tables
    for (const t of [
      "youcat_ai", "youcat_ad", "youcat_au",
      "catecismo_cic_ai", "catecismo_cic_ad", "catecismo_cic_au",
    ]) {
      try { await db.execAsync(`DROP TRIGGER IF EXISTS ${t};`); } catch { /* ok */ }
    }

    // Drop old FTS tables
    for (const t of ["youcat_fts", "catecismo_cic_fts"]) {
      try { await db.execAsync(`DROP TABLE IF EXISTS ${t};`); } catch { /* ok */ }
    }

    // Recreate as standalone FTS5
    await db.execAsync(`
      CREATE VIRTUAL TABLE youcat_fts USING fts5(
        id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo
      );
    `);
    await db.execAsync(`
      CREATE VIRTUAL TABLE catecismo_cic_fts USING fts5(
        id, parte, seccion, capitulo, articulo, texto
      );
    `);

    // Populate from source tables
    await db.execAsync(`
      INSERT INTO youcat_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo)
      SELECT rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo FROM youcat;
    `);
    await db.execAsync(`
      INSERT INTO catecismo_cic_fts(rowid, id, parte, seccion, capitulo, articulo, texto)
      SELECT rowid, id, parte, seccion, capitulo, articulo, texto FROM catecismo_cic;
    `);

    await setVersion(db, 1);
  }

  // ── v2: Add `parte` column if missing ─────────────────────────────────
  if (version < 2) {
    console.log("Migration v2: ensuring parte column…");
    try {
      await db.execAsync("ALTER TABLE youcat ADD COLUMN parte TEXT;");
    } catch {
      // already exists
    }
    await setVersion(db, 2);
  }

  await logTables(db);
}

async function logTables(db: SQLiteDatabase): Promise<void> {
  try {
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    console.log("DB tables:", tables.map((t) => t.name).join(", "));
  } catch {
    // ignore
  }
}

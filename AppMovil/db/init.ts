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

export async function ensureDatabaseSchema(db: SQLiteDatabase): Promise<void> {
  const version = await getVersion(db);
  if (version >= CURRENT_VERSION) {
    await logTables(db);
    return;
  }

  // ── v1: FTS standalone ────────────────────────────────────────────────
  if (version < 1) {
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
    } catch (e) {
      console.warn("Failed to create youcat_fts:", e);
    }

    try {
      await db.runAsync(
        "CREATE VIRTUAL TABLE catecismo_cic_fts USING fts5(id, parte, seccion, capitulo, articulo, texto)",
      );
    } catch (e) {
      console.warn("Failed to create catecismo_cic_fts:", e);
    }

    const youcatRows = await db.getAllAsync<any>("SELECT rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo FROM youcat");
    for (const r of youcatRows) {
      try {
        await db.runAsync(
          "INSERT INTO youcat_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [r.rowid, r.id, r.pregunta_nro, r.pregunta_texto, r.respuesta_texto, r.parte, r.capitulo],
        );
      } catch (e) {
        console.warn("Insert into youcat_fts failed:", e);
      }
    }

    const cicRows = await db.getAllAsync<any>("SELECT rowid, id, parte, seccion, capitulo, articulo, texto FROM catecismo_cic");
    for (const r of cicRows) {
      try {
        await db.runAsync(
          "INSERT INTO catecismo_cic_fts(rowid, id, parte, seccion, capitulo, articulo, texto) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [r.rowid, r.id, r.parte, r.seccion, r.capitulo, r.articulo, r.texto],
        );
      } catch (e) {
        console.warn("Insert into catecismo_cic_fts failed:", e);
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

async function logTables(db: SQLiteDatabase): Promise<void> {
  try {
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    console.log("DB tables:", tables.map((t) => t.name).join(", "));
  } catch { /* ignore */ }
}

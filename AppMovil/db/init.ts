import { type SQLiteDatabase } from "expo-sqlite";

export async function ensureDatabaseSchema(db: SQLiteDatabase): Promise<void> {
  // ── 1. Ensure `parte` column exists in `youcat` ──────────────────────────
  try {
    await db.execAsync("ALTER TABLE youcat ADD COLUMN parte TEXT;");
  } catch {
    // Column already exists – ignore
  }

  // ── 2. Ensure `youcat_fts` FTS5 virtual table exists ─────────────────────
  const youcatFts = await db.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='youcat_fts'",
  );
  if (!youcatFts || youcatFts.cnt === 0) {
    await db.execAsync("CREATE VIRTUAL TABLE youcat_fts USING fts5(id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo, content='youcat', content_rowid='id');");
    await db.execAsync("INSERT INTO youcat_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) SELECT rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo FROM youcat;");
  }

  // ── 3. Ensure `catecismo_cic_fts` FTS5 virtual table exists ──────────────
  const cicFts = await db.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='catecismo_cic_fts'",
  );
  if (!cicFts || cicFts.cnt === 0) {
    await db.execAsync("CREATE VIRTUAL TABLE catecismo_cic_fts USING fts5(id, parte, seccion, capitulo, articulo, texto, content='catecismo_cic', content_rowid='id');");
    await db.execAsync("INSERT INTO catecismo_cic_fts(rowid, id, parte, seccion, capitulo, articulo, texto) SELECT rowid, id, parte, seccion, capitulo, articulo, texto FROM catecismo_cic;");
  }
}

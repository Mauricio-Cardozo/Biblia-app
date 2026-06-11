import { type SQLiteDatabase } from "expo-sqlite";

export async function ensureDatabaseSchema(db: SQLiteDatabase): Promise<void> {
  // ── 1. Ensure `parte` column exists in `youcat` ──────────────────────────
  try {
    await db.execAsync("ALTER TABLE youcat ADD COLUMN parte TEXT;");
  } catch {
    // Column already exists – ignore
  }

  // ── 2. Ensure `youcat_fts` FTS5 virtual table exists ─────────────────────
  try {
    const youcatFts = await db.getFirstAsync<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='youcat_fts'",
    );
    if (!youcatFts || youcatFts.cnt === 0) {
      await db.execAsync(
        "CREATE VIRTUAL TABLE youcat_fts USING fts5(" +
        "id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo, " +
        "content='youcat', content_rowid='id'" +
        ");",
      );
      await db.execAsync("INSERT INTO youcat_fts(youcat_fts) VALUES('rebuild');");
    }
  } catch (e) {
    console.warn("Migration (youcat_fts):", e);
  }

  // ── 3. Ensure `catecismo_cic_fts` FTS5 virtual table exists ──────────────
  try {
    const cicFts = await db.getFirstAsync<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='catecismo_cic_fts'",
    );
    if (!cicFts || cicFts.cnt === 0) {
      await db.execAsync(
        "CREATE VIRTUAL TABLE catecismo_cic_fts USING fts5(" +
        "id, parte, seccion, capitulo, articulo, texto, " +
        "content='catecismo_cic', content_rowid='id'" +
        ");",
      );
      await db.execAsync("INSERT INTO catecismo_cic_fts(catecismo_cic_fts) VALUES('rebuild');");
    }
  } catch (e) {
    console.warn("Migration (catecismo_cic_fts):", e);
  }

  // ── 4. Log all tables for debugging ──────────────────────────────────────
  try {
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    console.log("DB tables:", tables.map((t) => t.name).join(", "));
  } catch {
    // ignore
  }
}

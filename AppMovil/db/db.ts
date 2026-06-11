import { type SQLiteDatabase } from "expo-sqlite";
import type {
  Book, Chapter, Verse,
  CICNumeral, CICParte, CICSeccion, CICNumeralPreview,
  YoucatQuestion, YoucatParte, YoucatPregunta,
} from "@/types";

// ═══════════════════════════════════════════════════════════════════════════════
// BIBLIA
// ═══════════════════════════════════════════════════════════════════════════════

export async function getLibros(db: SQLiteDatabase): Promise<Book[]> {
  return db.getAllAsync<Book>(
    `SELECT libro, testamento
     FROM biblia_pueblo_dios
     GROUP BY libro
     ORDER BY MIN(id) ASC`,
  );
}

export async function getCapitulos(
  db: SQLiteDatabase,
  libro: string,
): Promise<Chapter[]> {
  return db.getAllAsync<Chapter>(
    `SELECT DISTINCT capitulo FROM biblia_pueblo_dios
     WHERE libro = ? ORDER BY capitulo ASC`,
    [libro],
  );
}

export async function getVersiculos(
  db: SQLiteDatabase,
  libro: string,
  capitulo: number,
): Promise<Verse[]> {
  return db.getAllAsync<Verse>(
    `SELECT id, versiculo, texto FROM biblia_pueblo_dios
     WHERE libro = ? AND capitulo = ?
     ORDER BY versiculo ASC`,
    [libro, capitulo],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CIC – Catecismo
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCICPartes(db: SQLiteDatabase): Promise<CICParte[]> {
  return db.getAllAsync<CICParte>(
    "SELECT parte FROM catecismo_cic GROUP BY parte ORDER BY id ASC",
  );
}

export async function getCICSecciones(
  db: SQLiteDatabase,
  parte: string,
): Promise<CICSeccion[]> {
  return db.getAllAsync<CICSeccion>(
    "SELECT seccion FROM catecismo_cic WHERE parte = ? GROUP BY seccion ORDER BY id ASC",
    [parte],
  );
}

export async function getCICNumerales(
  db: SQLiteDatabase,
  parte: string,
  seccion: string,
): Promise<CICNumeralPreview[]> {
  return db.getAllAsync<CICNumeralPreview>(
    `SELECT id, articulo, texto
     FROM catecismo_cic
     WHERE parte = ? AND seccion = ?
     ORDER BY id ASC`,
    [parte, seccion],
  );
}

export async function getCICDetalle(
  db: SQLiteDatabase,
  id: number,
): Promise<CICNumeral | null> {
  return db.getFirstAsync<CICNumeral>(
    "SELECT id, parte, seccion, capitulo, articulo, texto FROM catecismo_cic WHERE id = ?",
    [id],
  );
}

export async function searchCIC(
  db: SQLiteDatabase,
  termino: string,
): Promise<CICNumeral[]> {
  try {
    return await db.getAllAsync<CICNumeral>(
      `SELECT c.* FROM catecismo_cic c
       JOIN catecismo_cic_fts f ON c.id = f.rowid
       WHERE catecismo_cic_fts MATCH ?
       ORDER BY f.rank`,
      [termino],
    );
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// YOUCAT
// ═══════════════════════════════════════════════════════════════════════════════

export async function getYoucatPartes(db: SQLiteDatabase): Promise<YoucatParte[]> {
  const rows = await db.getAllAsync<{
    parte: string;
    min_nro: number;
    max_nro: number;
    cnt: number;
  }>(
    `SELECT
       CASE WHEN parte IS NULL OR parte = '' THEN '1. Lo que creemos' ELSE parte END as parte,
       MIN(pregunta_nro) as min_nro,
       MAX(pregunta_nro) as max_nro,
       COUNT(*) as cnt
     FROM youcat
     GROUP BY parte
     ORDER BY MIN(pregunta_nro) ASC`,
  );
  return rows.map((r) => ({
    parte: r.parte,
    desde: r.min_nro,
    hasta: r.max_nro,
    preguntas: r.cnt,
  }));
}

export async function getYoucatPreguntas(
  db: SQLiteDatabase,
  parte: string,
): Promise<YoucatPregunta[]> {
  const isPart1 = parte === "1. Lo que creemos";
  return db.getAllAsync<YoucatPregunta>(
    `SELECT id, pregunta_nro, pregunta_texto
     FROM youcat
     WHERE ${isPart1 ? "(parte IS NULL OR parte = '')" : "parte = ?"}
     ORDER BY pregunta_nro ASC`,
    isPart1 ? [] : [parte],
  );
}

export async function getYoucatDetalle(
  db: SQLiteDatabase,
  id: number,
): Promise<YoucatQuestion | null> {
  return db.getFirstAsync<YoucatQuestion>(
    "SELECT id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo FROM youcat WHERE id = ?",
    [id],
  );
}

export async function searchYoucat(
  db: SQLiteDatabase,
  termino: string,
): Promise<YoucatQuestion[]> {
  try {
    return await db.getAllAsync<YoucatQuestion>(
      `SELECT y.* FROM youcat y
       JOIN youcat_fts f ON y.id = f.rowid
       WHERE youcat_fts MATCH ?
       ORDER BY f.rank`,
      [termino],
    );
  } catch {
    return [];
  }
}

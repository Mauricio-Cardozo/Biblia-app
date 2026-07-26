import { type SQLiteDatabase } from "expo-sqlite";
import type { Book, Chapter, Verse } from "@/types";

const BIBLE_TABLE = "biblia_pueblo_dios";

export async function getLibros(db: SQLiteDatabase): Promise<Book[]> {
  return db.getAllAsync<Book>(
    `SELECT libro, testamento
     FROM ${BIBLE_TABLE}
     GROUP BY libro
     ORDER BY MIN(id) ASC`,
  );
}

export async function getCapitulos(
  db: SQLiteDatabase,
  libro: string,
): Promise<Chapter[]> {
  return db.getAllAsync<Chapter>(
    `SELECT DISTINCT capitulo FROM ${BIBLE_TABLE}
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
    `SELECT id, libro, capitulo, versiculo, texto, testamento FROM ${BIBLE_TABLE}
     WHERE libro = ? AND capitulo = ?
     ORDER BY versiculo ASC`,
    [libro, capitulo],
  );
}

export async function searchBiblia(
  db: SQLiteDatabase,
  termino: string,
): Promise<Verse[]> {
  try {
    return await db.getAllAsync<Verse>(
      `SELECT v.* FROM biblia_pueblo_dios v
       JOIN biblia_pueblo_dios_fts f ON v.rowid = f.rowid
       WHERE biblia_pueblo_dios_fts MATCH ?
       ORDER BY f.rank
       LIMIT 50`,
      [termino],
    );
  } catch (e: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn("searchBiblia error:", e instanceof Error ? e.message : e);
    return [];
  }
}

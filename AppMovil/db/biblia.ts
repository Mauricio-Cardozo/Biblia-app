import { type SQLiteDatabase } from "expo-sqlite";
import type { Book, Chapter, Verse } from "@/types";

export const BIBLE_TABLES = {
  pueblo: "biblia_pueblo_dios",
  navarra: "biblia_navarra",
} as const;

export type BibliaVersion = keyof typeof BIBLE_TABLES;

/** Clave de favorito version-scoped: biblia-<version>-<verseId> */
export const favoritoId = (version: BibliaVersion, verseId: number) =>
  `biblia-${version}-${verseId}`;

export async function getLibros(db: SQLiteDatabase, version: BibliaVersion = "pueblo"): Promise<Book[]> {
  const table = BIBLE_TABLES[version];
  return db.getAllAsync<Book>(
    `SELECT libro, testamento
     FROM ${table}
     GROUP BY libro
     ORDER BY MIN(id) ASC`,
  );
}

export async function getCapitulos(
  db: SQLiteDatabase,
  libro: string,
  version: BibliaVersion = "pueblo",
): Promise<Chapter[]> {
  const table = BIBLE_TABLES[version];
  return db.getAllAsync<Chapter>(
    `SELECT DISTINCT capitulo FROM ${table}
     WHERE libro = ? ORDER BY capitulo ASC`,
    [libro],
  );
}

export async function getVersiculos(
  db: SQLiteDatabase,
  libro: string,
  capitulo: number,
  version: BibliaVersion = "pueblo",
): Promise<Verse[]> {
  const table = BIBLE_TABLES[version];
  return db.getAllAsync<Verse>(
    `SELECT id, libro, capitulo, versiculo, texto, testamento FROM ${table}
     WHERE libro = ? AND capitulo = ?
     ORDER BY versiculo ASC`,
    [libro, capitulo],
  );
}

export async function searchBiblia(
  db: SQLiteDatabase,
  termino: string,
  version: BibliaVersion = "pueblo",
): Promise<Verse[]> {
  const table = BIBLE_TABLES[version];
  const fts = `${table}_fts`;
  try {
    const rows = await db.getAllAsync<Verse>(
      `SELECT v.* FROM ${table} v
       JOIN ${fts} f ON v.rowid = f.rowid
       WHERE ${fts} MATCH ?
       ORDER BY f.rank
       LIMIT 50`,
      [termino],
    );
    if (rows.length > 0) return rows;
  } catch { /* FTS5 unavailable, fall through to LIKE */ }

  try {
    const like = `%${termino.replace(/"/g, '').replace(/'/g, "''")}%`;
    return await db.getAllAsync<Verse>(
      `SELECT id, libro, capitulo, versiculo, texto, testamento
       FROM ${table}
       WHERE texto LIKE ? OR libro LIKE ?
       ORDER BY libro, capitulo, versiculo
       LIMIT 50`,
      [like, like],
    );
  } catch {
    return [];
  }
}
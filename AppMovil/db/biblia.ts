import { type SQLiteDatabase } from "expo-sqlite";
import type { Book, Chapter, Verse } from "@/types";

export async function getLibros(db: SQLiteDatabase, tabla = "biblia_pueblo_dios"): Promise<Book[]> {
  return db.getAllAsync<Book>(
    `SELECT libro, testamento
     FROM ${tabla}
     GROUP BY libro
     ORDER BY MIN(id) ASC`,
  );
}

export async function getCapitulos(
  db: SQLiteDatabase,
  libro: string,
  tabla = "biblia_pueblo_dios",
): Promise<Chapter[]> {
  return db.getAllAsync<Chapter>(
    `SELECT DISTINCT capitulo FROM ${tabla}
     WHERE libro = ? ORDER BY capitulo ASC`,
    [libro],
  );
}

export async function getVersiculos(
  db: SQLiteDatabase,
  libro: string,
  capitulo: number,
  tabla = "biblia_pueblo_dios",
): Promise<Verse[]> {
  return db.getAllAsync<Verse>(
    `SELECT id, libro, capitulo, versiculo, texto, testamento FROM ${tabla}
     WHERE libro = ? AND capitulo = ?
     ORDER BY versiculo ASC`,
    [libro, capitulo],
  );
}

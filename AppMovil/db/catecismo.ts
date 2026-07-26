import { type SQLiteDatabase } from "expo-sqlite";
import type { YoucatPregunta } from "@/types";

export async function getYoucatPartes(
  db: SQLiteDatabase,
): Promise<{ parte_id: number; parte: string }[]> {
  return db.getAllAsync<{ parte_id: number; parte: string }>(
    "SELECT parte_id, parte FROM youcat GROUP BY parte_id ORDER BY parte_id ASC",
  );
}

export async function getYoucatPreguntas(
  db: SQLiteDatabase,
  parte_id: number,
): Promise<YoucatPregunta[]> {
  return db.getAllAsync<YoucatPregunta>(
    "SELECT id, parte_id, parte, seccion, capitulo, pregunta, respuesta, comentario FROM youcat WHERE parte_id = ? ORDER BY id ASC",
    [parte_id],
  );
}

export async function getYoucatDetalle(
  db: SQLiteDatabase,
  id: number,
): Promise<YoucatPregunta | null> {
  return db.getFirstAsync<YoucatPregunta>(
    "SELECT id, parte_id, parte, seccion, capitulo, pregunta, respuesta, comentario FROM youcat WHERE id = ?",
    [id],
  );
}

export async function searchYoucat(
  db: SQLiteDatabase,
  termino: string,
): Promise<YoucatPregunta[]> {
  return db.getAllAsync<YoucatPregunta>(
    `SELECT y.* FROM youcat y
     WHERE y.pregunta LIKE ? OR y.respuesta LIKE ?
     ORDER BY y.id`,
    [`%${termino}%`, `%${termino}%`],
  );
}

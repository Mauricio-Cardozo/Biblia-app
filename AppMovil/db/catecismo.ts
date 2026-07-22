import { type SQLiteDatabase } from "expo-sqlite";
import type { CICNumeral, CICParte, CICSeccion, CICNumeralPreview } from "@/types";

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
  return db.getAllAsync<CICNumeral>(
     `SELECT c.* FROM catecismo_cic c
      JOIN catecismo_cic_fts f ON c.rowid = f.rowid
     WHERE f MATCH ?
     ORDER BY f.rank`,
    [termino],
  );
}

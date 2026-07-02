import { type SQLiteDatabase } from "expo-sqlite";
import type {
  Book, Chapter, Verse,
  CICNumeral, CICParte, CICSeccion, CICNumeralPreview,
  Lectura,
  MisalPropioEntry, MisalOrdinarioBlock, MisalPrefacio, MisalPlegaria,
} from "@/types";

// ═══════════════════════════════════════════════════════════════════════════════
// BIBLIA
// ═══════════════════════════════════════════════════════════════════════════════

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
  return db.getAllAsync<CICNumeral>(
     `SELECT c.* FROM catecismo_cic c
      JOIN catecismo_cic_fts f ON c.rowid = f.rowid
     WHERE f MATCH ?
     ORDER BY f.rank`,
    [termino],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LECTURAS (Evangelio del día)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getLecturaDelDia(
  db: SQLiteDatabase,
  fecha: string,
): Promise<Lectura | null> {
  return db.getFirstAsync<Lectura>(
    "SELECT * FROM lecturas WHERE fecha = ?",
    [fecha],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MISAL ROMANO
// ═══════════════════════════════════════════════════════════════════════════════

export async function getMisalTemporadas(db: SQLiteDatabase): Promise<{ temporada: string; temporada_label: string; count: number }[]> {
  return db.getAllAsync<{ temporada: string; temporada_label: string; count: number }>(
    "SELECT temporada, temporada_label, COUNT(*) as count FROM misal_propio GROUP BY temporada ORDER BY MIN(id)",
  );
}

export async function getMisalPropio(db: SQLiteDatabase, temporada: string): Promise<MisalPropioEntry[]> {
  return db.getAllAsync<MisalPropioEntry>(
    "SELECT id, temporada, temporada_label, dia, colecta, oracion_ofrendas, postcomunion, prefacio, antifona_entrada, antifona_comunion FROM misal_propio WHERE temporada = ? ORDER BY id",
    [temporada],
  );
}

export async function getMisalPropioDetalle(db: SQLiteDatabase, id: number): Promise<MisalPropioEntry | null> {
  return db.getFirstAsync<MisalPropioEntry>(
    "SELECT id, temporada, temporada_label, dia, colecta, oracion_ofrendas, postcomunion, prefacio, antifona_entrada, antifona_comunion FROM misal_propio WHERE id = ?",
    [id],
  );
}

export async function getMisalOrdinario(db: SQLiteDatabase): Promise<MisalOrdinarioBlock[]> {
  return db.getAllAsync<MisalOrdinarioBlock>(
    "SELECT id, seccion, subseccion, rol, texto, orden FROM misal_ordinario ORDER BY orden",
  );
}

export async function getMisalOrdinarioPorSeccion(db: SQLiteDatabase, seccion: string): Promise<MisalOrdinarioBlock[]> {
  return db.getAllAsync<MisalOrdinarioBlock>(
    "SELECT id, seccion, subseccion, rol, texto, orden FROM misal_ordinario WHERE seccion = ? ORDER BY orden",
    [seccion],
  );
}

export async function getMisalOrdinarioSecciones(db: SQLiteDatabase): Promise<{ seccion: string; count: number }[]> {
  return db.getAllAsync<{ seccion: string; count: number }>(
    "SELECT seccion, COUNT(*) as count FROM misal_ordinario GROUP BY seccion ORDER BY MIN(orden)",
  );
}

export async function getMisalPrefacios(db: SQLiteDatabase): Promise<MisalPrefacio[]> {
  return db.getAllAsync<MisalPrefacio>(
    "SELECT id, titulo, texto FROM misal_prefacios ORDER BY id",
  );
}

export async function getMisalPrefacioDetalle(db: SQLiteDatabase, id: number): Promise<MisalPrefacio | null> {
  return db.getFirstAsync<MisalPrefacio>(
    "SELECT id, titulo, texto FROM misal_prefacios WHERE id = ?",
    [id],
  );
}

export async function getMisalPlegarias(db: SQLiteDatabase): Promise<MisalPlegaria[]> {
  return db.getAllAsync<MisalPlegaria>(
    "SELECT id, nombre, texto FROM misal_plegarias ORDER BY id",
  );
}

export async function getMisalPlegariaDetalle(db: SQLiteDatabase, id: number): Promise<MisalPlegaria | null> {
  return db.getFirstAsync<MisalPlegaria>(
    "SELECT id, nombre, texto FROM misal_plegarias WHERE id = ?",
    [id],
  );
}

export async function getMisalOrdinarioDetalle(db: SQLiteDatabase, id: number): Promise<MisalOrdinarioBlock | null> {
  return db.getFirstAsync<MisalOrdinarioBlock>(
    "SELECT id, seccion, subseccion, rol, texto, orden FROM misal_ordinario WHERE id = ?",
    [id],
  );
}

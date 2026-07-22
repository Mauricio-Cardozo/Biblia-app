import { type SQLiteDatabase } from "expo-sqlite";
import type { MisalPropioEntry, MisalOrdinarioBlock, MisalPrefacio, MisalPlegaria } from "@/types";

export interface MisalSearchResult {
  tabla: string;
  id: number;
  titulo: string;
  preview: string;
}

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

export async function getMisalPropioPorSemana(db: SQLiteDatabase, temporada: string, semana: number, esDomingo: boolean): Promise<MisalPropioEntry | null> {
  if (temporada === 'ordinario' && semana > 0 && semana <= 34) {
    const R = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII','XXIV','XXV','XXVI','XXVII','XXVIII','XXIX','XXX','XXXI','XXXII','XXXIII','XXXIV'];
    const n = R[semana - 1];
    const dom = await db.getFirstAsync<MisalPropioEntry>(
      "SELECT * FROM misal_propio WHERE temporada = 'ordinario' AND dia = ?", [`${n} DOMINGO DEL TIEMPO ORDINARIO`]
    );
    if (dom) return dom;
    return db.getFirstAsync<MisalPropioEntry>(
      "SELECT * FROM misal_propio WHERE temporada = 'ordinario' AND dia = ?", [`${n} SEMANA DEL TIEMPO ORDINARIO`]
    );
  }
  return null;
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

async function searchMisal(
  db: SQLiteDatabase,
  termino: string,
): Promise<MisalSearchResult[]> {
  const results: MisalSearchResult[] = [];

  const propio = await db.getAllAsync<any>(
    `SELECT p.id, p.dia as titulo, snippet(mpf, 1, '<mark>', '</mark>', '...', 8) as preview
     FROM misal_propio p JOIN misal_propio_fts mpf ON p.rowid = mpf.rowid
     WHERE mpf MATCH ? ORDER BY mpf.rank LIMIT 10`,
    [termino],
  );
  for (const r of propio) {
    results.push({ tabla: "Propio del Tiempo", id: r.id, titulo: r.titulo ?? "", preview: r.preview });
  }

  const ordinario = await db.getAllAsync<any>(
    `SELECT o.id, o.seccion as titulo, snippet(mof, 2, '<mark>', '</mark>', '...', 8) as preview
     FROM misal_ordinario o JOIN misal_ordinario_fts mof ON o.rowid = mof.rowid
     WHERE mof MATCH ? ORDER BY mof.rank LIMIT 10`,
    [termino],
  );
  for (const r of ordinario) {
    results.push({ tabla: "Ordinario de la Misa", id: r.id, titulo: r.titulo ?? "", preview: r.preview });
  }

  const prefacios = await db.getAllAsync<any>(
    `SELECT p.id, p.titulo, snippet(mpf, 1, '<mark>', '</mark>', '...', 8) as preview
     FROM misal_prefacios p JOIN misal_prefacios_fts mpf ON p.rowid = mpf.rowid
     WHERE mpf MATCH ? ORDER BY mpf.rank LIMIT 10`,
    [termino],
  );
  for (const r of prefacios) {
    results.push({ tabla: "Prefacios", id: r.id, titulo: r.titulo, preview: r.preview });
  }

  const plegarias = await db.getAllAsync<any>(
    `SELECT p.id, p.nombre as titulo, snippet(mpf, 1, '<mark>', '</mark>', '...', 8) as preview
     FROM misal_plegarias p JOIN misal_plegarias_fts mpf ON p.rowid = mpf.rowid
     WHERE mpf MATCH ? ORDER BY mpf.rank LIMIT 10`,
    [termino],
  );
  for (const r of plegarias) {
    results.push({ tabla: "Plegarias Eucarísticas", id: r.id, titulo: r.titulo ?? "", preview: r.preview });
  }

  results.sort((a, b) => a.tabla.localeCompare(b.tabla));
  return results;
}
export { searchMisal };

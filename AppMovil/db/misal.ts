import { type SQLiteDatabase } from "expo-sqlite";
import type { MisalPropioEntry, MisalOrdinarioBlock, MisalPrefacio, MisalPlegaria } from "@/types";

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



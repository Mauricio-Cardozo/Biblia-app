// ─── Biblia ────────────────────────────────────────────────────────────────────

export interface Book {
  libro: string;
  testamento: 'Antiguo' | 'Nuevo';
}

export interface Chapter {
  capitulo: number;
}

export interface Verse {
  id: number;
  libro: string;
  capitulo: number;
  versiculo: number;
  texto: string;
  testamento: string;
}

// ─── Catecismo CIC ─────────────────────────────────────────────────────────────

export interface CICNumeral {
  id: number;
  parte: string;
  seccion: string;
  capitulo: string;
  articulo: string;
  texto: string;
}

export interface CICParte {
  parte: string;
}

export interface CICSeccion {
  seccion: string;
}

export type CICNumeralPreview = Pick<CICNumeral, 'id' | 'articulo' | 'texto'>;

export interface CICSearchResult extends CICNumeral {
  highlight?: string;
  rank?: number;
}

// ─── Lecturas ───────────────────────────────────────────────────────────────────

export interface Lectura {
  id: number;
  fecha: string;
  titulo_misa: string;
  primera_lectura_ref: string;
  primera_lectura: string;
  salmo: string;
  aleluia: string;
  evangelio_ref: string;
  evangelio: string;
}

// ─── Misal Romano ──────────────────────────────────────────────────────────────

export interface MisalPropioEntry {
  id: number;
  temporada: string;
  temporada_label: string;
  dia: string;
  colecta: string;
  oracion_ofrendas: string;
  postcomunion: string;
  prefacio: string;
  antifona_entrada: string;
  antifona_comunion: string;
}

export interface MisalOrdinarioBlock {
  id: number;
  seccion: string;
  subseccion: string;
  rol: string;
  texto: string;
  orden: number;
}

export interface MisalPrefacio {
  id: number;
  titulo: string;
  texto: string;
}

export interface MisalPlegaria {
  id: number;
  nombre: string;
  texto: string;
}

// ─── Búsqueda genérica ─────────────────────────────────────────────────────────

export interface FTS5Query {
  term: string;
  limit?: number;
  offset?: number;
}

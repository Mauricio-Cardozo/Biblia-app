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

// ─── Lecturas ───────────────────────────────────────────────────────────────────

export interface Lectura {
  id: number;
  fecha: string;
  titulo_misa: string | null;
  primera_lectura_ref: string | null;
  primera_lectura: string | null;
  salmo: string | null;
  aleluia: string | null;
  evangelio_ref: string | null;
  evangelio: string | null;
  comentario_papal: string | null;
  url: string | null;
  creado_en: string | null;
}

// ─── Misal Romano ──────────────────────────────────────────────────────────────

export interface MisalPropioEntry {
  id: number;
  temporada: string;
  temporada_label: string | null;
  dia: string | null;
  colecta: string | null;
  oracion_ofrendas: string | null;
  postcomunion: string | null;
  prefacio: string | null;
  antifona_entrada: string | null;
  antifona_comunion: string | null;
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

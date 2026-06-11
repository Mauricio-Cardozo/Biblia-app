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

export interface CICSearchResult extends CICNumeral {
  highlight?: string;
  rank?: number;
}

// ─── YOUCAT ─────────────────────────────────────────────────────────────────────

export interface YoucatQuestion {
  id: number;
  pregunta_nro: number;
  pregunta_texto: string;
  respuesta_texto: string;
  parte: string;
  capitulo: string;
}

// ─── Lecturas ───────────────────────────────────────────────────────────────────

export interface Lectura {
  id: number;
  fecha: string;
  titulo_misa: string;
  primera_lectura: string;
  salmo: string;
  aleluia: string;
  evangelio: string;
}

// ─── Búsqueda genérica ─────────────────────────────────────────────────────────

export interface FTS5Query {
  term: string;
  limit?: number;
  offset?: number;
}

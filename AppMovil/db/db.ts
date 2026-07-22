export { getLibros, getCapitulos, getVersiculos } from "./biblia";
export type { Book, Chapter, Verse } from "@/types";

export {
  getCICPartes, getCICSecciones, getCICNumerales, getCICDetalle, searchCIC,
} from "./catecismo";
export type { CICNumeral, CICParte, CICSeccion, CICNumeralPreview } from "@/types";

export { getLecturaDelDia, getSeasonFromNearestLectura } from "./lecturas";
export type { Lectura } from "@/types";

export {
  getMisalTemporadas, getMisalPropio, getMisalPropioDetalle,
  getMisalPropioPorSemana, getMisalOrdinarioPorSeccion, getMisalOrdinarioSecciones,
  getMisalPrefacios, getMisalPrefacioDetalle, getMisalPlegarias,
  getMisalPlegariaDetalle, getMisalOrdinarioDetalle, searchMisal,
} from "./misal";
export type { MisalSearchResult } from "./misal";

export { getSantosDelDia, getMisalSantosDelDia } from "./santos";
export type { Santo, MisalSantosEntry } from "@/types";

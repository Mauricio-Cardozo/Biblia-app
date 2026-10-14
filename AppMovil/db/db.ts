export { getLibros, getCapitulos, getVersiculos, searchBiblia, favoritoId } from "./biblia";
export type { Book, Chapter, Verse } from "@/types";
export type { BibliaVersion } from "./biblia";

export {
  getYoucatPartes, getYoucatPreguntas, getYoucatDetalle, searchYoucat,
} from "./catecismo";
export type { YoucatPregunta } from "@/types";

export { getLecturaDelDia, getSeasonFromNearestLectura } from "./lecturas";
export type { Lectura } from "@/types";

export {
  getMisalTemporadas, getMisalPropio, getMisalPropioDetalle,
  getMisalPropioPorSemana, getMisalOrdinarioPorSeccion, getMisalOrdinarioSecciones,
  getMisalPrefacios, getMisalPrefacioDetalle, getMisalPlegarias,
  getMisalPlegariaDetalle, getMisalOrdinarioDetalle,
  getMisalGuiaSecciones, getMisalGuiaPorSeccion,
  searchMisalTodo,
} from "./misal";
export type { MisalGuiaEntry, MisalSearchResult } from "@/types";

export { getSantosDelDia, getMisalSantosDelDia, getMisalSantos } from "./santos";
export type { Santo, MisalSantosEntry } from "@/types";

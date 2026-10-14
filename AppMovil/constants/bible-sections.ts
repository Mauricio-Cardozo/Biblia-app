// Agrupación del canon católico en secciones (solo UI, no toca la DB)
export interface LibroRef {
  libro: string;
  deuterocanonico?: boolean;
}

export interface GrupoBiblia {
  testamento: "Antiguo" | "Nuevo";
  nombre: string;
  libros: LibroRef[];
}

export const GRUPOS_BIBLIA: GrupoBiblia[] = [
  {
    testamento: "Antiguo",
    nombre: "Pentateuco",
    libros: [
      { libro: "Génesis" }, { libro: "Éxodo" }, { libro: "Levítico" },
      { libro: "Números" }, { libro: "Deuteronomio" },
    ],
  },
  {
    testamento: "Antiguo",
    nombre: "Libros Históricos",
    libros: [
      { libro: "Josué" }, { libro: "Jueces" }, { libro: "Rut" },
      { libro: "1 Samuel" }, { libro: "2 Samuel" },
      { libro: "1 Reyes" }, { libro: "2 Reyes" },
      { libro: "1 Crónicas" }, { libro: "2 Crónicas" },
      { libro: "Esdras" }, { libro: "Nehemías" },
      { libro: "Tobías", deuterocanonico: true },
      { libro: "Judit", deuterocanonico: true },
      { libro: "Ester", deuterocanonico: true },
      { libro: "1 Macabeos", deuterocanonico: true },
      { libro: "2 Macabeos", deuterocanonico: true },
    ],
  },
  {
    testamento: "Antiguo",
    nombre: "Libros Sapienciales",
    libros: [
      { libro: "Job" }, { libro: "Salmos" }, { libro: "Proverbios" },
      { libro: "Eclesiastés" }, { libro: "Cantar de los Cantares" },
      { libro: "Sabiduría", deuterocanonico: true },
      { libro: "Eclesiástico", deuterocanonico: true },
    ],
  },
  {
    testamento: "Antiguo",
    nombre: "Libros Proféticos",
    libros: [
      { libro: "Isaías" }, { libro: "Jeremías" }, { libro: "Lamentaciones" },
      { libro: "Baruc", deuterocanonico: true },
      { libro: "Ezequiel" }, { libro: "Daniel", deuterocanonico: true },
      { libro: "Oseas" }, { libro: "Joel" }, { libro: "Amós" },
      { libro: "Abdías" }, { libro: "Jonás" }, { libro: "Miqueas" },
      { libro: "Nahúm" }, { libro: "Habacuc" }, { libro: "Sofonías" },
      { libro: "Ageo" }, { libro: "Zacarías" }, { libro: "Malaquías" },
    ],
  },
  {
    testamento: "Nuevo",
    nombre: "Evangelios",
    libros: [
      { libro: "Mateo" }, { libro: "Marcos" }, { libro: "Lucas" }, { libro: "Juan" },
    ],
  },
  {
    testamento: "Nuevo",
    nombre: "Libro Histórico",
    libros: [{ libro: "Hechos de los Apóstoles" }],
  },
  {
    testamento: "Nuevo",
    nombre: "Cartas Paulinas",
    // tradicionalmente incluye Hebreos dentro del grupo
    libros: [
      { libro: "Romanos" }, { libro: "1 Corintios" }, { libro: "2 Corintios" },
      { libro: "Gálatas" }, { libro: "Efesios" }, { libro: "Filipenses" },
      { libro: "Colosenses" }, { libro: "1 Tesalonicenses" }, { libro: "2 Tesalonicenses" },
      { libro: "1 Timoteo" }, { libro: "2 Timoteo" }, { libro: "Tito" },
      { libro: "Filemón" }, { libro: "Hebreos" },
    ],
  },
  {
    testamento: "Nuevo",
    nombre: "Cartas Católicas",
    libros: [
      { libro: "Santiago" }, { libro: "1 Pedro" }, { libro: "2 Pedro" },
      { libro: "1 Juan" }, { libro: "2 Juan" }, { libro: "3 Juan" }, { libro: "Judas" },
    ],
  },
  {
    testamento: "Nuevo",
    nombre: "Libro Profético",
    libros: [{ libro: "Apocalipsis" }],
  },
];

const DEUTEROCANONICOS = new Set(
  GRUPOS_BIBLIA.flatMap((g) => g.libros)
    .filter((l) => l.deuterocanonico)
    .map((l) => l.libro),
);

export const esDeuterocanonico = (libro: string): boolean =>
  DEUTEROCANONICOS.has(libro);
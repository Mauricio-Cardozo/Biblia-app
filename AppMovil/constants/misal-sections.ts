export interface Seccion {
  id: string;
  titulo: string;
  subtitulo: string;
  icono: string;
  ruta: string;
}

export const SECCIONES_MISAL: Seccion[] = [
  {
    id: 'hoy',
    titulo: 'Misa de Hoy',
    subtitulo: 'Oraciones y lecturas del día',
    icono: '🕊️',
    ruta: '/misal/hoy',
  },
  {
    id: 'guia',
    titulo: 'Guía de la Misa',
    subtitulo: 'Estructura y partes de la celebración',
    icono: '📋',
    ruta: '/misal/guia',
  },
  {
    id: 'propio',
    titulo: 'Propio del Tiempo',
    subtitulo: 'Adviento, Navidad, Cuaresma, Pascua, Ordinario',
    icono: '📅',
    ruta: '/misal/propio',
  },
  {
    id: 'ordinario',
    titulo: 'Ordinario de la Misa',
    subtitulo: 'Ritos, oraciones y plegarias de la misa',
    icono: '📖',
    ruta: '/misal/ordinario',
  },
  {
    id: 'prefacios',
    titulo: 'Prefacios',
    subtitulo: '67 prefacios para cada tiempo litúrgico',
    icono: '✋',
    ruta: '/misal/prefacios',
  },
  {
    id: 'plegarias',
    titulo: 'Plegarias Eucarísticas',
    subtitulo: 'I, II, III y IV',
    icono: '🍞',
    ruta: '/misal/plegarias',
  },
  {
    id: 'santos',
    titulo: 'Santoral',
    subtitulo: 'Misas propias de santos',
    icono: '🙏',
    ruta: '/misal/santos',
  },
  {
    id: 'busqueda',
    titulo: 'Buscar en el Misal',
    subtitulo: 'Búsqueda en todo el Misal Romano',
    icono: '🔍',
    ruta: '/misal/busqueda',
  },
];

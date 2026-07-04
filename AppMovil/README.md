# Iglesia Digital

App móvil de la Iglesia Católica para leer la Biblia, el Catecismo (CIC) y el Misal Romano.

## Stack

- **Framework:** React Native con Expo SDK 56
- **Navegación:** expo-router (file-based routing)
- **Base de datos:** expo-sqlite 16.0.10 con SQLite FTS5 para búsqueda
- **Listas virtualizadas:** @shopify/flash-list 2.0.2
- **Lenguaje:** TypeScript

## Arquitectura

```
app/                          → Pantallas (expo-router)
├── (tabs)/
│   ├── index.tsx             → Home (rachas, misal propio inline cards)
│   ├── biblia.tsx            → Biblia (libros → capítulos → versículos)
│   ├── catecismo.tsx         → CIC (partes → secciones → numerales → detalle)
│   └── _layout.tsx           → Tab layout
├── _layout.tsx               → Root layout (inicializa DB)
├── evangelio.tsx             → Evangelio del día
├── calendario.tsx            → Calendario de lecturas
├── test.tsx                  → Debug: buscar, rebuild FTS, inspeccionar esquema
└── misal/                    → Misal Romano (propio, ordinario, prefacios, plegarias)

db/
├── init.ts                   → Migraciones versionadas (PRAGMA user_version)
└── db.ts                     → Service layer (~15 funciones de consulta, incl. getMisalPropioPorSemana)

types/
└── index.ts                  → Interfaces compartidas

assets/
└── iglesia_digital.db        → Base de datos SQLite (10 MB)
```

## Base de Datos

El archivo `assets/iglesia_digital.db` se copia al dispositivo al primer inicio. La migración (versionada por `PRAGMA user_version`) agrega columnas faltantes y recrea tablas FTS5 standalone para búsqueda full-text.

### Tablas FTS

- `catecismo_cic_fts` → búsqueda en CIC

Son standalone (sin `content=`), pobladas fila por fila con `runAsync` para evitar errores de alias de columnas en expo-sqlite.

### Migraciones

| Versión | Cambio |
|---------|--------|
| 0 → 1   | Crear tablas FTS5 standalone y poblarlas |
| 1 → 2   | Agregar columna `parte` a `youcat` (no-op, youcat eliminado) |
| 2 → 3   | Crear tablas `novenas` y `novena_dias` |
| 3 → 4   | Eliminar tablas YOUCAT |
| 4 → 5   | Crear tablas `misal_propio`, `misal_ordinario`, `misal_prefacios`, `misal_plegarias` |

### Service Layer

`db/db.ts` exporta funciones que reciben `SQLiteDatabase` y retornan datos tipados. Las funciones de búsqueda lanzan error si las tablas FTS no existen; cada pantalla captura el error y muestra un mensaje amigable.

## Utilidades

`utils/seasons.ts` → `SEASON_EMOJI`, `romanToInt`, `detectSeason`, `parseWeekNumber`, `isSunday` — helpers para detectar temporada litúrgica y día.

## Scripts

```bash
npm start           # Iniciar Expo
npm run android     # Compilar y correr en Android
npm run ios         # Compilar y correr en iOS
npx tsc --noEmit    # Type-check
```

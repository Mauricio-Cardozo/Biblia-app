# Iglesia Digital

App móvil de la Iglesia Católica para leer la Biblia, el Catecismo (CIC) y el YOUCAT.

## Stack

- **Framework:** React Native con Expo SDK 54
- **Navegación:** expo-router (file-based routing)
- **Base de datos:** expo-sqlite 16.0.10 con SQLite FTS5 para búsqueda
- **Listas virtualizadas:** @shopify/flash-list 2.0.2
- **Lenguaje:** TypeScript

## Arquitectura

```
app/                          → Pantallas (expo-router)
├── (tabs)/
│   ├── biblia.tsx            → Biblia (libros → capítulos → versículos)
│   ├── catecismo.tsx         → CIC (partes → secciones → numerales → detalle)
│   ├── youcat.tsx            → YOUCAT (partes → preguntas → detalle + búsqueda)
│   └── _layout.tsx           → Tab layout
├── _layout.tsx               → Root layout (inicializa DB)
└── test.tsx                  → Debug: buscar, rebuild FTS, inspeccionar esquema

db/
├── init.ts                   → Migraciones versionadas (PRAGMA user_version)
└── db.ts                     → Service layer (12 funciones de consulta)

types/
└── index.ts                  → Interfaces compartidas

assets/
└── iglesia_digital.db        → Base de datos SQLite (10 MB)
```

## Base de Datos

El archivo `assets/iglesia_digital.db` se copia al dispositivo al primer inicio. La migración (versionada por `PRAGMA user_version`) agrega columnas faltantes y recrea tablas FTS5 standalone para búsqueda full-text.

### Tablas FTS

- `youcat_fts` → búsqueda en YOUCAT
- `catecismo_cic_fts` → búsqueda en CIC

Son standalone (sin `content=`), pobladas fila por fila con `runAsync` para evitar errores de alias de columnas en expo-sqlite.

### Migraciones

| Versión | Cambio |
|---------|--------|
| 0 → 1   | Crear tablas FTS5 standalone y poblarlas |
| 1 → 2   | Agregar columna `parte` a `youcat` |

### Service Layer

`db/db.ts` exporta funciones que reciben `SQLiteDatabase` y retornan datos tipados. Las funciones de búsqueda lanzan error si las tablas FTS no existen; cada pantalla captura el error y muestra un mensaje amigable.

## Scripts

```bash
npm start           # Iniciar Expo
npm run android     # Compilar y correr en Android
npm run ios         # Compilar y correr en iOS
npx tsc --noEmit    # Type-check
```

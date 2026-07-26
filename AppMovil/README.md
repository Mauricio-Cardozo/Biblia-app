# Iglesia Digital

App móvil Católica — Biblia, Catecismo, Misal Romano, Rezo del Rosario, Novenas y más.

## Stack

- **Framework:** React Native con Expo SDK 56 (Fabric, React Compiler)
- **Navegación:** expo-router 6 (file-based routing)
- **Base de datos:** expo-sqlite 16 con SQLite FTS5 para búsqueda
- **Listas virtualizadas:** @shopify/flash-list
- **Lenguaje:** TypeScript 5.9

## Arquitectura

```
app/                          → Pantallas (expo-router)
├── (tabs)/
│   ├── index.tsx             → Home (hero gradient, rachas, santo, propio)
│   ├── biblia.tsx            → Biblia (libro → capítulo → versículo + highlights)
│   ├── catecismo.tsx         → YOUCAT (parte → pregunta → detalle)
│   ├── oracion.tsx           → Oraciones, jaculatorias
│   ├── misal.tsx             → Misal Romano
│   └── _layout.tsx           → Tab navigator
├── _layout.tsx               → Root layout (SQLiteProvider, contextes, notificaciones)
├── evangelio.tsx             → Evangelio del día
├── calendario.tsx            → Calendario/mes de lecturas
├── favoritos.tsx             → Favoritos con grupos por tag y editor
└── misal/                    → Propio, Ordinario, Prefacios, Plegarias
```

## Base de Datos

Archivo `assets/iglesia_digital.db` copiado al dispositivo al primer inicio.
Migraciones versionadas por `PRAGMA user_version` (v7 actual).

**Tablas FTS5:** `catecismo_cic_fts`, `misal_propio_fts`, `misal_ordinario_fts`, `misal_prefacios_fts`, `misal_plegarias_fts`.

## Scripts

```bash
npm start           # Iniciar Expo dev server
npm run android     # Android
npm run ios         # iOS
npm run web         # Web
npm run lint        # ESLint (expo config) — 0 errors
npm test            # Jest (46 tests)
eas build           # EAS Build (APK/AAB)
```

## Design

- Paleta fija: Navy/Gold (`#0D1B2A` / `#C9A84C`)
- Tokens de espaciado (`S.*`) y radio (`R.*`) en `constants/`
- Hero section con gradient (`expo-linear-gradient`)
- Floating tab bar con scroll-to-hide
- Iconos: SF Symbols (iOS) / MaterialIcons (Android)

## Features destacadas v2.0

- **Home rediseñado** — Hero con gradient, badge litúrgico, saludo contextual, evangelio destacado
- **Notificaciones diarias** — 3 notificaciones (7am evangelio, 12pm versículo, 8pm rachas)
- **Sistema de etiquetas** — Tags con color, notas personales en favoritos, resaltado de versículos
- **Highlights en Biblia** — Long-press → color picker → fondo tintado

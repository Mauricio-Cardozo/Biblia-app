# ✝️ Iglesia Digital

Una aplicación móvil católica desarrollada con **Expo** y **React Native**, diseñada para acompañar la vida de fe. Centraliza textos sagrados (Biblia, Catecismo, Misal Romano) y herramientas de oración con una interfaz minimalista y elegante, combinando consulta de textos con elementos de gamificación espiritual.

---

---

## ✨ Funcionalidades

- **Versículo del Día** — Pasaje bíblico dinámico en la pantalla principal con fecha en español
- **Rachas** — Gamificación espiritual: seguimiento de días consecutivos de lectura de la Biblia y el Rosario
- **Biblia del Pueblo de Dios** — Navegación completa en 3 niveles:
  - 📖 Lista de libros con distinción Antiguo/Nuevo Testamento
  - 🔢 Selección de capítulo en grilla
  - 📜 Lectura de versículos con número dorado
- **Catecismo YOUCAT** — 526 preguntas con búsqueda LIKE, navegación por partes
- **Catecismo de la Iglesia Católica (CIC)** — Navegación completa en 5 niveles:
  - Parte → Sección → Capítulo → Artículo → Numerales con jerarquía completa y búsqueda FTS5
- **Misal Romano (México)** — Ordinario de la Misa, Propio del Tiempo completo (157 días), 67 Prefacios, 4 Plegarias Eucarísticas, 207 Misal de Santos, desde los PDFs oficiales de LiturgiaPapal
- **Santoral** — 919 santos con biografías y misa propia cuando corresponde
- **Misa de Hoy** — Lecturas diarias del leccionario + acceso rápido al Propio del Tiempo y Prefacios
- **Home rediseñado** — Hero section con gradient, badge litúrgico, saludo contextual ("Bendecido día/tarde/noche"), evangelio destacado, santo del día + rachas
- **Favoritos con etiquetas** — Marcá versículos y numerales como favoritos con persistencia en AsyncStorage; agrupación por tags, notas personales, color picker
- **Highlights en Biblia** — Long-press para resaltar versículos con 6 colores, fondo tintado, corazón coloreado
- **Notificaciones diarias** — 3 notificaciones programables: evangelio 7am, versículo aleatorio 12pm, recordatorio de rachas 8pm
- **Rosario Guiado** — Recitación paso a paso con cuentas visuales, misterios según el día y registro de racha (🔥 días consecutivos)
- **Coronilla de la Divina Misericordia** — Guiada paso a paso con el mismo sistema de rachas
- **Oraciones del Vaticano** — 23 oraciones extraídas de Vatican News (Ángelus, Magnificat, Te Deum, etc.)
- **Jaculatorias** — 5 grupos de invocaciones con formato V./R.
- **Novenas** — 18 devociones de 9 días (Espíritu Santo, Virgen María, Inmaculada, etc.) con selector de día
- **Calendario Litúrgico** — Navegación mensual con indicador de lecturas disponibles
- **Evangelio del Día** — Lectura diaria desde el leccionario con fuente ajustable
- **Modo Lectura** — Control de tamaño de fuente (0.8×–1.5×) con persistencia
- **Búsqueda FTS5** — Búsqueda de texto completo optimizada en SQLite sobre CIC
- **100% Offline** — Toda la base de datos está incluida en la app
- **Santoral completo** — 919 santos con biografía y misa propia
- **YOUCAT** — 526 preguntas del Youcat con búsqueda
- **Favoritos** — Marcá versículos, preguntas YOUCAT y lecturas como favoritos con persistencia en AsyncStorage, agrupables por etiquetas, con notas y color
- **Notificaciones diarias** — 3 notificaciones programables: evangelio 7am, versículo aleatorio 12pm, recordatorio de rachas 8pm

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Expo | SDK 56 | Framework principal |
| React Native | 0.85.3 | UI nativa |
| TypeScript | 6.x | Tipado estático |
| expo-router | 56.x | Navegación basada en archivos (Tabs + Stacks) |
| expo-sqlite | 56.x | Base de datos local con soporte FTS5 |
| @shopify/flash-list | latest | Listas de alto rendimiento |
| react-native-reanimated | latest | Transiciones fluidas |
| react-native-safe-area-context | latest | Gestión de insets |

---

## 🗄️ Base de Datos

La app usa un archivo SQLite precompilado (`iglesia_digital.db`) ubicado en `AppMovil/assets/`, copiado al directorio de documentos local en el primer arranque.

**Tablas:**

```sql
-- Biblia del Pueblo de Dios
TABLE biblia_pueblo_dios (
  id          INTEGER PRIMARY KEY,
  libro       TEXT,
  capitulo    INTEGER,
  versiculo   INTEGER,
  texto       TEXT,
  testamento  TEXT   -- 'Antiguo' | 'Nuevo'
)

-- YOUCAT (526 preguntas)
TABLE youcat (
  id        INTEGER PRIMARY KEY,
  parte_id  INTEGER,
  parte     TEXT,
  seccion   TEXT,
  capitulo  TEXT,
  pregunta  TEXT,
  respuesta TEXT,
  comentario TEXT
)

-- Catecismo de la Iglesia Católica (CIC) — 2865 numerales
TABLE catecismo_cic (
  id        INTEGER PRIMARY KEY,
  parte     TEXT,
  seccion   TEXT,
  capitulo  TEXT,
  articulo  TEXT,
  texto     TEXT NOT NULL
)

-- Leccionario diario (evangelio del día)
TABLE lecturas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha           TEXT NOT NULL UNIQUE,
  titulo_misa     TEXT,
  primera_lectura_ref TEXT,
  primera_lectura TEXT,
  salmo           TEXT,
  aleluia         TEXT,
  evangelio_ref   TEXT,
  evangelio       TEXT,
  comentario_papal TEXT,
  url             TEXT
)

-- Misal Romano — Propio del Tiempo (157 días)
TABLE misal_propio (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  temporada       TEXT NOT NULL,
  temporada_label TEXT,
  dia             TEXT NOT NULL,
  colecta         TEXT,
  oracion_ofrendas TEXT,
  postcomunion    TEXT,
  prefacio        TEXT,
  antifona_entrada TEXT,
  antifona_comunion TEXT
)

-- Misal Romano — Ordinario de la Misa
TABLE misal_ordinario (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  seccion     TEXT NOT NULL,
  subseccion  TEXT,
  rol         TEXT,
  texto       TEXT NOT NULL,
  orden       INTEGER
)

-- Misal Romano — Prefacios (67)
TABLE misal_prefacios (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo  TEXT NOT NULL,
  texto   TEXT NOT NULL
)

-- Misal Romano — Plegarias Eucarísticas (4)
TABLE misal_plegarias (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  texto  TEXT NOT NULL
)

-- Misal Romano — Santos (207 con misa propia)
TABLE misal_santos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  mes             INTEGER,
  dia             INTEGER,
  nombre          TEXT,
  titulo          TEXT,
  rango           TEXT,
  colecta         TEXT,
  oracion_ofrendas TEXT,
  postcomunion    TEXT,
  prefacio        TEXT,
  antifona_entrada TEXT,
  antifona_comunion TEXT
)

-- Santoral (919 santos con biografía)
TABLE santos (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  mes       INTEGER,
  dia       INTEGER,
  nombre    TEXT,
  titulo    TEXT,
  biografia TEXT
)

-- Novenas (devociones de 9 días)
TABLE novenas (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  url    TEXT
)

-- Días de novena
TABLE novena_dias (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  novena_id INTEGER NOT NULL,
  dia       INTEGER NOT NULL,
  titulo    TEXT,
  texto     TEXT NOT NULL,
  FOREIGN KEY (novena_id) REFERENCES novenas(id)
)
```

---

## 🚀 Instalación y ejecución

> **Nota sobre E2E tests:** Los 8 flujos Maestro en `maestro/flows/` se ejecutan con:
> ```bash
> maestro test maestro/flows/
> ```
> Requiere emulador Android o dispositivo con depuración USB.

> **Nota sobre actualizaciones de BD:** Si la app muestra errores de columnas o tablas faltantes (ej. `no such column: parte` o `no such table: ..._fts`), la migración automática en `db/init.ts` los corrige al arrancar. También podés forzar la recreación borrando la DB almacenada en el dispositivo:
> ```bash
> adb shell "run-as com.iglesiadigital.app rm /data/data/com.iglesiadigital.app/files/ExpoLite/iglesia_digital.db"
> ```

### Requisitos previos

- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/client) en tu dispositivo Android/iOS

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Mauricio-Cardozo/Biblia-app.git
cd Biblia-app/AppMovil

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npx expo start -c

# 4. Escanear el QR con Expo Go
```

> **Nota para CachyOS / Arch Linux (fish shell):** Los heredocs `<< 'EOF'` no funcionan en fish. Usá `python3 -c "open(...).write(...)"` o editá los archivos directamente desde VS Code.

### Build APK (Android)

```bash
# 1. Instalar EAS CLI (si no lo tenés)
npm install -g eas-cli

# 2. Iniciar sesión en tu cuenta Expo
eas login

# 3. Build APK de desarrollo
eas build --platform android --profile preview

# 4. Build AAB para Play Store
eas build --platform android --profile production
```

---

## 📁 Estructura del Proyecto

```
├── AppMovil/                        # App principal (Expo)
│   ├── app/
│   │   ├── _layout.tsx              # Layout raíz — SQLiteProvider + DatabaseInit + Stack
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx          # Tab bar flotante (Home, Biblia, Calendario, Oración)
│   │   │   ├── index.tsx            # Home — liturgia del día + rachas + santo + propio
│   │   │   ├── biblia.tsx           # Biblia — libros → capítulos → versículos + búsqueda FTS5
│   │   │   ├── catecismo.tsx        # YOUCAT — partes → preguntas → detalle + búsqueda LIKE
│   │   │   └── oracion.tsx          # Hub de oración — rosario, coronilla, oraciones, jaculatorias, novenas
│   │   ├── (tabs)/misal.tsx         # Misal — Propio, Ordinario, Prefacios, Plegarias, Santos
│   │   ├── misal/
│   │   │   ├── hoy.tsx              # Misa de Hoy (lecturas + acceso al Propio)
│   │   │   ├── propio/
│   │   │   │   ├── index.tsx        # Temporadas (Adviento, Navidad, Cuaresma, Pascua, Ordinario)
│   │   │   │   └── [id].tsx         # Detalle del día propio
│   │   │   ├── ordinario/
│   │   │   │   ├── index.tsx        # Secciones del Ordinario
│   │   │   │   └── [id].tsx         # Detalle de sección
│   │   │   ├── prefacios/
│   │   │   │   ├── index.tsx        # Lista de prefacios
│   │   │   │   └── [id].tsx         # Texto del prefacio
│   │   │   └── plegarias/
│   │   │       ├── index.tsx        # Lista de plegarias
│   │   │       └── [id].tsx         # Texto de la plegaria
│   │   ├── santo/[id].tsx           # Biografía del santo del día
│   │   ├── rosario/
│   │   │   ├── guia.tsx             # Rosario guiado con misterios + racha
│   │   │   └── coronilla.tsx        # Coronilla de la Divina Misericordia
│   │   ├── oraciones/
│   │   │   ├── index.tsx            # Lista de oraciones del Vaticano
│   │   │   ├── [id].tsx             # Detalle con fuente ajustable
│   │   │   ├── jaculatorias.tsx     # Jaculatorias agrupadas V./R.
│   │   │   └── novena/
│   │   │       ├── index.tsx        # Lista de 18 novenas
│   │   │       └── [id].tsx         # Detalle con selector de día
│   │   ├── evangelio.tsx            # Lectura del día (evangelio + 1ra lectura + salmo)
│   │   ├── calendario.tsx           # Calendario litúrgico mensual
│   │   ├── favoritos.tsx            # Favoritos agrupados (Biblia + YOUCAT)
│   │   └── test.tsx                 # Debug — DB diagnosis, rebuild FTS, expand DB
│   ├── components/
│   │   ├── themed-text.tsx          # Texto con 5 variantes (title/body/caption/...)
│   │   ├── reading-section.tsx      # Layout reutilizable de secciones de lectura
│   │   ├── prayer-runner.tsx        # Genérico para oraciones contadas (rosario, coronilla)
│   │   ├── fav-btn.tsx              # Heart toggle para favoritos con color dot
│   │   ├── font-size-control.tsx    # A-/A+ con persistencia
│   │   └── ui/
│   │       ├── screen-header.tsx    # Header reutilizable con back, superLabel, title, rightSlot
│   │       ├── hero-section.tsx     # Hero gradient con greeting, season badge, gospel quote
│   │       ├── streak-card.tsx      # Card reutilizable para rachas
│   │       ├── santo-card.tsx       # Card de santo del día
│   │       ├── list-item-card.tsx   # Card con badge, animación scale, chevron
│   │       ├── libro-card.tsx       # Card de libro bíblico con abreviatura + nombre
│   │       ├── buscador.tsx         # Input de búsqueda compartido (Biblia + YOUCAT)
│   │       ├── section-card.tsx     # Card de sección con subtítulo
│   │       ├── icon-symbol.tsx      # Iconos SF Symbols (iOS) / MaterialIcons (Android)
│   │       └── floating-tab-bar.tsx # Tab bar flotante con scroll-to-hide
│   ├── db/
│   │   ├── init.ts                  # Migración automática (CURRENT_VERSION=7)
│   │   ├── db.ts                    # Barrel — re-exporta todas las queries
│   │   ├── biblia.ts                # Queries de Biblia (libros, capítulos, versículos, búsqueda)
│   │   ├── catecismo.ts             # Queries de YOUCAT + CIC
│   │   ├── lecturas.ts              # Queries del leccionario diario
│   │   ├── misal.ts                 # Queries del Misal (propio, ordinario, prefacios, plegarias)
│   │   ├── santos.ts                # Queries del santoral (santos + misal_santos)
│   │   └── test-utils.ts            # sql.js adapter para tests en memoria
│   ├── hooks/
│   │   └── use-db-query.ts          # Hook genérico: fetch async + loading/error/data
│   ├── contexts/
│   │   ├── font-size.tsx            # Context de tamaño de fuente (0.8–1.5, paso 0.1)
│   │   └── bible-version.tsx        # Context de versión bíblica (1 traducción)
│   ├── constants/
│   │   ├── theme.ts                 # Paleta Navy/Gold (C.*)
│   │   ├── spacing.ts               # Tokens de espaciado (S.*)
│   │   ├── radius.ts               # Tokens de borde (R.*)
│   │   ├── shared-styles.ts         # Estilos comunes (container, center, card, etc.)
│   │   └── misal-sections.ts        # Secciones tipadas del Misal
│   ├── data/
│   │   ├── prayers.ts               # Textos de oraciones compartidas
│   │   ├── rosario-steps.ts         # Misterios del rosario por día
│   │   ├── coronilla-steps.ts       # Pasos de la Coronilla
│   │   ├── streaks.ts               # Cálculo de rachas (AsyncStorage)
│   │   ├── favoritos.ts             # CRUD de favoritos con notas/tags/color (AsyncStorage)
│   │   ├── tags.ts                  # CRUD de etiquetas (AsyncStorage)
│   │   ├── export-import.ts         # Backup/restore de AsyncStorage
│   │   ├── jaculatorias.ts          # Jaculatorias agrupadas
│   │   ├── vatican-prayers.ts       # 23 oraciones de Vatican News
│   │   ├── notifications.ts         # Notificaciones diarias (expo-notifications)
│   │   └── export-import.ts         # Backup/restore de AsyncStorage
│   ├── utils/
│   │   ├── date.ts                  # formatoFecha, hoy, fechaActualLarga
│   │   ├── seasons.ts               # detectSeason, parseWeekNumber, romanToInt, isSunday
│   │   └── scroll-state.ts          # Animated.Value compartido para tab bar
│   ├── types/
│   │   └── index.ts                 # Interfaces: Book, Chapter, Verse, Lectura, Santo, etc.
│   ├── maestro/
│   │   ├── config.yaml              # Config de Maestro E2E (appId)
│   │   ├── PROMPT.md                # Prompt para Antigravity (generar flujos)
│   │   ├── CI_PROMPT.md             # Prompt para CI/CD con Antigravity
│   │   └── flows/                   # 8 flujos E2E Maestro YAML
│   ├── __tests__/                   # 46 tests, 6 suites (Jest) — 0 lint errors
│   ├── .antigravity/
│   │   └── rules.md                 # Contexto de la app para Antigravity CLI
│   └── assets/
│       ├── iglesia_digital.db       # Base de datos SQLite (12 tablas)
│       └── images/                  # Iconos, splash, fondos
├── archive/                         # Scripts Python de ingesta de datos
│   ├── scraper_vaticano.py          # Vatican News → SQLite (lecturas)
│   ├── scraper_misal.py             # PDFs Misal Romano → SQLite
│   ├── scraper_youcat.py            # YOUCAT desde mscperu.org
│   ├── scraper_novenas.py           # Novenas desde devocionario.com
│   ├── scraper_cic.py               # PDF CIC → SQLite
│   ├── scraper_oraciones_vatican.py # Oraciones Vatican News → JSON
│   ├── popular_cic.py               # Extrae capítulo/artículo del CIC
│   └── misal_pdfs/                  # 17 PDFs fuente del Misal Romano
└── AGENTS.md                        # Guía para agentes IA
```

---

## 🎨 Diseño

Paleta **Navy Blue y Dorado** inspirada en los colores litúrgicos:

| Token | Hex | Uso |
|---|---|---|---|
| `navy` | `#0D1B2A` | Fondo principal |
| `navyMid` | `#1A2D45` | Cards y headers |
| `navyLight` | `#243B55` | Botones y elementos secundarios |
| `gold` | `#C9A84C` | Acentos, números de versículo |
| `goldLight` | `#E8C97A` | Texto destacado |
| `text` | `#F0E6CC` | Texto principal |

Además: `constants/spacing.ts` (S.*) con 8 tokens de espaciado, `constants/radius.ts` (R.*) con 5 tokens de borde, y `constants/shared-styles.ts` con estilos comunes.

---

## 🗺️ Roadmap

### ✅ Completado

- [x] Biblia del Pueblo de Dios — navegación completa + selector de versión
- [x] Catecismo CIC — navegación multinivel (5 niveles) + FTS5
- [x] Misal Romano — Propio del Tiempo (157 días), Ordinario (202 bloques), 67 Prefacios, 4 Plegarias Eucarísticas
- [x] Rosario guiado con misterios y rachas 🔥
- [x] Coronilla de la Divina Misericordia guiada
- [x] Evangelio del Día desde el leccionario
- [x] Calendario litúrgico mensual
- [x] Favoritos (versículos bíblicos + numerales CIC)
- [x] 23 oraciones del Vaticano
- [x] Jaculatorias agrupadas
- [x] Versículo del Día — pasaje destacado en la pantalla principal
- [x] Misa de hoy — lecturas diarias del leccionario con acceso al Propio del Tiempo
- [x] CIC capítulo/artículo poblado — 2359/2865 caps, 1964/2865 arts extraídos vía `popular_cic.py`
- [x] Modo lectura (fuente ajustable 0.8×–1.5×)
- [x] Novenas — 18 devociones de 9 días
- [x] **YOUCAT** — 526 preguntas con navegación por partes + LIKE search
- [x] **Santoral completo** — 919 santos con biografía + 207 con misa propia
- [x] **Rediseño navegación** — tab bar flotante redondeada, scroll-to-hide, ajustes en Home, calendario como tab
- [x] **React Compiler — 27 violaciones corregidas** — Animated.Value, setState en efectos, impure functions
- [x] **BibliaVersionContext simplificado** — eliminado multi-versión (1 sola traducción)
- [x] **Tokens de diseño** — spacing.ts (S.*), radius.ts (R.*), shared-styles.ts, misal-sections.ts
- [x] **Componentes compartidos** — LibroCard, Buscador, SectionCard, ReadingSection
- [x] **Tests E2E** — 8 flujos Maestro para navegación principal
- [x] **Infra testing** — @testing-library/react, jest-environment-jsdom, test de hooks
- [x] **Limpieza total de deuda técnica** — ~15 archivos muertos eliminados, catch(e: any) → instanceof Error, DB queries sin find() cliente
- [x] **Rediseño de Home** — HeroSection con gradient + season badge + greeting + evangelio. StreakCard + SantoCard extraídos. `expo-linear-gradient`.
- [x] **Notificaciones bíblicas diarias** — 3 notificaciones (7am evangelio, 12pm versículo, 8pm rachas) con toggles en ajustes y reschedule al abrir.
- [x] **Sistema de etiquetas, highlights y notas** — Favorito expandido con `notas`, `tags`, `color`. CRUD de tags. Modal de edición. Highlights en Biblia con color picker.

### 🟡 Mediano plazo

### 🟡 Mediano plazo
- [ ] **Configuraciones funcionales** — tema claro/oscuro real, notificaciones push (expo-notifications), ayuda integrada.
- [ ] **Animaciones y transiciones** — shared elements, hero animations, fade, scale, skeletons, microinteracciones. Inspirado en Lummen.
- [ ] **Widget Android** — versículo del día, racha y acceso rápido desde la pantalla de inicio.
- [ ] **Search global** — buscar en Biblia + CIC + Misal desde un campo unificado (FTS5 ya existe).
- [ ] **Workspaces** — guardar combinaciones de pantalla (ej. "Devocional matutino" con lectura + salmo)
- [ ] **Bloc de notas (Study Pad)** — notas personales con referencias bíblicas enlazables
- [ ] **Text-to-Speech** — botón "Escuchar" en Biblia/lecturas con control de velocidad
- [ ] **Deep linking** — compartir versículos via `iglesiadigital://biblia/Libro/Capítulo/Versículo`
- [ ] **Personalización visual** — selección de fuente (serif/sans), interlineado, temas
- [ ] **Referencias cruzadas** — cross-references clicables entre versículos

### 🟢 Largo plazo

- [ ] **Planes de lectura** — "Biblia en 1 año" con progreso y checkmarks
- [ ] **Strong's / palabras originales** — griego/hebreo con concordancia (requiere datos en DB)
- [ ] **Memorización** — modo de ocultar palabras para aprender versículos
- [ ] **Módulos descargables** — más traducciones bíblicas y comentarios vía descarga
- [ ] **Cloud Sync** — sincronización de favoritos/notas/rachas
- [ ] **i18n** — soporte multilingüe (inglés, portugués)
- [ ] **Integración IA** — "Explicar este pasaje" con API key propia del usuario
- [ ] **Sincronización en la nube (Firebase)**
- [ ] **Biblia de Jerusalén** (pendiente de conseguir texto digital)
- [ ] **Modo discreto** — apariencia alternativa para entornos restringidos
- [ ] **Split-pane / multi-ventana** — dos paneles simultáneos (Biblia + CIC, o Lecturas + Reflexión).

---

## 🛠️ Scripts de Datos (Python)

Los scripts en `archive/` procesan los PDFs o sitios web y generan la base de datos:

```bash
# Instalar dependencia (solo para scrapers PDF)
pip install pdfplumber --break-system-packages

# Scrapear lecturas diarias desde Vatican News (sin dependencias externas)
python3 archive/scraper_vaticano.py                          # mes actual + siguiente
python3 archive/scraper_vaticano.py --fecha 2026-06-11       # una fecha
python3 archive/scraper_vaticano.py --desde 2026-01-01 --hasta 2026-06-30
python3 archive/scraper_vaticano.py --preview --fecha 2026-06-11
python3 archive/scraper_vaticano.py --list                   # ver registros

# Generar catecismo_cic desde el PDF oficial
python3 archive/scraper_cic.py --preview   # vista previa sin guardar
python3 archive/scraper_cic.py             # genera la DB

# Scrapear Misal Romano desde 17 PDFs (LiturgiaPapal México)
python3 archive/scraper_misal.py --preview                                   # resumen de lo parseado
python3 archive/scraper_misal.py                                             # escribe en AppMovil/assets/iglesia_digital.db

# Poblar capítulo/artículo del CIC desde marcadores textuales
python3 archive/popular_cic.py                                               # extrae y actualiza catecismo_cic.capitulo + articulo

# Scrapear oraciones desde Vatican News (sin dependencias externas)
python3 archive/scraper_oraciones_vatican.py          # imprime JSON en stdout
python3 archive/scraper_oraciones_vatican.py > oraciones.json

# Novenas desde devocionario.com (sin dependencias externas)
python3 archive/scraper_novenas.py --preview           # vista previa JSON
python3 archive/scraper_novenas.py --db assets/db.db   # escribir en DB
```

---

## 🙏 Créditos

- **Biblia del Pueblo de Dios** — Texto bíblico en español latinoamericano
- **Catecismo de la Iglesia Católica** — © Libreria Editrice Vaticana
- **Misal Romano (México)** — © LiturgiaPapal.org / Conferencia del Episcopado Mexicano
- Desarrollado con ❤️ por [Mauricio](https://github.com/Mauricio-Cardozo)

---

## 📄 Licencia

Proyecto de uso personal y educativo. Los textos bíblicos y catequéticos pertenecen a sus respectivos propietarios.

---

### 📊 Análisis comparativo

Ver [`analisis-andbible.md`](./analisis-andbible.md) para un análisis detallado de features de [AndBible](https://github.com/AndBible/and-bible) y priorización para Iglesia Digital.

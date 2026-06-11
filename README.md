# ✝️ Iglesia Digital

Una aplicación móvil católica desarrollada con **Expo** y **React Native**, diseñada para acompañar la vida de fe. Centraliza textos sagrados (Biblia, Catecismo, YOUCAT) y herramientas de oración con una interfaz minimalista y elegante, combinando consulta de textos con elementos de gamificación espiritual.

---

## 📱 Capturas de pantalla

| Home | Biblia | Catecismo |
|------|--------|-----------|
| Versículo del día y rachas | Navegación por libros, capítulos y versículos | Navegación multinivel por partes y numerales |

---

## ✨ Funcionalidades

- **Versículo del Día** — Pasaje bíblico dinámico en la pantalla principal con fecha en español
- **Rachas** — Gamificación espiritual: seguimiento de días consecutivos de lectura de la Biblia y el Rosario
- **Biblia del Pueblo de Dios** — Navegación completa en 3 niveles:
  - 📖 Lista de libros con distinción Antiguo/Nuevo Testamento
  - 🔢 Selección de capítulo en grilla
  - 📜 Lectura de versículos con número dorado
- **Catecismo de la Iglesia Católica (CIC)** — Navegación completa en 4 niveles:
  - Parte → Sección → Numerales → Detalle con jerarquía completa
- **YOUCAT (Catecismo Joven)** — Navegación por partes + búsqueda FTS5 con 162 preguntas y respuestas
- **Rosario Guiado** — Recitación paso a paso con cuentas visuales, misterios según el día y registro de racha
- **Búsqueda FTS5** — Búsqueda de texto completo optimizada en SQLite
- **100% Offline** — Toda la base de datos está incluida en la app

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Expo | SDK 54 | Framework principal |
| React Native | 0.76+ | UI nativa |
| TypeScript | 5.x | Tipado estático |
| expo-router | 6.x | Navegación basada en archivos (Tabs + Stacks) |
| expo-sqlite | 15.x | Base de datos local con soporte FTS5 |
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

-- Catecismo de la Iglesia Católica (CIC)
TABLE catecismo_cic (
  id        INTEGER PRIMARY KEY,  -- Número de numeral (1-2865)
  parte     TEXT,
  seccion   TEXT,
  capitulo  TEXT,
  articulo  TEXT,
  texto     TEXT NOT NULL
)

-- YOUCAT (Catecismo Joven)
TABLE youcat (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  pregunta_nro    INTEGER NOT NULL,
  pregunta_texto  TEXT NOT NULL,
  respuesta_texto TEXT NOT NULL,
  parte           TEXT,
  capitulo        TEXT
)

-- Leccionario diario (evangelio del día)
TABLE lecturas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha           TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD
  titulo_misa     TEXT,
  primera_lectura TEXT,
  salmo           TEXT,
  aleluia         TEXT,
  evangelio       TEXT
)
```

---

## 🚀 Instalación y ejecución

### Requisitos previos

- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/client) en tu dispositivo Android/iOS

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Mauricio-bb/Biblia-app.git
cd Biblia-app/AppMovil

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npx expo start -c

# 4. Escanear el QR con Expo Go
```

> **Nota para CachyOS / Arch Linux (fish shell):** Los heredocs `<< 'EOF'` no funcionan en fish. Usá `python3 -c "open(...).write(...)"` o editá los archivos directamente desde VS Code.

---

## 📁 Estructura del Proyecto

```
Biblia-app/
├── AppMovil/                        # App principal (Expo)
│   ├── app/
│   │   ├── _layout.tsx              # Layout raíz — SQLiteProvider + Stack
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx          # Tab bar (Home, Biblia, Catecismo, YOUCAT)
│   │   │   ├── index.tsx            # Home — versículo del día + rachas + YOUCAT
│   │   │   ├── biblia.tsx           # Biblia — libros → capítulos → versículos
│   │   │   ├── catecismo.tsx        # CIC — partes → secciones → numerales → detalle
│   │   │   └── youcat.tsx           # YOUCAT — partes → preguntas → detalle + búsqueda
│   │   ├── rosario/
│   │   │   └── guia.tsx             # Guía interactiva del Rosario con misterios
│   │   └── test.tsx                 # Sandbox para pruebas de DB y FTS5
│   ├── components/
│   │   ├── themed-text.tsx
│   │   └── themed-view.tsx
│   ├── types/
│   │   └── index.ts                 # Interfaces compartidas (Book, CICNumeral, etc.)
│   ├── constants/
│   │   └── theme.ts                 # Paleta Navy/Gold + tokens C
│   └── assets/
│       └── iglesia_digital.db       # Base de datos SQLite
└── archive/                         # Scripts Python de ingesta de datos
    ├── scraper_cic.py               # PDF del CIC → SQLite (catecismo_cic)
    ├── scraper_youcat.py            # PDF del YOUCAT → SQLite (youcat)
    ├── scraper_leccionario.py       # curas.com.ar → SQLite (lecturas diarias)
    └── scraper_biblia.py            # Scraper original de la Biblia
```

---

## 🎨 Diseño

Paleta **Navy Blue y Dorado** inspirada en los colores litúrgicos:

| Token | Hex | Uso |
|---|---|---|
| `navy` | `#0D1B2A` | Fondo principal |
| `navyMid` | `#1A2D45` | Cards y headers |
| `navyLight` | `#243B55` | Botones y elementos secundarios |
| `gold` | `#C9A84C` | Acentos, números de versículo |
| `goldLight` | `#E8C97A` | Texto destacado |
| `text` | `#F0E6CC` | Texto principal |

---

## 🗺️ Roadmap

- [x] Biblia del Pueblo de Dios — navegación completa
- [x] Catecismo CIC — navegación multinivel (4 niveles)
- [x] Búsqueda FTS5 en SQLite
- [x] Rachas de lectura
- [ ] Evangelio del Día dinámico (desde leccionario)
- [x] Rosario guiado con misterios
- [x] YOUCAT — Catecismo Joven (navegación + búsqueda FTS5)
- [ ] Marcadores y favoritos
- [ ] Notificaciones diarias
- [ ] Modo lectura (fuente ajustable)
- [ ] Sincronización en la nube (Firebase)
- [x] Tipos TypeScript centralizados en `types/`
- [x] Paleta de colores consolidada en `constants/theme.ts`

---

## 🛠️ Scripts de Datos (Python)

Los scripts en `archive/` procesan los PDFs y generan la base de datos:

```bash
# Instalar dependencia
pip install pdfplumber --break-system-packages

# Generar catecismo_cic desde el PDF oficial
python3 archive/scraper_cic.py --preview   # vista previa sin guardar
python3 archive/scraper_cic.py             # genera la DB

# Generar youcat desde el PDF
python3 archive/scraper_youcat.py --preview
python3 archive/scraper_youcat.py

# Scrappear leccionario diario (requiere internet)
python3 archive/scraper_leccionario.py     # hoy
python3 archive/scraper_leccionario.py --date 2025-08-15
```

---

## 🙏 Créditos

- **Biblia del Pueblo de Dios** — Texto bíblico en español latinoamericano
- **Catecismo de la Iglesia Católica** — © Libreria Editrice Vaticana
- **YOUCAT** — Catecismo Joven de la Iglesia Católica
- Desarrollado con ❤️ por [Mauricio](https://github.com/Mauricio-bb)

---

## 📄 Licencia

Proyecto de uso personal y educativo. Los textos bíblicos y catequéticos pertenecen a sus respectivos propietarios.

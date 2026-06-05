# ✝️ Iglesia Digital

Una aplicación móvil católica desarrollada con **Expo** y **React Native**, diseñada para acompañar la vida de fe con la Biblia del Pueblo de Dios y el Catecismo de la Iglesia Católica disponibles offline.

---

## 📱 Capturas de pantalla

| Home | Biblia | Catecismo |
|------|--------|-----------|
| Versículo del día y rachas | Navegación por libros, capítulos y versículos | Navegación por partes y numerales |

---

## ✨ Funcionalidades

- **Versículo del Día** — Un versículo bíblico nuevo cada día en la pantalla principal
- **Rachas** — Seguimiento de días consecutivos de lectura de la Biblia y el Rosario
- **Biblia del Pueblo de Dios** — Navegación completa en 3 niveles:
  - 📖 Lista de libros (Antiguo y Nuevo Testamento)
  - 🔢 Selección de capítulo
  - 📜 Lectura de versículos
- **Catecismo de la Iglesia Católica (CIC)** — Navegación completa en 4 niveles:
  - Parte → Sección → Numerales → Detalle completo
- **100% Offline** — Toda la base de datos está incluida en la app, no requiere internet

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Expo | SDK 54 | Framework principal |
| React Native | 0.76+ | UI nativa |
| TypeScript | 5.x | Tipado estático |
| expo-router | 6.x | Navegación basada en archivos |
| expo-sqlite | 15.x | Base de datos local |

---

## 🗄️ Base de Datos

La app usa un archivo SQLite precompilado (`iglesia_digital.db`) ubicado en `AppMovil/assets/`.

**Tablas principales:**

```sql
-- Biblia del Pueblo de Dios
TABLE biblia_pueblo_dios (
  id          INTEGER PRIMARY KEY,
  libro       TEXT,
  capitulo    INTEGER,
  versiculo   INTEGER,
  texto       TEXT,
  testamento  TEXT  -- 'Antiguo' | 'Nuevo'
)

-- Catecismo de la Iglesia Católica
TABLE catecismo_cic (
  id        INTEGER PRIMARY KEY,
  parte     TEXT,
  seccion   TEXT,
  capitulo  TEXT,
  articulo  TEXT,
  texto     TEXT
)
```

---

## 🚀 Instalación y ejecución

### Requisitos previos

- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/client) en tu dispositivo Android/iOS
- [npx](https://docs.npmjs.com/cli/v7/commands/npx)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Mauricio-bb/Biblia-app.git
cd Biblia-app/AppMovil

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npx expo start -c

# 4. Escanear el QR con Expo Go en tu celular
```

> **Nota para CachyOS / Arch Linux:** Si usás fish shell, los comandos con `<<EOF` no funcionan. Usá `python3` o el editor de código para modificar archivos.

---

## 📁 Estructura del Proyecto

```
Biblia-app/
├── AppMovil/                  # App principal (Expo)
│   ├── app/
│   │   ├── _layout.tsx        # Layout raíz con SQLiteProvider
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx    # Tab bar (Home, Biblia, Catecismo)
│   │   │   ├── index.tsx      # Pantalla Home
│   │   │   ├── biblia.tsx     # Pantalla Biblia
│   │   │   └── catecismo.tsx  # Pantalla Catecismo
│   │   └── modal.tsx
│   ├── assets/
│   │   └── iglesia_digital.db # Base de datos SQLite
│   ├── components/
│   │   ├── themed-text.tsx
│   │   └── themed-view.tsx
│   └── constants/
│       └── theme.ts           # Colores Navy/Gold
└── archive/                   # Scripts Python de scraping
```

---

## 🎨 Diseño

La app usa una paleta **Navy Blue y Dorado** inspirada en los colores litúrgicos:

| Color | Hex | Uso |
|---|---|---|
| Navy | `#0D1B2A` | Fondo principal |
| Navy Mid | `#1A2D45` | Cards y header |
| Gold | `#C9A84C` | Acentos y títulos |
| Gold Light | `#E8C97A` | Texto destacado |
| Text | `#F0E6CC` | Texto principal |

---

## 🗺️ Roadmap

- [ ] Versículo del día dinámico (desde la DB por fecha)
- [ ] Rosario guiado con misterios
- [ ] Búsqueda en la Biblia
- [ ] Marcadores y favoritos
- [ ] Notificaciones diarias con versículo
- [ ] Modo lectura (fuente ajustable)
- [ ] YOUCAT (Catecismo para jóvenes)

---

## 🙏 Créditos

- **Biblia del Pueblo de Dios** — Texto bíblico en español latinoamericano
- **Catecismo de la Iglesia Católica** — Santa Sede
- Desarrollado con ❤️ por [Mauricio](https://github.com/Mauricio-bb)

---

## 📄 Licencia

Este proyecto es de uso personal y educativo. Los textos bíblicos y catequéticos pertenecen a sus respectivos propietarios.

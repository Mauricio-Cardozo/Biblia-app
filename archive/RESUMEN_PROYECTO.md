# Resumen Técnico: Proyecto Iglesia Digital (bible-app)

## 1. Descripción del Proyecto
"Iglesia Digital" es una aplicación móvil diseñada para el acompañamiento espiritual católico. La app centraliza textos sagrados (Biblia, Catecismo) y herramientas de oración (Rosario) con una interfaz de usuario minimalista y elegante. El enfoque combina la consulta de textos con elementos de gamificación espiritual (rachas, progreso diario).

## 2. Stack Tecnológico
El proyecto se desarrolla bajo el ecosistema **Expo**, priorizando el rendimiento y la facilidad de mantenimiento multiplataforma.

- **Framework:** React Native con Expo (v54).
- **Enrutamiento:** `expo-router` (basado en archivos).
- **Persistencia de Datos:** `expo-sqlite` (con soporte para FTS5 para búsqueda optimizada).
- ** UI / UX:** 
  - `react-native-reanimated`: Para transiciones fluidas.
  - `@shopify/flash-list`: Para renderizado de listas de alto rendimiento (optimización aplicada a numerales y libros).
  - `react-native-safe-area-context`: Gestión de insets de pantalla.
  - `@expo/vector-icons`: Iconografía estándar.
- **Backend/Scripts:** Python (scripts en `archive/`) para ingesta y limpieza de datos (utilizando `pdfplumber`, `pdfminer`, `pypdfium2`).

## 3. Estructura de Archivos
La lógica principal reside en `AppMovil/`:

- `AppMovil/app/`: Estructura de rutas de `expo-router`.
  - `(tabs)/`: Navegación principal.
    - `index.tsx`: Dashboard ("Home") con fecha dinámica y tarjetas de acceso rápido.
    - `biblia.tsx`: Lógica de navegación de libros, capítulos y versículos.
    - `catecismo.tsx`: Navegación multinivel (Partes → Secciones → Numerales → Detalle).
  - `rosario/guia.tsx`: Guía del Rosario.
  - `test.tsx`: Sandbox para pruebas de conectividad de base de datos y búsqueda FTS5.
- `AppMovil/services/`: Capa de abstracción para la base de datos (acceso a `iglesia_digital.db`).
- `AppMovil/components/`: Componentes reutilizables con estilos temáticos (ThemedText, ThemedView).

## 4. Funcionalidades Implementadas
- **Navegación:** Implementada completamente con `expo-router` (Tabs + Stacks).
- **UI:** Interfaz de usuario con esquema de colores oscuros (`navy`, `navyMid`) y acentos dorados (`gold`), cumpliendo con un diseño moderno.
- **Performance:** Optimización de listas mediante `@shopify/flash-list` en `biblia.tsx` y `catecismo.tsx`, eliminando el *layout thrashing* asociado a `FlatList` con grandes volúmenes de datos.
- **Datos:** 
  - Conexión funcional con SQLite.
  - Implementación de búsqueda FTS5 (búsqueda de texto completo).
  - Lógica de migración/copia de base de datos desde assets al directorio de documentos local.
- **Localización:** Fecha generada dinámicamente en español (formato `Día, N de Mes`).

## 5. Pendientes / Próximos Pasos
1. **Evangelio del Día:** Implementar la lógica para mostrar el pasaje diario (actualmente es un *placeholder* en el Home).
2. **Rosario:** Desarrollar la estructura completa de la guía del Rosario en `rosario/guia.tsx`.
3. **Sincronización:** Refinar la lógica de actualización del esquema de la base de datos (implementar `metadata` de versión).
4. **ETL:** Finalizar la ingesta de los datos faltantes del Ciclo Litúrgico y optimizar el manejo de errores en los scripts de scraping de Python.
5. **Types:** Centralizar las interfaces de TypeScript en `AppMovil/types/` para mejorar la escalabilidad del sistema.

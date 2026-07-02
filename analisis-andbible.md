# Análisis de AndBible — Qué copiar para Iglesia Digital

> Basado en el repo [AndBible/and-bible](https://github.com/AndBible/and-bible) (Kotlin, 13k+ commits, 760★, 14 años de desarrollo).

---

## 1. Split-pane / ventanas múltiples (LO MÁS IMPORTANTE)

AndBible permite tener múltiples paneles de texto en pantalla simultáneamente. Se pueden abrir varias traducciones de la Biblia lado a lado, o una traducción con un comentario al lado. Es la feature insignia.

**Qué copiar**: Permitir que el usuario abra 2 paneles simultáneos en tablets. En el panel izquierdo la Biblia, en el derecho un comentario/CIC/misa. En phones, al menos poder cambiar rápidamente entre "vista de lectura" y "vista de estudio" con un toggle.

**Prioridad**: ALTA (diferencia enorme para estudio serio)

---

## 2. Workspaces (espacios de trabajo)

AndBible tiene workspaces — configuraciones guardadas de qué documentos están abiertos, en qué paneles, con su estilo. Permite tener un workspace "Devocional matutino" (lectura del día + salmo) y otro "Estudio profundo" (Biblia + comentario + diccionario).

**Qué copiar**: Permitir al usuario guardar combinaciones de pantalla (Biblia + CIC, o Lecturas del día + Reflexión, etc.). En nuestra app católica tendría mucho sentido.

**Prioridad**: MEDIA (feature power-user, implementar después de split-pane)

---

## 3. Strong's / palabras originales (griego/hebreo)

AndBible integró el sistema de numeración Strong para análisis de palabras originales. Tocar una palabra -> ver su raíz griega/hebrea -> concordancia.

**Qué copiar**: Si la base de datos bíblica incluye números Strong, añadir vista de palabras originales. Es extremadamente valioso para estudio serio.

**Prioridad**: BAJA (requiere datos adicionales en DB, pero sería un diferenciador enorme)

---

## 4. Bookmarks, etiquetas y highlights (marcadores, etiquetas, resaltado)

Sistema completo: marcadores con etiquetas, notas personales, resaltado de versículos con colores. Las etiquetas se pueden filtrar y buscar.

**Qué copiar**: 
- Ya tenemos `FavBtn` con AsyncStorage (básico). Mejorar a un sistema de etiquetas (labels) con colores
- Permitir notas asociadas a versículos (se renderizan como comentario inline)
- Resaltado de texto con múltiples colores

**Prioridad**: ALTA (nuestra app ya tiene favoritos, hay que expandirlo)

---

## 5. Study Pads (bloc de notas de estudio)

AndBible tiene "Study Pads" — documentos en blanco que el usuario puede usar para tomar notas mientras escucha un sermón o estudia. Soporta referencias bíblicas enlazables.

**Qué copiar**: Un bloc de notas simple dentro de la app, con soporte para referencias bíblicas. Ideal para Misas/sermones.

**Prioridad**: MEDIA

---

## 6. Lectura de la Biblia con plan de lectura

Reading Plans: planes de lectura tipo "Biblia en 1 año" con seguimiento de progreso, checkboxes, y tracking automático de lo leído.

**Qué copiar**: 
- Ya tenemos lecturas diarias del día (misal + evangelio). Añadir plan "Biblia en 1 año" con checkmarks
- Mostrar progreso: "Leíste 45% del Antiguo Testamento"
- Tracking automático de versículos leídos

**Prioridad**: BAJA pero interesante para usuarios devotos

---

## 7. Memorización de versículos

AndBible tiene modos de memorización con Word Blur, Word Scramble, Word Type, Word Order.

**Qué copiar**: Un modo de memorización simple: mostrar versículo, ocultar palabras, el usuario completa.

**Prioridad**: BAJA (nice-to-have)

---

## 8. Text-to-Speech (TTS) avanzado

AndBible permite leer la Biblia en voz alta con voces TTS, bookmark de speech (speak bookmarks), sleep timer.

**Qué copiar**: Añadir botón "Escuchar" en la vista de Biblia/lecturas que lea el texto en voz alta. Control de velocidad.

**Prioridad**: MEDIA (útil para usuarios que quieren escuchar la misa/lectura del día)

---

## 9. CRUZ-REFERENCIAS Y NOTAS AL PIE ENLAZABLES

AndBible hace clic en una referencia cruzada y te lleva al pasaje. Igual con notas al pie.

**Qué copiar**: Añadir referencias cruzadas a la DB de la Biblia y hacerlas clicables (navegación a versículo). Aunque la DB actual `biblia_pueblo_dios` no tenga cross-refs, se podrían scrapear.

**Prioridad**: MEDIA (depende de datos disponibles)

---

## 10. SISTEMA DE MÓDULOS DESCARGABLES (SWORD)

AndBible usa JSword para descargar módulos desde repositorios Crosswire. El usuario puede instalar/desinstalar Biblias, comentarios, diccionarios.

**Qué copiar**: Quizás no el sistema completo (muy complejo), pero sí permitir expandir contenido descargable: más traducciones bíblicas, más comentarios, libros adicionales.

**Prioridad**: BAJA (muy complejo técnicamente; nuestra app está más curada)

---

## 11. Deep Linking (enlaces bíblicos)

AndBible soporta URLs tipo `https://read.andbible.org/?reference=Jn3.16` que abren la app en el versículo exacto.

**Qué copiar**: Implementar deep links para compartir versículos: `iglesiadigital://biblia/Juan/3/16`

**Prioridad**: MEDIA (útil para compartir en redes/WhatsApp)

---

## 12. Cloud Sync (sincronización en la nube)

AndBible sincroniza bookmarks, notas, progreso, etiquetas vía Google Drive.

**Qué copiar**: Sincronización de favoritos/notas/racha vía Nextcloud (o similar auto-hosteado), o al menos backup/restore local.

**Prioridad**: BAJA (complejo, pero importante para retención)

---

## 13. Diccionarios bíblicos integrados

AndBible puede abrir módulos de diccionario (Vine, Smith, etc.) que son clicables desde el texto bíblico.

**Qué copiar**: Un glosario de términos bíblicos (no necesitas módulo completo, un JSON con definiciones básicas). O integrar datos de diccionario bíblico gratuito.

**Prioridad**: BAJA

---

## 14. Modo discreto

AndBible tiene un "Discrete build" que se disfraza de calculadora para usuarios en zonas de persecución.

**Qué copiar**: Un modo de "apariencia inocente" o al menos un icono alternativo. No es prioritario pero es un gesto importante.

**Prioridad**: MUY BAJA (importante pero no bloqueante)

---

## 15. Personalización visual (CSS, fuentes, temas)

AndBible permite CSS personalizado para los módulos, cambio de fuente, tamaño, interlineado.

**Qué copiar**: 
- Ya tenemos FontSizeContext (0.8-1.5) — está bien
- Añadir: selección de fuente (serif vs sans), interlineado, tema claro/oscuro
- CSS personalizado (se puede implementar con WebView + CSS injection)

**Prioridad**: MEDIA (mejora UX)

---

## 16. Traducción de la interfaz (i18n)

AndBible tiene traducciones comunitarias vía Transifex. Interfaz en ~30 idiomas.

**Qué copiar**: Nuestra app es actualmente solo español. Añadir soporte multilingüe con i18n (inglés, portugués, etc.) ampliaría el alcance.

**Prioridad**: BAJA (para cuando la app esté madura)

---

## 17. Integración de IA (AI Bible Study Assistant)

AndBible 5.1+ añadió un asistente de estudio con IA (API key propia del usuario). Puede explicar pasajes, generar preguntas, etc.

**Qué copiar**: Añadir un botón "Explicar este pasaje" que use una API de LLM. El usuario trae su propia API key. Totalmente offline-first, la IA es optativa.

**Prioridad**: BAJA (tendencia actual, pero no esencial)

---

## 18. Arquitectura técnica a evitar (lecciones aprendidas)

AndBible usa:
- **JSword** (Java): biblioteca pesada, compleja, con curva de aprendizaje alta. Dependencia externa.
- **SQLite** con esquema genérico de módulos (tables dinámicas).
- **WebView** para renderizar texto bíblico con HTML/CSS/JS.
- **Dagger** para DI (Kotlin, complejo).

**Qué NO copiar**:
- No usar WebView para el texto bíblico. Nuestro enfoque React Native con Text component es más rápido y accesible.
- No usar un sistema de módulos dinámicos tan complejo al inicio. Empezar con contenido curado en DB embebida.
- No complicar con DI framework (nuestro stack sin state management es más simple y mantenible).

---

## 19. Notificaciones bíblicas diarias (BibleNotify)

> Basado en [BibleNotify/BibleNotify](https://github.com/BibleNotify/BibleNotify) (Flutter, 40★) — app que solo manda un versículo aleatorio por notificación diaria.

### Qué hace bien

BibleNotify resuelve una sola cosa, pero la resuelve perfectamente: **una notificación diaria no invasiva con un versículo**. Su arquitectura:

```
App configura hora y traducción
  → Android AlarmManager programa alarma diaria (android_alarm_manager_plus)
    → alarmCallback() se dispara en background
      → pickea un versículo aleatorio de un JSON plano
        → Muestra notificación con BigTextStyle (el versículo expandido)
          → Tapping abre la vista reader en ese versículo
```

### Stack técnico que usa

| Librería | Propósito |
|----------|-----------|
| `flutter_local_notifications` | Mostrar la notificación en Android |
| `android_alarm_manager_plus` | Programar alarma diaria recurrente |
| `shared_preferences` | Persistir hora, traducción, índice del versículo |
| JSONs planos por libro/traducción | Data bíblica |

### Lo que debemos copiar para Iglesia Digital

1. **Notificación diaria con la lectura del día** (evangelio de `lecturas` en SQLite) a las 7am
2. **Notificación con versículo aleatorio** de `biblia_pueblo_dios` al mediodía
3. **Notificación de recordatorio de racha** ("¡Reza el rosario!") personalizable
4. **Selector de hora** (TimePicker) y toggle on/off para cada tipo de notificación
5. **Permission handling** dedicado: pedir `POST_NOTIFICATIONS` (Android 13+) y `SCHEDULE_EXACT_ALARM` (Android 14+) en una pantalla de onboarding o settings
6. **BigTextStyle** en la notificación: que el versículo/lectura se vea completo al expandir
7. **Action al tap**: que al tocar la notificación abra la app en la lectura/versículo correspondiente

### Cómo implementarlo (ya tenemos todo)

- `expo-notifications` reemplaza a `flutter_local_notifications`
- `biblia_pueblo_dios` en SQLite reemplaza a los JSONs planos
- `lecturas` (tabla con el evangelio del día) para la notificación de lectura diaria
- `AsyncStorage` para persistir settings (hora, toggles) — ya lo usamos para streaks
- `data/notifications.ts` ya existe, hay que expandirlo

### Referencias del código de BibleNotify

| Archivo | Función clave |
|---------|--------------|
| `lib/services/notifications_service.dart` | `scheduleDailyNotification()`, `showBackgroundNotification()`, `scheduleNextAlarm()` |
| `lib/alarm_callback.dart` | `alarmCallback()` — entry-point de background que pica versículo + muestra notificación |
| `lib/services/settings_service.dart` | Persistencia de hora, traducción, versículo índice |
| `lib/services/verse_and_chapter_service.dart` | `generateRandomVerseIndex()`, `getVerseJsonFromIndex()` |

**Prioridad**: ALTA — implementación rápida (1-2 días), impacto directo en retención de usuarios.

---

## Resumen de prioridades para Iglesia Digital

| Prioridad | Feature | Esfuerzo | Impacto |
|-----------|---------|----------|---------|
| 🔴 ALTA | Split-pane (Biblia + comentario) | Alto | Muy alto |
| 🔴 ALTA | Sistema de etiquetas/highlights/notas | Medio | Alto |
| 🔴 ALTA | **Notificaciones bíblicas diarias** | **Bajo** | **Alto** |
| 🟡 MEDIA | Workspaces (combinaciones guardadas) | Medio | Medio |
| 🟡 MEDIA | Bloc de notas (Study Pad) | Bajo | Medio |
| 🟡 MEDIA | Text-to-Speech | Medio | Medio |
| 🟡 MEDIA | Deep linking (compartir versículos) | Bajo | Medio |
| 🟡 MEDIA | Personalización visual (temas/fuentes) | Bajo | Medio |
| 🟢 BAJA | Planes de lectura | Medio | Bajo |
| 🟢 BAJA | Strong's / palabras originales | Alto | Alto* |
| 🟢 BAJA | Memorización | Medio | Bajo |
| 🟢 BAJA | Módulos descargables | Muy alto | Medio |
| 🟢 BAJA | i18n (multi-idioma) | Medio | Medio |
| 🟢 BAJA | Cloud Sync | Alto | Medio |
| 🟢 BAJA | Integración IA | Bajo | Medio |
| ⚪ MUY BAJA | Modo discreto | Bajo | Bajo |

*Strong's tiene alto impacto pero depende de datos disponibles en la BD.

---

## Conclusión

AndBible es el estándar de oro para apps de estudio bíblico en Android por 3 razones:

1. **Split-pane + workspaces** — nadie más lo hace tan bien
2. **Sistema de módulos** — 1500+ documentos en 700+ idiomas
3. **Herramientas de estudio** — Strong's, notas, etiquetas, planes de lectura

Para Iglesia Digital, el camino es:
- **Corto plazo**: Notificaciones diarias + Split-pane simple (Biblia + CIC) + sistema de notas/etiquetas mejorado
- **Mediano plazo**: Workspaces, TTS, deep linking, temas visuales
- **Largo plazo**: Strong's, módulos descargables, cloud sync, IA

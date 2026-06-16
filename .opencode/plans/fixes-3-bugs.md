# Fix 3 Bugs Post-FTS

## Bug 1 — YOUCAT parte 1 solo muestra 3 preguntas (GROUP BY bug)

**Causa**: `GROUP BY parte` en `getYoucatPartes()` agrupa por el valor raw de la columna `parte` ANTES de que el `CASE WHEN` se evalúe. SQLite evalúa GROUP BY antes que SELECT expressions. Si algunos registros tienen `parte = NULL`, otros `parte = ''` y otros `parte = '1. Lo que creemos'`, se crean 3 grupos separados que el CASE unifica solo en display pero no en el agrupamiento.

**Fix**: Envolver la query en una subquery para que el CASE se aplique antes del GROUP BY.

**Archivo**: `AppMovil/db/db.ts:116-123`

**Código actual (bug):**
```typescript
`SELECT
   CASE WHEN parte IS NULL OR parte = '' THEN '1. Lo que creemos' ELSE parte END as parte,
   MIN(pregunta_nro) as min_nro,
   MAX(pregunta_nro) as max_nro,
   COUNT(*) as cnt
 FROM youcat
 GROUP BY parte
 ORDER BY MIN(pregunta_nro) ASC`
```

**Código corregido:**
```typescript
`SELECT parte, MIN(pregunta_nro) as min_nro, MAX(pregunta_nro) as max_nro, COUNT(*) as cnt
 FROM (
   SELECT
     CASE WHEN parte IS NULL OR parte = '' THEN '1. Lo que creemos' ELSE parte END as parte,
     pregunta_nro
   FROM youcat
 )
 GROUP BY parte
 ORDER BY MIN(pregunta_nro) ASC`
```

---

## Bug 2 — Biblia scroll no resetea al cambiar filtro

**Causa**: `FlashList` mantiene el offset de scroll cuando la data cambia porque React reusa el mismo componente. Al cambiar de "Nuevo" a "Todos", la lista se actualiza pero la posición de scroll persiste.

**Fix**: Agregar `key={filtro}` al FlashList para que React lo desmonte y remonte desde cero al cambiar el filtro.

**Archivo**: `AppMovil/app/(tabs)/biblia.tsx`

**Línea exacta**: Buscar `<FlashList` y agregar `key={filtro}` como prop. Debe quedar:
```tsx
<FlashList
  key={filtro}
  data={librosFiltrados}
  ...
/>
```

---

## Bug 3 — Catecismo CIC sin separación visual entre partes

**Causa**: El cambio a `ListItemCard` unificó el estilo. Antes las partes tenían badges de diferente color (`indexBadgeSec` usaba `#1A4A6E`). Ahora todo tiene el mismo badge dorado.

**Fix**: Agregar un `ListHeaderComponent` con texto descriptivo al inicio de cada nivel (partes/secciones/numerales) para dar contexto.

**Archivo**: `AppMovil/app/(tabs)/catecismo.tsx`

En el nivel "partes", agregar header entre el buscador y la lista:
```tsx
ListHeaderComponent={
  <ThemedText style={{ color: C.muted, fontSize: 12, paddingBottom: 8, paddingHorizontal: 4 }}>
    Seleccioná una parte del Catecismo
  </ThemedText>
}
```

## Verificación
- `npm run lint` → pasa
- Dispositivo: Home YOUCAT → 4 partes con badges 1-4
- Dispositivo: Biblia → cambiar filtro resetea scroll
- Dispositivo: Catecismo → separación visual entre niveles

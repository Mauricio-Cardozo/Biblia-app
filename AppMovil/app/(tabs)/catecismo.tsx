import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { C } from "@/constants/theme";
import FavBtn from "@/components/fav-btn";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Platform, ScrollView, StatusBar,
  StyleSheet, TextInput, TouchableOpacity, View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getCICPartes, getCICSecciones, getCICNumerales, getCICDetalle, searchCIC,
} from "@/db/db";
import type { CICNumeral, CICParte, CICSeccion, CICNumeralPreview } from "@/types";

type Nivel = "partes" | "secciones" | "numerales" | "detalle";

function Header({ nivel, parteActual, seccionActual, onBack }: {
  nivel: Nivel; parteActual: string | null; seccionActual: string | null; onBack: () => void;
}) {
  const titles: Record<Nivel, string> = {
    partes: "Catecismo de la Iglesia",
    secciones: parteActual ?? "",
    numerales: seccionActual ?? "",
    detalle: "Numeral",
  };

  return (
    <View style={s.header}>
      {nivel !== "partes" && (
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
          <ThemedText style={s.backArrow}>←</ThemedText>
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <ThemedText style={s.headerSuper}>✝ IGLESIA DIGITAL</ThemedText>
        <ThemedText style={s.headerTitle} numberOfLines={2}>{titles[nivel]}</ThemedText>
        {nivel === "secciones" && <ThemedText style={s.breadcrumb}>Seleccioná una sección</ThemedText>}
        {nivel === "numerales" && <ThemedText style={s.breadcrumb}>{parteActual}</ThemedText>}
      </View>
    </View>
  );
}

export default function CatecismoScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [nivel, setNivel] = useState<Nivel>("partes");
  const [parteActual, setParteActual] = useState<string | null>(null);
  const [seccionActual, setSeccionActual] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<CICNumeral | null>(null);

  const [partes, setPartes] = useState<CICParte[]>([]);
  const [secciones, setSecciones] = useState<CICSeccion[]>([]);
  const [numerales, setNumerales] = useState<CICNumeralPreview[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<CICNumeral[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentNumeralId, setCurrentNumeralId] = useState<number | null>(null);
  const [jumpValue, setJumpValue] = useState("");
  const inputRef = useRef<TextInput>(null);

  const cargarPartes = useCallback(async () => {
    setLoading(true); setError(null);
    try { setPartes(await getCICPartes(db)); }
    catch (e: any) { setError(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }, [db]);

  const cargarSecciones = useCallback(async (parte: string) => {
    setLoading(true); setError(null);
    try { setSecciones(await getCICSecciones(db, parte)); }
    catch (e: any) { setError(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }, [db]);

  const cargarNumerales = useCallback(async (parte: string, seccion: string) => {
    setLoading(true); setError(null);
    try { setNumerales(await getCICNumerales(db, parte, seccion)); }
    catch (e: any) { setError(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }, [db]);

  const cargarDetalle = useCallback(async (id: number) => {
    setLoading(true); setError(null);
    try {
      const row = await getCICDetalle(db, id);
      setDetalle(row ?? null);
      setCurrentNumeralId(id);
      setNivel("detalle");
    } catch (e: any) { setError(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }, [db]);

  const buscar = useCallback(async (termino: string) => {
    if (!termino.trim()) {
      setResultados([]); setSearchError(null); setBuscando(false);
      return;
    }
    setBuscando(true); setSearchError(null);
    try {
      const rows = await searchCIC(db, termino);
      setResultados(rows);
      if (rows.length === 0) {
        setSearchError("Sin resultados. Si esperabas encontrar algo, andá a Test y usá 'Rebuild FTS'.");
      }
    } catch (e: any) {
      setResultados([]);
      setSearchError(`Error en búsqueda: ${e.message}. Probá con términos más simples.`);
    }
    setBuscando(false);
  }, [db]);

  const irAlNumeral = useCallback(async (nro: number) => {
    setLoading(true); setError(null);
    try {
      const row = await getCICDetalle(db, nro);
      if (row) {
        setDetalle(row);
        setCurrentNumeralId(nro);
        setParteActual(row.parte);
        setSeccionActual(row.seccion);
        setNivel("detalle");
      } else {
        setError(`No existe el numeral ${nro}`);
      }
    } catch (e: any) {
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => { cargarPartes(); }, [cargarPartes]);

  const seleccionarParte = (parte: string) => {
    setParteActual(parte); cargarSecciones(parte); setNivel("secciones");
  };
  const seleccionarSeccion = (seccion: string) => {
    setSeccionActual(seccion); cargarNumerales(parteActual!, seccion); setNivel("numerales");
  };
  const volver = () => {
    if (resultados.length > 0 || buscando || searchError) {
      setResultados([]); setBuscando(false); setSearchError(null); setQuery("");
      return;
    }
    if (nivel === "detalle") { setNivel("numerales"); setDetalle(null); setCurrentNumeralId(null); }
    if (nivel === "numerales") { setNivel("secciones"); setSeccionActual(null); }
    if (nivel === "secciones") { setNivel("partes"); setParteActual(null); }
  };

  const idx = currentNumeralId != null ? numerales.findIndex((n) => n.id === currentNumeralId) : -1;
  const prevId = idx > 0 ? numerales[idx - 1]?.id : null;
  const nextId = idx < numerales.length - 1 ? numerales[idx + 1]?.id : null;

  const renderBuscador = () => (
    <View style={s.buscadorRow}>
      <View style={s.buscador}>
        <TextInput
          ref={inputRef}
          style={s.input}
          placeholder="Buscar en CIC…"
          placeholderTextColor={C.muted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => buscar(query)}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => { setQuery(""); setResultados([]); setBuscando(false); setSearchError(null); }}
            style={s.clearBtn}
          >
            <ThemedText style={s.clearText}>✕</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      <View style={s.jumpBox}>
        <TextInput
          style={s.jumpInput}
          placeholder="#"
          placeholderTextColor={C.muted}
          value={jumpValue}
          onChangeText={setJumpValue}
          onSubmitEditing={() => {
            const n = parseInt(jumpValue, 10);
            if (n > 0) irAlNumeral(n);
            setJumpValue("");
          }}
          keyboardType="number-pad"
          returnKeyType="go"
        />
      </View>
    </View>
  );

  if (loading) return (
    <ThemedView style={s.center}>
      <ActivityIndicator size="large" color={C.gold} />
      <ThemedText style={s.muted}>Cargando…</ThemedText>
    </ThemedView>
  );

  if (error) return (
    <ThemedView style={s.center}>
      <ThemedText style={s.errorText}>{error}</ThemedText>
      <TouchableOpacity style={s.retryBtn} onPress={cargarPartes}>
        <ThemedText style={s.retryText}>Reintentar</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  if (nivel === "detalle" && detalle) return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <Header nivel="detalle" parteActual={parteActual} seccionActual={seccionActual} onBack={volver} />
      <ScrollView contentContainerStyle={s.detalleContent} showsVerticalScrollIndicator={false}>
        <View style={s.nroBadgeRow}>
          <View style={s.nroBadge}><ThemedText style={s.nroBadgeText}>Numeral {detalle.id}</ThemedText></View>
          <FavBtn
            favorito={{
              id: `cic-${detalle.id}`,
              tipo: "cic",
              referencia: `CIC #${detalle.id}`,
              preview: detalle.texto?.slice(0, 80) ?? "",
              timestamp: Date.now(),
            }}
          />
        </View>
        <View style={s.jerarquia}>
          {detalle.parte && <ThemedText style={s.jerarquiaItem}>📖 {detalle.parte}</ThemedText>}
          {detalle.seccion && <ThemedText style={s.jerarquiaItem}>  › {detalle.seccion}</ThemedText>}
          {detalle.capitulo && <ThemedText style={s.jerarquiaItem}>  › {detalle.capitulo}</ThemedText>}
          {detalle.articulo && <ThemedText style={s.jerarquiaItem}>  › {detalle.articulo}</ThemedText>}
        </View>
        <View style={s.divider} />
        <ThemedText style={s.detalleTexto}>{detalle.texto}</ThemedText>

        {/* Prev / Next */}
        <View style={s.prevNextRow}>
          <TouchableOpacity
            style={[s.prevNextBtn, !prevId && s.prevNextDisabled]}
            onPress={() => prevId && cargarDetalle(prevId)}
            disabled={!prevId}
            activeOpacity={0.7}
          >
            <ThemedText style={s.prevNextText}>← Anterior</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.prevNextBtn, !nextId && s.prevNextDisabled]}
            onPress={() => nextId && cargarDetalle(nextId)}
            disabled={!nextId}
            activeOpacity={0.7}
          >
            <ThemedText style={s.prevNextText}>Siguiente →</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Jump to numeral */}
        <View style={s.jumpDetailRow}>
          <TextInput
            style={s.jumpDetailInput}
            placeholder="Ir al numeral #"
            placeholderTextColor={C.muted}
            value={jumpValue}
            onChangeText={setJumpValue}
            onSubmitEditing={() => {
              const n = parseInt(jumpValue, 10);
              if (n > 0) irAlNumeral(n);
              setJumpValue("");
            }}
            keyboardType="number-pad"
            returnKeyType="go"
          />
        </View>

        <TouchableOpacity style={s.volverBtn} onPress={volver} activeOpacity={0.8}>
          <ThemedText style={s.volverBtnText}>← Volver a lista</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  if (resultados.length > 0 || buscando || searchError) {
    return (
      <View style={[s.safe, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <Header nivel={nivel} parteActual={parteActual} seccionActual={seccionActual} onBack={volver} />
        {renderBuscador()}
        {buscando ? (
          <View style={s.center}><ActivityIndicator size="large" color={C.gold} /></View>
        ) : (
          <FlashList
            data={resultados}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.card} onPress={() => cargarDetalle(item.id)} activeOpacity={0.75}>
                <View style={s.nroBox}><ThemedText style={s.nroText}>{item.id}</ThemedText></View>
                <View style={{ flex: 1 }}>
                  {item.articulo ? <ThemedText style={s.cardSub} numberOfLines={1}>{item.articulo}</ThemedText> : null}
                  <ThemedText style={s.cardPreview} numberOfLines={2}>{item.texto?.slice(0, 80)}…</ThemedText>
                </View>
                <ThemedText style={s.chevron}>›</ThemedText>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchError
                ? <ThemedText style={s.mutedCenter}>{searchError}</ThemedText>
                : null
            }
          />
        )}
      </View>
    );
  }

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <Header nivel={nivel} parteActual={parteActual} seccionActual={seccionActual} onBack={volver} />
      {renderBuscador()}

      {nivel === "partes" && (
        <FlashList data={partes} keyExtractor={(item) => item.parte} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={s.card} onPress={() => seleccionarParte(item.parte)} activeOpacity={0.75}>
              <View style={s.indexBadge}><ThemedText style={s.indexText}>{index + 1}</ThemedText></View>
              <ThemedText style={s.cardTitle} numberOfLines={2}>{item.parte}</ThemedText>
              <ThemedText style={s.chevron}>›</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}

      {nivel === "secciones" && (
        <FlashList data={secciones} keyExtractor={(item) => item.seccion} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={s.card} onPress={() => seleccionarSeccion(item.seccion)} activeOpacity={0.75}>
              <View style={[s.indexBadge, s.indexBadgeSec]}><ThemedText style={s.indexText}>{index + 1}</ThemedText></View>
              <ThemedText style={s.cardTitle} numberOfLines={2}>{item.seccion}</ThemedText>
              <ThemedText style={s.chevron}>›</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}

      {nivel === "numerales" && (
        <FlashList data={numerales} keyExtractor={(item) => String(item.id)} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => cargarDetalle(item.id)} activeOpacity={0.75}>
              <View style={s.nroBox}><ThemedText style={s.nroText}>{item.id}</ThemedText></View>
              <View style={{ flex: 1 }}>
                {item.articulo ? <ThemedText style={s.cardSub} numberOfLines={1}>{item.articulo}</ThemedText> : null}
                <ThemedText style={s.cardPreview} numberOfLines={2}>{item.texto?.slice(0, 80)}…</ThemedText>
              </View>
              <ThemedText style={s.chevron}>›</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: C.navy },
  muted: { color: C.muted, fontSize: 14 },
  mutedCenter: { color: C.muted, fontSize: 14, textAlign: "center", paddingVertical: 40 },
  errorText: { color: C.error, fontSize: 14, textAlign: "center", paddingHorizontal: 20 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.navyLight, borderRadius: 8, borderWidth: 1, borderColor: C.goldDim },
  retryText: { color: C.goldLight, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", backgroundColor: C.navyMid, paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? 12 : 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.goldDim, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.navyLight, borderWidth: 1, borderColor: C.goldDim, alignItems: "center", justifyContent: "center" },
  backArrow: { color: C.gold, fontSize: 20, lineHeight: 22 },
  headerSuper: { color: C.gold, fontSize: 10, letterSpacing: 2, fontWeight: "600" },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: "700", marginTop: 2 },
  breadcrumb: { color: C.muted, fontSize: 11, marginTop: 2 },
  // Search + jump
  buscadorRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 12, marginVertical: 10 },
  buscador: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.navyMid, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim, paddingHorizontal: 14 },
  input: { flex: 1, color: C.text, fontSize: 15, paddingVertical: 12 },
  clearBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.navyLight, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  clearText: { color: C.muted, fontSize: 12 },
  jumpBox: { width: 52, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim, backgroundColor: C.navyMid, alignItems: "center", justifyContent: "center" },
  jumpInput: { color: C.gold, fontSize: 16, fontWeight: "700", textAlign: "center", width: "100%", padding: 0 },
  list: { padding: 12 },
  sep: { height: 1, backgroundColor: C.sep, marginHorizontal: 8 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: C.navyMid, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, gap: 12, borderWidth: 1, borderColor: C.sep, marginBottom: 6 },
  indexBadge: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.goldDim, alignItems: "center", justifyContent: "center" },
  indexBadgeSec: { backgroundColor: "#1A4A6E" },
  indexText: { color: C.goldLight, fontSize: 13, fontWeight: "800" },
  cardTitle: { flex: 1, color: C.text, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  chevron: { color: C.gold, fontSize: 22 },
  nroBox: { minWidth: 46, height: 40, borderRadius: 8, backgroundColor: C.goldDim, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  nroText: { color: C.goldLight, fontSize: 13, fontWeight: "800" },
  cardSub: { color: C.gold, fontSize: 11, fontWeight: "600", marginBottom: 3 },
  cardPreview: { color: C.text, fontSize: 13, lineHeight: 18 },
  detalleContent: { padding: 20, paddingBottom: 40 },
  nroBadgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  nroBadge: { alignSelf: "flex-start", backgroundColor: C.goldDim, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  nroBadgeText: { color: C.goldLight, fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  jerarquia: { gap: 4, marginBottom: 16 },
  jerarquiaItem: { color: C.muted, fontSize: 13, lineHeight: 20 },
  divider: { height: 2, backgroundColor: C.goldDim, borderRadius: 1, marginBottom: 20 },
  detalleTexto: { color: C.text, fontSize: 16, lineHeight: 28, textAlign: "justify" },
  prevNextRow: { flexDirection: "row", gap: 10, marginTop: 24 },
  prevNextBtn: { flex: 1, paddingVertical: 12, backgroundColor: C.navyLight, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim, alignItems: "center" },
  prevNextDisabled: { opacity: 0.35 },
  prevNextText: { color: C.goldLight, fontWeight: "600", fontSize: 14 },
  jumpDetailRow: { marginTop: 12 },
  jumpDetailInput: { backgroundColor: C.navyLight, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim, paddingVertical: 12, paddingHorizontal: 16, color: C.text, fontSize: 15, textAlign: "center" },
  volverBtn: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: C.navyLight, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim, alignItems: "center" },
  volverBtnText: { color: C.goldLight, fontWeight: "600", fontSize: 15 },
});

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { C } from "@/constants/theme";
import ScreenHeader from "@/components/ui/screen-header";
import ListItemCard from "@/components/ui/list-item-card";
import FavBtn from "@/components/fav-btn";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, ScrollView, StatusBar,
  StyleSheet, TextInput, TouchableOpacity, View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getCICPartes, getCICSecciones, getCICNumerales, getCICDetalle, searchCIC,
} from "@/db/db";
import type { CICNumeral, CICParte, CICSeccion, CICNumeralPreview } from "@/types";

type Nivel = "partes" | "secciones" | "numerales" | "detalle";

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
      if (row) {
        setDetalle(row);
        setCurrentNumeralId(id);
        setNivel("detalle");
      } else {
        setError(`No existe el numeral ${id}`);
      }
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
    else if (nivel === "numerales") { setNivel("secciones"); setSeccionActual(null); }
    else if (nivel === "secciones") { setNivel("partes"); setParteActual(null); }
  };

  const idx = currentNumeralId != null ? numerales.findIndex((n) => n.id === currentNumeralId) : -1;
  const prevId = idx > 0 ? numerales[idx - 1]?.id : null;
  const nextId = idx < numerales.length - 1 ? numerales[idx + 1]?.id : null;

  const getHeaderTitles = () => {
    switch (nivel) {
      case "partes": return { title: "Catecismo de la Iglesia", superLabel: "✝ IGLESIA DIGITAL" };
      case "secciones": return { title: parteActual ?? "", superLabel: "✝ IGLESIA DIGITAL", subtitle: "Seleccioná una sección" };
      case "numerales": return { title: seccionActual ?? "", superLabel: "✝ IGLESIA DIGITAL", subtitle: parteActual ?? "" };
      case "detalle": return { title: "Numeral", superLabel: "✝ IGLESIA DIGITAL" };
    }
  };

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
      <ScreenHeader
        title="Numeral"
        showBack={nivel !== "partes"}
        onBack={volver}
        superLabel="✝ IGLESIA DIGITAL"
      />
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
        <ScreenHeader
          title={getHeaderTitles().title}
          showBack={nivel !== "partes"}
          onBack={volver}
          superLabel="✝ IGLESIA DIGITAL"
        />
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
              <ListItemCard
                index={item.id}
                title={item.texto?.slice(0, 80) + "…"}
                subtitle={[item.parte, item.seccion].filter(Boolean).join(" › ")}
                onPress={() => cargarDetalle(item.id)}
              />
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
      <ScreenHeader
        title={getHeaderTitles().title}
        showBack={nivel !== "partes"}
        onBack={volver}
        superLabel="✝ IGLESIA DIGITAL"
        subtitle={getHeaderTitles().subtitle}
      />
      {renderBuscador()}

      {nivel === "partes" && (
        <FlashList data={partes} keyExtractor={(item) => item.parte} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ThemedText style={s.nivelInfo}>Seleccioná una parte del Catecismo</ThemedText>}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item, index }) => (
            <ListItemCard
              index={index + 1}
              title={item.parte}
              onPress={() => seleccionarParte(item.parte)}
            />
          )}
        />
      )}

      {nivel === "secciones" && (
        <FlashList data={secciones} keyExtractor={(item) => item.seccion} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ThemedText style={s.nivelInfo}>Seleccioná una sección</ThemedText>}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item, index }) => (
            <ListItemCard
              index={index + 1}
              title={item.seccion}
              onPress={() => seleccionarSeccion(item.seccion)}
            />
          )}
        />
      )}

      {nivel === "numerales" && (
        <FlashList data={numerales} keyExtractor={(item) => String(item.id)} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ThemedText style={s.nivelInfo}>Seleccioná un numeral</ThemedText>}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item }) => (
            <ListItemCard
              title={item.articulo || `Numeral ${item.id}`}
              subtitle={item.texto?.slice(0, 80) + "…"}
              onPress={() => cargarDetalle(item.id)}
            />
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
  buscadorRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginVertical: 10 },
  buscador: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.navyMid, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim, paddingHorizontal: 14 },
  input: { flex: 1, color: C.text, fontSize: 15, paddingVertical: 12 },
  clearBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.navyLight, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  clearText: { color: C.muted, fontSize: 12 },
  jumpBox: { width: 52, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim, backgroundColor: C.navyMid, alignItems: "center", justifyContent: "center" },
  jumpInput: { color: C.gold, fontSize: 16, fontWeight: "700", textAlign: "center", width: "100%", padding: 0 },
  list: { padding: 16 },
  sep: { height: 1, backgroundColor: C.sep, marginHorizontal: 8 },
  nivelInfo: { color: C.muted, fontSize: 12, paddingBottom: 8, paddingHorizontal: 4 },
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

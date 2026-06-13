import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { C } from "@/constants/theme";
import FavBtn from "@/components/fav-btn";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getYoucatPartes,
  getYoucatPreguntas,
  getYoucatDetalle,
  searchYoucat,
} from "@/db/db";
import type { YoucatParte, YoucatPregunta, YoucatQuestion } from "@/types";

type Nivel = "partes" | "preguntas" | "detalle";

export default function YoucatScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [nivel, setNivel] = useState<Nivel>("partes");
  const [parteActual, setParteActual] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<YoucatQuestion | null>(null);

  const [partes, setPartes] = useState<YoucatParte[]>([]);
  const [preguntas, setPreguntas] = useState<YoucatPregunta[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<YoucatQuestion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const cargarPartes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPartes(await getYoucatPartes(db));
    } catch (e: any) {
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [db]);

  const cargarPreguntas = useCallback(
    async (parte: string) => {
      setLoading(true);
      setError(null);
      try {
        setPreguntas(await getYoucatPreguntas(db, parte));
      } catch (e: any) {
        setError(`Error: ${e.message}`);
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const cargarDetalleFn = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      try {
        const row = await getYoucatDetalle(db, id);
        setDetalle(row ?? null);
        setNivel("detalle");
      } catch (e: any) {
        setError(`Error: ${e.message}`);
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const buscar = useCallback(
    async (termino: string) => {
      if (!termino.trim()) {
        setResultados([]);
        setSearchError(null);
        setBuscando(false);
        return;
      }
      setBuscando(true);
      setSearchError(null);
      try {
        const rows = await searchYoucat(db, termino);
        setResultados(rows);
        if (rows.length === 0) {
          setSearchError("Sin resultados. Si esperabas encontrar algo, andá a Test y usá 'Rebuild FTS'.");
        }
      } catch (e: any) {
        setResultados([]);
        setSearchError(`Error en búsqueda: ${e.message}. Probá con términos más simples, o andá a Test > Rebuild FTS.`);
      }
      setBuscando(false);
    },
    [db],
  );

  useEffect(() => { cargarPartes(); }, [cargarPartes]);

  const seleccionarParte = (parte: string) => {
    setParteActual(parte);
    cargarPreguntas(parte);
    setNivel("preguntas");
  };

  const volver = () => {
    if (nivel === "detalle") {
      setNivel("preguntas");
      setDetalle(null);
    } else if (nivel === "preguntas") {
      setNivel("partes");
      setParteActual(null);
    }
  };

  const renderHeader = () => {
    const titulo = nivel === "partes"
      ? "YOUCAT"
      : nivel === "preguntas"
        ? parteActual ?? ""
        : `Pregunta ${detalle?.pregunta_nro ?? ""}`;

    return (
      <View style={s.header}>
        {nivel !== "partes" && (
          <TouchableOpacity onPress={volver} style={s.backBtn} activeOpacity={0.7}>
            <ThemedText style={s.backArrow}>←</ThemedText>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <ThemedText style={s.headerSuper}>✝ Catecismo Joven</ThemedText>
          <ThemedText style={s.headerTitle} numberOfLines={2}>{titulo}</ThemedText>
          {nivel === "preguntas" && (
            <ThemedText style={s.breadcrumb}>
              {partes.find((p) => p.parte === parteActual)?.preguntas ?? 0} preguntas
            </ThemedText>
          )}
        </View>
      </View>
    );
  };

  const renderBuscador = () => (
    <View style={s.buscador}>
      <TextInput
        ref={inputRef}
        style={s.input}
        placeholder="Buscar en YOUCAT…"
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
  );

  if (loading) {
    return (
      <ThemedView style={s.center}>
        <ActivityIndicator size="large" color={C.gold} />
        <ThemedText style={s.muted}>Cargando…</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={s.center}>
        <ThemedText style={s.errorText}>{error}</ThemedText>
        <TouchableOpacity style={s.retryBtn} onPress={cargarPartes}>
          <ThemedText style={s.retryText}>Reintentar</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (nivel === "detalle" && detalle) {
    return (
      <View style={[s.safe, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        {renderHeader()}
        <ScrollView contentContainerStyle={s.detalleContent} showsVerticalScrollIndicator={false}>
          <View style={s.nroBadgeRow}>
            <View style={s.nroBadge}>
              <ThemedText style={s.nroBadgeText}>Pregunta {detalle.pregunta_nro}</ThemedText>
            </View>
            <FavBtn
              favorito={{
                id: `youcat-${detalle.id}`,
                tipo: "youcat",
                referencia: `YOUCAT #${detalle.pregunta_nro}`,
                preview: detalle.pregunta_texto?.slice(0, 80) ?? "",
                timestamp: Date.now(),
              }}
            />
          </View>
          <ThemedText style={s.preguntaTexto}>{detalle.pregunta_texto}</ThemedText>
          <View style={s.divider} />
          <ThemedText style={s.respuestaTexto}>{detalle.respuesta_texto}</ThemedText>
          {detalle.capitulo ? <ThemedText style={s.refTexto}>{detalle.capitulo}</ThemedText> : null}
          <TouchableOpacity style={s.volverBtn} onPress={volver} activeOpacity={0.8}>
            <ThemedText style={s.volverBtnText}>← Volver</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (resultados.length > 0 || buscando || searchError) {
    return (
      <View style={[s.safe, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        {renderHeader()}
        {renderBuscador()}
        {buscando ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.gold} />
          </View>
        ) : (
          <FlashList
            data={resultados}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={s.sep} />}
           
            renderItem={({ item }) => (
              <TouchableOpacity style={s.card} onPress={() => cargarDetalleFn(item.id)} activeOpacity={0.75}>
                <View style={s.nroBox}>
                  <ThemedText style={s.nroText}>{item.pregunta_nro}</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={s.cardTitle} numberOfLines={2}>{item.pregunta_texto}</ThemedText>
                  <ThemedText style={s.cardPreview} numberOfLines={1}>{item.respuesta_texto?.slice(0, 80)}…</ThemedText>
                </View>
                <ThemedText style={s.chevron}>›</ThemedText>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchError
                ? <ThemedText style={s.errorText}>{searchError}</ThemedText>
                : <ThemedText style={s.emptyText}>Sin resultados para {'\u201C'}{query}{'\u201D'}</ThemedText>
            }
          />
        )}
      </View>
    );
  }

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      {renderHeader()}
      {renderBuscador()}

      {nivel === "partes" && (
        <FlashList
          data={partes}
          keyExtractor={(item) => item.parte}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.sep} />}
         
          renderItem={({ item, index }) => (
            <TouchableOpacity style={s.card} onPress={() => seleccionarParte(item.parte)} activeOpacity={0.75}>
              <View style={s.indexBadge}><ThemedText style={s.indexText}>{index + 1}</ThemedText></View>
              <View style={{ flex: 1 }}>
                <ThemedText style={s.cardTitle} numberOfLines={2}>{item.parte}</ThemedText>
                <ThemedText style={s.cardMeta}>{item.preguntas} preguntas · {item.desde}–{item.hasta}</ThemedText>
              </View>
              <ThemedText style={s.chevron}>›</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}

      {nivel === "preguntas" && (
        <FlashList
          data={preguntas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.sep} />}
         
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => cargarDetalleFn(item.id)} activeOpacity={0.75}>
              <View style={s.nroBox}><ThemedText style={s.nroText}>{item.pregunta_nro}</ThemedText></View>
              <ThemedText style={s.cardTitle} numberOfLines={2}>{item.pregunta_texto}</ThemedText>
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
  errorText: { color: C.error, fontSize: 14, textAlign: "center", paddingHorizontal: 20 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.navyLight, borderRadius: 8, borderWidth: 1, borderColor: C.goldDim },
  retryText: { color: C.goldLight, fontWeight: "600" },
  emptyText: { color: C.muted, fontSize: 14, textAlign: "center", paddingVertical: 40 },
  header: { flexDirection: "row", alignItems: "center", backgroundColor: C.navyMid, paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? 12 : 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.goldDim, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.navyLight, borderWidth: 1, borderColor: C.goldDim, alignItems: "center", justifyContent: "center" },
  backArrow: { color: C.gold, fontSize: 20, lineHeight: 22 },
  headerSuper: { color: C.gold, fontSize: 10, letterSpacing: 2, fontWeight: "600" },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: "700", marginTop: 2 },
  breadcrumb: { color: C.muted, fontSize: 11, marginTop: 2 },
  buscador: { flexDirection: "row", alignItems: "center", backgroundColor: C.navyMid, marginHorizontal: 12, marginVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim, paddingHorizontal: 14 },
  input: { flex: 1, color: C.text, fontSize: 15, paddingVertical: 12 },
  clearBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.navyLight, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  clearText: { color: C.muted, fontSize: 12 },
  list: { padding: 12 },
  sep: { height: 1, backgroundColor: C.sep, marginHorizontal: 8 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: C.navyMid, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, gap: 12, borderWidth: 1, borderColor: C.sep, marginBottom: 6 },
  indexBadge: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.goldDim, alignItems: "center", justifyContent: "center" },
  indexText: { color: C.goldLight, fontSize: 13, fontWeight: "800" },
  cardTitle: { flex: 1, color: C.text, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  cardMeta: { color: C.muted, fontSize: 11, marginTop: 3 },
  cardPreview: { color: C.muted, fontSize: 12, marginTop: 3, lineHeight: 16 },
  chevron: { color: C.gold, fontSize: 22 },
  nroBox: { minWidth: 46, height: 40, borderRadius: 8, backgroundColor: C.goldDim, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  nroText: { color: C.goldLight, fontSize: 13, fontWeight: "800" },
  detalleContent: { padding: 20, paddingBottom: 40 },
  nroBadgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  nroBadge: { alignSelf: "flex-start", backgroundColor: C.goldDim, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  nroBadgeText: { color: C.goldLight, fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  preguntaTexto: { color: C.gold, fontSize: 18, fontWeight: "700", lineHeight: 26, marginBottom: 16, fontStyle: "italic" },
  divider: { height: 2, backgroundColor: C.goldDim, borderRadius: 1, marginBottom: 20 },
  respuestaTexto: { color: C.text, fontSize: 16, lineHeight: 28, textAlign: "justify" },
  refTexto: { color: C.muted, fontSize: 12, fontStyle: "italic", marginTop: 20, textAlign: "right" },
  volverBtn: { marginTop: 32, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: C.navyLight, borderRadius: 10, borderWidth: 1, borderColor: C.goldDim, alignItems: "center" },
  volverBtnText: { color: C.goldLight, fontWeight: "600", fontSize: 15 },
});

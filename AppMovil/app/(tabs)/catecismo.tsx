import { ThemedText } from "@/components/themed-text";
import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import ScreenHeader from "@/components/ui/screen-header";
import ListItemCard from "@/components/ui/list-item-card";
import Buscador from "@/components/ui/buscador";
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
  getYoucatPartes, getYoucatPreguntas, getYoucatDetalle, searchYoucat,
} from "@/db/db";
import type { YoucatPregunta } from "@/types";

type Nivel = "partes" | "preguntas" | "detalle";

const PARTE_ICONS = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ"];

export default function CatecismoScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [nivel, setNivel] = useState<Nivel>("partes");
  const [parteActual, setParteActual] = useState<{ parte_id: number; parte: string } | null>(null);
  const [detalle, setDetalle] = useState<YoucatPregunta | null>(null);

  const [partes, setPartes] = useState<{ parte_id: number; parte: string }[]>([]);
  const [preguntas, setPreguntas] = useState<YoucatPregunta[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<YoucatPregunta[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [jumpValue, setJumpValue] = useState("");
  const inputRef = useRef<TextInput>(null);

  const cargarPartes = useCallback(async () => {
    setLoading(true); setError(null);
    try { setPartes(await getYoucatPartes(db)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [db]);

  useEffect(() => {
    let mounted = true;
    getYoucatPartes(db).then((res) => { if (mounted) setPartes(res); })
      .catch((e) => { if (mounted) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [db]);

  const cargarPreguntas = useCallback(async (parte_id: number) => {
    setLoading(true); setError(null);
    try { setPreguntas(await getYoucatPreguntas(db, parte_id)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [db]);

  const cargarDetalle = useCallback(async (id: number) => {
    setLoading(true); setError(null);
    try {
      const row = await getYoucatDetalle(db, id);
      if (row) {
        setDetalle(row);
        setNivel("detalle");
      } else {
        setError(`No existe la pregunta ${id}`);
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [db]);

  const buscar = useCallback(async (termino: string) => {
    if (!termino.trim()) {
      setResultados([]); setSearchError(null); setBuscando(false);
      return;
    }
    setBuscando(true); setSearchError(null);
    try {
      const rows = await searchYoucat(db, termino);
      setResultados(rows);
      if (rows.length === 0) setSearchError("Sin resultados.");
    } catch (e: unknown) {
      setResultados([]);
      setSearchError(`Error en búsqueda: ${e instanceof Error ? e.message : String(e)}.`);
    }
    setBuscando(false);
  }, [db]);

  const irAPregunta = useCallback(async (nro: number) => {
    setLoading(true); setError(null);
    try {
      const row = await getYoucatDetalle(db, nro);
      if (row) {
        setDetalle(row);
        setParteActual({ parte_id: row.parte_id, parte: row.parte });
        setNivel("detalle");
      } else {
        setError(`No existe la pregunta ${nro}`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [db]);

  const seleccionarParte = (p: { parte_id: number; parte: string }) => {
    setParteActual(p); cargarPreguntas(p.parte_id); setNivel("preguntas");
  };
  const volver = () => {
    if (resultados.length > 0 || buscando || searchError) {
      setResultados([]); setBuscando(false); setSearchError(null); setQuery("");
      return;
    }
    if (nivel === "detalle") { setNivel("preguntas"); setDetalle(null); }
    else if (nivel === "preguntas") { setNivel("partes"); setParteActual(null); }
  };

  const getHeaderTitles = () => {
    switch (nivel) {
      case "partes": return { title: "YOUCAT", superLabel: "✝ IGLESIA DIGITAL" };
      case "preguntas": return { title: parteActual?.parte ?? "", superLabel: "✝ IGLESIA DIGITAL" };
      case "detalle": return { title: "Pregunta", superLabel: "✝ IGLESIA DIGITAL" };
    }
  };

  const renderBuscador = () => (
    <Buscador
      value={query}
      onChangeText={setQuery}
      onSubmit={() => buscar(query)}
      onClear={() => { setQuery(""); setResultados([]); setBuscando(false); setSearchError(null); }}
      placeholder="Buscar en YOUCAT…"
      inputRef={inputRef}
      rightSlot={
        <View style={s.jumpBox}>
          <TextInput
            style={s.jumpInput}
            placeholder="#"
            placeholderTextColor={C.muted}
            value={jumpValue}
            onChangeText={setJumpValue}
            onSubmitEditing={() => {
              const n = parseInt(jumpValue, 10);
              if (n > 0) irAPregunta(n);
              setJumpValue("");
            }}
            keyboardType="number-pad"
            returnKeyType="go"
          />
        </View>
      }
    />
  );

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={C.gold} />
      <ThemedText style={s.muted}>Cargando…</ThemedText>
    </View>
  );

  if (error) return (
    <View style={s.center}>
      <ThemedText style={s.errorText}>{error}</ThemedText>
      <TouchableOpacity style={s.retryBtn} onPress={cargarPartes}>
        <ThemedText style={s.retryText}>Reintentar</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (nivel === "detalle" && detalle) return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <ScreenHeader
        title="Pregunta"
        showBack
        onBack={volver}
        superLabel="✝ IGLESIA DIGITAL"
      />
      <ScrollView contentContainerStyle={s.detalleContent} showsVerticalScrollIndicator={false}>
        <View style={s.nroBadgeRow}>
          <View style={s.nroBadge}><ThemedText style={s.nroBadgeText}>#{detalle.id}</ThemedText></View>
          <FavBtn
            favorito={{
              id: `youcat-${detalle.id}`,
              tipo: "youcat",
              referencia: `YOUCAT #${detalle.id}`,
              preview: detalle.pregunta?.slice(0, 80) ?? "",
              timestamp: 0,
            }}
          />
        </View>
        <View style={s.jerarquia}>
          {detalle.parte ? <ThemedText style={s.jerarquiaItem}>📖 {detalle.parte}</ThemedText> : null}
          {detalle.seccion ? <ThemedText style={s.jerarquiaItem}>  › {detalle.seccion}</ThemedText> : null}
          {detalle.capitulo ? <ThemedText style={s.jerarquiaItem}>  › {detalle.capitulo}</ThemedText> : null}
        </View>
        <View style={s.divider} />
        <ThemedText style={s.preguntaTexto}>{detalle.pregunta}</ThemedText>
        {detalle.respuesta ? (
          <>
            <View style={s.respuestaLabel}><ThemedText style={s.labelText}>RESPUESTA</ThemedText></View>
            <ThemedText style={s.respuestaTexto}>{detalle.respuesta}</ThemedText>
          </>
        ) : null}
        {detalle.comentario ? (
          <>
            <View style={s.comentarioLabel}><ThemedText style={s.labelText}>COMENTARIO</ThemedText></View>
            <ThemedText style={s.comentarioTexto}>{detalle.comentario}</ThemedText>
          </>
        ) : null}
      </ScrollView>
    </View>
  );

  if (resultados.length > 0 || buscando || searchError) {
    return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <ScreenHeader
          title={getHeaderTitles().title}
          showBack
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
                title={item.pregunta?.slice(0, 80) + "…"}
                subtitle={item.respuesta?.slice(0, 60) + "…" ?? ""}
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
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <ScreenHeader
        title={getHeaderTitles().title}
        showBack={nivel !== "partes"}
        onBack={volver}
        superLabel="✝ IGLESIA DIGITAL"
      />
      {renderBuscador()}

      {nivel === "partes" && (
        <FlashList data={partes} keyExtractor={(item) => String(item.parte_id)} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ThemedText style={s.nivelInfo}>Seleccioná una parte del YOUCAT</ThemedText>}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item, index }) => (
            <ListItemCard
              index={index + 1}
              title={`${PARTE_ICONS[index] ?? ""} ${item.parte}`}
              onPress={() => seleccionarParte(item)}
            />
          )}
        />
      )}

      {nivel === "preguntas" && (
        <FlashList data={preguntas} keyExtractor={(item) => String(item.id)} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ThemedText style={s.nivelInfo}>{preguntas.length} preguntas</ThemedText>}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item }) => (
            <ListItemCard
              index={item.id}
              title={item.pregunta?.slice(0, 80) + "…"}
              subtitle={item.respuesta?.slice(0, 60) + "…" ?? ""}
              onPress={() => cargarDetalle(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: S.md, backgroundColor: C.navy },
  muted: { color: C.muted, fontSize: 14 },
  mutedCenter: { color: C.muted, fontSize: 14, textAlign: "center", paddingVertical: S.huge },
  errorText: { color: C.error, fontSize: 14, textAlign: "center", paddingHorizontal: S.xl },
  retryBtn: { paddingHorizontal: S.xl, paddingVertical: 10, backgroundColor: C.navyLight, borderRadius: R.md, borderWidth: 1, borderColor: C.goldDim },
  retryText: { color: C.goldLight, fontWeight: "600" },
  jumpBox: { width: 52, height: 44, borderRadius: R.md, borderWidth: 1, borderColor: C.goldDim, backgroundColor: C.navyMid, alignItems: "center", justifyContent: "center" },
  jumpInput: { color: C.gold, fontSize: 16, fontWeight: "700", textAlign: "center", width: "100%", padding: 0 },
  list: { padding: S.lg },
  sep: { height: 1, backgroundColor: C.sep, marginHorizontal: S.sm },
  nivelInfo: { color: C.muted, fontSize: 12, paddingBottom: S.sm, paddingHorizontal: S.xs },
  detalleContent: { padding: S.xl, paddingBottom: S.huge },
  nroBadgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  nroBadge: { alignSelf: "flex-start", backgroundColor: C.goldDim, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 6 },
  nroBadgeText: { color: C.goldLight, fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  jerarquia: { gap: S.xs, marginBottom: S.lg },
  jerarquiaItem: { color: C.muted, fontSize: 13, lineHeight: 20 },
  divider: { height: 2, backgroundColor: C.goldDim, borderRadius: 1, marginBottom: S.xl },
  preguntaTexto: { color: C.text, fontSize: 18, fontWeight: "700", lineHeight: 28, marginBottom: S.lg },
  respuestaLabel: { marginTop: S.lg, marginBottom: S.xs },
  labelText: { color: C.gold, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  respuestaTexto: { color: C.text, fontSize: 16, lineHeight: 26, textAlign: "justify" },
  comentarioLabel: { marginTop: S.lg, marginBottom: S.xs },
  comentarioTexto: { color: C.muted, fontSize: 14, lineHeight: 22, textAlign: "justify", fontStyle: "italic" },
});

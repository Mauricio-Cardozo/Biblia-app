import ScreenHeader from "@/components/ui/screen-header";
import LibroCard from "@/components/ui/libro-card";
import Buscador from "@/components/ui/buscador";
import { ThemedText } from "@/components/themed-text";
import { C } from "@/constants/theme";
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { useSQLiteContext } from "expo-sqlite";
import { tabBarScrollY } from "@/utils/scroll-state";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, ImageBackground, Modal, Share, StatusBar,
  StyleSheet, TextInput, TouchableOpacity, View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLibros, getCapitulos, getVersiculos, searchBiblia } from "@/db/db";
import { addFavorito, getFavoritos, isFavorito, removeFavorito, type Favorito } from "@/data/favoritos";
import type { Book, Chapter, Verse } from "@/types";

type Nivel = "libros" | "capitulos" | "versiculos";
type Filtro = "Antiguo" | "Nuevo" | "Todos";

const handleScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
  tabBarScrollY.setValue(e.nativeEvent.contentOffset.y);
};

export default function BibliaScreen() {
  const db = useSQLiteContext();

  const [nivel, setNivel] = useState<Nivel>("libros");
  const [libroActual, setLibroActual] = useState<Book | null>(null);
  const [capActual, setCapActual] = useState<number | null>(null);

  const [libros, setLibros] = useState<Book[]>([]);
  const [capitulos, setCapitulos] = useState<Chapter[]>([]);
  const [versiculos, setVersiculos] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [favs, setFavs] = useState<Set<number>>(new Set());
  const [favColors, setFavColors] = useState<Record<number, string>>({});
  const [pickerVerse, setPickerVerse] = useState<Verse | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); setSearchError(null); setSearching(false); return; }
    setSearching(true); setSearchError(null);
    try {
      const termino = q.trim().split(/\s+/).filter(Boolean).map(w => `"${w}"`).join(' ');
      const rows = await searchBiblia(db, termino);
      setSearchResults(rows);
      if (rows.length === 0) setSearchError("Sin resultados.");
    } catch (e: unknown) {
      setSearchError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setSearching(false);
  }, [db]);

  const clearSearch = () => {
    setSearchQuery(""); setSearchResults([]); setSearchError(null); setSearching(false);
  };

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try { setLibros(await getLibros(db)); }
      catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
      finally { setLoading(false); }
    })();
  }, [db]);

  const cargarCapitulos = useCallback(async (libro: string) => {
    setLoading(true); setError(null);
    try { setCapitulos(await getCapitulos(db, libro)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [db]);

  const cargarVersiculos = useCallback(async (libro: string, cap: number) => {
    setLoading(true); setError(null);
    try { setVersiculos(await getVersiculos(db, libro, cap)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [db]);

  useEffect(() => {
    (async () => {
      const all = await getFavoritos();
      const s = new Set<number>();
      const colors: Record<number, string> = {};
      for (const v of versiculos) {
        const f = all.find((x) => x.id === `biblia-${v.id}`);
        if (f) { s.add(v.id); if (f.color) colors[v.id] = f.color; }
      }
      setFavs(s);
      setFavColors(colors);
    })();
  }, [versiculos]);

  const handleLongPress = useCallback(async (v: Verse) => {
    const id = `biblia-${v.id}`;
    const isFav = await isFavorito(id);
    if (isFav) {
      await removeFavorito(id);
      setFavs((prev) => { const s = new Set(prev); s.delete(v.id); return s; });
      setFavColors((prev) => { const n = { ...prev }; delete n[v.id]; return n; });
    } else {
      setPickerVerse(v);
    }
  }, []);

  const pickColor = useCallback(async (color: string) => {
    if (!pickerVerse) return;
    const v = pickerVerse;
    const id = `biblia-${v.id}`;
    try {
      await addFavorito({ id, tipo: "biblia", referencia: `${v.libro} ${v.capitulo}:${v.versiculo}`, preview: v.texto.slice(0, 80), timestamp: Date.now(), color } as Favorito);
      setFavs((prev) => new Set(prev).add(v.id));
      setFavColors((prev) => ({ ...prev, [v.id]: color }));
    } catch (e: unknown) { console.warn('[biblia] highlight error:', e instanceof Error ? e.message : e); }
    setPickerVerse(null);
  }, [pickerVerse]);

  const seleccionarLibro = (libro: Book) => {
    setLibroActual(libro); cargarCapitulos(libro.libro); setNivel("capitulos");
  };
  const seleccionarCapitulo = (cap: number) => {
    setCapActual(cap); cargarVersiculos(libroActual!.libro, cap); setNivel("versiculos");
  };
  const volver = () => {
    if (searchResults.length > 0 || searching || searchError) { clearSearch(); return; }
    if (nivel === "versiculos") { setNivel("capitulos"); setCapActual(null); }
    else if (nivel === "capitulos") { setNivel("libros"); setLibroActual(null); }
  };

  const librosFiltrados = filtro === "Todos"
    ? libros
    : libros.filter((b) => b.testamento === filtro);

  const antiguos = libros.filter((b) => b.testamento === "Antiguo").length;
  const nuevos = libros.filter((b) => b.testamento === "Nuevo").length;

  const renderHeader = () => {
    if (nivel === "libros") {
      const imgSrc = filtro === "Nuevo"
        ? require("@/assets/images/biblia-nuevo.jpg")
        : require("@/assets/images/biblia-antiguo.jpg");

      return (
        <ImageBackground source={imgSrc} style={s.heroImg} resizeMode="cover">
          <View style={s.heroOverlay}>
            <ThemedText style={s.heroSuper}>✝ BIBLIA DEL PUEBLO DE DIOS</ThemedText>
            <ThemedText style={s.heroTitle}>La Sagrada Escritura</ThemedText>
            <ThemedText style={s.heroSub}>{antiguos + nuevos} Libros</ThemedText>
          </View>
        </ImageBackground>
      );
    }

    return (
      <ScreenHeader
        superLabel="✝ BIBLIA DEL PUEBLO DE DIOS"
        title={nivel === "capitulos" ? (libroActual?.libro ?? "") : `${libroActual?.libro ?? ""} ${capActual ?? ""}`}
        subtitle={nivel === "capitulos" ? `${libroActual?.testamento} Testamento` : `${libroActual?.libro ?? ""} › Cap. ${capActual ?? ""}`}
        showBack
        onBack={volver}
        rightSlot={<View style={{ width: 40 }} />}
      />
    );
  };

  const irAVersiculo = (v: Verse) => {
    setLibroActual({ libro: v.libro, testamento: v.testamento as 'Antiguo' | 'Nuevo' });
    setCapActual(v.capitulo);
    cargarVersiculos(v.libro, v.capitulo);
    setNivel("versiculos");
    clearSearch();
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={C.gold} />
      <ThemedText style={s.muted}>Cargando…</ThemedText>
    </View>
  );

  if (error) return (
    <View style={s.center}>
      <ThemedText style={s.errorText}>{error}</ThemedText>
    </View>
  );

  if (searchResults.length > 0 || searching || searchError) {
    return (
      <SafeAreaView style={sharedStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <ScreenHeader title="Buscar en la Biblia" showBack onBack={volver} superLabel="✝ IGLESIA DIGITAL" />
        <Buscador
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={() => handleSearch(searchQuery)}
          onClear={clearSearch}
          placeholder="Buscá palabras…"
          inputRef={inputRef}
        />
        {searching ? (
          <View style={s.center}><ActivityIndicator size="large" color={C.gold} /></View>
        ) : (
          <FlashList
            data={searchResults}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.resultRow} onPress={() => irAVersiculo(item)} activeOpacity={0.75}>
                <View style={s.resultRef}>
                  <ThemedText style={s.resultRefText}>{item.libro} {item.capitulo}:{item.versiculo}</ThemedText>
                </View>
                <ThemedText style={s.resultTexto} numberOfLines={2}>{item.texto}</ThemedText>
              </TouchableOpacity>
            )}
            ListEmptyComponent={searchError ? <ThemedText style={s.emptyText}>{searchError}</ThemedText> : null}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {nivel !== "libros" && renderHeader()}

      {nivel === "libros" && (
        <FlashList
          key={filtro}
          data={librosFiltrados}
          keyExtractor={(item) => item.libro}
          numColumns={2}
          contentContainerStyle={s.gridContainer}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll} scrollEventThrottle={16}
          ListHeaderComponent={
            <View>
              {renderHeader()}
              <Buscador
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmit={() => handleSearch(searchQuery)}
                onClear={clearSearch}
                placeholder="Buscá en la Biblia…"
                inputRef={inputRef}
              />
              <View style={s.pillRow}>
                {(["Antiguo", "Nuevo", "Todos"] as Filtro[]).map((f) => {
                  const count = f === "Antiguo" ? antiguos : f === "Nuevo" ? nuevos : antiguos + nuevos;
                  const label = f === "Todos" ? `Todos (${count})` : `${f} (${count})`;
                  const active = filtro === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[s.pill, active && s.pillActive]}
                      onPress={() => setFiltro(f)}
                      activeOpacity={0.7}
                      accessibilityLabel={f}
                    >
                      <ThemedText style={[s.pillText, active && s.pillTextActive]}>{label}</ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <LibroCard item={item} onPress={() => seleccionarLibro(item)} />
          )}
        />
      )}

      {nivel === "capitulos" && (
        <FlashList data={capitulos} keyExtractor={(item) => String(item.capitulo)} numColumns={5}
          contentContainerStyle={s.capGrid} showsVerticalScrollIndicator={false}
          onScroll={handleScroll} scrollEventThrottle={16}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.capCard} onPress={() => seleccionarCapitulo(item.capitulo)} activeOpacity={0.75}>
              <ThemedText style={s.capNum}>{item.capitulo}</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}

      {nivel === "versiculos" && (
        <FlashList data={versiculos} keyExtractor={(item) => String(item.id)} contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false} ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onScroll={handleScroll} scrollEventThrottle={16}
          renderItem={({ item }) => {
            const color = favColors[item.id];
            return (
              <TouchableOpacity style={[s.versRow, color ? { backgroundColor: color + '30' } : undefined]} onLongPress={() => handleLongPress(item)} activeOpacity={0.85} delayLongPress={400}>
                <ThemedText style={s.versNum}>{item.versiculo}</ThemedText>
                <ThemedText style={s.versTexto}>{item.texto}</ThemedText>
                <TouchableOpacity onPress={() => Share.share({ message: `${item.libro} ${item.capitulo}:${item.versiculo}\n${item.texto}` })} style={s.shareBtn}>
                  <ThemedText style={s.shareIcon}>↗</ThemedText>
                </TouchableOpacity>
                <ThemedText style={[s.versFav, color ? { color } : undefined]}>{favs.has(item.id) ? "♥" : ""}</ThemedText>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={!!pickerVerse} transparent animationType="fade" onRequestClose={() => setPickerVerse(null)}>
        <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setPickerVerse(null)}>
          <View style={s.pickerModal} onStartShouldSetResponder={() => true}>
            <ThemedText style={s.pickerTitle}>Resaltar versículo</ThemedText>
            <View style={s.pickerRow}>
              {['#E8C97A', '#4CAF50', '#7B3FAF', '#2196F3', '#E07070', '#FF9800'].map((c) => (
                <TouchableOpacity key={c} style={[s.pickerSwatch, { backgroundColor: c }]} onPress={() => pickColor(c)} />
              ))}
              <TouchableOpacity style={s.pickerSwatch} onPress={() => setPickerVerse(null)}>
                <ThemedText style={s.pickerCancel}>✕</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: S.md },
  muted: { color: C.muted, fontSize: 14 },
  errorText: { color: "#E07070", fontSize: 14, textAlign: "center", padding: S.xl },

  heroImg: { width: "100%", height: 220 },
  heroOverlay: {
    flex: 1, backgroundColor: "rgba(13,27,42,0.65)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: S.xl,
  },
  heroSuper: { color: C.gold, fontSize: 10, letterSpacing: 2, fontWeight: "600", marginBottom: S.sm },
  heroTitle: { color: C.text, fontSize: 26, fontWeight: "700", textAlign: "center" },
  heroSub: { color: C.muted, fontSize: 14, marginTop: 6 },

  pillRow: { flexDirection: "row", gap: S.sm, paddingHorizontal: S.md, paddingVertical: S.md },
  pill: {
    flex: 1, paddingVertical: S.sm, borderRadius: R.xxl,
    borderWidth: 1, borderColor: C.goldDim,
    alignItems: "center",
  },
  pillActive: { backgroundColor: C.gold, borderColor: C.gold },
  pillText: { color: C.gold, fontSize: 13, fontWeight: "600" },
  pillTextActive: { color: C.navy },

  gridContainer: { paddingHorizontal: S.sm, paddingBottom: S.xxl },

  list: { padding: S.md },
  capGrid: { padding: S.md },
  capCard: { flex: 1, margin: 5, backgroundColor: C.navyMid, borderRadius: R.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.goldDim, paddingVertical: 10, paddingHorizontal: 6, minHeight: 48 },
  capNum: { color: C.goldLight, fontSize: 15, fontWeight: "700" },
  versRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  versNum: { color: C.gold, fontSize: 13, fontWeight: "700", minWidth: 28, paddingTop: 2, textAlign: "right" },
  versTexto: { flex: 1, color: C.text, fontSize: 15, lineHeight: 24 },
  shareBtn: { paddingHorizontal: S.xs },
  shareIcon: { color: C.muted, fontSize: 16 },
  versFav: { color: C.error, fontSize: 16, minWidth: 20, textAlign: "center", paddingTop: 2 },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: S.xl },
  pickerModal: { backgroundColor: C.navyLight, borderRadius: R.xl, padding: S.xl },
  pickerTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: S.lg, textAlign: 'center' },
  pickerRow: { flexDirection: 'row', gap: S.md, justifyContent: 'center', flexWrap: 'wrap' },
  pickerSwatch: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pickerCancel: { color: C.muted, fontSize: 18 },

  resultRow: { paddingVertical: S.sm, paddingHorizontal: S.md, gap: S.xs },
  resultRef: { alignSelf: "flex-start", backgroundColor: C.goldDim, borderRadius: R.sm, paddingHorizontal: 10, paddingVertical: 3 },
  resultRefText: { color: C.goldLight, fontSize: 12, fontWeight: "700" },
  resultTexto: { color: C.text, fontSize: 14, lineHeight: 20, marginTop: S.xs },
  emptyText: { color: C.muted, fontSize: 14, textAlign: "center", paddingVertical: S.huge },
});

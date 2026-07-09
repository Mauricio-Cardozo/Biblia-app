import ScreenHeader from "@/components/ui/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { C } from "@/constants/theme";
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { useSQLiteContext } from "expo-sqlite";
import { useBibliaVersion } from "@/contexts/bible-version";
import { tabBarScrollY } from "@/utils/scroll-state";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Animated, ImageBackground, StatusBar,
  StyleSheet, TouchableOpacity, View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLibros, getCapitulos, getVersiculos } from "@/db/db";
import { addFavorito, isFavorito, removeFavorito, type Favorito } from "@/data/favoritos";
import type { Book, Chapter, Verse } from "@/types";

type Nivel = "libros" | "capitulos" | "versiculos";
type Filtro = "Antiguo" | "Nuevo" | "Todos";

const handleScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
  tabBarScrollY.setValue(e.nativeEvent.contentOffset.y);
};

const ABREVIATURAS: Record<string, string> = {
  "Génesis": "Gn", "Éxodo": "Éx", "Levítico": "Lv", "Números": "Nm",
  "Deuteronomio": "Dt", "Josué": "Jos", "Jueces": "Jue", "Rut": "Rut",
  "1 Samuel": "1 Sm", "2 Samuel": "2 Sm", "1 Reyes": "1 Re", "2 Reyes": "2 Re",
  "1 Crónicas": "1 Cr", "2 Crónicas": "2 Cr", "Esdras": "Esd", "Nehemías": "Ne",
  "Tobías": "Tb", "Judit": "Jdt", "Ester": "Est", "1 Macabeos": "1 Mac",
  "2 Macabeos": "2 Mac", "Job": "Job", "Salmos": "Sal", "Proverbios": "Prov",
  "Eclesiastés": "Ecl", "Cantar de los Cantares": "Cant", "Sabiduría": "Sab",
  "Eclesiástico": "Sir", "Isaías": "Is", "Jeremías": "Jr", "Lamentaciones": "Lam",
  "Baruc": "Bar", "Ezequiel": "Ez", "Daniel": "Dn", "Oseas": "Os",
  "Joel": "Jl", "Amós": "Am", "Abdías": "Abd", "Jonás": "Jon",
  "Miqueas": "Miq", "Nahúm": "Na", "Habacuc": "Hab", "Sofonías": "Sof",
  "Ageo": "Ag", "Zacarías": "Za", "Malaquías": "Mal",
  "Mateo": "Mt", "Marcos": "Mc", "Lucas": "Lc", "Juan": "Jn",
  "Hechos de los Apóstoles": "Hch", "Romanos": "Rom", "1 Corintios": "1 Cor",
  "2 Corintios": "2 Cor", "Gálatas": "Gal", "Efesios": "Ef", "Filipenses": "Fil",
  "Colosenses": "Col", "1 Tesalonicenses": "1 Tes", "2 Tesalonicenses": "2 Tes",
  "1 Timoteo": "1 Tim", "2 Timoteo": "2 Tim", "Tito": "Tit", "Filemón": "Flm",
  "Hebreos": "Heb", "Santiago": "Sant", "1 Pedro": "1 Pe", "2 Pedro": "2 Pe",
  "1 Juan": "1 Jn", "2 Juan": "2 Jn", "3 Juan": "3 Jn", "Judas": "Jds",
  "Apocalipsis": "Ap",
};

const abrev = (libro: string) => ABREVIATURAS[libro] ?? libro.slice(0, 3);

function LibroCard({ item, onPress }: { item: Book; onPress: () => void }) {
  const scale = useMemo(() => new Animated.Value(1), []);

  const handlePressIn = () => {
    Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[s.libroCardWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={s.libroCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <ThemedText style={s.libroAbr}>{abrev(item.libro)}</ThemedText>
        <ThemedText style={s.libroNombre} numberOfLines={1}>{item.libro}</ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function BibliaScreen() {
  const db = useSQLiteContext();
  const { version, versiones, setVersion } = useBibliaVersion();

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

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try { setLibros(await getLibros(db, version.tabla)); }
      catch (e: any) { setError(`Error: ${e.message}`); }
      finally { setLoading(false); }
    })();
  }, [db, version.tabla]);

  const cargarCapitulos = useCallback(async (libro: string) => {
    setLoading(true); setError(null);
    try { setCapitulos(await getCapitulos(db, libro, version.tabla)); }
    catch (e: any) { setError(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }, [db, version.tabla]);

  const cargarVersiculos = useCallback(async (libro: string, cap: number) => {
    setLoading(true); setError(null);
    try { setVersiculos(await getVersiculos(db, libro, cap, version.tabla)); }
    catch (e: any) { setError(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }, [db, version.tabla]);

  useEffect(() => {
    Promise.all(versiculos.map((v) => isFavorito(`biblia-${v.id}`))).then((results) => {
      const s = new Set<number>();
      versiculos.forEach((v, i) => { if (results[i]) s.add(v.id); });
      setFavs(s);
    });
  }, [versiculos]);

  const toggleFav = useCallback(async (v: Verse) => {
    const id = `biblia-${v.id}`;
    const isFav = await isFavorito(id);
    if (isFav) {
      await removeFavorito(id);
      setFavs((prev) => { const s = new Set(prev); s.delete(v.id); return s; });
    } else {
      await addFavorito({
        id,
        tipo: "biblia",
        referencia: `${v.libro} ${v.capitulo}:${v.versiculo}`,
        preview: v.texto.slice(0, 80),
        timestamp: Date.now(),
      } as Favorito);
      setFavs((prev) => new Set(prev).add(v.id));
    }
  }, []);

  const seleccionarLibro = (libro: Book) => {
    setLibroActual(libro); cargarCapitulos(libro.libro); setNivel("capitulos");
  };
  const seleccionarCapitulo = (cap: number) => {
    setCapActual(cap); cargarVersiculos(libroActual!.libro, cap); setNivel("versiculos");
  };
  const volver = () => {
    if (nivel === "versiculos") { setNivel("capitulos"); setCapActual(null); }
    else if (nivel === "capitulos") { setNivel("libros"); setLibroActual(null); }
  };

  const librosFiltrados = filtro === "Todos"
    ? libros
    : libros.filter((b) => b.testamento === filtro);

  const antiguos = libros.filter((b) => b.testamento === "Antiguo").length;
  const nuevos = libros.filter((b) => b.testamento === "Nuevo").length;

  const [mostrarVersiones, setMostrarVersiones] = useState(false);

  const renderHeader = () => {
    if (nivel === "libros") {
      const imgSrc = filtro === "Nuevo"
        ? require("@/assets/images/biblia-nuevo.jpg")
        : require("@/assets/images/biblia-antiguo.jpg");

      return (
        <ImageBackground source={imgSrc} style={s.heroImg} resizeMode="cover">
          <View style={s.heroOverlay}>
            <TouchableOpacity onPress={() => setMostrarVersiones(true)}>
              <ThemedText style={s.heroSuper}>✝ {version.nombre.toUpperCase()}</ThemedText>
            </TouchableOpacity>
            <ThemedText style={s.heroTitle}>La Sagrada Escritura</ThemedText>
            <ThemedText style={s.heroSub}>{antiguos + nuevos} Libros</ThemedText>
          </View>
        </ImageBackground>
      );
    }

    return (
      <ScreenHeader
        superLabel={`✝ ${version.nombre.toUpperCase()}`}
        title={nivel === "capitulos" ? (libroActual?.libro ?? "") : `${libroActual?.libro ?? ""} ${capActual ?? ""}`}
        subtitle={nivel === "capitulos" ? `${libroActual?.testamento} Testamento` : `${libroActual?.libro ?? ""} › Cap. ${capActual ?? ""}`}
        showBack
        onBack={volver}
        rightSlot={
          <TouchableOpacity onPress={() => setMostrarVersiones(true)}>
            <ThemedText style={{ color: C.gold, fontSize: 10, letterSpacing: 1, fontWeight: "700" }}>
              CAMBIAR
            </ThemedText>
          </TouchableOpacity>
        }
      />
    );
  };

  if (loading) return (
    <ThemedView style={s.center}>
      <ActivityIndicator size="large" color={C.gold} />
      <ThemedText style={s.muted}>Cargando…</ThemedText>
    </ThemedView>
  );

  if (error) return (
    <ThemedView style={s.center}>
      <ThemedText style={s.errorText}>{error}</ThemedText>
    </ThemedView>
  );

  return (
    <SafeAreaView style={s.safe}>
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
          renderItem={({ item }) => (
            <TouchableOpacity style={s.versRow} onLongPress={() => toggleFav(item)} activeOpacity={0.85} delayLongPress={400}>
              <ThemedText style={s.versNum}>{item.versiculo}</ThemedText>
              <ThemedText style={s.versTexto}>{item.texto}</ThemedText>
              <ThemedText style={s.versFav}>{favs.has(item.id) ? "♥" : ""}</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}

      {mostrarVersiones && (
        <View style={s.versionOverlay}>
          <TouchableOpacity style={s.versionBackdrop} onPress={() => setMostrarVersiones(false)} />
          <View style={s.versionSheet}>
            <ThemedText style={s.versionTitle}>Versión de la Biblia</ThemedText>
            {versiones.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[s.versionOption, v.id === version.id && s.versionOptionActive]}
                onPress={() => { setVersion(v.id); setMostrarVersiones(false); }}
                activeOpacity={0.7}
              >
                <ThemedText style={[s.versionName, v.id === version.id && s.versionNameActive]}>
                  {v.nombre}
                </ThemedText>
                <ThemedText style={s.versionDesc}>{v.descripcion}</ThemedText>
                {v.id === version.id && <ThemedText style={s.versionCheck}>✓</ThemedText>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.versionCerrar} onPress={() => setMostrarVersiones(false)}>
              <ThemedText style={s.versionCerrarText}>Cerrar</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
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
  libroCardWrapper: { flex: 1, margin: 6 },
  libroCard: {
    backgroundColor: C.navyMid, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.sep,
    height: 90, alignItems: "center", justifyContent: "center",
    paddingHorizontal: S.sm,
  },
  libroAbr: { color: C.gold, fontSize: 28, fontWeight: "800" },
  libroNombre: { color: C.muted, fontSize: 13, marginTop: S.xs, textAlign: "center" },

  list: { padding: S.md },
  capGrid: { padding: S.md },
  capCard: { flex: 1, margin: 5, backgroundColor: C.navyMid, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.goldDim, paddingVertical: 10, paddingHorizontal: 6, minHeight: 48 },
  capNum: { color: C.goldLight, fontSize: 15, fontWeight: "700" },
  versRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  versNum: { color: C.gold, fontSize: 13, fontWeight: "700", minWidth: 28, paddingTop: 2, textAlign: "right" },
  versTexto: { flex: 1, color: C.text, fontSize: 15, lineHeight: 24 },
  versFav: { color: C.error, fontSize: 16, minWidth: 20, textAlign: "center", paddingTop: 2 },

  versionOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  versionBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  versionSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: C.navyMid, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: S.xl, paddingBottom: S.huge,
  },
  versionTitle: { color: C.text, fontSize: 18, fontWeight: "700", marginBottom: S.lg },
  versionOption: {
    paddingVertical: 14, paddingHorizontal: S.lg, borderRadius: R.lg,
    marginBottom: S.sm, borderWidth: 1, borderColor: C.sep,
  },
  versionOptionActive: { borderColor: C.gold, backgroundColor: C.navyLight },
  versionName: { color: C.text, fontSize: 15, fontWeight: "600" },
  versionNameActive: { color: C.gold },
  versionDesc: { color: C.muted, fontSize: 12, marginTop: 3, lineHeight: 16 },
  versionCheck: { color: C.gold, fontSize: 18, position: "absolute", right: 16, top: 14 },
  versionCerrar: { marginTop: S.sm, paddingVertical: S.md, alignItems: "center" },
  versionCerrarText: { color: C.muted, fontSize: 14 },
});

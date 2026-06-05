import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type Nivel = "libros" | "capitulos" | "versiculos";

interface Libro {
  libro: string;
  testamento: string;
}
interface Capitulo {
  capitulo: number;
}
interface Versiculo {
  id: number;
  versiculo: number;
  texto: string;
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
  navy: "#0D1B2A",
  navyMid: "#1A2D45",
  navyLight: "#243B55",
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDim: "#8B6914",
  text: "#F0E6CC",
  muted: "#9BA8B5",
  sep: "#1E3050",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BibliaScreen() {
  const db = useSQLiteContext();

  const [nivel, setNivel] = useState<Nivel>("libros");
  const [libroActual, setLibroActual] = useState<Libro | null>(null);
  const [capActual, setCapActual] = useState<number | null>(null);

  const [libros, setLibros] = useState<Libro[]>([]);
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [versiculos, setVersiculos] = useState<Versiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const cargarLibros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await db.getAllAsync<Libro>(
        `SELECT libro, testamento
         FROM biblia_pueblo_dios
         GROUP BY libro
         ORDER BY MIN(id) ASC`,
      );
      setLibros(rows);
    } catch (e: any) {
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [db]);

  const cargarCapitulos = useCallback(
    async (libro: string) => {
      setLoading(true);
      setError(null);
      try {
        const rows = await db.getAllAsync<Capitulo>(
          `SELECT DISTINCT capitulo FROM biblia_pueblo_dios
         WHERE libro = ? ORDER BY capitulo ASC`,
          [libro],
        );
        setCapitulos(rows);
      } catch (e: any) {
        setError(`Error: ${e.message}`);
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const cargarVersiculos = useCallback(
    async (libro: string, cap: number) => {
      setLoading(true);
      setError(null);
      try {
        const rows = await db.getAllAsync<Versiculo>(
          `SELECT id, versiculo, texto FROM biblia_pueblo_dios
         WHERE libro = ? AND capitulo = ?
         ORDER BY versiculo ASC`,
          [libro, cap],
        );
        setVersiculos(rows);
      } catch (e: any) {
        setError(`Error: ${e.message}`);
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  useEffect(() => {
    cargarLibros();
  }, [cargarLibros]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const seleccionarLibro = (libro: Libro) => {
    setLibroActual(libro);
    cargarCapitulos(libro.libro);
    setNivel("capitulos");
  };

  const seleccionarCapitulo = (cap: number) => {
    setCapActual(cap);
    cargarVersiculos(libroActual!.libro, cap);
    setNivel("versiculos");
  };

  const volver = () => {
    if (nivel === "versiculos") {
      setNivel("capitulos");
      setCapActual(null);
    } else if (nivel === "capitulos") {
      setNivel("libros");
      setLibroActual(null);
    }
  };

  // ── Header ─────────────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={s.header}>
      {nivel !== "libros" && (
        <TouchableOpacity
          onPress={volver}
          style={s.backBtn}
          activeOpacity={0.7}
        >
          <ThemedText style={s.backArrow}>←</ThemedText>
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <ThemedText style={s.headerSuper}>
          ✝ BIBLIA DEL PUEBLO DE DIOS
        </ThemedText>
        <ThemedText style={s.headerTitle} numberOfLines={1}>
          {nivel === "libros"
            ? "Libros"
            : nivel === "capitulos"
              ? libroActual?.libro
              : `${libroActual?.libro} ${capActual}`}
        </ThemedText>
        {nivel !== "libros" && (
          <ThemedText style={s.breadcrumb}>
            {nivel === "capitulos"
              ? `${libroActual?.testamento} Testamento`
              : `${libroActual?.libro} › Cap. ${capActual}`}
          </ThemedText>
        )}
      </View>
    </View>
  );

  // ── States ─────────────────────────────────────────────────────────────────

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
      </ThemedView>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      {renderHeader()}

      {/* LIBROS */}
      {nivel === "libros" && (
        <FlatList
          data={libros}
          keyExtractor={(item) => item.libro}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={s.libroCard}
              onPress={() => seleccionarLibro(item)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  s.indexBadge,
                  item.testamento === "Nuevo" && s.indexBadgeNuevo,
                ]}
              >
                <ThemedText style={s.indexText}>{index + 1}</ThemedText>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={s.libroNombre}>{item.libro}</ThemedText>
                <ThemedText style={s.libroTestamento}>
                  {item.testamento} Testamento
                </ThemedText>
              </View>
              <ThemedText style={s.chevron}>›</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}

      {/* CAPÍTULOS */}
      {nivel === "capitulos" && (
        <FlatList
          data={capitulos}
          keyExtractor={(item) => String(item.capitulo)}
          numColumns={5}
          contentContainerStyle={s.capGrid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.capCard}
              onPress={() => seleccionarCapitulo(item.capitulo)}
              activeOpacity={0.75}
            >
              <ThemedText style={s.capNum}>{item.capitulo}</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}

      {/* VERSÍCULOS */}
      {nivel === "versiculos" && (
        <FlatList
          data={versiculos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <View style={s.versRow}>
              <ThemedText style={s.versNum}>{item.versiculo}</ThemedText>
              <ThemedText style={s.versTexto}>{item.texto}</ThemedText>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  muted: { color: C.muted, fontSize: 14 },
  errorText: {
    color: "#E07070",
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.navyMid,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 12 : 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.goldDim,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.navyLight,
    borderWidth: 1,
    borderColor: C.goldDim,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { color: C.gold, fontSize: 20, lineHeight: 22 },
  headerSuper: {
    color: C.gold,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "600",
  },
  headerTitle: { color: C.text, fontSize: 20, fontWeight: "700", marginTop: 2 },
  breadcrumb: { color: C.muted, fontSize: 12, marginTop: 2 },

  list: { padding: 12 },
  sep: { height: 1, backgroundColor: C.sep, marginHorizontal: 8 },

  // Libros
  libroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.navyMid,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: C.sep,
    marginBottom: 6,
  },
  indexBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: C.goldDim,
    alignItems: "center",
    justifyContent: "center",
  },
  indexBadgeNuevo: { backgroundColor: "#1A4A6E" },
  indexText: { color: C.goldLight, fontSize: 12, fontWeight: "800" },
  libroNombre: { color: C.text, fontSize: 15, fontWeight: "600" },
  libroTestamento: { color: C.muted, fontSize: 11, marginTop: 2 },
  chevron: { color: C.gold, fontSize: 22 },

  // Capítulos
  capGrid: { padding: 12 },
  capCard: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    maxWidth: "18%",
    backgroundColor: C.navyMid,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.goldDim,
  },
  capNum: { color: C.goldLight, fontSize: 15, fontWeight: "700" },

  // Versículos
  versRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  versNum: {
    color: C.gold,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 28,
    paddingTop: 2,
    textAlign: "right",
  },
  versTexto: { flex: 1, color: C.text, fontSize: 15, lineHeight: 24 },
});

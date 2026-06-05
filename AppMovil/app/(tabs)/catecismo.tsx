import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type Nivel = "partes" | "secciones" | "numerales" | "detalle";

interface ParteCatecismo {
  parte: string;
}
interface SeccionCatecismo {
  seccion: string;
}
interface NumeralCatecismo {
  id: number;
  articulo: string;
  texto: string;
}
interface DetalleCatecismo extends NumeralCatecismo {
  parte: string;
  seccion: string;
  capitulo: string;
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
  error: "#E07070",
};

// ─── Header component ─────────────────────────────────────────────────────────

function Header({
  nivel,
  parteActual,
  seccionActual,
  onBack,
}: {
  nivel: Nivel;
  parteActual: string | null;
  seccionActual: string | null;
  onBack: () => void;
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
        <TouchableOpacity
          onPress={onBack}
          style={s.backBtn}
          activeOpacity={0.7}
        >
          <ThemedText style={s.backArrow}>←</ThemedText>
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <ThemedText style={s.headerSuper}>✝ IGLESIA DIGITAL</ThemedText>
        <ThemedText style={s.headerTitle} numberOfLines={2}>
          {titles[nivel]}
        </ThemedText>
        {nivel === "secciones" && (
          <ThemedText style={s.breadcrumb}>Seleccioná una sección</ThemedText>
        )}
        {nivel === "numerales" && (
          <ThemedText style={s.breadcrumb}>{parteActual}</ThemedText>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CatecismoScreen() {
  const db = useSQLiteContext();

  const [nivel, setNivel] = useState<Nivel>("partes");
  const [parteActual, setParteActual] = useState<string | null>(null);
  const [seccionActual, setSeccionActual] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetalleCatecismo | null>(null);

  const [partes, setPartes] = useState<ParteCatecismo[]>([]);
  const [secciones, setSecciones] = useState<SeccionCatecismo[]>([]);
  const [numerales, setNumerales] = useState<NumeralCatecismo[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Loaders ────────────────────────────────────────────────────────────────

  const cargarPartes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await db.getAllAsync<ParteCatecismo>(
        "SELECT DISTINCT parte FROM catecismo_cic ORDER BY MIN(id) ASC",
      );
      setPartes(rows);
    } catch (e: any) {
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [db]);

  const cargarSecciones = useCallback(
    async (parte: string) => {
      setLoading(true);
      setError(null);
      try {
        const rows = await db.getAllAsync<SeccionCatecismo>(
          "SELECT DISTINCT seccion FROM catecismo_cic WHERE parte = ? ORDER BY MIN(id) ASC",
          [parte],
        );
        setSecciones(rows);
      } catch (e: any) {
        setError(`Error: ${e.message}`);
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const cargarNumerales = useCallback(
    async (parte: string, seccion: string) => {
      setLoading(true);
      setError(null);
      try {
        const rows = await db.getAllAsync<NumeralCatecismo>(
          `SELECT id, articulo, texto
         FROM catecismo_cic
         WHERE parte = ? AND seccion = ?
         ORDER BY id ASC`,
          [parte, seccion],
        );
        setNumerales(rows);
      } catch (e: any) {
        setError(`Error: ${e.message}`);
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const cargarDetalle = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      try {
        const row = await db.getFirstAsync<DetalleCatecismo>(
          "SELECT id, parte, seccion, capitulo, articulo, texto FROM catecismo_cic WHERE id = ?",
          [id],
        );
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

  useEffect(() => {
    cargarPartes();
  }, [cargarPartes]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const seleccionarParte = (parte: string) => {
    setParteActual(parte);
    cargarSecciones(parte);
    setNivel("secciones");
  };

  const seleccionarSeccion = (seccion: string) => {
    setSeccionActual(seccion);
    cargarNumerales(parteActual!, seccion);
    setNivel("numerales");
  };

  const volver = () => {
    if (nivel === "detalle") {
      setNivel("numerales");
      setDetalle(null);
    }
    if (nivel === "numerales") {
      setNivel("secciones");
      setSeccionActual(null);
    }
    if (nivel === "secciones") {
      setNivel("partes");
      setParteActual(null);
    }
  };

  // ── Shared states ──────────────────────────────────────────────────────────

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

  // ── Detail view ────────────────────────────────────────────────────────────

  if (nivel === "detalle" && detalle) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.navy} />
        <Header
          nivel="detalle"
          parteActual={parteActual}
          seccionActual={seccionActual}
          onBack={volver}
        />
        <ScrollView
          contentContainerStyle={s.detalleContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Badge numeral */}
          <View style={s.nroBadge}>
            <ThemedText style={s.nroBadgeText}>Numeral {detalle.id}</ThemedText>
          </View>

          {/* Jerarquía */}
          <View style={s.jerarquia}>
            {detalle.parte && (
              <ThemedText style={s.jerarquiaItem}>
                📖 {detalle.parte}
              </ThemedText>
            )}
            {detalle.seccion && (
              <ThemedText style={s.jerarquiaItem}>
                {" "}
                › {detalle.seccion}
              </ThemedText>
            )}
            {detalle.capitulo && (
              <ThemedText style={s.jerarquiaItem}>
                {" "}
                › {detalle.capitulo}
              </ThemedText>
            )}
            {detalle.articulo && (
              <ThemedText style={s.jerarquiaItem}>
                {" "}
                › {detalle.articulo}
              </ThemedText>
            )}
          </View>

          <View style={s.divider} />

          {/* Texto */}
          <ThemedText style={s.detalleTexto}>{detalle.texto}</ThemedText>

          <TouchableOpacity
            style={s.volverBtn}
            onPress={volver}
            activeOpacity={0.8}
          >
            <ThemedText style={s.volverBtnText}>← Volver</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── List views ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <Header
        nivel={nivel}
        parteActual={parteActual}
        seccionActual={seccionActual}
        onBack={volver}
      />

      {/* PARTES */}
      {nivel === "partes" && (
        <FlatList
          data={partes}
          keyExtractor={(item) => item.parte}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => seleccionarParte(item.parte)}
              activeOpacity={0.75}
            >
              <View style={s.indexBadge}>
                <ThemedText style={s.indexText}>{index + 1}</ThemedText>
              </View>
              <ThemedText style={s.cardTitle} numberOfLines={2}>
                {item.parte}
              </ThemedText>
              <ThemedText style={s.chevron}>›</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}

      {/* SECCIONES */}
      {nivel === "secciones" && (
        <FlatList
          data={secciones}
          keyExtractor={(item) => item.seccion}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => seleccionarSeccion(item.seccion)}
              activeOpacity={0.75}
            >
              <View style={[s.indexBadge, s.indexBadgeSec]}>
                <ThemedText style={s.indexText}>{index + 1}</ThemedText>
              </View>
              <ThemedText style={s.cardTitle} numberOfLines={2}>
                {item.seccion}
              </ThemedText>
              <ThemedText style={s.chevron}>›</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}

      {/* NUMERALES */}
      {nivel === "numerales" && (
        <FlatList
          data={numerales}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => cargarDetalle(item.id)}
              activeOpacity={0.75}
            >
              <View style={s.nroBox}>
                <ThemedText style={s.nroText}>{item.id}</ThemedText>
              </View>
              <View style={{ flex: 1 }}>
                {item.articulo ? (
                  <ThemedText style={s.cardSub} numberOfLines={1}>
                    {item.articulo}
                  </ThemedText>
                ) : null}
                <ThemedText style={s.cardPreview} numberOfLines={2}>
                  {item.texto?.slice(0, 80)}…
                </ThemedText>
              </View>
              <ThemedText style={s.chevron}>›</ThemedText>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: C.navy,
  },
  muted: { color: C.muted, fontSize: 14 },
  errorText: {
    color: C.error,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: C.navyLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.goldDim,
  },
  retryText: { color: C.goldLight, fontWeight: "600" },

  // Header
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
  headerTitle: { color: C.text, fontSize: 18, fontWeight: "700", marginTop: 2 },
  breadcrumb: { color: C.muted, fontSize: 11, marginTop: 2 },

  // List
  list: { padding: 12 },
  sep: { height: 1, backgroundColor: C.sep, marginHorizontal: 8 },

  // Cards
  card: {
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
  indexBadgeSec: { backgroundColor: "#1A4A6E" },
  indexText: { color: C.goldLight, fontSize: 13, fontWeight: "800" },
  cardTitle: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  chevron: { color: C.gold, fontSize: 22 },

  // Numeral card
  nroBox: {
    minWidth: 46,
    height: 40,
    borderRadius: 8,
    backgroundColor: C.goldDim,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  nroText: { color: C.goldLight, fontSize: 13, fontWeight: "800" },
  cardSub: { color: C.gold, fontSize: 11, fontWeight: "600", marginBottom: 3 },
  cardPreview: { color: C.text, fontSize: 13, lineHeight: 18 },

  // Detail
  detalleContent: { padding: 20, paddingBottom: 40 },
  nroBadge: {
    alignSelf: "flex-start",
    backgroundColor: C.goldDim,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },
  nroBadgeText: {
    color: C.goldLight,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  jerarquia: { gap: 4, marginBottom: 16 },
  jerarquiaItem: { color: C.muted, fontSize: 13, lineHeight: 20 },
  divider: {
    height: 2,
    backgroundColor: C.goldDim,
    borderRadius: 1,
    marginBottom: 20,
  },
  detalleTexto: {
    color: C.text,
    fontSize: 16,
    lineHeight: 28,
    textAlign: "justify",
  },
  volverBtn: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: C.navyLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.goldDim,
    alignItems: "center",
  },
  volverBtnText: { color: C.goldLight, fontWeight: "600", fontSize: 15 },
});

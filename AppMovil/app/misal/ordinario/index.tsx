import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { ThemedText } from "@/components/themed-text";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalOrdinarioSecciones, getMisalOrdinarioPorSeccion } from "@/db/db";
import type { MisalOrdinarioBlock } from "@/types";

export default function OrdinarioScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [secciones, setSecciones] = useState<{ seccion: string; count: number }[]>([]);
  const [blocks, setBlocks] = useState<MisalOrdinarioBlock[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setSecciones(await getMisalOrdinarioSecciones(db)); }
      catch (e) { console.warn('[ordinario]', e); }
      setLoading(false);
    })();
  }, [db]);

  const loadBlocks = useCallback(async (seccion: string) => {
    setLoading(true);
    try {
      setBlocks(await getMisalOrdinarioPorSeccion(db, seccion));
      setSelected(seccion);
    } catch (e) { console.warn('[ordinario]', e); }
    setLoading(false);
  }, [db]);

  if (loading) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={selected ?? "Ordinario de la Misa"}
        subtitle={selected ? `${blocks.length} bloques` : "Seleccioná una sección"}
        showBack
        onBack={() => {
          if (selected) { setSelected(null); setBlocks([]); }
          else { router.back(); }
        }}
      />
      <ScrollView contentContainerStyle={s.content}>
        {!selected && secciones.map((se) => (
          <TouchableOpacity
            key={se.seccion}
            style={s.card}
            onPress={() => loadBlocks(se.seccion)}
            activeOpacity={0.7}
          >
            <View style={s.cardRow}>
              <View style={s.cardTextWrap}>
                <ThemedText style={s.cardTitle}>{se.seccion}</ThemedText>
                <ThemedText style={s.cardSubtitle}>{se.count} bloques</ThemedText>
              </View>
              <ThemedText style={s.chevron}>›</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
        {selected && blocks.map((b) => (
          <TouchableOpacity
            key={b.id}
            style={s.block}
            onPress={() => router.push(`/misal/ordinario/${b.id}`)}
            activeOpacity={0.7}
          >
            <View style={s.blockHeader}>
              <ThemedText style={s.rol}>{b.rol}</ThemedText>
              {b.subseccion !== selected && (
                <ThemedText style={s.sub}>{b.subseccion}</ThemedText>
              )}
            </View>
            <ThemedText style={s.blockText} numberOfLines={3}>
              {b.texto.slice(0, 150)}…
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: S.lg, paddingBottom: S.huge },
  card: {
    backgroundColor: C.navyMid,
    borderRadius: R.lg,
    padding: S.lg,
    marginBottom: S.sm,
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: "600" },
  cardSubtitle: { color: C.muted, fontSize: 12, marginTop: 2 },
  chevron: { color: C.gold, fontSize: 22, marginLeft: S.sm },
  block: {
    backgroundColor: C.navyMid,
    borderRadius: R.lg,
    padding: 14,
    marginBottom: S.sm,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: S.sm,
  },
  rol: {
    color: C.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sub: {
    color: C.muted,
    fontSize: 10,
  },
  blockText: {
    color: C.text,
    fontSize: 13,
    lineHeight: 20,
  },
});

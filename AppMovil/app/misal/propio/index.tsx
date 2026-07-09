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
import { getMisalTemporadas, getMisalPropio } from "@/db/db";
import { SEASON_EMOJI } from "@/utils/seasons";
import type { MisalPropioEntry } from "@/types";

export default function PropioScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [temporadas, setTemporadas] = useState<{ temporada: string; temporada_label: string; count: number }[]>([]);
  const [entries, setEntries] = useState<MisalPropioEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMisalTemporadas(db);
        setTemporadas(data);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [db]);

  const loadEntries = useCallback(async (temporada: string) => {
    setLoading(true);
    try {
      const data = await getMisalPropio(db, temporada);
      setEntries(data);
      setSelected(temporada);
    } catch { /* ignore */ }
    setLoading(false);
  }, [db]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={selected ? `${selected.charAt(0).toUpperCase() + selected.slice(1)}` : "Propio del Tiempo"}
        subtitle={selected ? `${entries.length} días` : "Seleccioná un tiempo litúrgico"}
        showBack
        onBack={() => {
          if (selected) {
            setSelected(null);
            setEntries([]);
          } else {
            router.back();
          }
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {!selected && temporadas.map((t) => (
          <TouchableOpacity
            key={t.temporada}
            style={styles.card}
            onPress={() => loadEntries(t.temporada)}
            activeOpacity={0.7}
          >
            <View style={styles.cardRow}>
              <ThemedText style={styles.cardIcon}>{SEASON_EMOJI[t.temporada] ?? "🌿"}</ThemedText>
              <View style={styles.cardTextWrap}>
                <ThemedText style={styles.cardTitle}>{t.temporada_label}</ThemedText>
                <ThemedText style={styles.cardSubtitle}>{t.count} días</ThemedText>
              </View>
              <ThemedText style={styles.chevron}>›</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
        {selected && entries.map((e) => (
          <TouchableOpacity
            key={e.id}
            style={styles.card}
            onPress={() => router.push(`/misal/propio/${e.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardTextWrap}>
                <ThemedText style={styles.cardTitle}>{e.dia}</ThemedText>
                {e.colecta && (
                  <ThemedText style={styles.cardSubtitle} numberOfLines={2}>
                    {e.colecta.slice(0, 100)}…
                  </ThemedText>
                )}
              </View>
              <ThemedText style={styles.chevron}>›</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  cardIcon: { fontSize: 28, marginRight: 14 },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: "600" },
  cardSubtitle: { color: C.muted, fontSize: 12, marginTop: S.xs, lineHeight: 17 },
  chevron: { color: C.gold, fontSize: 22, marginLeft: S.sm },
});

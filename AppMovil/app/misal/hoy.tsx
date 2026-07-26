import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import SectionCard from "@/components/section-card";
import ScreenHeader from "@/components/ui/screen-header";
import ReadingSection from "@/components/reading-section";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDbQuery } from "@/hooks/use-db-query";
import { getLecturaDelDia, getMisalTemporadas } from "@/db/db";
import { SEASON_EMOJI } from "@/utils/seasons";
import { hoy } from "@/utils/date";
import type { Lectura } from "@/types";

type HoyData = [Lectura | null, { temporada: string; temporada_label: string; count: number }[]];

export default function HoyScreen() {
  const insets = useSafeAreaInsets();
  const today = hoy();

  const { data, loading } = useDbQuery<HoyData>(
    (db) => Promise.all([
      getLecturaDelDia(db, today),
      getMisalTemporadas(db),
    ]),
    [today],
  );

  const lectura = data?.[0] ?? null;
  const temporadas = data?.[1] ?? [];

  if (loading) {
    return (
      <View style={[sharedStyles.container, sharedStyles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Misa de Hoy" subtitle={today} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        {lectura ? (
          <View style={s.lecturaCard}>
            <ThemedText style={s.lecturaTitle}>{lectura.titulo_misa}</ThemedText>
            {lectura.primera_lectura ? (
              <ReadingSection label="Primera Lectura" referencia={lectura.primera_lectura_ref} texto={lectura.primera_lectura} />
            ) : null}
            {lectura.salmo ? <ReadingSection label="Salmo" texto={lectura.salmo} /> : null}
            {lectura.aleluia ? <ReadingSection label="Aleluya" texto={lectura.aleluia} /> : null}
            {lectura.evangelio ? (
              <ReadingSection label="Evangelio" referencia={lectura.evangelio_ref} texto={lectura.evangelio} />
            ) : null}
          </View>
        ) : (
          <View style={s.noData}>
            <ThemedText style={s.noDataText}>No hay lecturas disponibles para hoy</ThemedText>
          </View>
        )}

        <ThemedText style={s.sectionTitle}>Propio del Tiempo</ThemedText>
        {temporadas.map((t) => (
          <SectionCard
            key={t.temporada}
            icono={SEASON_EMOJI[t.temporada] ?? "🌿"}
            titulo={t.temporada_label}
            subtitulo={`${t.count} días`}
            onPress={() => router.push("/misal/propio")}
          />
        ))}

        <SectionCard
          icono="✋"
          titulo="Prefacios"
          subtitulo="67 prefacios para cada tiempo"
          onPress={() => router.push("/misal/prefacios")}
        />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: S.lg, paddingBottom: S.huge },
  lecturaCard: {
    backgroundColor: C.navyMid,
    borderRadius: R.lg,
    padding: S.lg,
    marginBottom: S.lg,
  },
  lecturaTitle: { color: C.gold, fontSize: 16, fontWeight: "700", marginBottom: S.md },
  noData: { padding: S.xxl, alignItems: "center" },
  noDataText: { color: C.muted, fontSize: 14 },
  sectionTitle: { color: C.gold, fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 10, marginTop: S.xs },
  card: {
    backgroundColor: C.navyMid,
    borderRadius: R.lg,
    padding: 14,
    marginBottom: 6,
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardIcon: { fontSize: 24, marginRight: S.md },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 14, fontWeight: "600" },
  cardSubtitle: { color: C.muted, fontSize: 11, marginTop: 2 },
  chevron: { color: C.gold, fontSize: 20, marginLeft: 6 },
});

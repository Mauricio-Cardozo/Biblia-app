import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getLecturaDelDia, getMisalTemporadas } from "@/db/db";
import type { Lectura } from "@/types";

export default function HoyScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().slice(0, 10);

  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [temporadas, setTemporadas] = useState<{ temporada: string; temporada_label: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLecturaDelDia(db, today),
      getMisalTemporadas(db),
    ]).then(([lec, temps]) => {
      setLectura(lec);
      setTemporadas(temps);
    }).finally(() => setLoading(false));
  }, [db, today]);

  if (loading) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Misa de Hoy" subtitle={today} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        {lectura ? (
          <View style={s.lecturaCard}>
            <ThemedText style={s.lecturaTitle}>{lectura.titulo_misa}</ThemedText>
            {lectura.primera_lectura && (
              <View style={s.readingBlock}>
                <ThemedText style={s.readingLabel}>Primera Lectura</ThemedText>
                <ThemedText style={s.readingRef}>{lectura.primera_lectura_ref}</ThemedText>
                <ThemedText style={s.readingText}>{lectura.primera_lectura}</ThemedText>
              </View>
            )}
            {lectura.salmo && (
              <View style={s.readingBlock}>
                <ThemedText style={s.readingLabel}>Salmo</ThemedText>
                <ThemedText style={s.readingText}>{lectura.salmo}</ThemedText>
              </View>
            )}
            {lectura.aleluia && (
              <View style={s.readingBlock}>
                <ThemedText style={s.readingLabel}>Aleluia</ThemedText>
                <ThemedText style={s.readingText}>{lectura.aleluia}</ThemedText>
              </View>
            )}
            {lectura.evangelio && (
              <View style={s.readingBlock}>
                <ThemedText style={s.readingLabel}>Evangelio</ThemedText>
                <ThemedText style={s.readingRef}>{lectura.evangelio_ref}</ThemedText>
                <ThemedText style={s.readingText}>{lectura.evangelio}</ThemedText>
              </View>
            )}
          </View>
        ) : (
          <View style={s.noData}>
            <ThemedText style={s.noDataText}>No hay lecturas disponibles para hoy</ThemedText>
          </View>
        )}

        <ThemedText style={s.sectionTitle}>Propio del Tiempo</ThemedText>
        {temporadas.map((t) => (
          <TouchableOpacity
            key={t.temporada}
            style={s.card}
            onPress={() => router.push("/misal/propio")}
            activeOpacity={0.7}
          >
            <View style={s.cardRow}>
              <ThemedText style={s.cardIcon}>
                {t.temporada === "adviento" ? "🕯️" :
                 t.temporada === "navidad" ? "⭐" :
                 t.temporada === "cuaresma" ? "🙏" :
                 t.temporada === "pascua" ? "✨" :
                 "🌿"}
              </ThemedText>
              <View style={s.cardTextWrap}>
                <ThemedText style={s.cardTitle}>{t.temporada_label}</ThemedText>
                <ThemedText style={s.cardSubtitle}>{t.count} días</ThemedText>
              </View>
              <ThemedText style={s.chevron}>›</ThemedText>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[s.card, { marginTop: 8 }]}
          onPress={() => router.push("/misal/prefacios")}
          activeOpacity={0.7}
        >
          <View style={s.cardRow}>
            <ThemedText style={s.cardIcon}>✋</ThemedText>
            <View style={s.cardTextWrap}>
              <ThemedText style={s.cardTitle}>Prefacios</ThemedText>
              <ThemedText style={s.cardSubtitle}>67 prefacios para cada tiempo</ThemedText>
            </View>
            <ThemedText style={s.chevron}>›</ThemedText>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40 },
  lecturaCard: {
    backgroundColor: C.navyMid,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  lecturaTitle: { color: C.gold, fontSize: 16, fontWeight: "700", marginBottom: 12 },
  readingBlock: { marginBottom: 14 },
  readingLabel: { color: C.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  readingRef: { color: C.muted, fontSize: 11, fontStyle: "italic", marginBottom: 4 },
  readingText: { color: C.text, fontSize: 14, lineHeight: 22 },
  noData: { padding: 24, alignItems: "center" },
  noDataText: { color: C.muted, fontSize: 14 },
  sectionTitle: { color: C.gold, fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  card: {
    backgroundColor: C.navyMid,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardIcon: { fontSize: 24, marginRight: 12 },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 14, fontWeight: "600" },
  cardSubtitle: { color: C.muted, fontSize: 11, marginTop: 2 },
  chevron: { color: C.gold, fontSize: 20, marginLeft: 6 },
});

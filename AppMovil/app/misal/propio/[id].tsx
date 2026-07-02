import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { useSQLiteContext } from "expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalPropioDetalle } from "@/db/db";
import type { MisalPropioEntry } from "@/types";

export default function PropioDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [entry, setEntry] = useState<MisalPropioEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getMisalPropioDetalle(db, Number(id)).then(setEntry).catch(console.error).finally(() => setLoading(false));
  }, [db, id]);

  if (loading) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ThemedText style={s.errorText}>Entrada no encontrada</ThemedText>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={entry.dia} superLabel={entry.temporada_label} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        <Section label="Antífona de entrada" text={entry.antifona_entrada} />
        <Section label="Oración colecta" text={entry.colecta} />
        <Section label="Oración sobre las ofrendas" text={entry.oracion_ofrendas} />
        <Section label="Prefacio" text={entry.prefacio} />
        <Section label="Antífona de la comunión" text={entry.antifona_comunion} />
        <Section label="Oración después de la comunión" text={entry.postcomunion} />
      </ScrollView>
    </View>
  );
}

function Section({ label, text }: { label: string; text: string | null | undefined }) {
  if (!text) return null;
  return (
    <View style={s.section}>
      <ThemedText style={s.label}>{label}</ThemedText>
      <ThemedText style={s.text}>{text}</ThemedText>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40 },
  errorText: { color: C.gold, fontSize: 16 },
  section: {
    backgroundColor: C.navyMid,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  label: {
    color: C.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  text: {
    color: C.text,
    fontSize: 14,
    lineHeight: 22,
  },
});

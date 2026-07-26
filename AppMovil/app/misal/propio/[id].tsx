import { C } from '@/constants/theme';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalPropioDetalle } from "@/db/db";
import { useDbQuery } from "@/hooks/use-db-query";

export default function PropioDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: entry, loading } = useDbQuery(
    (db) => getMisalPropioDetalle(db, Number(id)),
    [id],
  );

  if (loading) {
    return (
      <View style={[sharedStyles.container, sharedStyles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={[sharedStyles.container, sharedStyles.center, { paddingTop: insets.top }]}>
        <ThemedText style={s.errorText}>Entrada no encontrada</ThemedText>
      </View>
    );
  }

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={entry.dia ?? ''} superLabel={entry.temporada_label ?? ''} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={sharedStyles.content}>
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
  errorText: { color: C.gold, fontSize: 16 },
  section: {
    backgroundColor: C.navyMid,
    borderRadius: R.lg,
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

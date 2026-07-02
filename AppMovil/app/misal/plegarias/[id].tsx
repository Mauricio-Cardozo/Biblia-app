import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { useSQLiteContext } from "expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalPlegariaDetalle } from "@/db/db";
import type { MisalPlegaria } from "@/types";

export default function PlegariaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [plegaria, setPlegaria] = useState<MisalPlegaria | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getMisalPlegariaDetalle(db, Number(id)).then(setPlegaria).catch(console.error).finally(() => setLoading(false));
  }, [db, id]);

  if (loading) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  if (!plegaria) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ThemedText style={s.errorText}>Plegaria no encontrada</ThemedText>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={plegaria.nombre}
        superLabel="Plegaria Eucarística"
        showBack
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.block}>
          <ThemedText style={s.text}>{plegaria.texto}</ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40 },
  errorText: { color: C.gold, fontSize: 16 },
  block: {
    backgroundColor: C.navyMid,
    borderRadius: 12,
    padding: 16,
  },
  text: { color: C.text, fontSize: 14, lineHeight: 22 },
});

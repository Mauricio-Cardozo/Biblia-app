import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { useSQLiteContext } from "expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalOrdinarioDetalle } from "@/db/db";
import type { MisalOrdinarioBlock } from "@/types";

export default function OrdinarioDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [block, setBlock] = useState<MisalOrdinarioBlock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getMisalOrdinarioDetalle(db, Number(id)).then(setBlock).finally(() => setLoading(false));
  }, [db, id]);

  if (loading) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  if (!block) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ThemedText style={s.errorText}>Bloque no encontrado</ThemedText>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={block.subseccion}
        superLabel={`${block.seccion} · ${block.rol}`}
        showBack
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.block}>
          <ThemedText style={s.text}>{block.texto}</ThemedText>
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

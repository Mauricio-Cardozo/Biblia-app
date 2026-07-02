import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { useSQLiteContext } from "expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalPrefacioDetalle } from "@/db/db";
import type { MisalPrefacio } from "@/types";

export default function PrefacioDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [prefacio, setPrefacio] = useState<MisalPrefacio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getMisalPrefacioDetalle(db, Number(id)).then(setPrefacio).finally(() => setLoading(false));
  }, [db, id]);

  if (loading) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  if (!prefacio) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ThemedText style={s.errorText}>Prefacio no encontrado</ThemedText>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={prefacio.titulo}
        superLabel="Prefacio"
        showBack
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.block}>
          <ThemedText style={s.text}>{prefacio.texto}</ThemedText>
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

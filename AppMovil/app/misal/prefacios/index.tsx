import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalPrefacios } from "@/db/db";
import type { MisalPrefacio } from "@/types";

export default function PrefaciosScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [prefacios, setPrefacios] = useState<MisalPrefacio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMisalPrefacios(db).then(setPrefacios).finally(() => setLoading(false));
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
      <ScreenHeader title="Prefacios" subtitle={`${prefacios.length} prefacios`} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        {prefacios.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={s.card}
            onPress={() => router.push(`/misal/prefacios/${p.id}`)}
            activeOpacity={0.7}
          >
            <ThemedText style={s.title}>{p.titulo}</ThemedText>
            <ThemedText style={s.preview} numberOfLines={3}>{p.texto.slice(0, 120)}…</ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: C.navyMid,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  title: { color: C.gold, fontSize: 14, fontWeight: "600", marginBottom: 6 },
  preview: { color: C.text, fontSize: 13, lineHeight: 20 },
});

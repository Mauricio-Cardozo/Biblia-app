import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalPlegarias } from "@/db/db";
import type { MisalPlegaria } from "@/types";

export default function PlegariasScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [plegarias, setPlegarias] = useState<MisalPlegaria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMisalPlegarias(db).then(setPlegarias).finally(() => setLoading(false));
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
      <ScreenHeader title="Plegarias Eucarísticas" subtitle={`${plegarias.length} plegarias`} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        {plegarias.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={s.card}
            onPress={() => router.push(`/misal/plegarias/${p.id}`)}
            activeOpacity={0.7}
          >
            <ThemedText style={s.title}>{p.nombre}</ThemedText>
            <ThemedText style={s.preview} numberOfLines={4}>{p.texto.slice(0, 200)}…</ThemedText>
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
  title: { color: C.gold, fontSize: 15, fontWeight: "600", marginBottom: 6 },
  preview: { color: C.text, fontSize: 13, lineHeight: 20 },
});

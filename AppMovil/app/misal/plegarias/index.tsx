import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalPlegarias } from "@/db/db";
import { useDbQuery } from "@/hooks/use-db-query";

export default function PlegariasScreen() {
  const insets = useSafeAreaInsets();
  const { data: plegarias, loading } = useDbQuery<import("@/types").MisalPlegaria[]>(
    (db) => getMisalPlegarias(db),
  );

  if (loading) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  const list = plegarias ?? [];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Plegarias Eucarísticas" subtitle={`${list.length} plegarias`} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        {list.map((p) => (
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
  content: { padding: S.lg, paddingBottom: S.huge },
  card: {
    backgroundColor: C.navyMid,
    borderRadius: R.lg,
    padding: 14,
    marginBottom: S.sm,
  },
  title: { color: C.gold, fontSize: 15, fontWeight: "600", marginBottom: 6 },
  preview: { color: C.text, fontSize: 13, lineHeight: 20 },
});

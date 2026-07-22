import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalPrefacios } from "@/db/db";
import { useDbQuery } from "@/hooks/use-db-query";

export default function PrefaciosScreen() {
  const insets = useSafeAreaInsets();
  const { data: prefacios, loading } = useDbQuery<import("@/types").MisalPrefacio[]>(
    (db) => getMisalPrefacios(db),
  );

  if (loading) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  const list = prefacios ?? [];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Prefacios" subtitle={`${list.length} prefacios`} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        {list.map((p) => (
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
  content: { padding: S.lg, paddingBottom: S.huge },
  card: {
    backgroundColor: C.navyMid,
    borderRadius: R.lg,
    padding: 14,
    marginBottom: S.sm,
  },
  title: { color: C.gold, fontSize: 14, fontWeight: "600", marginBottom: 6 },
  preview: { color: C.text, fontSize: 13, lineHeight: 20 },
});

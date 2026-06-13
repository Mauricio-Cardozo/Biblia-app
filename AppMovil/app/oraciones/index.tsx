import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ORACIONES from "@/data/vatican-prayers";

export default function OracionesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ThemedText style={s.backArrow}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText style={s.title}>Oraciones</ThemedText>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <ThemedText style={s.intro}>Todas las oraciones</ThemedText>
        {ORACIONES.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={s.card}
            onPress={() => router.push(`/oraciones/${p.id}`)}
            activeOpacity={0.7}
          >
            <ThemedText style={s.cardTitle}>{p.titulo}</ThemedText>
            <ThemedText style={s.chevron}>›</ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    paddingVertical: Platform.OS === "android" ? 12 : 8,
    borderBottomWidth: 1, borderBottomColor: C.goldDim, backgroundColor: C.navyMid, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.navyLight,
    borderWidth: 1, borderColor: C.goldDim, alignItems: "center", justifyContent: "center",
  },
  backArrow: { color: C.gold, fontSize: 20, lineHeight: 22 },
  title: { color: C.text, fontSize: 18, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 48 },
  intro: { color: C.muted, fontSize: 14, marginBottom: 16 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.navyMid,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 8, borderWidth: 1, borderColor: C.sep,
  },
  cardTitle: { flex: 1, color: C.text, fontSize: 15, fontWeight: "600" },
  chevron: { color: C.gold, fontSize: 22, marginLeft: 8 },
});

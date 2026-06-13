import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { useFontSize, fs } from "@/contexts/font-size";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ORACIONES from "@/data/vatican-prayers";

export default function OracionDetalleScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { multiplier } = useFontSize();
  const prayer = ORACIONES.find((p) => p.id === id);

  if (!prayer) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ThemedText style={s.backArrow}>←</ThemedText>
          </TouchableOpacity>
          <ThemedText style={s.title}>Oración no encontrada</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ThemedText style={s.backArrow}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText style={s.title}>{prayer.titulo}</ThemedText>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <ThemedText style={[s.texto, { fontSize: fs(16, multiplier), lineHeight: fs(28, multiplier) }]}>
          {prayer.texto}
        </ThemedText>
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
  content: { padding: 20, paddingBottom: 48 },
  texto: { color: C.text, lineHeight: 28 },
});

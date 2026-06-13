import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Novena {
  id: number;
  titulo: string;
  dias_count: number;
}

export default function NovenaListScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const [novenas, setNovenas] = useState<Novena[]>([]);

  const load = useCallback(async () => {
    const rows = await db.getAllAsync<Novena>(
      "SELECT n.id, n.titulo, (SELECT COUNT(*) FROM novena_dias WHERE novena_id = n.id) AS dias_count FROM novenas n ORDER BY n.id",
    );
    setNovenas(rows);
  }, [db]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ThemedText style={s.backArrow}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText style={s.title}>Novenas</ThemedText>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <ThemedText style={s.intro}>Elegí una novena para comenzar</ThemedText>
        {novenas.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={s.card}
            onPress={() => router.push(`/oraciones/novena/${n.id}`)}
            activeOpacity={0.7}
          >
            <View style={s.cardTextWrap}>
              <ThemedText style={s.cardTitle}>{n.titulo}</ThemedText>
              <ThemedText style={s.cardSub}>{n.dias_count} días</ThemedText>
            </View>
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
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: "600" },
  cardSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  chevron: { color: C.gold, fontSize: 22, marginLeft: 8 },
});

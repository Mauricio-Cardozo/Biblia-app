import { C } from "@/constants/theme";
import { S } from '@/constants/spacing';
import { ThemedText } from "@/components/themed-text";
import { useFontSize, fs } from "@/contexts/font-size";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NovenaDia {
  id: number;
  dia: number;
  titulo: string;
  texto: string;
}

export default function NovenaDetalleScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { multiplier } = useFontSize();
  const [titulo, setTitulo] = useState("");
  const [dias, setDias] = useState<NovenaDia[]>([]);
  const [diaSel, setDiaSel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const nov = await db.getFirstAsync<{ titulo: string }>("SELECT titulo FROM novenas WHERE id = ?", [Number(id)]);
      if (nov) setTitulo(nov.titulo);
      const rows = await db.getAllAsync<NovenaDia>(
        "SELECT id, dia, titulo, texto FROM novena_dias WHERE novena_id = ? ORDER BY dia",
        [Number(id)],
      );
      setDias(rows);
      setLoading(false);
    })();
  }, [db, id]);

  const diaActual = dias.find((d) => d.dia === diaSel);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ThemedText style={s.backArrow}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText style={s.title} numberOfLines={1}>{titulo}</ThemedText>
      </View>

      <View style={s.diaRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.diaScroll}>
          {dias.map((d) => (
            <TouchableOpacity
              key={d.dia}
              style={[s.diaBtn, diaSel === d.dia && s.diaBtnActive]}
              onPress={() => setDiaSel(d.dia)}
              activeOpacity={0.7}
            >
              <ThemedText style={[s.diaBtnText, diaSel === d.dia && s.diaBtnTextActive]}>
                Día {d.dia}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {loading ? (
          <ThemedText style={s.loading}>Cargando…</ThemedText>
        ) : diaActual ? (
          <>
            <ThemedText style={s.diaTitulo}>{diaActual.titulo}</ThemedText>
            <ThemedText style={[s.texto, { fontSize: fs(16, multiplier), lineHeight: fs(28, multiplier) }]}>
              {diaActual.texto}
            </ThemedText>
          </>
        ) : (
          <ThemedText style={s.loading}>Día no encontrado</ThemedText>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: S.lg,
    paddingVertical: Platform.OS === "android" ? 12 : 8,
    borderBottomWidth: 1, borderBottomColor: C.goldDim, backgroundColor: C.navyMid, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.navyLight,
    borderWidth: 1, borderColor: C.goldDim, alignItems: "center", justifyContent: "center",
  },
  backArrow: { color: C.gold, fontSize: 20, lineHeight: 22 },
  title: { color: C.text, fontSize: 18, fontWeight: "700", flex: 1 },
  diaRow: {
    borderBottomWidth: 1, borderBottomColor: C.sep, backgroundColor: C.navyMid,
    paddingVertical: S.sm,
  },
  diaScroll: { paddingHorizontal: S.lg, gap: S.sm },
  diaBtn: {
    paddingHorizontal: 14, paddingVertical: S.sm, borderRadius: 20,
    backgroundColor: C.navyLight, borderWidth: 1, borderColor: C.sep,
  },
  diaBtnActive: { backgroundColor: C.gold, borderColor: C.gold },
  diaBtnText: { color: C.muted, fontSize: 13, fontWeight: "600" },
  diaBtnTextActive: { color: C.navy },
  content: { padding: S.xl, paddingBottom: S.massive },
  loading: { color: C.muted, fontSize: 15, textAlign: "center", marginTop: S.huge },
  diaTitulo: { color: C.gold, fontSize: 18, fontWeight: "700", marginBottom: S.lg },
  texto: { color: C.text, lineHeight: 28 },
});

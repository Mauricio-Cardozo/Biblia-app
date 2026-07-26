import { C } from "@/constants/theme";
import { R } from '@/constants/radius';
import { S } from '@/constants/spacing';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import { useFontSize, fs } from "@/contexts/font-size";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDbQuery } from "@/hooks/use-db-query";

interface NovenaDia {
  id: number;
  dia: number;
  titulo: string;
  texto: string;
}

interface NovenaData {
  titulo: string;
  dias: NovenaDia[];
}

function fetchNovena(db: import("expo-sqlite").SQLiteDatabase, id: string): Promise<NovenaData> {
  return db.getFirstAsync<{ titulo: string }>("SELECT titulo FROM novenas WHERE id = ?", [Number(id)]).then((nov) =>
    db.getAllAsync<NovenaDia>(
      "SELECT id, dia, titulo, texto FROM novena_dias WHERE novena_id = ? ORDER BY dia",
      [Number(id)],
    ).then((dias) => ({ titulo: nov?.titulo ?? "", dias })),
  );
}

export default function NovenaDetalleScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { multiplier } = useFontSize();
  const [diaSel, setDiaSel] = React.useState(1);

  const { data, loading } = useDbQuery(
    (db) => id ? fetchNovena(db, id) : Promise.resolve<NovenaData>({ titulo: "", dias: [] }),
    [id],
  );

  const titulo = data?.titulo ?? "";
  const dias = data?.dias ?? [];
  const diaActual = dias.find((d) => d.dia === diaSel);

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
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
    paddingHorizontal: 14, paddingVertical: S.sm, borderRadius: R.xxl,
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

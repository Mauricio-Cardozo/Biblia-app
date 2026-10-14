import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import ScreenHeader from "@/components/ui/screen-header";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDbQuery } from "@/hooks/use-db-query";

interface Novena {
  id: number;
  titulo: string;
  dias_count: number;
}

export default function NovenaListScreen() {
  const insets = useSafeAreaInsets();
  const { data: novenas } = useDbQuery<Novena[]>((db) =>
    db.getAllAsync<Novena>(
      "SELECT n.id, n.titulo, (SELECT COUNT(*) FROM novena_dias WHERE novena_id = n.id) AS dias_count FROM novenas n ORDER BY n.id",
    ),
  );

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Novenas" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        <ThemedText style={s.intro}>Elegí una novena para comenzar</ThemedText>
        {(novenas ?? []).map((n) => (
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
  content: { padding: S.lg, paddingBottom: S.massive },
  intro: { color: C.muted, fontSize: 14, marginBottom: S.lg },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.navyMid,
    borderRadius: R.lg, paddingVertical: 14, paddingHorizontal: S.lg,
    marginBottom: S.sm, borderWidth: 1, borderColor: C.sep,
  },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: "600" },
  cardSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  chevron: { color: C.gold, fontSize: 22, marginLeft: S.sm },
});

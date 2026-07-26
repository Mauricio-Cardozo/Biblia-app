import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalSantos } from "@/db/db";
import { useDbQuery } from "@/hooks/use-db-query";
import type { MisalSantosEntry } from "@/types";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function SantosScreen() {
  const insets = useSafeAreaInsets();
  const { data: santos, loading } = useDbQuery((db) => getMisalSantos(db));
  const list = santos ?? [];

  if (loading) return (
    <View style={[sharedStyles.container, sharedStyles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={C.gold} />
    </View>
  );

  const grouped: { mes: number; dia: number; items: MisalSantosEntry[] }[] = [];
  for (const s of list) {
    const key = `${s.mes}-${s.dia}`;
    let g = grouped.find(g => `${g.mes}-${g.dia}` === key);
    if (!g) { g = { mes: s.mes, dia: s.dia, items: [] }; grouped.push(g); }
    g.items.push(s);
  }

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Santoral" subtitle={`${list.length} entradas`} showBack onBack={() => router.back()} />
      <FlashList
        data={grouped}
        keyExtractor={(item) => `${item.mes}-${item.dia}`}
        contentContainerStyle={sharedStyles.content}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={80}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => router.push(`/misal/santos/${item.mes}/${item.dia}`)}
            activeOpacity={0.7}
          >
            <ThemedText style={s.title}>
              {item.dia} de {MESES[item.mes - 1]}
            </ThemedText>
            <ThemedText style={s.subtitle}>
              {item.items.map(i => i.nombre).join(', ')}
            </ThemedText>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.navyMid, borderRadius: R.lg, padding: S.lg, marginBottom: S.sm },
  title: { color: C.gold, fontSize: 15, fontWeight: "600" },
  subtitle: { color: C.text, fontSize: 13, marginTop: S.xs },
});

import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { ThemedText } from "@/components/themed-text";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalOrdinarioDetalle } from "@/db/db";
import { useDbQuery } from "@/hooks/use-db-query";

export default function OrdinarioDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: block, loading } = useDbQuery(
    (db) => getMisalOrdinarioDetalle(db, Number(id)),
    [id],
  );

  if (loading) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  if (!block) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <ThemedText style={s.errorText}>Bloque no encontrado</ThemedText>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={block.subseccion}
        superLabel={`${block.seccion} · ${block.rol}`}
        showBack
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.block}>
          <ThemedText style={s.text}>{block.texto}</ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: S.lg, paddingBottom: S.huge },
  errorText: { color: C.gold, fontSize: 16 },
  block: {
    backgroundColor: C.navyMid,
    borderRadius: R.lg,
    padding: S.lg,
  },
  text: { color: C.text, fontSize: 14, lineHeight: 22 },
});

import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalGuiaPorSeccion } from "@/db/db";
import { useDbQuery } from "@/hooks/use-db-query";

export default function GuiaSeccionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: entries, loading } = useDbQuery(
    (db) => getMisalGuiaPorSeccion(db, id!),
    [id],
  );

  if (loading) return (
    <View style={[sharedStyles.container, sharedStyles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={C.gold} />
    </View>
  );

  const list = entries ?? [];

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={id ?? ""} subtitle={`${list.length} elementos`} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={sharedStyles.content}>
        {list.map((e) => (
          <View key={e.id} style={s.block}>
            <ThemedText style={s.title}>{e.titulo}</ThemedText>
            <ThemedText style={s.text}>{e.texto}</ThemedText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  block: { backgroundColor: C.navyMid, borderRadius: R.lg, padding: S.lg, marginBottom: S.md },
  title: { color: C.gold, fontSize: 15, fontWeight: "600", marginBottom: S.sm },
  text: { color: C.text, fontSize: 14, lineHeight: 22 },
});

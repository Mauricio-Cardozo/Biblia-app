import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalGuiaSecciones } from "@/db/db";
import { useDbQuery } from "@/hooks/use-db-query";

export default function GuiaScreen() {
  const insets = useSafeAreaInsets();
  const { data: secciones, loading } = useDbQuery((db) => getMisalGuiaSecciones(db));

  if (loading) return (
    <View style={[sharedStyles.container, sharedStyles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={C.gold} />
    </View>
  );

  const list = secciones ?? [];

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Guía de la Misa" subtitle={`${list.length} secciones`} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={sharedStyles.content}>
        {list.map((sec) => (
          <TouchableOpacity
            key={sec.seccion}
            style={s.card}
            onPress={() => router.push(`/misal/guia/${encodeURIComponent(sec.seccion)}`)}
            activeOpacity={0.7}
          >
            <ThemedText style={s.title}>{sec.seccion}</ThemedText>
            <ThemedText style={s.subtitle}>{sec.count} elementos</ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.navyMid, borderRadius: R.lg, padding: S.lg, marginBottom: S.sm },
  title: { color: C.gold, fontSize: 15, fontWeight: "600" },
  subtitle: { color: C.muted, fontSize: 12, marginTop: S.xs },
});

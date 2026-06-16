import { C } from "@/constants/theme";
import ScreenHeader from "@/components/ui/screen-header";
import ListItemCard from "@/components/ui/list-item-card";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ORACIONES from "@/data/vatican-prayers";

export default function OracionesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Oraciones" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        {ORACIONES.map((p) => (
          <ListItemCard
            key={p.id}
            title={p.titulo}
            onPress={() => router.push(`/oraciones/${p.id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  content: { padding: 16, paddingBottom: 48 },
});

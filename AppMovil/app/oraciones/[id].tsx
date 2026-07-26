import { C } from "@/constants/theme";
import { S } from '@/constants/spacing';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import ScreenHeader from "@/components/ui/screen-header";
import { useFontSize, fs } from "@/contexts/font-size";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ORACIONES from "@/data/vatican-prayers";

export default function OracionDetalleScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { multiplier } = useFontSize();
  const prayer = ORACIONES.find((p) => p.id === id);

  if (!prayer) {
    return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Oración no encontrada" showBack onBack={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={prayer.titulo} showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        <ThemedText style={[s.texto, { fontSize: fs(16, multiplier), lineHeight: fs(28, multiplier) }]}>
          {prayer.texto}
        </ThemedText>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: S.lg, paddingBottom: S.massive },
  texto: { color: C.text, lineHeight: 28 },
});

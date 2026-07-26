import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { SECCIONES_MISAL } from '@/constants/misal-sections';
import { sharedStyles } from '@/constants/shared-styles';
import SectionCard from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MisalScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[sharedStyles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <ThemedText style={styles.brand}>✝ IGLESIA DIGITAL</ThemedText>
        <ThemedText style={styles.title}>Misal Romano</ThemedText>
      </View>

      {SECCIONES_MISAL.map((seccion) => (
        <SectionCard
          key={seccion.id}
          icono={seccion.icono}
          titulo={seccion.titulo}
          subtitulo={seccion.subtitulo}
          onPress={() => router.push(seccion.ruta as any)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  header: { paddingHorizontal: S.xl, marginBottom: S.xxl },
  brand: { color: C.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  title: { color: C.text, fontSize: 28, fontWeight: '700' },
});

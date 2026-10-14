import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { sharedStyles } from '@/constants/shared-styles';
import { tabBarScrollY } from '@/utils/scroll-state';
import SectionCard from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const handleScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
  tabBarScrollY.setValue(e.nativeEvent.contentOffset.y);
};

const ORACIONES_SECCIONES = [
  { id: 'rosario', titulo: 'Santo Rosario', subtitulo: 'Guía completa con misterios del día', icono: '📿', ruta: '/rosario/guia' },
  { id: 'coronilla', titulo: 'Coronilla', subtitulo: 'Divina Misericordia', icono: '🌿', ruta: '/rosario/coronilla' },
  { id: 'favoritos', titulo: 'Favoritos', subtitulo: 'Versículos, numerales y lecturas guardadas', icono: '❤️', ruta: '/favoritos' },
  { id: 'oraciones', titulo: 'Oraciones', subtitulo: 'Del Vaticano: Padre nuestro, Ave María, Credo y más', icono: '📖', ruta: '/oraciones' },
  { id: 'jaculatorias', titulo: 'Jaculatorias', subtitulo: 'Oraciones breves para el día', icono: '🔥', ruta: '/oraciones/jaculatorias' },
  { id: 'novenas', titulo: 'Novenas', subtitulo: '18 devociones de 9 días', icono: '🕯️', ruta: '/oraciones/novena' },
];

export default function OracionScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView onScroll={handleScroll} scrollEventThrottle={16} style={[sharedStyles.container, { paddingTop: insets.top + 16 }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText style={styles.brand}>✝ IGLESIA DIGITAL</ThemedText>
        <ThemedText style={styles.title}>Oración</ThemedText>
      </View>

      {ORACIONES_SECCIONES.map((s) => (
        <SectionCard
          key={s.id}
          icono={s.icono}
          titulo={s.titulo}
          subtitulo={s.subtitulo}
          onPress={() => router.push(s.ruta as any)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 100 },
  header: { paddingHorizontal: S.xl, marginBottom: S.xxl },
  brand: { color: C.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: S.xs },
  title: { color: C.text, fontSize: 28, fontWeight: '700' },
});

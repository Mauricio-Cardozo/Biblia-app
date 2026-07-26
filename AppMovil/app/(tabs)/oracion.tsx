import { C } from '@/constants/theme';
import { R } from '@/constants/radius';
import { S } from '@/constants/spacing';
import { sharedStyles } from '@/constants/shared-styles';
import { tabBarScrollY } from '@/utils/scroll-state';
import SectionCard from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SECCIONES_MISAL } from '@/constants/misal-sections';

const handleScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
  tabBarScrollY.setValue(e.nativeEvent.contentOffset.y);
};

type Pill = 'oraciones' | 'misal';

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
  const [pill, setPill] = useState<Pill>('oraciones');

  return (
    <ScrollView onScroll={handleScroll} scrollEventThrottle={16} style={[sharedStyles.container, { paddingTop: insets.top + 16 }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText style={styles.brand}>✝ IGLESIA DIGITAL</ThemedText>
        <ThemedText style={styles.title}>Oración</ThemedText>
      </View>

      <View style={styles.pillRow}>
        {(['oraciones', 'misal'] as Pill[]).map((p) => {
          const active = pill === p;
          const label = p === 'oraciones' ? 'Oraciones' : 'Misal';
          return (
            <TouchableOpacity key={p} style={[styles.pill, active && styles.pillActive]} onPress={() => setPill(p)} activeOpacity={0.7}>
              <ThemedText style={[styles.pillText, active && styles.pillTextActive]}>{label}</ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      {(pill === 'oraciones' ? ORACIONES_SECCIONES : SECCIONES_MISAL).map((s) => (
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
  pillRow: { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.xl, marginBottom: S.xl },
  pill: { flex: 1, paddingVertical: 10, borderRadius: R.xxl, borderWidth: 1, borderColor: C.goldDim, alignItems: 'center' },
  pillActive: { backgroundColor: C.gold, borderColor: C.gold },
  pillText: { color: C.gold, fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: C.navy },
});

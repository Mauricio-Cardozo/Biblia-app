import { C } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { getCICPartes } from '@/db/db';
import type { CICParte } from '@/types';

type Pill = 'oraciones' | 'catecismo' | 'misal';

const ORACIONES_SECCIONES = [
  { id: 'rosario', titulo: 'Santo Rosario', subtitulo: 'Guía completa con misterios del día', icono: '📿', ruta: '/rosario/guia' },
  { id: 'coronilla', titulo: 'Coronilla', subtitulo: 'Divina Misericordia', icono: '🌿', ruta: '/rosario/coronilla' },
  { id: 'favoritos', titulo: 'Favoritos', subtitulo: 'Versículos, numerales y lecturas guardadas', icono: '❤️', ruta: '/favoritos' },
  { id: 'oraciones', titulo: 'Oraciones', subtitulo: 'Del Vaticano: Padre nuestro, Ave María, Credo y más', icono: '📖', ruta: '/oraciones' },
  { id: 'jaculatorias', titulo: 'Jaculatorias', subtitulo: 'Oraciones breves para el día', icono: '🔥', ruta: '/oraciones/jaculatorias' },
  { id: 'novenas', titulo: 'Novenas', subtitulo: '18 devociones de 9 días', icono: '🕯️', ruta: '/oraciones/novena' },
];

const MISAL_SECCIONES = [
  { id: 'hoy', titulo: 'Misa de Hoy', subtitulo: 'Oraciones y lecturas del día', icono: '🕊️', ruta: '/misal/hoy' },
  { id: 'propio', titulo: 'Propio del Tiempo', subtitulo: 'Adviento, Navidad, Cuaresma, Pascua, Ordinario', icono: '📅', ruta: '/misal/propio' },
  { id: 'ordinario', titulo: 'Ordinario de la Misa', subtitulo: 'Ritos, oraciones y plegarias', icono: '📖', ruta: '/misal/ordinario' },
  { id: 'prefacios', titulo: 'Prefacios', subtitulo: '67 prefacios para cada tiempo litúrgico', icono: '✋', ruta: '/misal/prefacios' },
  { id: 'plegarias', titulo: 'Plegarias Eucarísticas', subtitulo: 'I, II, III y IV', icono: '🍞', ruta: '/misal/plegarias' },
];

export default function OracionScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const [pill, setPill] = useState<Pill>('oraciones');
  const [partes, setPartes] = useState<CICParte[]>([]);

  useEffect(() => {
    if (pill === 'catecismo') {
      getCICPartes(db).then(setPartes).catch(() => {});
    }
  }, [pill, db]);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 16 }]} contentContainerStyle={styles.content}>
      <ThemedText style={styles.brand}>✝ IGLESIA DIGITAL</ThemedText>
      <ThemedText style={styles.title}>Oración</ThemedText>

      <View style={styles.pillRow}>
        {(['oraciones', 'catecismo', 'misal'] as Pill[]).map((p) => {
          const active = pill === p;
          const label = p === 'oraciones' ? 'Oraciones' : p === 'catecismo' ? 'Catecismo' : 'Misal';
          return (
            <TouchableOpacity key={p} style={[styles.pill, active && styles.pillActive]} onPress={() => setPill(p)} activeOpacity={0.7}>
              <ThemedText style={[styles.pillText, active && styles.pillTextActive]}>{label}</ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      {pill === 'oraciones' && ORACIONES_SECCIONES.map((s) => (
        <TouchableOpacity key={s.id} style={styles.card} onPress={() => router.push(s.ruta)} activeOpacity={0.7}>
          <View style={styles.cardRow}>
            <ThemedText style={styles.cardIcon}>{s.icono}</ThemedText>
            <View style={styles.cardTextWrap}>
              <ThemedText style={styles.cardTitle}>{s.titulo}</ThemedText>
              <ThemedText style={styles.cardSubtitle}>{s.subtitulo}</ThemedText>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </View>
        </TouchableOpacity>
      ))}

      {pill === 'catecismo' && (
        <View>
          <ThemedText style={styles.subHeader}>Partes del Catecismo</ThemedText>
          {partes.map((p, i) => (
            <TouchableOpacity key={p.parte} style={styles.card} onPress={() => router.push('/catecismo')} activeOpacity={0.7}>
              <View style={styles.cardRow}>
                <View style={styles.indexBadge}><ThemedText style={styles.indexBadgeText}>{i + 1}</ThemedText></View>
                <View style={styles.cardTextWrap}>
                  <ThemedText style={styles.cardTitle}>{p.parte}</ThemedText>
                </View>
                <ThemedText style={styles.chevron}>›</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {pill === 'misal' && MISAL_SECCIONES.map((s) => (
        <TouchableOpacity key={s.id} style={styles.card} onPress={() => router.push(s.ruta)} activeOpacity={0.7}>
          <View style={styles.cardRow}>
            <ThemedText style={styles.cardIcon}>{s.icono}</ThemedText>
            <View style={styles.cardTextWrap}>
              <ThemedText style={styles.cardTitle}>{s.titulo}</ThemedText>
              <ThemedText style={styles.cardSubtitle}>{s.subtitulo}</ThemedText>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  content: { paddingBottom: 100 },
  brand: { color: C.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 4, marginHorizontal: 20 },
  title: { color: C.text, fontSize: 28, fontWeight: '700', marginBottom: 24, marginHorizontal: 20 },
  pillRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  pill: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: C.goldDim, alignItems: 'center' },
  pillActive: { backgroundColor: C.gold, borderColor: C.gold },
  pillText: { color: C.gold, fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: C.navy },
  subHeader: { color: C.muted, fontSize: 12, marginBottom: 8, marginHorizontal: 20 },
  card: { marginHorizontal: 20, marginBottom: 12, padding: 18, borderRadius: 15, backgroundColor: C.navyMid },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 32, marginRight: 16 },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: C.muted, fontSize: 13, marginTop: 2 },
  chevron: { color: C.gold, fontSize: 24, marginLeft: 8 },
  indexBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.goldDim, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  indexBadgeText: { color: C.goldLight, fontSize: 14, fontWeight: '800' },
});

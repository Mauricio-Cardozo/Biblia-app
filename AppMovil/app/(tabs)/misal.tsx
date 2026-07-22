import { C } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface Seccion {
  id: string;
  titulo: string;
  subtitulo: string;
  icono: string;
  ruta: string;
}

export const SECCIONES_MISAL: Seccion[] = [
  {
    id: 'hoy',
    titulo: 'Misa de Hoy',
    subtitulo: 'Oraciones y lecturas del día',
    icono: '🕊️',
    ruta: '/misal/hoy',
  },
  {
    id: 'propio',
    titulo: 'Propio del Tiempo',
    subtitulo: 'Adviento, Navidad, Cuaresma, Pascua, Ordinario',
    icono: '📅',
    ruta: '/misal/propio',
  },
  {
    id: 'ordinario',
    titulo: 'Ordinario de la Misa',
    subtitulo: 'Ritos, oraciones y plegarias de la misa',
    icono: '📖',
    ruta: '/misal/ordinario',
  },
  {
    id: 'prefacios',
    titulo: 'Prefacios',
    subtitulo: '67 prefacios para cada tiempo litúrgico',
    icono: '✋',
    ruta: '/misal/prefacios',
  },
  {
    id: 'plegarias',
    titulo: 'Plegarias Eucarísticas',
    subtitulo: 'I, II, III y IV',
    icono: '🍞',
    ruta: '/misal/plegarias',
  },
];

export default function MisalScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
    >
      <ThemedText style={styles.brand}>✝ IGLESIA DIGITAL</ThemedText>
      <ThemedText style={styles.title}>Misal Romano</ThemedText>

      {SECCIONES_MISAL.map((seccion) => (
        <TouchableOpacity
          key={seccion.id}
          style={styles.card}
          onPress={() => router.push(seccion.ruta)}
          activeOpacity={0.7}
        >
          <View style={styles.cardRow}>
            <ThemedText style={styles.cardIcon}>{seccion.icono}</ThemedText>
            <View style={styles.cardTextWrap}>
              <ThemedText style={styles.cardTitle}>{seccion.titulo}</ThemedText>
              <ThemedText style={styles.cardSubtitle}>{seccion.subtitulo}</ThemedText>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.navy,
  },
  content: {
    paddingBottom: 40,
  },
  brand: {
    color: C.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
    marginHorizontal: 20,
  },
  title: {
    color: C.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    marginHorizontal: 20,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    borderRadius: 15,
    backgroundColor: C.navyMid,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: C.muted,
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    color: C.gold,
    fontSize: 24,
    marginLeft: 8,
  },
});

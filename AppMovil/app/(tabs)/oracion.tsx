import { C } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isEnabled, setEnabled } from '@/data/notifications';

interface Seccion {
  id: string;
  titulo: string;
  subtitulo: string;
  icono: string;
  ruta: string | null;
  color: string;
}

const SECCIONES: Seccion[] = [
  {
    id: 'rosario',
    titulo: 'Santo Rosario',
    subtitulo: 'Guía completa con misterios del día',
    icono: '📿',
    ruta: '/rosario/guia',
    color: C.navyMid,
  },
  {
    id: 'coronilla',
    titulo: 'Coronilla',
    subtitulo: 'Divina Misericordia',
    icono: '🌿',
    ruta: '/rosario/coronilla',
    color: C.navyMid,
  },
  {
    id: 'favoritos',
    titulo: 'Favoritos',
    subtitulo: 'Versículos, numerales y lecturas guardadas',
    icono: '❤️',
    ruta: '/favoritos',
    color: C.navyMid,
  },
  {
    id: 'oraciones',
    titulo: 'Oraciones',
    subtitulo: 'Del Vaticano: Padre nuestro, Ave María, Credo y más',
    icono: '📖',
    ruta: '/oraciones',
    color: C.navyMid,
  },
  {
    id: 'jaculatorias',
    titulo: 'Jaculatorias',
    subtitulo: 'Oraciones breves para el día',
    icono: '🔥',
    ruta: '/oraciones/jaculatorias',
    color: C.navyMid,
  },
  {
    id: 'angelus',
    titulo: 'Ángelus',
    subtitulo: 'Oración del Ángelus',
    icono: '🔔',
    ruta: '/oraciones/angelus',
    color: C.navyMid,
  },
  {
    id: 'novenas',
    titulo: 'Novenas',
    subtitulo: '18 devociones de 9 días',
    icono: '🕯️',
    ruta: '/oraciones/novena',
    color: C.navyMid,
  },
];

export default function OracionScreen() {
  const insets = useSafeAreaInsets();
  const [notifOn, setNotifOn] = useState(false);

  useEffect(() => {
    isEnabled().then(setNotifOn);
  }, []);

  const toggleNotif = async (v: boolean) => {
    setNotifOn(v);
    await setEnabled(v);
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
    >
      <ThemedText style={styles.brand}>✝ IGLESIA DIGITAL</ThemedText>
      <ThemedText style={styles.title}>Oración</ThemedText>

      {SECCIONES.map((seccion) => {
        const isEnabled = seccion.ruta !== null;

        return (
          <TouchableOpacity
            key={seccion.id}
            style={[
              styles.card,
              { backgroundColor: seccion.color },
              !isEnabled && styles.cardDisabled,
            ]}
            onPress={() => isEnabled && router.push(seccion.ruta!)}
            activeOpacity={isEnabled ? 0.7 : 1}
            disabled={!isEnabled}
          >
            <View style={styles.cardRow}>
              <ThemedText style={styles.cardIcon}>{seccion.icono}</ThemedText>
              <View style={styles.cardTextWrap}>
                <ThemedText style={styles.cardTitle}>{seccion.titulo}</ThemedText>
                <ThemedText style={styles.cardSubtitle}>{seccion.subtitulo}</ThemedText>
              </View>
              {isEnabled ? (
                <ThemedText style={styles.chevron}>›</ThemedText>
              ) : (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>Próximamente</ThemedText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.notifRow}>
        <View style={styles.notifTextWrap}>
          <ThemedText style={styles.notifTitle}>Recordatorio diario</ThemedText>
          <ThemedText style={styles.notifSub}>Todos los días a las 20:00</ThemedText>
        </View>
        <Switch
          value={notifOn}
          onValueChange={toggleNotif}
          trackColor={{ false: C.navyLight, true: C.goldDim }}
          thumbColor={notifOn ? C.gold : C.muted}
        />
      </View>
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
  },
  cardDisabled: {
    opacity: 0.5,
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
  badge: {
    backgroundColor: C.gold,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: C.navy,
    fontSize: 10,
    fontWeight: '700',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 18,
    borderRadius: 15,
    backgroundColor: C.navyLight,
  },
  notifTextWrap: {
    flex: 1,
  },
  notifTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '600',
  },
  notifSub: {
    color: C.muted,
    fontSize: 13,
    marginTop: 2,
  },
});

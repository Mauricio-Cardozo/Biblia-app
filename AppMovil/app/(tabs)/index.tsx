import { C } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Link, router } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calcularRacha, obtenerStats } from '@/data/streaks';
import { useSQLiteContext } from 'expo-sqlite';
import { getLecturaDelDia } from '@/db/db';
import { fechaActualLarga, hoy } from '@/utils/date';
import { SEASON_EMOJI, detectSeason } from '@/utils/seasons';
import type { Lectura } from '@/types';

export default function LiturgiaScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

  const [rachaRosario, setRachaRosario] = useState(0);
  const [rachaCoronilla, setRachaCoronilla] = useState(0);
  const [stats, setStats] = useState({ rosario_total: 0, coronilla_total: 0 });
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [temporadas, setTemporadas] = useState<{ temporada: string; temporada_label: string; count: number }[]>([]);

  useEffect(() => {
    Promise.all([
      calcularRacha("racha_rosario_ultima"),
      calcularRacha("racha_coronilla_ultima"),
      obtenerStats(),
      getLecturaDelDia(db, hoy()),
      import('@/db/db').then((m) => m.getMisalTemporadas(db)),
    ]).then(([rr, rc, st, lec, temps]) => {
      setRachaRosario(rr);
      setRachaCoronilla(rc);
      setStats({ rosario_total: st.rosario_total, coronilla_total: st.coronilla_total });
      setLectura(lec);
      setTemporadas(temps);
    });
  }, []);

  const misaTitle = lectura?.titulo_misa;
  const season = misaTitle ? detectSeason(misaTitle) : null;
  const seasonData = season ? temporadas.find((t) => t.temporada === season) : null;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {__DEV__ && (
        <Link href="/test" style={styles.debugLink} asChild>
          <TouchableOpacity activeOpacity={0.7}>
            <ThemedText style={styles.debugText}>[Debug] Test Database</ThemedText>
          </TouchableOpacity>
        </Link>
      )}
      <ThemedText style={styles.brand}>✝ IGLESIA DIGITAL</ThemedText>
      <ThemedText style={styles.pageTitle}>Liturgia</ThemedText>
      <ThemedText style={styles.dateText}>{fechaActualLarga()}</ThemedText>
      {misaTitle ? <ThemedText style={styles.misaTitle}>{misaTitle}</ThemedText> : null}

      {/* Evangelio del Día */}
      <TouchableOpacity onPress={() => router.push('/evangelio')} style={styles.card}>
        <ThemedText style={styles.cardLabel}>EVANGELIO DEL DÍA</ThemedText>
        {lectura?.evangelio ? (
          <>
            <ThemedText style={styles.verseText} numberOfLines={3}>
              {'\u201C'}{lectura.evangelio}{'\u201D'}
            </ThemedText>
            {lectura.evangelio_ref ? (
              <ThemedText style={styles.verseRef}>{lectura.evangelio_ref}</ThemedText>
            ) : null}
          </>
        ) : (
          <ThemedText style={styles.verseText}>
            {'\u201C'}Yo soy el camino, la verdad y la vida.{'\u201D'}
          </ThemedText>
        )}
      </TouchableOpacity>

      {/* Oración — Rachas */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => router.push('/rosario/guia')} style={[styles.cardSm, { flex: 0.48 }]}>
          <ThemedText style={styles.cardLabel}>ROSARIO</ThemedText>
          <ThemedText style={styles.streakText}>🕊️ {stats.rosario_total}</ThemedText>
          {rachaRosario > 0 && <ThemedText style={styles.streakSub}>🔥 {rachaRosario} días seguidos</ThemedText>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/rosario/coronilla')} style={[styles.cardSm, { flex: 0.48 }]}>
          <ThemedText style={styles.cardLabel}>CORONILLA</ThemedText>
          <ThemedText style={styles.streakText}>🕊️ {stats.coronilla_total}</ThemedText>
          {rachaCoronilla > 0 && <ThemedText style={styles.streakSub}>🔥 {rachaCoronilla} días seguidos</ThemedText>}
        </TouchableOpacity>
      </View>

      {/* Propio del Tiempo — temporada actual */}
      {seasonData ? (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/misal/propio')}
          activeOpacity={0.7}
        >
          <View style={styles.cardRow}>
            <ThemedText style={styles.cardIcon}>{SEASON_EMOJI[seasonData.temporada] ?? '🌿'}</ThemedText>
            <View style={styles.cardTextWrap}>
              <ThemedText style={styles.cardLabel}>PROPIO DEL TIEMPO</ThemedText>
              <ThemedText style={styles.cardTitle}>{seasonData.temporada_label}</ThemedText>
              <ThemedText style={styles.cardSubtitle}>{seasonData.count} días</ThemedText>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </View>
        </TouchableOpacity>
      ) : temporadas.length > 0 ? (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/misal/propio')}
          activeOpacity={0.7}
        >
          <View style={styles.cardRow}>
            <ThemedText style={styles.cardIcon}>📅</ThemedText>
            <View style={styles.cardTextWrap}>
              <ThemedText style={styles.cardLabel}>PROPIO DEL TIEMPO</ThemedText>
              <ThemedText style={styles.cardTitle}>{temporadas.length} temporadas litúrgicas</ThemedText>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </View>
        </TouchableOpacity>
      ) : null}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  debugLink: { backgroundColor: '#8B0000', marginBottom: 10, borderRadius: 8, marginHorizontal: 20, padding: 10, alignItems: 'center' },
  debugText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  brand: { color: C.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 4, marginHorizontal: 20 },
  pageTitle: { color: C.text, fontSize: 28, fontWeight: '700', marginBottom: 4, marginHorizontal: 20 },
  dateText: { color: C.gold, fontSize: 18, marginBottom: 4, marginHorizontal: 20 },
  misaTitle: { color: C.goldLight, fontSize: 13, fontStyle: 'italic', marginBottom: 20, marginHorizontal: 20 },
  card: { backgroundColor: C.navyMid, padding: 20, borderRadius: 12, marginBottom: 15, marginHorizontal: 20 },
  cardSm: { padding: 18, borderRadius: 12, backgroundColor: C.navyMid, marginBottom: 15, marginHorizontal: 20 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 28, marginRight: 14 },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: C.muted, fontSize: 12, marginTop: 2 },
  chevron: { color: C.gold, fontSize: 24, marginLeft: 6 },
  cardLabel: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  verseText: { color: C.text, fontSize: 18, fontStyle: 'italic' },
  verseRef: { color: C.muted, marginTop: 10, textAlign: 'right' },
  streakText: { color: C.text, fontSize: 22, fontWeight: 'bold' },
  streakSub: { color: C.muted, fontSize: 11, marginTop: 2 },
});

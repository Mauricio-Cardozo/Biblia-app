import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { ThemedText } from '@/components/themed-text';
import { Link, router } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calcularRacha, obtenerStats } from '@/data/streaks';
import { useSQLiteContext } from 'expo-sqlite';
import { getLecturaDelDia, getMisalTemporadas, getMisalPropioPorSemana } from '@/db/db';
import { fechaActualLarga, hoy } from '@/utils/date';
import { detectSeason, parseWeekNumber, isSunday, SEASON_EMOJI } from '@/utils/seasons';
import type { Lectura, MisalPropioEntry } from '@/types';

export default function LiturgiaScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

  const [rachaRosario, setRachaRosario] = useState(0);
  const [rachaCoronilla, setRachaCoronilla] = useState(0);
  const [stats, setStats] = useState({ rosario_total: 0, coronilla_total: 0 });
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [temporadas, setTemporadas] = useState<{ temporada: string; temporada_label: string; count: number }[]>([]);
  const [propio, setPropio] = useState<MisalPropioEntry | null>(null);

  useEffect(() => {
    Promise.all([
      calcularRacha("racha_rosario_ultima"),
      calcularRacha("racha_coronilla_ultima"),
      obtenerStats(),
      getLecturaDelDia(db, hoy()),
      getMisalTemporadas(db),
    ]).then(([rr, rc, st, lec, temps]) => {
      setRachaRosario(rr);
      setRachaCoronilla(rc);
      setStats({ rosario_total: st.rosario_total, coronilla_total: st.coronilla_total });
      setLectura(lec);
      setTemporadas(temps);
      if (lec?.titulo_misa) {
        const season = detectSeason(lec.titulo_misa);
        if (season) {
          const week = parseWeekNumber(lec.titulo_misa);
          const sun = isSunday(lec.titulo_misa);
          getMisalPropioPorSemana(db, season, week, sun).then(setPropio).catch(() => {});
        }
      }
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
      <View style={styles.streakRow}>
        <TouchableOpacity onPress={() => router.push('/rosario/guia')} style={[styles.cardSm, { flex: 0.48, marginHorizontal: 0 }]}>
          <ThemedText style={styles.cardLabel}>ROSARIO</ThemedText>
          <ThemedText style={styles.streakText}>🕊️ {stats.rosario_total}</ThemedText>
          {rachaRosario > 0 && <ThemedText style={styles.streakSub}>🔥 {rachaRosario} días seguidos</ThemedText>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/rosario/coronilla')} style={[styles.cardSm, { flex: 0.48, marginHorizontal: 0 }]}>
          <ThemedText style={styles.cardLabel}>CORONILLA</ThemedText>
          <ThemedText style={styles.streakText}>🕊️ {stats.coronilla_total}</ThemedText>
          {rachaCoronilla > 0 && <ThemedText style={styles.streakSub}>🔥 {rachaCoronilla} días seguidos</ThemedText>}
        </TouchableOpacity>
      </View>

      {/* Propio del Tiempo */}
      {propio ? (
        <View style={styles.propioSection}>
          <ThemedText style={styles.sectionLabel}>PROPIO DEL TIEMPO</ThemedText>
          <ThemedText style={styles.propioDia}>{seasonData?.temporada_label ?? ''} — {propio.dia}</ThemedText>

          {propio.antifona_entrada ? (
            <View style={styles.propioCard}>
              <ThemedText style={styles.propioLabel}>Antífona de entrada</ThemedText>
              <ThemedText style={styles.propioText}>{propio.antifona_entrada}</ThemedText>
            </View>
          ) : null}

          {propio.colecta ? (
            <View style={styles.propioCard}>
              <ThemedText style={styles.propioLabel}>Oración colecta</ThemedText>
              <ThemedText style={styles.propioText}>{propio.colecta}</ThemedText>
            </View>
          ) : null}

          {propio.oracion_ofrendas ? (
            <View style={styles.propioCard}>
              <ThemedText style={styles.propioLabel}>Oración sobre las ofrendas</ThemedText>
              <ThemedText style={styles.propioText}>{propio.oracion_ofrendas}</ThemedText>
            </View>
          ) : null}

          {propio.postcomunion ? (
            <View style={styles.propioCard}>
              <ThemedText style={styles.propioLabel}>Postcomunión</ThemedText>
              <ThemedText style={styles.propioText}>{propio.postcomunion}</ThemedText>
            </View>
          ) : null}

          {propio.antifona_comunion ? (
            <View style={styles.propioCard}>
              <ThemedText style={styles.propioLabel}>Antífona de comunión</ThemedText>
              <ThemedText style={styles.propioText}>{propio.antifona_comunion}</ThemedText>
            </View>
          ) : null}
        </View>
      ) : seasonData ? (
        <TouchableOpacity style={styles.card} onPress={() => router.push('/misal/propio')} activeOpacity={0.7}>
          <View style={styles.cardRow}>
            <ThemedText style={styles.cardIcon}>{SEASON_EMOJI[seasonData.temporada] ?? '🌿'}</ThemedText>
            <View style={styles.cardTextWrap}>
              <ThemedText style={styles.cardLabel}>PROPIO DEL TIEMPO</ThemedText>
              <ThemedText style={styles.cardTitle}>{seasonData.temporada_label}</ThemedText>
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
  debugLink: { backgroundColor: '#8B0000', marginBottom: 10, borderRadius: R.md, marginHorizontal: S.xl, padding: 10, alignItems: 'center' },
  debugText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  brand: { color: C.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: S.xs, marginHorizontal: S.xl },
  pageTitle: { color: C.text, fontSize: 28, fontWeight: '700', marginBottom: S.xs, marginHorizontal: S.xl },
  dateText: { color: C.gold, fontSize: 18, marginBottom: S.xs, marginHorizontal: S.xl },
  misaTitle: { color: C.goldLight, fontSize: 13, fontStyle: 'italic', marginBottom: S.xl, marginHorizontal: S.xl },
  card: { backgroundColor: C.navyMid, padding: S.xl, borderRadius: R.lg, marginBottom: 15, marginHorizontal: S.xl },
  cardSm: { padding: 18, borderRadius: R.lg, backgroundColor: C.navyMid, marginBottom: 15 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: S.xl },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 28, marginRight: 14 },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  chevron: { color: C.gold, fontSize: 24, marginLeft: 6 },
  cardLabel: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: S.xs },
  verseText: { color: C.text, fontSize: 18, fontStyle: 'italic' },
  verseRef: { color: C.muted, marginTop: 10, textAlign: 'right' },
  streakText: { color: C.text, fontSize: 22, fontWeight: 'bold' },
  streakSub: { color: C.muted, fontSize: 11, marginTop: 2 },
  sectionLabel: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: S.xs, marginHorizontal: S.xl },
  propioSection: { marginBottom: 15 },
  propioDia: { color: C.text, fontSize: 14, fontWeight: '600', marginBottom: S.md, marginHorizontal: S.xl },
  propioCard: { backgroundColor: C.navyMid, padding: S.lg, borderRadius: R.lg, marginBottom: 10, marginHorizontal: S.xl },
  propioLabel: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  propioText: { color: C.text, fontSize: 14, lineHeight: 22 },
});

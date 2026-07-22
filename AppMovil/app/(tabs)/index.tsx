import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { ThemedText } from '@/components/themed-text';
import { Link, router } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { tabBarScrollY } from '@/utils/scroll-state';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calcularRacha, obtenerStats } from '@/data/streaks';
import { useSQLiteContext } from 'expo-sqlite';
import { getLecturaDelDia, getMisalTemporadas, getMisalPropioPorSemana, getSeasonFromNearestLectura } from '@/db/db';
import { fechaActualLarga, hoy } from '@/utils/date';
import { detectSeason, parseWeekNumber, isSunday, SEASON_EMOJI } from '@/utils/seasons';
import type { Lectura, MisalPropioEntry } from '@/types';

const handleScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
  tabBarScrollY.setValue(e.nativeEvent.contentOffset.y);
};

const getSaludo = () => {
  const h = new Date().getHours();
  if (h < 6) return 'Bendecida noche';
  if (h < 12) return 'Bendecido día';
  if (h < 20) return 'Bendecida tarde';
  return 'Bendecida noche';
};

const SEASON_COLOR: Record<string, string> = {
  adviento: '#7B3FAF',
  cuaresma: '#7B3FAF',
  pascua: '#E8C97A',
  navidad: '#E8C97A',
  ordinario: '#4CAF50',
};

const SEASON_COLOR_NAME: Record<string, string> = {
  adviento: 'Morado',
  cuaresma: 'Morado',
  pascua: 'Blanco',
  navidad: 'Blanco',
  ordinario: 'Verde',
};

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
          getMisalPropioPorSemana(db, season, week, sun).then(setPropio).catch((e) => console.warn('[misa]', e));
        } else {
          getSeasonFromNearestLectura(db, hoy()).then(fb => {
            if (fb) getMisalPropioPorSemana(db, fb.season, fb.week, fb.isSunday).then(setPropio).catch((e) => console.warn('[misa]', e));
          });
        }
      }
    });
  }, [db]);

  const misaTitle = lectura?.titulo_misa;
  const season = misaTitle ? detectSeason(misaTitle) : null;
  const seasonData = season ? temporadas.find((t) => t.temporada === season) : null;
  const seasonColor = season ? (SEASON_COLOR[season] ?? C.gold) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        {__DEV__ && (
          <Link href="/test" style={styles.debugLink} asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <ThemedText style={styles.debugText}>[Debug] Test Database</ThemedText>
            </TouchableOpacity>
          </Link>
        )}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.brand}>✝ IGLESIA DIGITAL</ThemedText>
            <ThemedText style={styles.pageTitle}>Liturgia</ThemedText>
          </View>
          <TouchableOpacity onPress={() => router.push('/ajustes')} style={styles.gearBtn}>
            <ThemedText style={styles.gearIcon}>⚙️</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.dateText}>{fechaActualLarga()}</ThemedText>
        {misaTitle ? <ThemedText style={styles.misaTitle}>{misaTitle}</ThemedText> : null}

      <ScrollView onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        {/* Hero — Saludo + Temporada + Evangelio */}
        <TouchableOpacity onPress={() => router.push('/evangelio')} style={[styles.heroCard, seasonColor ? { borderLeftColor: seasonColor } : undefined]} activeOpacity={0.9}>
          {season ? (
            <View style={styles.seasonRow}>
              <View style={[styles.colorDot, { backgroundColor: seasonColor }]} />
              <ThemedText style={styles.seasonLabel}>{SEASON_EMOJI[season] ?? '🌿'} {seasonData?.temporada_label ?? 'Tiempo Ordinario'} · {SEASON_COLOR_NAME[season]}</ThemedText>
            </View>
          ) : null}
          <ThemedText style={styles.greeting}>{getSaludo()}</ThemedText>
          <ThemedText style={styles.heroQuote} numberOfLines={4}>
            {'\u201C'}{lectura?.evangelio ?? 'Yo soy el camino, la verdad y la vida.'}{'\u201D'}
          </ThemedText>
          {lectura?.evangelio_ref ? (
            <ThemedText style={styles.heroRef}>{lectura.evangelio_ref}</ThemedText>
          ) : null}
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
            {propio.antifona_entrada ? <PrayerCard label="Antífona de entrada" text={propio.antifona_entrada} /> : null}
            {propio.colecta ? <PrayerCard label="Oración colecta" text={propio.colecta} /> : null}
            {propio.oracion_ofrendas ? <PrayerCard label="Oración sobre las ofrendas" text={propio.oracion_ofrendas} /> : null}
            {propio.postcomunion ? <PrayerCard label="Postcomunión" text={propio.postcomunion} /> : null}
            {propio.antifona_comunion ? <PrayerCard label="Antífona de comunión" text={propio.antifona_comunion} /> : null}
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
    </View>
  );
}

function PrayerCard({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.propioCard}>
      <ThemedText style={styles.propioLabel}>{label}</ThemedText>
      <ThemedText style={styles.propioText}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  debugLink: { backgroundColor: '#8B0000', marginBottom: 10, borderRadius: R.md, marginHorizontal: S.xl, padding: 10, alignItems: 'center' },
  debugText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: S.xl },
  gearBtn: { paddingTop: 4, paddingLeft: S.md },
  gearIcon: { fontSize: 22 },
  brand: { color: C.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: S.xs },
  pageTitle: { color: C.text, fontSize: 28, fontWeight: '700', marginBottom: S.xs },
  dateText: { color: C.gold, fontSize: 18, marginBottom: S.xs, marginHorizontal: S.xl },
  misaTitle: { color: C.goldLight, fontSize: 13, fontStyle: 'italic', marginBottom: S.xl, marginHorizontal: S.xl },
  heroCard: { backgroundColor: C.navyMid, padding: S.xl, borderRadius: R.lg, marginBottom: 15, marginHorizontal: S.xl, borderLeftWidth: 4, borderLeftColor: C.gold },
  seasonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: S.md },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  seasonLabel: { color: C.goldLight, fontSize: 12, fontWeight: '600' },
  greeting: { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: S.xs },
  heroQuote: { color: C.text, fontSize: 19, fontStyle: 'italic', lineHeight: 28 },
  heroRef: { color: C.muted, marginTop: S.sm, textAlign: 'right' },
  card: { backgroundColor: C.navyMid, padding: S.xl, borderRadius: R.lg, marginBottom: 15, marginHorizontal: S.xl },
  cardSm: { padding: 18, borderRadius: R.lg, backgroundColor: C.navyMid, marginBottom: 15 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: S.xl },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 28, marginRight: 14 },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  chevron: { color: C.gold, fontSize: 24, marginLeft: 6 },
  cardLabel: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: S.xs },
  streakText: { color: C.text, fontSize: 22, fontWeight: 'bold' },
  streakSub: { color: C.muted, fontSize: 11, marginTop: 2 },
  sectionLabel: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: S.xs, marginHorizontal: S.xl },
  propioSection: { marginBottom: 15 },
  propioDia: { color: C.text, fontSize: 14, fontWeight: '600', marginBottom: S.md, marginHorizontal: S.xl },
  propioCard: { backgroundColor: C.navyMid, padding: S.lg, borderRadius: R.lg, marginBottom: 10, marginHorizontal: S.xl },
  propioLabel: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  propioText: { color: C.text, fontSize: 14, lineHeight: 22 },
});

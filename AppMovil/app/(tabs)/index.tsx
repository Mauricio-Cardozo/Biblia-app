import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from '@/components/themed-text';
import HeroSection from '@/components/ui/hero-section';
import StreakCard from '@/components/ui/streak-card';
import SantoCard from '@/components/ui/santo-card';
import type { SeasonInfo } from '@/components/ui/hero-section';
import { Link, router } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { tabBarScrollY } from '@/utils/scroll-state';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calcularRacha, obtenerStats } from '@/data/streaks';
import { useSQLiteContext } from 'expo-sqlite';
import { getLecturaDelDia, getMisalTemporadas, getMisalPropioPorSemana, getSeasonFromNearestLectura, getSantosDelDia } from '@/db/db';
import { fechaActualLarga, hoy } from '@/utils/date';
import { detectSeason, parseWeekNumber, SEASON_EMOJI } from '@/utils/seasons';
import type { Lectura, MisalPropioEntry, Santo } from '@/types';

const handleScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
  tabBarScrollY.setValue(e.nativeEvent.contentOffset.y);
};

const h = new Date().getHours();
const saludo = h < 6 ? 'Bendecida noche' : h < 12 ? 'Bendecido día' : h < 20 ? 'Bendecida tarde' : 'Bendecida noche';

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
  const [santoDelDia, setSantoDelDia] = useState<Santo | null>(null);

  useEffect(() => {
    (async () => {
      const [rr, rc, st, lec, temps] = await Promise.all([
        calcularRacha("racha_rosario_ultima"),
        calcularRacha("racha_coronilla_ultima"),
        obtenerStats(),
        getLecturaDelDia(db, hoy()),
        getMisalTemporadas(db),
      ]);
      setRachaRosario(rr);
      setRachaCoronilla(rc);
      setStats({ rosario_total: st.rosario_total, coronilla_total: st.coronilla_total });
      setLectura(lec);
      setTemporadas(temps);
      const now = new Date();
      try {
        const santos = await getSantosDelDia(db, now.getMonth() + 1, now.getDate());
        setSantoDelDia(santos[0] ?? null);
      } catch (e: unknown) { console.warn('[santo]', e instanceof Error ? e.message : e); }

      if (lec?.titulo_misa) {
        const season = detectSeason(lec.titulo_misa);
        try {
          if (season) {
            const week = parseWeekNumber(lec.titulo_misa);
            setPropio(await getMisalPropioPorSemana(db, season, week));
          } else {
            const fb = await getSeasonFromNearestLectura(db, hoy());
            if (fb) setPropio(await getMisalPropioPorSemana(db, fb.season, fb.week));
          }
        } catch (e: unknown) { console.warn('[misa]', e instanceof Error ? e.message : e); }
      }
    })();
  }, [db]);

  const misaTitle = lectura?.titulo_misa;
  const season = misaTitle ? detectSeason(misaTitle) : null;
  const seasonData = season ? temporadas.find((t) => t.temporada === season) : null;

  const seasonInfo: SeasonInfo | null = season && seasonData ? {
    season,
    label: seasonData.temporada_label,
    color: SEASON_COLOR[season] ?? C.gold,
    emoji: SEASON_EMOJI[season] ?? '🌿',
    colorName: SEASON_COLOR_NAME[season],
  } : null;

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top + 20 }]}>
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
        <HeroSection
          greeting={saludo}
          season={seasonInfo}
          gospelQuote={lectura?.evangelio ?? null}
          gospelRef={lectura?.evangelio_ref ?? null}
          onPress={() => router.push('/evangelio')}
        />

        <View style={styles.streakRow}>
          <StreakCard
            label="ROSARIO"
            count={stats.rosario_total}
            streakDays={rachaRosario}
            onPress={() => router.push('/rosario/guia')}
          />
          <StreakCard
            label="CORONILLA"
            count={stats.coronilla_total}
            streakDays={rachaCoronilla}
            onPress={() => router.push('/rosario/coronilla')}
          />
        </View>

        {santoDelDia ? (
          <SantoCard
            nombre={santoDelDia.nombre}
            titulo={santoDelDia.titulo}
            biografia={santoDelDia.biografia}
            onPress={() => router.push(`/santo/${santoDelDia.id}`)}
          />
        ) : null}

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
                <ThemedText style={styles.sectionLabel}>PROPIO DEL TIEMPO</ThemedText>
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
  debugLink: { backgroundColor: '#8B0000', marginBottom: 10, borderRadius: R.md, marginHorizontal: S.xl, padding: 10, alignItems: 'center' },
  debugText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: S.xl },
  gearBtn: { paddingTop: 4, paddingLeft: S.md },
  gearIcon: { fontSize: 22 },
  brand: { color: C.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: S.xs },
  pageTitle: { color: C.text, fontSize: 28, fontWeight: '700', marginBottom: S.xs },
  dateText: { color: C.gold, fontSize: 18, marginBottom: S.xs, marginHorizontal: S.xl },
  misaTitle: { color: C.goldLight, fontSize: 13, fontStyle: 'italic', marginBottom: S.xl, marginHorizontal: S.xl },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: S.xl },
  sectionLabel: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: S.xs, marginHorizontal: S.xl },
  propioSection: { marginBottom: 15 },
  propioDia: { color: C.text, fontSize: 14, fontWeight: '600', marginBottom: S.md, marginHorizontal: S.xl },
  propioCard: { backgroundColor: C.navyMid, padding: S.lg, borderRadius: R.lg, marginBottom: 10, marginHorizontal: S.xl },
  propioLabel: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  propioText: { color: C.text, fontSize: 14, lineHeight: 22 },
  card: { backgroundColor: C.navyMid, padding: S.xl, borderRadius: R.lg, marginBottom: 15, marginHorizontal: S.xl },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 28, marginRight: 14 },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  chevron: { color: C.gold, fontSize: 24, marginLeft: 6 },
});

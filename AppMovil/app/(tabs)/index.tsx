import { C } from '@/constants/theme';
import { Link, router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calcularRacha, obtenerStats } from '@/data/streaks';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [rachaRosario, setRachaRosario] = useState(0);
  const [rachaCoronilla, setRachaCoronilla] = useState(0);
  const [stats, setStats] = useState({ rosario_total: 0, coronilla_total: 0 });

  useEffect(() => {
    Promise.all([
      calcularRacha("racha_rosario_ultima"),
      calcularRacha("racha_coronilla_ultima"),
      obtenerStats(),
    ]).then(([rr, rc, st]) => {
      setRachaRosario(rr);
      setRachaCoronilla(rc);
      setStats({ rosario_total: st.rosario_total, coronilla_total: st.coronilla_total });
    });
  }, []);

  const obtenerFechaActual = () => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date();
    return `${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]}`;
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Link href="/test" style={styles.debugLink}>
        [Debug] Test Database
      </Link>
      <Text style={styles.dateText}>{obtenerFechaActual()}</Text>

      {/* Evangelio del Día */}
      <TouchableOpacity onPress={() => router.push('/evangelio')} style={styles.card}>
        <Text style={styles.cardLabel}>EVANGELIO DEL DÍA</Text>
        <Text style={styles.verseText}>{'\u201C'}Yo soy el camino, la verdad y la vida.{'\u201D'}</Text>
        <Text style={styles.verseRef}>— Juan 14:6</Text>
      </TouchableOpacity>

      {/* Rachas */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => router.push('/rosario/guia')} style={[styles.card, { flex: 0.48 }]}>
          <Text style={styles.cardLabel}>ROSARIO</Text>
          <Text style={styles.streakText}>🔥 {rachaRosario} días</Text>
          {stats.rosario_total > 0 && <Text style={styles.streakSub}>Total: {stats.rosario_total}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/rosario/coronilla')} style={[styles.card, { flex: 0.48 }]}>
          <Text style={styles.cardLabel}>CORONILLA</Text>
          <Text style={styles.streakText}>🔥 {rachaCoronilla} días</Text>
          {stats.coronilla_total > 0 && <Text style={styles.streakSub}>Total: {stats.coronilla_total}</Text>}
        </TouchableOpacity>
      </View>

      {/* YOUCAT */}
      <Link href={"/youcat" as any} asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardLabel}>CATEQUESIS — YOUCAT</Text>
          <Text style={styles.youcatSub}>Catecismo Joven de la Iglesia Católica</Text>
          <Text style={styles.youcatMeta}>162 preguntas y respuestas · 4 partes</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  debugLink: { color: '#fff', padding: 10, backgroundColor: 'red', marginBottom: 10, borderRadius: 5, textAlign: 'center', marginHorizontal: 20 },
  dateText: { color: C.gold, fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginHorizontal: 20 },
  card: { backgroundColor: C.navyMid, padding: 20, borderRadius: 15, marginBottom: 15, marginHorizontal: 20 },
  cardLabel: { color: C.gold, fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  verseText: { color: '#fff', fontSize: 18, fontStyle: 'italic' },
  verseRef: { color: '#fff', opacity: 0.6, marginTop: 10, textAlign: 'right' },
  streakText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  streakSub: { color: C.muted, fontSize: 11, marginTop: 2 },
  youcatSub: { color: C.text, fontSize: 14, lineHeight: 20 },
  youcatMeta: { color: C.muted, fontSize: 12, marginTop: 6 },
});

import { C } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Link, router } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { calcularRacha, obtenerStats } from '@/data/streaks';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

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
  }, [db]);

  const obtenerFechaActual = () => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date();
    return `${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]}`;
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {__DEV__ && (
        <Link href="/test" style={styles.debugLink} asChild>
          <TouchableOpacity activeOpacity={0.7}>
            <ThemedText style={styles.debugText}>[Debug] Test Database</ThemedText>
          </TouchableOpacity>
        </Link>
      )}
      <ThemedText style={styles.dateText}>{obtenerFechaActual()}</ThemedText>

      {/* Evangelio del Día */}
      <TouchableOpacity onPress={() => router.push('/evangelio')} style={styles.card}>
        <ThemedText style={styles.cardLabel}>EVANGELIO DEL DÍA</ThemedText>
        <ThemedText style={styles.verseText}>{'\u201C'}Yo soy el camino, la verdad y la vida.{'\u201D'}</ThemedText>
        <ThemedText style={styles.verseRef}>— Juan 14:6</ThemedText>
      </TouchableOpacity>

      {/* Rachas */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => router.push('/rosario/guia')} style={[styles.card, { flex: 0.48 }]}>
          <ThemedText style={styles.cardLabel}>ROSARIO</ThemedText>
          <ThemedText style={styles.streakText}>🔥 {rachaRosario} días</ThemedText>
          {stats.rosario_total > 0 && <ThemedText style={styles.streakSub}>Total: {stats.rosario_total}</ThemedText>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/rosario/coronilla')} style={[styles.card, { flex: 0.48 }]}>
          <ThemedText style={styles.cardLabel}>CORONILLA</ThemedText>
          <ThemedText style={styles.streakText}>🔥 {rachaCoronilla} días</ThemedText>
          {stats.coronilla_total > 0 && <ThemedText style={styles.streakSub}>Total: {stats.coronilla_total}</ThemedText>}
        </TouchableOpacity>
      </View>

      {/* Misal Romano */}
      <TouchableOpacity onPress={() => router.push('/misal/hoy')} style={styles.card}>
        <ThemedText style={styles.cardLabel}>MISAL ROMANO</ThemedText>
        <ThemedText style={styles.verseText}>{'\u201C'}Esto es mi Cuerpo, que se entrega por ustedes.{'\u201D'}</ThemedText>
        <ThemedText style={styles.verseRef}>— Lucas 22:19</ThemedText>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  debugLink: { backgroundColor: '#8B0000', marginBottom: 10, borderRadius: 8, marginHorizontal: 20, padding: 10, alignItems: 'center' },
  debugText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  dateText: { color: C.gold, fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginHorizontal: 20 },
  card: { backgroundColor: C.navyMid, padding: 20, borderRadius: 12, marginBottom: 15, marginHorizontal: 20 },
  cardLabel: { color: C.gold, fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  verseText: { color: C.text, fontSize: 18, fontStyle: 'italic' },
  verseRef: { color: C.muted, marginTop: 10, textAlign: 'right' },
  streakText: { color: C.text, fontSize: 16, fontWeight: 'bold' },
  streakSub: { color: C.muted, fontSize: 11, marginTop: 2 },

});

import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tabBarScrollY } from "@/utils/scroll-state";
import { getSantosDelDia, getMisalSantosDelDia } from '@/db/db';
import type { Santo, MisalSantosEntry } from '@/types';

const handleScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
  tabBarScrollY.setValue(e.nativeEvent.contentOffset.y);
};

interface DiaLectura {
  fecha: string;
  titulo_misa: string;
  tieneEvangelio: number;
}

const MESES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function diasEnMes(a: number, m: number): number {
  return new Date(a, m, 0).getDate();
}

export default function CalendarioLiturgico() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [lecturas, setLecturas] = useState<Map<string, DiaLectura>>(new Map());
  const [loading, setLoading] = useState(true);
  const [santos, setSantos] = useState<Santo[]>([]);
  const [santoPropio, setSantoPropio] = useState<MisalSantosEntry | null>(null);

  const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(hoyStr);

  useEffect(() => {
    (async () => {
      const start = `${ano}-${String(mes).padStart(2, "0")}-01`;
      const end = `${ano}-${String(mes).padStart(2, "0")}-${diasEnMes(ano, mes)}`;
      try {
        const rows = await db.getAllAsync<DiaLectura>(
          `SELECT fecha, titulo_misa, CASE WHEN evangelio IS NOT NULL AND evangelio != '' THEN 1 ELSE 0 END as tieneEvangelio FROM lecturas WHERE fecha >= ? AND fecha <= ? ORDER BY fecha`,
          [start, end]
        );
        const map = new Map<string, DiaLectura>();
        for (const r of rows) map.set(r.fecha, r);
        setLecturas(map);
      } catch (e) { console.warn('[calendario]', e); }
      setLoading(false);
    })();
  }, [db, ano, mes]);

  useEffect(() => {
    (async () => {
      const parts = selectedDate.split('-').map(Number);
      try {
        const [ss, ms] = await Promise.all([
          getSantosDelDia(db, parts[1], parts[2]),
          getMisalSantosDelDia(db, parts[1], parts[2]),
        ]);
        setSantos(ss);
        setSantoPropio(ms.find(e => e.colecta) ?? null);
      } catch (e) { console.warn('[calendario]', e); }
    })();
  }, [db, selectedDate]);

  const totalDias = diasEnMes(ano, mes);
  const primerDiaSemana = new Date(ano, mes - 1, 1).getDay();

  const celdas: React.ReactNode[] = [];
  for (let i = 0; i < primerDiaSemana; i++) {
    celdas.push(<View key={`empty-${i}`} style={styles.celda} />);
  }
  for (let d = 1; d <= totalDias; d++) {
    const fechaStr = `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const lectura = lecturas.get(fechaStr);
    const esHoy = fechaStr === hoyStr;
    const esSel = fechaStr === selectedDate;
    celdas.push(
      <TouchableOpacity
        key={fechaStr}
        style={[styles.celda, esHoy && styles.celdaHoy, esSel && !esHoy && styles.celdaSel]}
        onPress={() => { setSelectedDate(fechaStr); if (lectura) router.push(`/evangelio?fecha=${fechaStr}`); }}
        disabled={!lectura}
        activeOpacity={0.6}
      >
        <ThemedText style={[styles.diaNum, esHoy && styles.diaNumHoy, !lectura && styles.diaNumVacio]}>
          {d}
        </ThemedText>
        {lectura?.tieneEvangelio ? <ThemedText style={styles.diaDot}>✦</ThemedText> : <View style={{ height: 12 }} />}
      </TouchableOpacity>
    );
  }

  const fechaParts = selectedDate.split('-');
  const diaLabel = `${parseInt(fechaParts[2])} de ${MESES[parseInt(fechaParts[1])]} de ${fechaParts[0]}`;

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ThemedText style={styles.title}>Calendario Litúrgico</ThemedText>

      <View style={styles.mesNav}>
        <TouchableOpacity onPress={() => { if (mes === 1) { setMes(12); setAno((a) => a - 1); } else { setMes((m) => m - 1); } }} style={styles.mesBtn}>
          <ThemedText style={styles.mesBtnText}>‹</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.mesLabel}>{MESES[mes]} {ano}</ThemedText>
        <TouchableOpacity onPress={() => { if (mes === 12) { setMes(1); setAno((a) => a + 1); } else { setMes((m) => m + 1); } }} style={styles.mesBtn}>
          <ThemedText style={styles.mesBtnText}>›</ThemedText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={C.gold} style={{ marginTop: S.huge }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} onScroll={handleScroll} scrollEventThrottle={16}>
          <View style={styles.semanaRow}>
            {DIAS_SEMANA.map((d) => (
              <View key={d} style={styles.semanaCelda}>
                <ThemedText style={styles.semanaLabel}>{d}</ThemedText>
              </View>
            ))}
          </View>
          <View style={styles.grid}>{celdas}</View>
          <ThemedText style={styles.leyenda}>✦ Días con lectura del Evangelio</ThemedText>

          {santos.length > 0 || santoPropio ? (
            <View style={styles.santosSection}>
              <ThemedText style={styles.sectionLabel}>SANTOS DEL DÍA</ThemedText>
              <ThemedText style={styles.diaLabel}>{diaLabel}</ThemedText>

              {santos.length > 0 ? (
                <View style={styles.santosList}>
                  {santos.map(s => (
                    <TouchableOpacity key={s.id} style={styles.santoCard} onPress={() => router.push(`/santo/${s.id}`)} activeOpacity={0.7}>
                      <ThemedText style={styles.santoName}>
                        {s.nombre}{s.titulo ? `, ${s.titulo}` : ''}
                      </ThemedText>
                      {s.biografia && s.biografia.length > 0 ? (
                        <ThemedText style={styles.santoChevron}>›</ThemedText>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <ThemedText style={styles.sinSanto}>No hay santos registrados para este día</ThemedText>
              )}

              {santoPropio?.colecta ? (
                <View style={styles.propioSection}>
                  <ThemedText style={styles.sectionSubLabel}>ORACIONES PROPIAS</ThemedText>
                  {santoPropio.antifona_entrada ? (
                    <View style={styles.propioCard}>
                      <ThemedText style={styles.propioLabel}>Antífona de entrada</ThemedText>
                      <ThemedText style={styles.propioText}>{santoPropio.antifona_entrada}</ThemedText>
                    </View>
                  ) : null}
                  {santoPropio.colecta ? (
                    <View style={styles.propioCard}>
                      <ThemedText style={styles.propioLabel}>Oración colecta</ThemedText>
                      <ThemedText style={styles.propioText}>{santoPropio.colecta}</ThemedText>
                    </View>
                  ) : null}
                  {santoPropio.oracion_ofrendas ? (
                    <View style={styles.propioCard}>
                      <ThemedText style={styles.propioLabel}>Oración sobre las ofrendas</ThemedText>
                      <ThemedText style={styles.propioText}>{santoPropio.oracion_ofrendas}</ThemedText>
                    </View>
                  ) : null}
                  {santoPropio.prefacio ? (
                    <View style={styles.propioCard}>
                      <ThemedText style={styles.propioLabel}>Prefacio</ThemedText>
                      <ThemedText style={styles.propioText}>{santoPropio.prefacio}</ThemedText>
                    </View>
                  ) : null}
                  {santoPropio.antifona_comunion ? (
                    <View style={styles.propioCard}>
                      <ThemedText style={styles.propioLabel}>Antífona de comunión</ThemedText>
                      <ThemedText style={styles.propioText}>{santoPropio.antifona_comunion}</ThemedText>
                    </View>
                  ) : null}
                  {santoPropio.postcomunion ? (
                    <View style={styles.propioCard}>
                      <ThemedText style={styles.propioLabel}>Postcomunión</ThemedText>
                      <ThemedText style={styles.propioText}>{santoPropio.postcomunion}</ThemedText>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const CELDA = 44;

const styles = StyleSheet.create({
  title: { color: C.text, fontSize: 22, fontWeight: '700', marginHorizontal: S.xl, marginBottom: S.sm },
  mesNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: S.xl, marginVertical: S.md },
  mesBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.navyLight, alignItems: "center", justifyContent: "center" },
  mesBtnText: { color: C.gold, fontSize: 24, fontWeight: "700", marginTop: Platform.OS === "android" ? -2 : -3 },
  mesLabel: { color: C.text, fontSize: 18, fontWeight: "600", minWidth: 150, textAlign: "center" },
  scrollContent: { paddingHorizontal: S.md, paddingBottom: 100 },
  semanaRow: { flexDirection: "row" },
  semanaCelda: { width: CELDA, height: 28, alignItems: "center", justifyContent: "center" },
  semanaLabel: { color: C.muted, fontSize: 12, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  celda: { width: CELDA, height: CELDA, alignItems: "center", justifyContent: "center" },
  celdaHoy: { backgroundColor: C.goldDim, borderRadius: R.md },
  celdaSel: { backgroundColor: `${C.gold}20`, borderRadius: R.md },
  diaNum: { fontSize: 15, fontWeight: "600", color: C.text },
  diaNumHoy: { color: C.navy },
  diaNumVacio: { color: C.muted, opacity: 0.4 },
  diaDot: { color: C.gold, fontSize: 10, marginTop: 1 },
  leyenda: { color: C.muted, fontSize: 12, textAlign: "center", marginTop: S.lg },
  santosSection: { marginTop: S.xl, marginHorizontal: S.xs },
  sectionLabel: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: S.xs },
  sectionSubLabel: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: S.sm, marginTop: S.md },
  diaLabel: { color: C.text, fontSize: 14, fontWeight: '600', marginBottom: S.md },
  santosList: { marginBottom: S.sm },
  santoCard: { backgroundColor: C.navyMid, padding: S.md, borderRadius: R.lg, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  santoName: { color: C.goldLight, fontSize: 14, lineHeight: 22, flex: 1 },
  santoChevron: { color: C.gold, fontSize: 20, marginLeft: S.sm },
  sinSanto: { color: C.muted, fontSize: 13, fontStyle: 'italic' },
  propioSection: {},
  propioCard: { backgroundColor: C.navyMid, padding: S.lg, borderRadius: R.lg, marginBottom: 10 },
  propioLabel: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  propioText: { color: C.text, fontSize: 14, lineHeight: 22 },
});

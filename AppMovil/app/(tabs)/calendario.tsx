import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { ThemedText } from "@/components/themed-text";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  useEffect(() => {
    setLoading(true);
    const start = `${ano}-${String(mes).padStart(2, "0")}-01`;
    const end = `${ano}-${String(mes).padStart(2, "0")}-${diasEnMes(ano, mes)}`;
    db.getAllAsync<DiaLectura>(
      `SELECT fecha, titulo_misa, CASE WHEN evangelio IS NOT NULL AND evangelio != '' THEN 1 ELSE 0 END as tieneEvangelio FROM lecturas WHERE fecha >= ? AND fecha <= ? ORDER BY fecha`,
      [start, end]
    ).then((rows) => {
      const map = new Map<string, DiaLectura>();
      for (const r of rows) map.set(r.fecha, r);
      setLecturas(map);
      setLoading(false);
    }).catch(console.error);
  }, [db, ano, mes]);

  const mesAnterior = useCallback(() => {
    if (mes === 1) { setMes(12); setAno((a) => a - 1); }
    else { setMes((m) => m - 1); }
  }, [mes]);

  const mesSiguiente = useCallback(() => {
    if (mes === 12) { setMes(1); setAno((a) => a + 1); }
    else { setMes((m) => m + 1); }
  }, [mes]);

  const totalDias = diasEnMes(ano, mes);
  const primerDiaSemana = new Date(ano, mes - 1, 1).getDay();
  const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const celdas: React.ReactNode[] = [];
  for (let i = 0; i < primerDiaSemana; i++) {
    celdas.push(<View key={`empty-${i}`} style={styles.celda} />);
  }
  for (let d = 1; d <= totalDias; d++) {
    const fechaStr = `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const lectura = lecturas.get(fechaStr);
    const esHoy = fechaStr === hoyStr;
    celdas.push(
      <TouchableOpacity
        key={fechaStr}
        style={[styles.celda, esHoy && styles.celdaHoy]}
        onPress={() => { if (lectura) router.push(`/evangelio?fecha=${fechaStr}`); }}
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedText style={styles.title}>Calendario Litúrgico</ThemedText>

      <View style={styles.mesNav}>
        <TouchableOpacity onPress={mesAnterior} style={styles.mesBtn}>
          <ThemedText style={styles.mesBtnText}>‹</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.mesLabel}>{MESES[mes]} {ano}</ThemedText>
        <TouchableOpacity onPress={mesSiguiente} style={styles.mesBtn}>
          <ThemedText style={styles.mesBtnText}>›</ThemedText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={C.gold} style={{ marginTop: S.huge }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.semanaRow}>
            {DIAS_SEMANA.map((d) => (
              <View key={d} style={styles.semanaCelda}>
                <ThemedText style={styles.semanaLabel}>{d}</ThemedText>
              </View>
            ))}
          </View>
          <View style={styles.grid}>{celdas}</View>
          <ThemedText style={styles.leyenda}>✦ Días con lectura del Evangelio</ThemedText>
        </ScrollView>
      )}
    </View>
  );
}

const CELDA = 44;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
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
  diaNum: { fontSize: 15, fontWeight: "600", color: C.text },
  diaNumHoy: { color: C.navy },
  diaNumVacio: { color: C.muted, opacity: 0.4 },
  diaDot: { color: C.gold, fontSize: 10, marginTop: 1 },
  leyenda: { color: C.muted, fontSize: 12, textAlign: "center", marginTop: S.lg },
});

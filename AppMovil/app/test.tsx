import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { searchCIC, searchYoucat } from '@/db/db';
import { diagnose, forceReCopy } from '@/db/init';
import type { CICNumeral, YoucatQuestion } from '@/types';

type SearchTarget = 'cic' | 'youcat';

export default function TestDatabase() {
  const db = useSQLiteContext();

  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  const [termino, setTermino] = useState('');
  const [target, setTarget] = useState<SearchTarget>('cic');
  const [searchResults, setSearchResults] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const ejecutarDiagnosis = useCallback(async () => {
    setDiagnosisLoading(true);
    setDiagnosis('');
    const d = await diagnose(db);
    setDiagnosis(d);
    setDiagnosisLoading(false);
  }, [db]);

  const confirmarReCopy = useCallback(() => {
    Alert.alert(
      "¿Expandir base de datos?",
      "Esto borra la DB actual y la recopia desde assets. La app se cerrará. ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Expandir",
          style: "destructive",
          onPress: async () => {
            try {
              await forceReCopy();
              Alert.alert("Listo", "Base de datos eliminada. Cerrá y abrí la app para recopiar desde assets.");
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  }, []);

  const ejecutarBusqueda = useCallback(async () => {
    const t = termino.trim();
    if (!t) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults('');
    try {
      if (target === 'cic') {
        const data = await searchCIC(db, t);
        setSearchResults(data.length === 0
          ? 'Sin resultados'
          : data.slice(0, 30).map((r: CICNumeral) =>
              `• Numeral ${r.id}: ${r.texto.slice(0, 120)}…`
            ).join('\n\n')
        );
      } else {
        const data = await searchYoucat(db, t);
        setSearchResults(data.length === 0
          ? 'Sin resultados'
          : data.slice(0, 30).map((r: YoucatQuestion) =>
              `• Pregunta ${r.pregunta_nro}: ${r.pregunta_texto.slice(0, 80)}…`
            ).join('\n\n')
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Search error:', err);
      setSearchError(`Error: ${msg}`);
    } finally {
      setSearchLoading(false);
    }
  }, [db, termino, target]);

  const rebuildFTS = useCallback(async () => {
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults('');
    const errors: string[] = [];

    try {
      await db.runAsync('DROP TABLE IF EXISTS youcat_fts;');
      await db.runAsync('DROP TABLE IF EXISTS catecismo_cic_fts;');
    } catch {
      errors.push('Error al dropear tablas FTS existentes');
    }

    // ── youcat_fts ──
    try {
      await db.runAsync(`CREATE VIRTUAL TABLE youcat_fts USING fts5(
        id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo
      )`);
      const youcatRows = await db.getAllAsync<any>(
        "SELECT rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo FROM youcat"
      );
      for (const r of youcatRows) {
        await db.runAsync(
          "INSERT INTO youcat_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [r.rowid, r.id, r.pregunta_nro, r.pregunta_texto, r.respuesta_texto, r.parte, r.capitulo],
        );
      }
    } catch (err: any) {
      errors.push(`youcat_fts: ${err.message}`);
    }

    // ── catecismo_cic_fts ──
    try {
      await db.runAsync(`CREATE VIRTUAL TABLE catecismo_cic_fts USING fts5(
        id, parte, seccion, capitulo, articulo, texto
      )`);
      const cicRows = await db.getAllAsync<any>(
        "SELECT rowid, id, parte, seccion, capitulo, articulo, texto FROM catecismo_cic"
      );
      for (const r of cicRows) {
        await db.runAsync(
          "INSERT INTO catecismo_cic_fts(rowid, id, parte, seccion, capitulo, articulo, texto) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [r.rowid, r.id, r.parte, r.seccion, r.capitulo, r.articulo, r.texto],
        );
      }
    } catch (err: any) {
      errors.push(`catecismo_cic_fts: ${err.message}`);
    }

    if (errors.length === 0) {
      setSearchResults('✅ FTS rebuild exitoso');
    } else {
      setSearchResults(`⚠ Rebuild parcial:\n  ${errors.join('\n  ')}`);
    }
    setSearchLoading(false);
  }, [db]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.title}>🔍 Debug de Base de Datos</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Buscar</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.tabBtn, target === 'cic' && styles.tabBtnActive]} onPress={() => setTarget('cic')}>
            <Text style={[styles.tabBtnText, target === 'cic' && styles.tabBtnTextActive]}>CIC</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, target === 'youcat' && styles.tabBtnActive]} onPress={() => setTarget('youcat')}>
            <Text style={[styles.tabBtnText, target === 'youcat' && styles.tabBtnTextActive]}>YOUCAT</Text>
          </TouchableOpacity>
        </View>
        <TextInput ref={inputRef} style={styles.input} placeholder="Ej: Dios, amor, fe..." placeholderTextColor="#666"
          value={termino} onChangeText={setTermino} onSubmitEditing={ejecutarBusqueda} returnKeyType="search"
        />
        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={ejecutarBusqueda}>
            <Text style={styles.btnText}>🔎 Buscar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={rebuildFTS}>
            <Text style={styles.btnText}>🔄 Rebuild FTS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {searchLoading && <ActivityIndicator size="large" color="#C9A84C" style={{ marginVertical: 20 }} />}
      {searchError && <Text style={styles.error}>{searchError}</Text>}
      {searchResults !== '' && !searchLoading && (
        <View style={styles.card}>
          <Text style={styles.resultText}>{searchResults}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={ejecutarDiagnosis}>
        <Text style={styles.btnText}>🔬 Diagnosticar DB</Text>
      </TouchableOpacity>
      {diagnosisLoading && <ActivityIndicator size="small" color="#C9A84C" style={{ marginVertical: 12 }} />}
      {diagnosis !== '' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Diagnóstico</Text>
          <Text style={styles.mono}>{diagnosis}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.btnDanger} onPress={confirmarReCopy}>
        <Text style={styles.btnDangerText}>⚠ Expandir DB desde assets</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 50, backgroundColor: '#0D1B2A' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#E8C97A' },
  card: { backgroundColor: '#1A2D45', padding: 14, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#C9A84C33' },
  cardTitle: { color: '#C9A84C', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  input: { backgroundColor: '#0D1B2A', color: '#F0E6CC', fontSize: 15, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#C9A84C55', marginBottom: 10 },
  btn: { flex: 1, backgroundColor: '#1A2D45', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#C9A84C', alignItems: 'center' },
  btnSecondary: { flex: 1, backgroundColor: '#243B55', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#C9A84C55', alignItems: 'center' },
  btnDanger: { backgroundColor: '#4A1A2D', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E07070', alignItems: 'center', marginTop: 8 },
  btnText: { color: '#E8C97A', fontWeight: '700', fontSize: 14 },
  btnDangerText: { color: '#E07070', fontWeight: '700', fontSize: 14 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: '#0D1B2A', alignItems: 'center', borderWidth: 1, borderColor: '#C9A84C33' },
  tabBtnActive: { backgroundColor: '#C9A84C33', borderColor: '#C9A84C' },
  tabBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
  tabBtnTextActive: { color: '#E8C97A' },
  error: { color: '#E07070', fontSize: 14, textAlign: 'center', marginVertical: 10 },
  resultText: { color: '#F0E6CC', fontSize: 13, fontFamily: 'monospace', lineHeight: 20 },
  mono: { color: '#F0E6CC', fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
});

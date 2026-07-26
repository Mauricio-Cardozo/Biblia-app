import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { searchYoucat } from '@/db/db';
import type { YoucatPregunta } from '@/types';
import { diagnose, forceReCopy } from '@/db/init';

export default function TestDatabase() {
  const db = useSQLiteContext();

  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  const [termino, setTermino] = useState('');
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
            } catch (e: unknown) {
              Alert.alert("Error", e instanceof Error ? e.message : String(e));
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
      const data = await searchYoucat(db, t);
      setSearchResults(data.length === 0
        ? 'Sin resultados'
        : data.slice(0, 30).map((r: YoucatPregunta) =>
            `• #${r.id}: ${r.pregunta.slice(0, 120)}…`
          ).join('\n\n')
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Search error:', err);
      setSearchError(`Error: ${msg}`);
    } finally {
      setSearchLoading(false);
    }
  }, [db, termino]);

  const rebuildFTS = useCallback(async () => {
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults('✅ No se necesita FTS para YOUCAT (usa LIKE)');
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    if (!__DEV__) router.replace('/');
  }, []);

  if (!__DEV__) return null;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <ThemedText style={s.title}>🔍 Debug de Base de Datos</ThemedText>

      <View style={s.card}>
        <ThemedText style={s.cardTitle}>Buscar en YOUCAT</ThemedText>
        <TextInput ref={inputRef} style={s.input} placeholder="Ej: Dios, amor, fe..." placeholderTextColor={C.muted}
          value={termino} onChangeText={setTermino} onSubmitEditing={ejecutarBusqueda} returnKeyType="search"
        />
        <View style={s.row}>
          <TouchableOpacity style={s.btn} onPress={ejecutarBusqueda}>
            <ThemedText style={s.btnText}>🔎 Buscar</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={rebuildFTS}>
            <ThemedText style={s.btnText}>🔄 Rebuild FTS</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {searchLoading && <ActivityIndicator size="large" color={C.gold} style={{ marginVertical: S.xl }} />}
      {searchError && <ThemedText style={s.error}>{searchError}</ThemedText>}
      {searchResults !== '' && !searchLoading && (
        <View style={s.card}>
          <ThemedText style={s.resultText}>{searchResults}</ThemedText>
        </View>
      )}

      <TouchableOpacity style={s.btn} onPress={ejecutarDiagnosis}>
        <ThemedText style={s.btnText}>🔬 Diagnosticar DB</ThemedText>
      </TouchableOpacity>
      {diagnosisLoading && <ActivityIndicator size="small" color={C.gold} style={{ marginVertical: S.md }} />}
      {diagnosis !== '' && (
        <View style={s.card}>
          <ThemedText style={s.cardTitle}>Diagnóstico</ThemedText>
          <ThemedText style={s.mono}>{diagnosis}</ThemedText>
        </View>
      )}

      <TouchableOpacity style={s.btnDanger} onPress={confirmarReCopy}>
        <ThemedText style={s.btnDangerText}>⚠ Expandir DB desde assets</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: S.lg, paddingTop: 50, backgroundColor: C.navy },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: S.lg, color: C.goldLight },
  card: { backgroundColor: C.navyMid, padding: 14, borderRadius: R.lg, marginBottom: 14, borderWidth: 1, borderColor: C.goldDim },
  cardTitle: { color: C.gold, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  input: { backgroundColor: C.navy, color: C.text, fontSize: 15, paddingHorizontal: 14, paddingVertical: 10, borderRadius: R.md, borderWidth: 1, borderColor: C.goldDim, marginBottom: 10 },
  btn: { flex: 1, backgroundColor: C.navyMid, padding: S.md, borderRadius: R.md, borderWidth: 1, borderColor: C.gold, alignItems: 'center' },
  btnSecondary: { flex: 1, backgroundColor: C.navyLight, padding: S.md, borderRadius: R.md, borderWidth: 1, borderColor: C.goldDim, alignItems: 'center' },
  btnDanger: { backgroundColor: '#4A1A2D', padding: S.md, borderRadius: R.md, borderWidth: 1, borderColor: C.error, alignItems: 'center', marginTop: S.sm },
  btnText: { color: C.goldLight, fontWeight: '700', fontSize: 14 },
  btnDangerText: { color: C.error, fontWeight: '700', fontSize: 14 },
  error: { color: C.error, fontSize: 14, textAlign: 'center', marginVertical: 10 },
  resultText: { color: C.text, fontSize: 13, fontFamily: 'monospace', lineHeight: 20 },
  mono: { color: C.text, fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
});

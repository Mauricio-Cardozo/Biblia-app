import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import type { CICNumeral } from '@/types';

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export default function TestDatabase() {
  const db = useSQLiteContext();

  const [results, setResults] = useState<CICNumeral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tablas, setTablas] = useState<string[]>([]);
  const [esquema, setEsquema] = useState<Record<string, ColumnInfo[]>>({});

  const runTest = useCallback(async () => {
    try {
      const data = await db.getAllAsync<CICNumeral>(
        `SELECT c.* FROM catecismo_cic c
         JOIN catecismo_cic_fts f ON c.id = f.id
         WHERE catecismo_cic_fts MATCH ?
         ORDER BY rank`,
        ['Dios'],
      );
      setResults(data);
    } catch (err) {
      console.error(err);
      setError('Error al consultar la DB. Verifica los logs.');
    } finally {
      setLoading(false);
    }
  }, [db]);

  const inspeccionarEsquema = useCallback(async () => {
    try {
      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      );
      const nombres = tables.map((t) => t.name);
      setTablas(nombres);

      const esquemaMap: Record<string, ColumnInfo[]> = {};
      for (const name of nombres) {
        const cols = await db.getAllAsync<ColumnInfo>(`PRAGMA table_info(${name});`);
        esquemaMap[name] = cols;
      }
      setEsquema(esquemaMap);
    } catch (err) {
      console.error('Error al inspeccionar esquema:', err);
    }
  }, [db]);

  useEffect(() => { runTest(); }, [runTest]);

  if (loading) return <ActivityIndicator size="large" style={styles.center} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Debug de Base de Datos</Text>

      <TouchableOpacity style={styles.btn} onPress={inspeccionarEsquema}>
        <Text style={styles.btnText}>📋 Inspeccionar Esquema</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      {!error && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            FTS5 — Resultados para "Dios" (CIC): {results.length}
          </Text>
          {results.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.numeralId}>Numeral {item.id}</Text>
              <Text>{item.texto.substring(0, 100)}...</Text>
            </View>
          ))}
        </View>
      )}

      {tablas.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tablas ({tablas.length})</Text>
          <Text style={styles.mono}>{tablas.join(', ')}</Text>
        </View>
      )}

      {Object.entries(esquema).map(([name, cols]) => (
        <View key={name} style={styles.section}>
          <Text style={styles.tableName}>📦 {name}</Text>
          {cols.map((col) => (
            <View key={col.cid} style={styles.colRow}>
              <Text style={styles.mono}>
                {col.pk ? '🔑' : '  '} {col.name}{' '}
                <Text style={styles.colType}>{col.type}</Text>
                {col.notnull ? ' NOT NULL' : ''}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#0D1B2A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1B2A' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#E8C97A' },
  btn: {
    backgroundColor: '#1A2D45',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C9A84C',
    alignItems: 'center',
    marginBottom: 16,
  },
  btnText: { color: '#E8C97A', fontWeight: '700', fontSize: 15 },
  error: { color: '#E07070', fontSize: 14, textAlign: 'center', marginVertical: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#C9A84C', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  tableName: { color: '#F0E6CC', fontSize: 15, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  card: { padding: 12, backgroundColor: '#1A2D45', marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: '#C9A84C33' },
  numeralId: { fontWeight: 'bold', color: '#E8C97A', marginBottom: 4 },
  colRow: { paddingVertical: 3, paddingLeft: 8 },
  mono: { color: '#F0E6CC', fontSize: 13, fontFamily: 'monospace' },
  colType: { color: '#888', fontSize: 12 },
});

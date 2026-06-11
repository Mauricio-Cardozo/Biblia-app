import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSQLiteContext } from 'expo-sqlite';
import type { CICNumeral } from '@/types';

export default function TestDatabase() {
  const db = useSQLiteContext();

  const [results, setResults] = useState<CICNumeral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => { runTest(); }, [runTest]);


  if (loading) return <ActivityIndicator size="large" style={styles.center} />;
  if (error) return <Text style={styles.center}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resultados para "Dios" (CIC)</Text>
      <FlashList
        data={results.slice(0, 5)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.numeralId}>Numeral {item.id}</Text>
            <Text>{item.texto.substring(0, 100)}...</Text>
          </View>
        )}
        estimatedItemSize={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  card: { padding: 15, backgroundColor: '#f9f9f9', marginBottom: 10, borderRadius: 8 },
  numeralId: { fontWeight: 'bold', color: '#666' }
});

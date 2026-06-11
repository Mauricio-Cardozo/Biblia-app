import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

interface ColumnInfo {
  cid: number; name: string; type: string;
  notnull: number; dflt_value: string | null; pk: number;
}

type SearchTarget = 'cic' | 'youcat';

interface SearchRow {
  id: number;
  titulo: string;
  preview: string;
}

export default function TestDatabase() {
  const db = useSQLiteContext();

  // ── Schema inspector ──
  const [tablas, setTablas] = useState<string[]>([]);
  const [esquema, setEsquema] = useState<Record<string, ColumnInfo[]>>({});
  const [loadingSchema, setLoadingSchema] = useState(false);

  // ── Search ──
  const [termino, setTermino] = useState('');
  const [target, setTarget] = useState<SearchTarget>('cic');
  const [searchResults, setSearchResults] = useState<SearchRow[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const inspeccionarEsquema = useCallback(async () => {
    setLoadingSchema(true);
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
    } finally {
      setLoadingSchema(false);
    }
  }, [db]);

  const ejecutarBusqueda = useCallback(async () => {
    const t = termino.trim();
    if (!t) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      let rows: SearchRow[];
      if (target === 'cic') {
        const data = await db.getAllAsync<{ id: number; texto: string }>(
          `SELECT c.id, c.texto FROM catecismo_cic c
           JOIN catecismo_cic_fts f ON c.id = f.id
           WHERE catecismo_cic_fts MATCH ?
           ORDER BY rank LIMIT 50`,
          [t],
        );
        rows = data.map((r) => ({
          id: r.id,
          titulo: `Numeral ${r.id}`,
          preview: r.texto?.slice(0, 120) ?? '',
        }));
      } else {
        const data = await db.getAllAsync<{ id: number; pregunta_nro: number; pregunta_texto: string; respuesta_texto: string }>(
          `SELECT y.id, y.pregunta_nro, y.pregunta_texto, y.respuesta_texto FROM youcat y
           JOIN youcat_fts f ON y.id = f.id
           WHERE youcat_fts MATCH ?
           ORDER BY rank LIMIT 50`,
          [t],
        );
        rows = data.map((r) => ({
          id: r.id,
          titulo: `Pregunta ${r.pregunta_nro}`,
          preview: `${r.pregunta_texto?.slice(0, 80)}… ${r.respuesta_texto?.slice(0, 60)}…`,
        }));
      }
      setSearchResults(rows);
    } catch (err) {
      console.error('Search error:', err);
      setSearchError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSearchLoading(false);
    }
  }, [db, termino, target]);

  const rebuildFTS = useCallback(async () => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      await db.execAsync("INSERT INTO youcat_fts(youcat_fts) VALUES('rebuild');");
      await db.execAsync("INSERT INTO catecismo_cic_fts(catecismo_cic_fts) VALUES('rebuild');");
      setSearchError(null);
      setSearchResults([]);
      alert('✅ FTS rebuild exitoso. Probá buscar de nuevo.');
    } catch (err) {
      console.error('Rebuild error:', err);
      setSearchError(`Error al rebuild: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSearchLoading(false);
    }
  }, [db]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.title}>🔍 Debug de Base de Datos</Text>

      {/* ── Search section ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Buscar</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.tabBtn, target === 'cic' && styles.tabBtnActive]}
            onPress={() => setTarget('cic')}
          >
            <Text style={[styles.tabBtnText, target === 'cic' && styles.tabBtnTextActive]}>CIC</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, target === 'youcat' && styles.tabBtnActive]}
            onPress={() => setTarget('youcat')}
          >
            <Text style={[styles.tabBtnText, target === 'youcat' && styles.tabBtnTextActive]}>YOUCAT</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Ej: Dios, amor, fe..."
          placeholderTextColor="#666"
          value={termino}
          onChangeText={setTermino}
          onSubmitEditing={ejecutarBusqueda}
          returnKeyType="search"
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

      {/* ── Search results ── */}
      {searchLoading && <ActivityIndicator size="large" color="#C9A84C" style={{ marginVertical: 20 }} />}
      {searchError && <Text style={styles.error}>{searchError}</Text>}
      {!searchLoading && searchResults.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {target === 'cic' ? 'CIC' : 'YOUCAT'} — {searchResults.length} resultados
          </Text>
          {searchResults.map((r) => (
            <View key={r.id} style={styles.resultRow}>
              <Text style={styles.resultId}>{r.titulo}</Text>
              <Text style={styles.resultPreview}>{r.preview}</Text>
            </View>
          ))}
        </View>
      )}
      {!searchLoading && !searchError && termino.trim() && searchResults.length === 0 && (
        <Text style={styles.muted}>Sin resultados para "{termino}"</Text>
      )}

      {/* ── Schema ── */}
      <TouchableOpacity style={styles.btn} onPress={inspeccionarEsquema}>
        <Text style={styles.btnText}>📋 Inspeccionar Esquema</Text>
      </TouchableOpacity>
      {loadingSchema && <ActivityIndicator size="large" color="#C9A84C" style={{ marginVertical: 10 }} />}

      {tablas.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tablas ({tablas.length})</Text>
          <Text style={styles.mono}>{tablas.join(', ')}</Text>
        </View>
      )}

      {Object.entries(esquema).map(([name, cols]) => (
        <View key={name} style={styles.card}>
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
  container: { flex: 1, padding: 16, paddingTop: 50, backgroundColor: '#0D1B2A' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#E8C97A' },
  card: {
    backgroundColor: '#1A2D45', padding: 14, borderRadius: 10,
    marginBottom: 14, borderWidth: 1, borderColor: '#C9A84C33',
  },
  cardTitle: { color: '#C9A84C', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  input: {
    backgroundColor: '#0D1B2A', color: '#F0E6CC', fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#C9A84C55', marginBottom: 10,
  },
  btn: {
    flex: 1, backgroundColor: '#1A2D45', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#C9A84C', alignItems: 'center',
  },
  btnSecondary: {
    flex: 1, backgroundColor: '#243B55', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#C9A84C55', alignItems: 'center',
  },
  btnText: { color: '#E8C97A', fontWeight: '700', fontSize: 14 },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 6,
    backgroundColor: '#0D1B2A', alignItems: 'center',
    borderWidth: 1, borderColor: '#C9A84C33',
  },
  tabBtnActive: { backgroundColor: '#C9A84C33', borderColor: '#C9A84C' },
  tabBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
  tabBtnTextActive: { color: '#E8C97A' },
  error: { color: '#E07070', fontSize: 14, textAlign: 'center', marginVertical: 10 },
  muted: { color: '#888', fontSize: 14, textAlign: 'center', marginVertical: 10 },
  tableName: { color: '#F0E6CC', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  resultRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0D1B2A' },
  resultId: { color: '#E8C97A', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  resultPreview: { color: '#F0E6CC', fontSize: 13, lineHeight: 18 },
  colRow: { paddingVertical: 2, paddingLeft: 4 },
  mono: { color: '#F0E6CC', fontSize: 12, fontFamily: 'monospace' },
  colType: { color: '#888', fontSize: 11 },
});
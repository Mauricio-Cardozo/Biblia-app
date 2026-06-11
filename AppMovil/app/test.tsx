import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { searchCIC, searchYoucat } from '@/db/db';
import type { CICNumeral, YoucatQuestion } from '@/types';

type SearchTarget = 'cic' | 'youcat';

export default function TestDatabase() {
  const db = useSQLiteContext();

  const [tablas, setTablas] = useState<string[]>([]);
  const [esquema, setEsquema] = useState<string>('');

  const [termino, setTermino] = useState('');
  const [target, setTarget] = useState<SearchTarget>('cic');
  const [searchResults, setSearchResults] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const inspeccionarEsquema = useCallback(async () => {
    try {
      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      );
      const names = tables.map((t) => t.name);
      setTablas(names);

      let info = '';
      for (const name of names) {
        if (name.endsWith('_config') || name.endsWith('_data') || name.endsWith('_docsize') || name.endsWith('_idx')) continue;
        const cols = await db.getAllAsync<{ cid: number; name: string; type: string; notnull: number; pk: number }>(
          `PRAGMA table_info(${name});`,
        );
        info += `\n📦 ${name}\n`;
        for (const col of cols) {
          info += `  ${col.pk ? '🔑' : '  '} ${col.name} ${col.type}${col.notnull ? ' NOT NULL' : ''}\n`;
        }
      }
      setEsquema(info);
    } catch (err) {
      console.error(err);
      setEsquema('Error al leer esquema');
    }
  }, [db]);

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
    try {
      await db.execAsync('DROP TABLE IF EXISTS youcat_fts;');
      await db.execAsync('DROP TABLE IF EXISTS catecismo_cic_fts;');
      await db.execAsync(`CREATE VIRTUAL TABLE youcat_fts USING fts5(
        id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo
      );`);
      await db.execAsync(`CREATE VIRTUAL TABLE catecismo_cic_fts USING fts5(
        id, parte, seccion, capitulo, articulo, texto
      );`);
      await db.execAsync(`INSERT INTO youcat_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo)
        SELECT rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo FROM youcat;`);
      await db.execAsync(`INSERT INTO catecismo_cic_fts(rowid, id, parte, seccion, capitulo, articulo, texto)
        SELECT rowid, id, parte, seccion, capitulo, articulo, texto FROM catecismo_cic;`);
      setSearchResults('✅ FTS rebuild exitoso');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Rebuild error:', err);
      setSearchError(`Error en rebuild: ${msg}`);
    } finally {
      setSearchLoading(false);
    }
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

      <TouchableOpacity style={styles.btn} onPress={inspeccionarEsquema}>
        <Text style={styles.btnText}>📋 Inspeccionar Esquema</Text>
      </TouchableOpacity>

      {tablas.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tablas ({tablas.length})</Text>
          <Text style={styles.mono}>{tablas.join(', ')}</Text>
        </View>
      )}

      {esquema !== '' && (
        <View style={styles.card}>
          <Text style={styles.mono}>{esquema}</Text>
        </View>
      )}
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
  btnText: { color: '#E8C97A', fontWeight: '700', fontSize: 14 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: '#0D1B2A', alignItems: 'center', borderWidth: 1, borderColor: '#C9A84C33' },
  tabBtnActive: { backgroundColor: '#C9A84C33', borderColor: '#C9A84C' },
  tabBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
  tabBtnTextActive: { color: '#E8C97A' },
  error: { color: '#E07070', fontSize: 14, textAlign: 'center', marginVertical: 10 },
  resultText: { color: '#F0E6CC', fontSize: 13, fontFamily: 'monospace', lineHeight: 20 },
  mono: { color: '#F0E6CC', fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
});

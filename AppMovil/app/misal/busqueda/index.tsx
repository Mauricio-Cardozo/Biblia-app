import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { searchMisalTodo } from "@/db/db";
import { useSQLiteContext } from "expo-sqlite";
import type { MisalSearchResult } from "@/types";

const TIPO_EMOJI: Record<string, string> = { propio: "📅", ordinario: "📖", prefacio: "✋", plegaria: "🍞" };

export default function BusquedaScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MisalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const buscar = useCallback(async (termino: string) => {
    if (!termino.trim()) { setResults([]); setError(null); return; }
    setLoading(true); setError(null);
    try {
      const rows = await searchMisalTodo(db, termino);
      setResults(rows);
      if (rows.length === 0) setError("Sin resultados.");
    } catch (e: unknown) {
      setError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(false);
  }, [db]);

  const irAResultado = (item: MisalSearchResult) => {
    const path = item.tipo === 'propio' ? `/misal/propio/${item.id}`
      : item.tipo === 'ordinario' ? `/misal/ordinario/${item.id}`
      : item.tipo === 'prefacio' ? `/misal/prefacios/${item.id}`
      : `/misal/plegarias/${item.id}`;
    router.push(path as any);
  };

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Buscar en Misal" showBack onBack={() => router.back()} />
      <View style={s.buscadorRow}>
        <View style={s.buscador}>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Buscá en el Misal…"
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => buscar(query)}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setResults([]); setError(null); }} style={s.clearBtn}>
              <ThemedText style={s.clearText}>✕</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {loading ? (
        <View style={[sharedStyles.center, { flex: 1 }]}><ActivityIndicator color={C.gold} /></View>
      ) : (
        <FlashList
          data={results}
          keyExtractor={(item) => `${item.tipo}-${item.id}`}
          contentContainerStyle={sharedStyles.content}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={80}
          ItemSeparatorComponent={() => <View style={{ height: S.sm }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => irAResultado(item)} activeOpacity={0.7}>
              <View style={s.cardRow}>
                <ThemedText style={s.emoji}>{TIPO_EMOJI[item.tipo] ?? "📄"}</ThemedText>
                <View style={s.cardTextWrap}>
                  <ThemedText style={s.title} numberOfLines={1}>{item.titulo}</ThemedText>
                  <ThemedText style={s.preview} numberOfLines={2}>{item.preview}</ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={error ? <ThemedText style={s.empty}>{error}</ThemedText> : null}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  buscadorRow: { marginHorizontal: S.lg, marginVertical: S.sm },
  buscador: { flexDirection: "row", alignItems: "center", backgroundColor: C.navyMid, borderRadius: R.md, borderWidth: 1, borderColor: C.goldDim, paddingHorizontal: 14 },
  input: { flex: 1, color: C.text, fontSize: 15, paddingVertical: S.md },
  clearBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.navyLight, alignItems: "center", justifyContent: "center", marginLeft: S.sm },
  clearText: { color: C.muted, fontSize: 12 },
  empty: { color: C.muted, fontSize: 14, textAlign: "center", paddingVertical: S.huge },
  card: { backgroundColor: C.navyMid, borderRadius: R.lg, padding: S.md },
  cardRow: { flexDirection: "row", alignItems: "flex-start" },
  emoji: { fontSize: 24, marginRight: S.md, marginTop: 2 },
  cardTextWrap: { flex: 1 },
  title: { color: C.gold, fontSize: 14, fontWeight: "600" },
  preview: { color: C.text, fontSize: 13, lineHeight: 19, marginTop: S.xs },
});

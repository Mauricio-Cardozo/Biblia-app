import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import { getFavoritos, type Favorito } from "@/data/favoritos";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RUTAS: Record<Favorito["tipo"], string> = {
  biblia: "/biblia",
  cic: "/catecismo",
  youcat: "/youcat",
  evangelio: "/evangelio",
};

export default function FavoritosScreen() {
  const insets = useSafeAreaInsets();
  const [favs, setFavs] = useState<Favorito[]>([]);

  const recargar = useCallback(async () => {
    setFavs(await getFavoritos());
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={styles.backArrow}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Favoritos</ThemedText>
      </View>

      <FlatList
        data={favs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ThemedText style={styles.empty}>Sin favoritos todavía</ThemedText>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(RUTAS[item.tipo])}
            activeOpacity={0.75}
          >
            <View style={styles.cardBody}>
              <ThemedText style={styles.cardTipo}>{item.tipo.toUpperCase()}</ThemedText>
              <ThemedText style={styles.cardRef}>{item.referencia}</ThemedText>
              <ThemedText style={styles.cardPreview} numberOfLines={2}>
                {item.preview}
              </ThemedText>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.goldDim,
  },
  backBtn: { paddingRight: 12, paddingVertical: 4 },
  backArrow: { color: C.gold, fontSize: 22, lineHeight: 24 },
  title: { color: C.gold, fontSize: 18, fontWeight: "700", flex: 1 },
  list: { padding: 12 },
  empty: { color: C.muted, fontSize: 14, textAlign: "center", paddingVertical: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.navyMid,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.sep,
  },
  cardBody: { flex: 1 },
  cardTipo: { color: C.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  cardRef: { color: C.text, fontSize: 14, fontWeight: "600" },
  cardPreview: { color: C.muted, fontSize: 12, marginTop: 3, lineHeight: 16 },
  chevron: { color: C.gold, fontSize: 22, marginLeft: 8 },
});

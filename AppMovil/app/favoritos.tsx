import { C } from "@/constants/theme";
import { S } from '@/constants/spacing';
import { ThemedText } from "@/components/themed-text";
import ScreenHeader from "@/components/ui/screen-header";
import ListItemCard from "@/components/ui/list-item-card";
import { router } from "expo-router";
import { getFavoritos, type Favorito } from "@/data/favoritos";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RUTAS: Record<Favorito["tipo"], string> = {
  biblia: "/biblia",
  cic: "/catecismo",
  evangelio: "/evangelio",
};

export default function FavoritosScreen() {
  const insets = useSafeAreaInsets();
  const [favs, setFavs] = useState<Favorito[]>([]);

  useEffect(() => {
    (async () => { setFavs(await getFavoritos()); })();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Favoritos" showBack onBack={() => router.back()} />

      <FlashList
        data={favs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ThemedText style={styles.empty}>Sin favoritos todavía</ThemedText>
        }
        renderItem={({ item }) => (
          <ListItemCard
            title={item.referencia}
            subtitle={item.preview}
            onPress={() => router.push((item.tipo === "evangelio" ? `/evangelio?fecha=${item.id.replace("evangelio-", "")}` : RUTAS[item.tipo]) as any)}
            rightSlot={
              <ThemedText style={styles.cardTipo}>{item.tipo.toUpperCase()}</ThemedText>
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  list: { padding: S.lg },
  empty: { color: C.muted, fontSize: 14, textAlign: "center", paddingVertical: S.huge },
  cardTipo: { color: C.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
});

import { ThemedText } from "@/components/themed-text";
import { addFavorito, getFavoritos, removeFavorito, type Favorito } from "@/data/favoritos";
import React, { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";

interface Props {
  favorito: Favorito;
}

export default function FavBtn({ favorito }: Props) {
  const [activo, setActivo] = useState(false);
  const [stored, setStored] = useState<Favorito | null>(null);

  useEffect(() => {
    (async () => {
      const favs = await getFavoritos();
      const f = favs.find((x) => x.id === favorito.id);
      setActivo(!!f);
      setStored(f ?? null);
    })();
  }, [favorito.id]);

  const toggle = useCallback(async () => {
    try {
      if (activo) {
        await removeFavorito(favorito.id);
        setActivo(false);
        setStored(null);
      } else {
        const f = { ...favorito, timestamp: Date.now() };
        await addFavorito(f);
        setActivo(true);
        setStored(f);
      }
    } catch (e: unknown) {
      console.warn('[fav] toggle error:', e instanceof Error ? e.message : e);
    }
  }, [activo, favorito]);

  return (
    <TouchableOpacity onPress={toggle} style={styles.btn} activeOpacity={0.7}>
      {stored?.color ? <View style={[styles.dot, { backgroundColor: stored.color }]} /> : null}
      <ThemedText style={[styles.icon, activo && styles.activo]}>
        {activo ? "❤️" : "🤍"}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  icon: { fontSize: 20, lineHeight: 24 },
  activo: {},
});

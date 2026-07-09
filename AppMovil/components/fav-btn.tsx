import { S } from '@/constants/spacing';
import { ThemedText } from "@/components/themed-text";
import { addFavorito, isFavorito, removeFavorito, type Favorito } from "@/data/favoritos";
import React, { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  favorito: Favorito;
}

export default function FavBtn({ favorito }: Props) {
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    isFavorito(favorito.id).then(setActivo);
  }, [favorito.id]);

  const toggle = useCallback(async () => {
    if (activo) {
      await removeFavorito(favorito.id);
      setActivo(false);
    } else {
      await addFavorito({ ...favorito, timestamp: Date.now() });
      setActivo(true);
    }
  }, [activo, favorito]);

  return (
    <TouchableOpacity onPress={toggle} style={styles.btn} activeOpacity={0.7}>
      <ThemedText style={[styles.icon, activo && styles.activo]}>
        {activo ? "❤️" : "🤍"}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: S.xs },
  icon: { fontSize: 20, lineHeight: 24 },
  activo: {},
});

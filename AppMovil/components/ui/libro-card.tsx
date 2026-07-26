import { ThemedText } from "@/components/themed-text";
import { C } from "@/constants/theme";
import { S } from "@/constants/spacing";
import { R } from "@/constants/radius";
import type { Book } from "@/types";
import React, { useState } from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";

export const ABREVIATURAS: Record<string, string> = {
  "Génesis": "Gn", "Éxodo": "Éx", "Levítico": "Lv", "Números": "Nm",
  "Deuteronomio": "Dt", "Josué": "Jos", "Jueces": "Jue", "Rut": "Rut",
  "1 Samuel": "1 Sm", "2 Samuel": "2 Sm", "1 Reyes": "1 Re", "2 Reyes": "2 Re",
  "1 Crónicas": "1 Cr", "2 Crónicas": "2 Cr", "Esdras": "Esd", "Nehemías": "Ne",
  "Tobías": "Tb", "Judit": "Jdt", "Ester": "Est", "1 Macabeos": "1 Mac",
  "2 Macabeos": "2 Mac", "Job": "Job", "Salmos": "Sal", "Proverbios": "Prov",
  "Eclesiastés": "Ecl", "Cantar de los Cantares": "Cant", "Sabiduría": "Sab",
  "Eclesiástico": "Sir", "Isaías": "Is", "Jeremías": "Jr", "Lamentaciones": "Lam",
  "Baruc": "Bar", "Ezequiel": "Ez", "Daniel": "Dn", "Oseas": "Os",
  "Joel": "Jl", "Amós": "Am", "Abdías": "Abd", "Jonás": "Jon",
  "Miqueas": "Miq", "Nahúm": "Na", "Habacuc": "Hab", "Sofonías": "Sof",
  "Ageo": "Ag", "Zacarías": "Za", "Malaquías": "Mal",
  "Mateo": "Mt", "Marcos": "Mc", "Lucas": "Lc", "Juan": "Jn",
  "Hechos de los Apóstoles": "Hch", "Romanos": "Rom", "1 Corintios": "1 Cor",
  "2 Corintios": "2 Cor", "Gálatas": "Gal", "Efesios": "Ef", "Filipenses": "Fil",
  "Colosenses": "Col", "1 Tesalonicenses": "1 Tes", "2 Tesalonicenses": "2 Tes",
  "1 Timoteo": "1 Tim", "2 Timoteo": "2 Tim", "Tito": "Tit", "Filemón": "Flm",
  "Hebreos": "Heb", "Santiago": "Sant", "1 Pedro": "1 Pe", "2 Pedro": "2 Pe",
  "1 Juan": "1 Jn", "2 Juan": "2 Jn", "3 Juan": "3 Jn", "Judas": "Jds",
  "Apocalipsis": "Ap",
};

export const abrev = (libro: string) => ABREVIATURAS[libro] ?? libro.slice(0, 3);

interface LibroCardProps {
  item: Book;
  onPress: () => void;
}

export default function LibroCard({ item, onPress }: LibroCardProps) {
  const [scale] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[s.libroCardWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={s.libroCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <ThemedText style={s.libroAbr}>{abrev(item.libro)}</ThemedText>
        <ThemedText style={s.libroNombre} numberOfLines={1}>{item.libro}</ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  libroCardWrapper: { flex: 1, margin: 6 },
  libroCard: {
    backgroundColor: C.navyMid,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.sep,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: S.sm,
  },
  libroAbr: { color: C.gold, fontSize: 28, fontWeight: "800" },
  libroNombre: { color: C.muted, fontSize: 13, marginTop: S.xs, textAlign: "center" },
});

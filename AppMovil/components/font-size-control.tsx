import { C } from '@/constants/theme';
import { R } from '@/constants/radius';
import { ThemedText } from "@/components/themed-text";
import { useFontSize } from "@/contexts/font-size";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function FontSizeControl() {
  const { multiplier, aumentar, disminuir, reset } = useFontSize();

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={disminuir} style={styles.btn}>
        <ThemedText style={styles.label}>A-</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={reset} style={styles.valBtn}>
        <ThemedText style={styles.val}>{Math.round(multiplier * 100)}%</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={aumentar} style={styles.btn}>
        <ThemedText style={styles.label}>A+</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btn: {
    width: 30,
    height: 30,
    borderRadius: R.md,
    backgroundColor: C.navyLight,
    borderWidth: 1,
    borderColor: C.goldDim,
    alignItems: "center",
    justifyContent: "center",
  },
  valBtn: {
    paddingHorizontal: 8,
    height: 24,
    borderRadius: R.sm,
    backgroundColor: C.navyLight,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: C.gold,
    fontSize: 11,
    fontWeight: "700",
  },
  val: {
    color: C.goldLight,
    fontSize: 10,
    fontWeight: "600",
  },
});

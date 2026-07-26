import { ThemedText } from "@/components/themed-text";
import { C } from "@/constants/theme";
import { S } from "@/constants/spacing";
import { R } from "@/constants/radius";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface BuscadorProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  inputRef?: React.Ref<TextInput>;
  rightSlot?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function Buscador({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = "Buscar…",
  inputRef,
  rightSlot,
  containerStyle,
}: BuscadorProps) {
  return (
    <View style={[styles.buscadorRow, containerStyle]}>
      <View style={styles.buscador}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearBtn} activeOpacity={0.7}>
            <ThemedText style={styles.clearText}>✕</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      {rightSlot}
    </View>
  );
}

const styles = StyleSheet.create({
  buscadorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    marginHorizontal: S.lg,
    marginVertical: S.sm,
  },
  buscador: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.navyMid,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.goldDim,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    paddingVertical: S.md,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.navyLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: S.sm,
  },
  clearText: {
    color: C.muted,
    fontSize: 12,
  },
});

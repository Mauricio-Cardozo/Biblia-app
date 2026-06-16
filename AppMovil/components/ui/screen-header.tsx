import { C } from "@/constants/theme";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";

interface Props {
  superLabel?: string;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

export default function ScreenHeader({
  superLabel,
  title,
  subtitle,
  showBack,
  onBack,
  rightSlot,
}: Props) {
  return (
    <View style={s.header}>
      {showBack && (
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
          <ThemedText style={s.backArrow}>←</ThemedText>
        </TouchableOpacity>
      )}
      <View style={s.textWrap}>
        {superLabel && (
          <ThemedText style={s.superLabel}>{superLabel}</ThemedText>
        )}
        <ThemedText style={s.titleText} numberOfLines={2}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText style={s.subtitleText}>{subtitle}</ThemedText>
        )}
      </View>
      {rightSlot && <View style={s.rightSlot}>{rightSlot}</View>}
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.navyMid,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 12 : 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.goldDim,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.navyLight,
    borderWidth: 1,
    borderColor: C.goldDim,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { color: C.gold, fontSize: 20, lineHeight: 22 },
  textWrap: { flex: 1 },
  superLabel: {
    color: C.gold,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "600",
  },
  titleText: {
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  subtitleText: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
  rightSlot: { marginLeft: "auto" },
});

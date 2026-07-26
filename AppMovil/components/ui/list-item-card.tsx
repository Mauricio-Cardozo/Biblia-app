import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import React, { useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";

interface Props {
  index?: number;
  title: string;
  subtitle?: string;
  subtitleRight?: string;
  onPress?: () => void;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
}

export default function ListItemCard({
  index,
  title,
  subtitle,
  subtitleRight,
  onPress,
  disabled,
  rightSlot,
}: Props) {
  const [scale] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const content = (
    <View style={s.inner}>
      {index !== undefined && (
        <View style={s.badge}>
          <ThemedText style={s.badgeText}>{index}</ThemedText>
        </View>
      )}
      <View style={s.body}>
        <ThemedText style={s.title} numberOfLines={2}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText style={s.subtitle} numberOfLines={2}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      {subtitleRight && (
        <ThemedText style={s.subRight}>{subtitleRight}</ThemedText>
      )}
      {rightSlot}
      <ThemedText style={s.chevron}>›</ThemedText>
    </View>
  );

  if (disabled) {
    return <View style={[s.card, s.disabled]}>{content}</View>;
  }

  return (
    <Animated.View style={[s.card, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.navyMid,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.sep,
    marginBottom: 6,
  },
  disabled: { opacity: 0.5 },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: S.md,
    paddingHorizontal: S.md,
    gap: S.md,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: R.md,
    backgroundColor: C.goldDim,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: C.goldLight,
    fontSize: 13,
    fontWeight: "800",
  },
  body: { flex: 1 },
  title: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  subtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  subRight: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  chevron: {
    color: C.gold,
    fontSize: 22,
  },
});

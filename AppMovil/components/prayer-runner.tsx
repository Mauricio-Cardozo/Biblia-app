import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import FontSizeControl from "@/components/font-size-control";
import { useFontSize, fs } from "@/contexts/font-size";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Step } from "@/data/prayers";

interface Props {
  pasos: Step[];
  storageKey: string;
  title: string;
  onBack?: () => void;
}

export default function PrayerRunner({ pasos, storageKey, title, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { multiplier } = useFontSize();

  const [stepIndex, setStepIndex] = useState(0);
  const [completado, setCompletado] = useState(false);

  const step = pasos[stepIndex];
  const total = pasos.length;

  const currentMystery = step.mysteryIndex ?? -1;
  const avesCompletadas = pasos
    .slice(0, stepIndex + 1)
    .filter((s) => s.mysteryIndex === currentMystery && (s.hailMaryIndex ?? 0) > 0).length;

  const handleSiguiente = useCallback(() => {
    if (stepIndex < total - 1) {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex, total]);

  useEffect(() => {
    if (step.id === "completado" && !completado) {
      setCompletado(true);
      const hoy = new Date();
      const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
      AsyncStorage.setItem(storageKey, fecha).catch(() => {});
      const statsKey = "stats_" + storageKey.replace("racha_", "");
      AsyncStorage.getItem(statsKey).then((val) => {
        const n = val ? parseInt(val, 10) + 1 : 1;
        AsyncStorage.setItem(statsKey, String(n)).catch(() => {});
      }).catch(() => {});
    }
  }, [step.id, completado, storageKey]);

  const showBeads = currentMystery >= 0 && step.id !== "completado";
  const mysteryLabel = showBeads && step.subtitle ? step.subtitle : "";

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <ThemedText style={s.backArrow}>←</ThemedText>
        </TouchableOpacity>
        <View style={s.headerTextWrap}>
          <ThemedText style={s.headerTitle}>{title}</ThemedText>
          <ThemedText style={s.headerProgreso}>
            Paso {Math.min(stepIndex + 1, total)} de {total}
          </ThemedText>
        </View>
        <FontSizeControl />
      </View>

      {showBeads && (
        <View style={s.beadsContainer}>
          <ThemedText style={s.beadsLabel}>{mysteryLabel}</ThemedText>
          <View style={s.beadsRow}>
            {Array.from({ length: 10 }, (_, i) => (
              <View
                key={i}
                style={[s.bead, i < avesCompletadas ? s.beadActivo : s.beadInactivo]}
              />
            ))}
          </View>
        </View>
      )}

      <ScrollView
        style={s.contentArea}
        contentContainerStyle={s.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={step.id}
          entering={FadeIn.duration(350)}
          exiting={FadeOut.duration(200)}
        >
          <View style={s.stepBadge}>
            <ThemedText style={s.stepBadgeText}>{step.title}</ThemedText>
          </View>

          {step.subtitle && !showBeads ? (
            <ThemedText style={s.subtitle}>{step.subtitle}</ThemedText>
          ) : null}

          <ThemedText style={[s.prayerText, { fontSize: fs(17, multiplier), lineHeight: fs(30, multiplier) }]}>{step.text}</ThemedText>
        </Animated.View>
      </ScrollView>

      {step.id !== "completado" ? (
        <View style={s.footer}>
          <TouchableOpacity
            style={s.nextBtn}
            onPress={handleSiguiente}
            activeOpacity={0.8}
          >
            <ThemedText style={s.nextBtnText}>Amén · Siguiente</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.footer}>
          <TouchableOpacity
            style={s.nextBtn}
            onPress={() => setStepIndex(0)}
            activeOpacity={0.8}
          >
            <ThemedText style={s.nextBtnText}>Rezar de nuevo</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.goldDim,
  },
  backBtn: { paddingRight: 12, paddingVertical: 4 },
  backArrow: { color: C.gold, fontSize: 22, lineHeight: 24 },
  headerTextWrap: { flex: 1 },
  headerTitle: { color: C.gold, fontSize: 18, fontWeight: "700" },
  headerProgreso: { color: C.muted, fontSize: 12 },
  beadsContainer: {
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.sep,
  },
  beadsLabel: { color: C.goldLight, fontSize: 11, fontWeight: "600", marginBottom: 8, letterSpacing: 0.5 },
  beadsRow: { flexDirection: "row", gap: 6 },
  bead: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
  beadActivo: { backgroundColor: C.gold, borderColor: C.goldLight },
  beadInactivo: { backgroundColor: C.navyLight, borderColor: C.goldDim },
  contentArea: { flex: 1 },
  contentInner: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 20 },
  stepBadge: { alignSelf: "flex-start", backgroundColor: C.goldDim, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16 },
  stepBadgeText: { color: C.goldLight, fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  subtitle: { color: C.muted, fontSize: 12, fontStyle: "italic", marginBottom: 12 },
  prayerText: { color: C.text, fontSize: 17, lineHeight: 30, textAlign: "center" },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "android" ? 16 : 32,
    backgroundColor: C.navy,
    borderTopWidth: 1,
    borderTopColor: C.goldDim,
  },
  nextBtn: {
    backgroundColor: C.goldDim,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.gold,
  },
  nextBtnText: { color: C.goldLight, fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});

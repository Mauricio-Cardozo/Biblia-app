import { C } from '@/constants/theme';
import { R } from '@/constants/radius';
import { ThemedText } from "@/components/themed-text";
import ScreenHeader from "@/components/ui/screen-header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import FontSizeControl from "@/components/font-size-control";
import { useFontSize, fs } from "@/contexts/font-size";
import { getPrefSilencio } from "@/data/notifications";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import React, { useCallback, useEffect, useState } from "react";
import {
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
  const [ready, setReady] = useState(false);
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

  const handleAnterior = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    (async () => {
      if (await getPrefSilencio()) {
        // ponytail: screen-awake only, no system DND (needs setInterruptionFilterAsync from expo-notifications ≥ v57)
        await activateKeepAwakeAsync();
      }
    })();
    return () => deactivateKeepAwake();
  }, []);

  useEffect(() => {
    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    AsyncStorage.getItem(storageKey + "_saved_date").then((savedDate) => {
      if (savedDate === fecha) {
        return AsyncStorage.getItem(storageKey + "_saved_step");
      }
      return null;
    }).then((savedStep) => {
      if (savedStep) {
        const idx = parseInt(savedStep, 10);
        if (idx > 0 && idx < total) setStepIndex(idx);
      }
    }).finally(() => setReady(true)).catch(() => setReady(true));
  }, [storageKey, total]);

  useEffect(() => {
    if (ready && !completado) {
      const hoy = new Date();
      const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
      AsyncStorage.setItem(storageKey + "_saved_date", fecha).catch(() => {});
      AsyncStorage.setItem(storageKey + "_saved_step", String(stepIndex)).catch(() => {});
    }
  }, [stepIndex, ready, completado, storageKey]);

  useEffect(() => {
    if (step.id === "completado" && !completado) {
      const t = setTimeout(() => setCompletado(true), 0);
      (async () => {
        const hoy = new Date();
        const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

        const prayerName = storageKey.includes("rosario") ? "rosario" : "coronilla";
        const countKey = storageKey.replace("_ultima", "_count");
        const statsKey = "stats_" + prayerName + "_total";

        const lastDate = await AsyncStorage.getItem(storageKey);
        const hoyLocal = new Date(); hoyLocal.setHours(0, 0, 0, 0);
        const last = lastDate ? new Date(lastDate + "T00:00:00") : null;
        const diff = last ? Math.floor((hoyLocal.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)) : -1;

        let streak = 1;
        if (diff === 0) {
          const existing = await AsyncStorage.getItem(countKey);
          streak = parseInt(existing || "1", 10);
        } else if (diff === 1) {
          const existing = await AsyncStorage.getItem(countKey);
          streak = (parseInt(existing || "1", 10)) + 1;
        }

        await AsyncStorage.setItem(storageKey, fecha);
        await AsyncStorage.setItem(countKey, String(streak));

        const statsVal = await AsyncStorage.getItem(statsKey);
        const newTotal = statsVal ? parseInt(statsVal, 10) + 1 : 1;
        await AsyncStorage.setItem(statsKey, String(newTotal));

        await AsyncStorage.removeItem(storageKey + "_saved_step");
        await AsyncStorage.removeItem(storageKey + "_saved_date");
      })().catch(() => {});
      return () => clearTimeout(t);
    }
  }, [step.id, completado, storageKey]);

  if (!ready) return null;

  const showBeads = currentMystery >= 0 && step.id !== "completado";
  const mysteryLabel = showBeads && step.subtitle ? step.subtitle : "";

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <ScreenHeader
        title={title}
        subtitle={`Paso ${Math.min(stepIndex + 1, total)} de ${total}`}
        showBack
        onBack={onBack}
        rightSlot={<FontSizeControl />}
      />

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
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={s.footerRow}>
            {stepIndex > 0 && (
              <TouchableOpacity
                style={s.prevBtn}
                onPress={handleAnterior}
                activeOpacity={0.8}
              >
                <ThemedText style={s.prevBtnText}>← Anterior</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.nextBtn, stepIndex > 0 && s.nextBtnFlex]}
              onPress={handleSiguiente}
              activeOpacity={0.8}
            >
              <ThemedText style={s.nextBtnText}>Amén · Siguiente</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
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
  stepBadge: { alignSelf: "flex-start", backgroundColor: C.goldDim, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16 },
  stepBadgeText: { color: C.goldLight, fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  subtitle: { color: C.muted, fontSize: 12, fontStyle: "italic", marginBottom: 12 },
  prayerText: { color: C.text, fontSize: 17, lineHeight: 30, textAlign: "center" },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: C.navy,
    borderTopWidth: 1,
    borderTopColor: C.goldDim,
  },
  footerRow: { flexDirection: "row", gap: 12 },
  prevBtn: {
    flex: 1,
    backgroundColor: C.navyLight,
    borderRadius: R.lg,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.goldDim,
  },
  prevBtnText: { color: C.muted, fontSize: 16, fontWeight: "600" },
  nextBtn: {
    backgroundColor: C.goldDim,
    borderRadius: R.lg,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.gold,
  },
  nextBtnFlex: { flex: 1 },
  nextBtnText: { color: C.goldLight, fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});

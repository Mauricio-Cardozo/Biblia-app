import PrayerRunner from "@/components/prayer-runner";
import { generarPasosCoronilla } from "@/data/coronilla-steps";
import { router } from "expo-router";
import React, { useMemo } from "react";

export default function CoronillaScreen() {
  const pasos = useMemo(() => generarPasosCoronilla(), []);

  return (
    <PrayerRunner
      pasos={pasos}
      storageKey="racha_coronilla_ultima"
      title="Coronilla"
      onBack={() => router.back()}
    />
  );
}

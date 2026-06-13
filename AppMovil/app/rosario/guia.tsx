import PrayerRunner from "@/components/prayer-runner";
import { generarPasosRosario } from "@/data/rosario-steps";
import { router } from "expo-router";
import React, { useMemo } from "react";

export default function RosarioGuiaScreen() {
  const pasos = useMemo(() => generarPasosRosario(), []);

  return (
    <PrayerRunner
      pasos={pasos}
      storageKey="racha_rosario_ultima"
      title="Santo Rosario"
      onBack={() => router.back()}
    />
  );
}

import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";
import { getLecturaDelDia } from "@/db/db";
import type { Lectura } from "@/types";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatoFecha(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${dias[fecha.getDay()]}, ${d} de ${meses[fecha.getMonth()]} ${y}`;
}

function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function SeccionLectura({
  label,
  referencia,
  texto,
}: {
  label: string;
  referencia?: string | null;
  texto: string;
}) {
  return (
    <View style={s.seccion}>
      <ThemedText style={s.seccionLabel}>{label}</ThemedText>
      {referencia ? <ThemedText style={s.referencia}>{referencia}</ThemedText> : null}
      <ThemedText style={s.texto}>{texto}</ThemedText>
    </View>
  );
}

export default function EvangelioScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLecturaDelDia(db, hoy());
      setLectura(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) {
    return (
      <View style={[s.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  if (error || !lectura) {
    return (
      <View style={[s.centered, { paddingTop: insets.top }]}>
        <ThemedText style={s.errorText}>
          {error ?? "No hay lecturas para hoy."}
        </ThemedText>
        <TouchableOpacity onPress={cargar} style={s.reintentarBtn}>
          <ThemedText style={s.reintentarText}>Reintentar</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top }]}
      contentContainerStyle={s.content}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ThemedText style={s.backArrow}>←</ThemedText>
        </TouchableOpacity>
        <View style={s.headerTextWrap}>
          <ThemedText style={s.headerTitle}>Evangelio del día</ThemedText>
          <ThemedText style={s.headerFecha}>{formatoFecha(lectura.fecha)}</ThemedText>
        </View>
      </View>

      {/* Título de la misa */}
      {lectura.titulo_misa ? (
        <ThemedText style={s.tituloMisa}>{lectura.titulo_misa}</ThemedText>
      ) : null}

      {/* Primera Lectura */}
      {lectura.primera_lectura ? (
        <SeccionLectura
          label="Primera Lectura"
          referencia={lectura.primera_lectura_ref}
          texto={lectura.primera_lectura}
        />
      ) : null}

      {/* Salmo */}
      {lectura.salmo ? (
        <SeccionLectura label="Salmo Responsorial" texto={lectura.salmo} />
      ) : null}

      {/* Aleluya */}
      {lectura.aleluia ? (
        <SeccionLectura label="Aleluya" texto={lectura.aleluia} />
      ) : null}

      {/* Evangelio */}
      {lectura.evangelio ? (
        <SeccionLectura
          label="Evangelio"
          referencia={lectura.evangelio_ref}
          texto={lectura.evangelio}
        />
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  content: { paddingBottom: 48 },
  centered: { flex: 1, backgroundColor: C.navy, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  errorText: { color: C.error, fontSize: 15, textAlign: "center", marginBottom: 16 },
  reintentarBtn: { backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  reintentarText: { color: C.navy, fontWeight: "700", fontSize: 14 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.sep,
  },
  backBtn: { paddingRight: 12, paddingVertical: 4 },
  backArrow: { color: C.gold, fontSize: 22, lineHeight: 24 },
  headerTextWrap: { flex: 1 },
  headerTitle: { color: C.gold, fontSize: 18, fontWeight: "700" },
  headerFecha: { color: C.muted, fontSize: 12, marginTop: 2 },

  tituloMisa: {
    color: C.goldLight,
    fontSize: 20,
    fontWeight: "700",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },

  seccion: { marginTop: 24, marginHorizontal: 20 },
  seccionLabel: {
    color: C.gold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  referencia: {
    color: C.goldLight,
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 8,
  },
  texto: {
    color: C.text,
    fontSize: 15,
    lineHeight: 24,
  },
});

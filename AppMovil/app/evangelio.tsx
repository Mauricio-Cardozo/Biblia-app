import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import ScreenHeader from "@/components/ui/screen-header";
import { useSQLiteContext } from "expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import { getLecturaDelDia } from "@/db/db";
import FavBtn from "@/components/fav-btn";
import FontSizeControl from "@/components/font-size-control";
import { useFontSize, fs } from "@/contexts/font-size";
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
  const { multiplier } = useFontSize();
  return (
    <View style={s.seccion}>
      <ThemedText style={s.seccionLabel}>{label}</ThemedText>
      {referencia ? <ThemedText style={[s.referencia, { fontSize: fs(14, multiplier) }]}>{referencia}</ThemedText> : null}
      <ThemedText style={[s.texto, { fontSize: fs(15, multiplier), lineHeight: fs(24, multiplier) }]}>{texto}</ThemedText>
    </View>
  );
}

export default function EvangelioScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { fecha: fechaParam } = useLocalSearchParams<{ fecha?: string }>();

  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const targetDate = fechaParam ?? hoy();
      const data = await getLecturaDelDia(db, targetDate);
      setLectura(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [db, fechaParam]);

  useEffect(() => { cargar(); }, [cargar, fechaParam]);

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
      <ScreenHeader
        title="Evangelio del día"
        subtitle={formatoFecha(lectura.fecha)}
        showBack
        onBack={() => router.back()}
        rightSlot={
          <View style={s.headerRight}>
            <FontSizeControl />
            <TouchableOpacity onPress={() => router.push("/calendario")} style={s.calBtn}>
              <ThemedText style={{ color: C.gold, fontSize: 20 }}>📅</ThemedText>
            </TouchableOpacity>
            <FavBtn
              favorito={{
                id: `evangelio-${lectura.fecha}`,
                tipo: "evangelio",
                referencia: `Evangelio ${lectura.fecha}`,
                preview: lectura.evangelio?.slice(0, 80) ?? "",
                timestamp: Date.now(),
              }}
            />
          </View>
        }
      />

      {lectura.titulo_misa ? (
        <ThemedText style={s.tituloMisa}>{lectura.titulo_misa}</ThemedText>
      ) : null}

      {lectura.primera_lectura ? (
        <SeccionLectura
          label="Primera Lectura"
          referencia={lectura.primera_lectura_ref}
          texto={lectura.primera_lectura}
        />
      ) : null}

      {lectura.salmo ? (
        <SeccionLectura label="Salmo Responsorial" texto={lectura.salmo} />
      ) : null}

      {lectura.aleluia ? (
        <SeccionLectura label="Aleluya" texto={lectura.aleluia} />
      ) : null}

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
  reintentarBtn: { backgroundColor: C.gold, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  reintentarText: { color: C.navy, fontWeight: "700", fontSize: 14 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  calBtn: { padding: 4 },
  tituloMisa: {
    color: C.goldLight,
    fontSize: 20,
    fontWeight: "700",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  seccion: { marginTop: 24, marginHorizontal: 16 },
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

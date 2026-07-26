import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import ScreenHeader from "@/components/ui/screen-header";
import ReadingSection from "@/components/reading-section";
import { router, useLocalSearchParams } from "expo-router";
import { getLecturaDelDia } from "@/db/db";
import FavBtn from "@/components/fav-btn";
import FontSizeControl from "@/components/font-size-control";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDbQuery } from "@/hooks/use-db-query";
import { formatoFecha, hoy } from "@/utils/date";

export default function EvangelioScreen() {
  const insets = useSafeAreaInsets();
  const { fecha: fechaParam } = useLocalSearchParams<{ fecha?: string }>();
  const targetDate = fechaParam ?? hoy();
  const { data: lectura, loading, error, refetch: cargar } = useDbQuery(
    (db) => getLecturaDelDia(db, targetDate),
    [targetDate],
  );

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
      style={[sharedStyles.container, { paddingTop: insets.top }]}
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
            <TouchableOpacity
              onPress={() => {
                const lines = [
                  lectura.titulo_misa,
                  "",
                  ...(lectura.primera_lectura ? [`${lectura.primera_lectura_ref}:\n${lectura.primera_lectura}`] : []),
                  ...(lectura.salmo ? [`Salmo:\n${lectura.salmo}`] : []),
                  ...(lectura.evangelio ? [`${lectura.evangelio_ref}:\n${lectura.evangelio}`] : []),
                ];
                Share.share({ message: lines.filter(Boolean).join("\n\n") });
              }}
              style={s.shareBtn}
            >
              <ThemedText style={{ color: C.gold, fontSize: 20 }}>↗</ThemedText>
            </TouchableOpacity>
            <FavBtn
              favorito={{
                id: `evangelio-${lectura.fecha}`,
                tipo: "evangelio",
                referencia: `Evangelio ${lectura.fecha}`,
                preview: lectura.evangelio?.slice(0, 80) ?? "",
                timestamp: 0,
              }}
            />
          </View>
        }
      />

      {lectura.titulo_misa ? (
        <ThemedText style={s.tituloMisa}>{lectura.titulo_misa}</ThemedText>
      ) : null}

      {lectura.primera_lectura ? (
        <ReadingSection
          label="Primera Lectura"
          referencia={lectura.primera_lectura_ref}
          texto={lectura.primera_lectura}
        />
      ) : null}

      {lectura.salmo ? (
        <ReadingSection label="Salmo Responsorial" texto={lectura.salmo} />
      ) : null}

      {lectura.aleluia ? (
        <ReadingSection label="Aleluya" texto={lectura.aleluia} />
      ) : null}

      {lectura.evangelio ? (
        <ReadingSection
          label="Evangelio"
          referencia={lectura.evangelio_ref}
          texto={lectura.evangelio}
        />
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { paddingBottom: S.massive },
  centered: { flex: 1, backgroundColor: C.navy, justifyContent: "center", alignItems: "center", paddingHorizontal: S.xl },
  errorText: { color: C.error, fontSize: 15, textAlign: "center", marginBottom: S.lg },
  reintentarBtn: { backgroundColor: C.gold, borderRadius: R.lg, paddingHorizontal: S.xxl, paddingVertical: 10 },
  reintentarText: { color: C.navy, fontWeight: "700", fontSize: 14 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: S.sm },
  calBtn: { padding: S.xs },
  shareBtn: { padding: S.xs },
  tituloMisa: {
    color: C.goldLight,
    fontSize: 20,
    fontWeight: "700",
    marginHorizontal: S.lg,
    marginTop: S.xl,
    marginBottom: S.sm,
  },
});

import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDbQuery } from '@/hooks/use-db-query';
import { getMisalSantosDelDia } from '@/db/db';
import type { Santo, MisalSantosEntry } from '@/types';

export default function SantoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data } = useDbQuery<[Santo | null, MisalSantosEntry | null]>(
    (db): Promise<[Santo | null, MisalSantosEntry | null]> => {
      if (!id) return Promise.resolve([null, null]);
      const nid = Number(id);
      return db.getFirstAsync<Santo>("SELECT * FROM santos WHERE id = ?", [nid]).then((row) => {
        if (!row) return [null, null];
        return getMisalSantosDelDia(db, row.mes, row.dia).then((ms) => [row, ms.find(e => e.colecta) ?? null]);
      });
    },
    [id],
  );

  const santo = (data as [Santo | null, MisalSantosEntry | null] | undefined)?.[0] ?? null;
  const santoPropio = (data as [Santo | null, MisalSantosEntry | null] | undefined)?.[1] ?? null;

  if (!santo) return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ThemedText style={s.backText}>‹</ThemedText></TouchableOpacity>
        <ThemedText style={s.title}>Cargando...</ThemedText>
      </View>
    </View>
  );

  const cleanTitulo = santo.titulo?.replace(/[.\s]*(Memoria|Fiesta|Solemnidad)$/i, '').replace(/[.\s]+$/, '').trim();

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ThemedText style={s.backText}>‹</ThemedText></TouchableOpacity>
        <ThemedText style={s.title} numberOfLines={1}>{santo.nombre}</ThemedText>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {cleanTitulo ? <ThemedText style={s.subtitle}>{cleanTitulo}</ThemedText> : null}
        {santo.biografia && santo.biografia.length > 0 ? (
          <ThemedText style={s.bio}>{santo.biografia}</ThemedText>
        ) : (
          <ThemedText style={s.sinBio}>No hay biografía disponible para este santo.</ThemedText>
        )}

        {santoPropio?.colecta ? (
          <View style={s.propioSection}>
            <ThemedText style={s.sectionLabel}>ORACIONES PROPIAS</ThemedText>
            {santoPropio.antifona_entrada ? (
              <View style={s.card}><ThemedText style={s.cardLabel}>Antífona de entrada</ThemedText><ThemedText style={s.cardText}>{santoPropio.antifona_entrada}</ThemedText></View>
            ) : null}
            {santoPropio.colecta ? (
              <View style={s.card}><ThemedText style={s.cardLabel}>Oración colecta</ThemedText><ThemedText style={s.cardText}>{santoPropio.colecta}</ThemedText></View>
            ) : null}
            {santoPropio.oracion_ofrendas ? (
              <View style={s.card}><ThemedText style={s.cardLabel}>Oración sobre las ofrendas</ThemedText><ThemedText style={s.cardText}>{santoPropio.oracion_ofrendas}</ThemedText></View>
            ) : null}
            {santoPropio.prefacio ? (
              <View style={s.card}><ThemedText style={s.cardLabel}>Prefacio</ThemedText><ThemedText style={s.cardText}>{santoPropio.prefacio}</ThemedText></View>
            ) : null}
            {santoPropio.antifona_comunion ? (
              <View style={s.card}><ThemedText style={s.cardLabel}>Antífona de comunión</ThemedText><ThemedText style={s.cardText}>{santoPropio.antifona_comunion}</ThemedText></View>
            ) : null}
            {santoPropio.postcomunion ? (
              <View style={s.card}><ThemedText style={s.cardLabel}>Postcomunión</ThemedText><ThemedText style={s.cardText}>{santoPropio.postcomunion}</ThemedText></View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginHorizontal: S.xl, marginBottom: S.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.navyLight, alignItems: 'center', justifyContent: 'center' },
  backText: { color: C.gold, fontSize: 22, fontWeight: '700', marginTop: -2 },
  title: { flex: 1, color: C.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  content: { paddingHorizontal: S.xl, paddingBottom: 60 },
  subtitle: { color: C.goldLight, fontSize: 14, fontStyle: 'italic', marginBottom: S.lg },
  bio: { color: C.text, fontSize: 15, lineHeight: 24, marginBottom: S.xl },
  sinBio: { color: C.muted, fontSize: 14, fontStyle: 'italic', marginBottom: S.xl },
  propioSection: { marginTop: S.md },
  sectionLabel: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: S.md },
  card: { backgroundColor: C.navyMid, padding: S.lg, borderRadius: R.lg, marginBottom: 10 },
  cardLabel: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  cardText: { color: C.text, fontSize: 14, lineHeight: 22 },
});

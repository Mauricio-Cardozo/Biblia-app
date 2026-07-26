import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ui/screen-header";
import { getMisalSantosDelDia } from "@/db/db";
import { useDbQuery } from "@/hooks/use-db-query";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function SantosDiaScreen() {
  const { mes, dia } = useLocalSearchParams<{ mes: string; dia: string }>();
  const insets = useSafeAreaInsets();
  const { data: entries, loading } = useDbQuery(
    (db) => getMisalSantosDelDia(db, Number(mes), Number(dia)),
    [mes, dia],
  );

  if (loading) return (
    <View style={[sharedStyles.container, sharedStyles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={C.gold} />
    </View>
  );

  const list = entries ?? [];

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={`${dia} de ${MESES[Number(mes) - 1]}`}
        subtitle={`${list.length} santos`}
        showBack onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={sharedStyles.content}>
        {list.map((e) => (
          <View key={e.id} style={s.card}>
            <ThemedText style={s.nombre}>{e.nombre}</ThemedText>
            {e.titulo ? <ThemedText style={s.titulo}>{e.titulo}</ThemedText> : null}
            {e.colecta ? <><View style={s.label}><ThemedText style={s.labelText}>COLECTA</ThemedText></View><ThemedText style={s.text}>{e.colecta}</ThemedText></> : null}
            {e.oracion_ofrendas ? <><View style={s.label}><ThemedText style={s.labelText}>OFERTORIO</ThemedText></View><ThemedText style={s.text}>{e.oracion_ofrendas}</ThemedText></> : null}
            {e.postcomunion ? <><View style={s.label}><ThemedText style={s.labelText}>POSTCOMUNIÓN</ThemedText></View><ThemedText style={s.text}>{e.postcomunion}</ThemedText></> : null}
            {e.prefacio ? <><View style={s.label}><ThemedText style={s.labelText}>PREFACIO</ThemedText></View><ThemedText style={s.text}>{e.prefacio}</ThemedText></> : null}
            {e.antifona_entrada ? <><View style={s.label}><ThemedText style={s.labelText}>ANTÍFONA DE ENTRADA</ThemedText></View><ThemedText style={s.text}>{e.antifona_entrada}</ThemedText></> : null}
            {e.antifona_comunion ? <><View style={s.label}><ThemedText style={s.labelText}>ANTÍFONA DE COMUNIÓN</ThemedText></View><ThemedText style={s.text}>{e.antifona_comunion}</ThemedText></> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.navyMid, borderRadius: R.lg, padding: S.lg, marginBottom: S.md },
  nombre: { color: C.gold, fontSize: 17, fontWeight: "700" },
  titulo: { color: C.muted, fontSize: 13, marginBottom: S.sm, fontStyle: "italic" },
  label: { marginTop: S.md, marginBottom: S.xs },
  labelText: { color: C.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  text: { color: C.text, fontSize: 14, lineHeight: 22 },
});

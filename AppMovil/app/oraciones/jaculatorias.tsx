import { C } from "@/constants/theme";
import { S } from '@/constants/spacing';
import { sharedStyles } from '@/constants/shared-styles';
import { ThemedText } from "@/components/themed-text";
import ScreenHeader from "@/components/ui/screen-header";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import JACULATORIAS from "@/data/jaculatorias";

export default function JaculatoriasScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[sharedStyles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Jaculatorias" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        <ThemedText style={s.intro}>
          Oraciones breves para mejor mantenernos en la presencia de Dios a lo largo del día
        </ThemedText>

        {JACULATORIAS.map((grupo) => (
          <View key={grupo.titulo} style={s.grupo}>
            <ThemedText style={s.grupoTitulo}>{grupo.titulo}</ThemedText>
            {grupo.items.map((item, idx) => (
              <View key={item.invocacion} style={s.item}>
                <ThemedText style={s.invocacion}>
                  <ThemedText style={s.v}>V. </ThemedText>
                  {item.invocacion}
                </ThemedText>
                {item.respuesta ? (
                  <ThemedText style={s.respuesta}>
                    <ThemedText style={s.r}>R. </ThemedText>
                    {item.respuesta}
                  </ThemedText>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: S.lg, paddingBottom: S.massive },
  intro: { color: C.muted, fontSize: 14, lineHeight: 22, marginBottom: S.xxl, fontStyle: "italic" },
  grupo: { marginBottom: 28 },
  grupoTitulo: { color: C.gold, fontSize: 16, fontWeight: "700", marginBottom: S.md },
  item: { marginBottom: S.md, paddingLeft: S.sm },
  invocacion: { color: C.text, fontSize: 15, lineHeight: 22 },
  respuesta: { color: C.goldLight, fontSize: 15, lineHeight: 22, marginTop: 2 },
  v: { color: C.gold, fontWeight: "700" },
  r: { color: C.gold, fontWeight: "700" },
});

import { C } from "@/constants/theme";
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
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Jaculatorias" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content}>
        <ThemedText style={s.intro}>
          Oraciones breves para mejor mantenernos en la presencia de Dios a lo largo del día
        </ThemedText>

        {JACULATORIAS.map((grupo) => (
          <View key={grupo.titulo} style={s.grupo}>
            <ThemedText style={s.grupoTitulo}>{grupo.titulo}</ThemedText>
            {grupo.items.map((item, idx) => (
              <View key={idx} style={s.item}>
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
  container: { flex: 1, backgroundColor: C.navy },
  content: { padding: 16, paddingBottom: 48 },
  intro: { color: C.muted, fontSize: 14, lineHeight: 22, marginBottom: 24, fontStyle: "italic" },
  grupo: { marginBottom: 28 },
  grupoTitulo: { color: C.gold, fontSize: 16, fontWeight: "700", marginBottom: 12 },
  item: { marginBottom: 12, paddingLeft: 8 },
  invocacion: { color: C.text, fontSize: 15, lineHeight: 22 },
  respuesta: { color: C.goldLight, fontSize: 15, lineHeight: 22, marginTop: 2 },
  v: { color: C.gold, fontWeight: "700" },
  r: { color: C.gold, fontWeight: "700" },
});

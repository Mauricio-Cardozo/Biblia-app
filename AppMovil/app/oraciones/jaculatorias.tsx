import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import JACULATORIAS from "@/data/jaculatorias";

export default function JaculatoriasScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ThemedText style={s.backArrow}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText style={s.title}>Jaculatorias</ThemedText>
      </View>
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
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    paddingVertical: Platform.OS === "android" ? 12 : 8,
    borderBottomWidth: 1, borderBottomColor: C.goldDim, backgroundColor: C.navyMid,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.navyLight,
    borderWidth: 1, borderColor: C.goldDim, alignItems: "center", justifyContent: "center",
  },
  backArrow: { color: C.gold, fontSize: 20, lineHeight: 22 },
  title: { color: C.text, fontSize: 18, fontWeight: "700" },
  content: { padding: 20, paddingBottom: 48 },
  intro: { color: C.muted, fontSize: 14, lineHeight: 22, marginBottom: 24, fontStyle: "italic" },
  grupo: { marginBottom: 28 },
  grupoTitulo: { color: C.gold, fontSize: 16, fontWeight: "700", marginBottom: 12 },
  item: { marginBottom: 12, paddingLeft: 8 },
  invocacion: { color: C.text, fontSize: 15, lineHeight: 22 },
  respuesta: { color: C.goldLight, fontSize: 15, lineHeight: 22, marginTop: 2 },
  v: { color: C.gold, fontWeight: "700" },
  r: { color: C.gold, fontWeight: "700" },
});

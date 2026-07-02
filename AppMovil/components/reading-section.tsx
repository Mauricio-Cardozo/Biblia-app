import { C } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { View, StyleSheet } from "react-native";
import { useFontSize, fs } from "@/contexts/font-size";

export default function ReadingSection({
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
    <View style={s.block}>
      <ThemedText style={s.label}>{label}</ThemedText>
      {referencia ? <ThemedText style={[s.ref, { fontSize: fs(14, multiplier) }]}>{referencia}</ThemedText> : null}
      <ThemedText style={[s.text, { fontSize: fs(15, multiplier), lineHeight: fs(24, multiplier) }]}>{texto}</ThemedText>
    </View>
  );
}

const s = StyleSheet.create({
  block: { marginTop: 24, marginHorizontal: 16 },
  label: { color: C.gold, fontSize: 12, fontWeight: "700", letterSpacing: 1.2, marginBottom: 6 },
  ref: { color: C.goldLight, fontStyle: "italic", marginBottom: 8 },
  text: { color: C.text, lineHeight: 24 },
});

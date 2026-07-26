import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface SectionCardProps {
  icono: string;
  titulo: string;
  subtitulo: string;
  onPress: () => void;
}

export default function SectionCard({ icono, titulo, subtitulo, onPress }: SectionCardProps) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <View style={s.cardRow}>
        <ThemedText style={s.cardIcon}>{icono}</ThemedText>
        <View style={s.cardTextWrap}>
          <ThemedText style={s.cardTitle}>{titulo}</ThemedText>
          <ThemedText style={s.cardSubtitle}>{subtitulo}</ThemedText>
        </View>
        <ThemedText style={s.chevron}>›</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: S.xl,
    marginBottom: S.md,
    padding: 18,
    borderRadius: 15,
    backgroundColor: C.navyMid,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 32, marginRight: S.lg },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  cardSubtitle: { color: C.muted, fontSize: 13, marginTop: 2 },
  chevron: { color: C.gold, fontSize: 24, marginLeft: S.sm },
});

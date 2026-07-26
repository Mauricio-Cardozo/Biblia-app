import { C } from '@/constants/theme';
import { S } from '@/constants/spacing';
import { R } from '@/constants/radius';
import { ThemedText } from '@/components/themed-text';
import { TouchableOpacity, View, StyleSheet } from 'react-native';

interface SantoCardProps {
  nombre: string;
  titulo: string | null;
  biografia: string;
  onPress: () => void;
}

export default function SantoCard({ nombre, titulo, biografia, onPress }: SantoCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.7}>
      <View style={styles.row}>
        <ThemedText style={styles.icon}>✝</ThemedText>
        <View style={styles.wrap}>
          <ThemedText style={styles.label}>SANTO DEL DÍA</ThemedText>
          <ThemedText style={styles.name}>{nombre}</ThemedText>
          {titulo ? <ThemedText style={styles.subtitle}>{titulo}</ThemedText> : null}
          <ThemedText style={styles.bio} numberOfLines={2}>{biografia}</ThemedText>
        </View>
        <ThemedText style={styles.chevron}>›</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.navyMid,
    padding: S.xl,
    borderRadius: R.lg,
    marginBottom: 15,
    marginHorizontal: S.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
    marginRight: 14,
  },
  wrap: {
    flex: 1,
  },
  label: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  name: {
    color: C.text,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: C.goldLight,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  bio: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  chevron: {
    color: C.gold,
    fontSize: 24,
    marginLeft: 6,
  },
});

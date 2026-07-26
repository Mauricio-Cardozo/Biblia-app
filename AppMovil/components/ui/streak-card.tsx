import { C } from '@/constants/theme';
import { R } from '@/constants/radius';
import { ThemedText } from '@/components/themed-text';
import { TouchableOpacity, StyleSheet } from 'react-native';

interface StreakCardProps {
  label: string;
  count: number;
  streakDays: number;
  onPress: () => void;
}

export default function StreakCard({ label, count, streakDays, onPress }: StreakCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.7}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.count}>🕊️ {count}</ThemedText>
      {streakDays > 0 && (
        <ThemedText style={styles.streak}>🔥 {streakDays} días seguidos</ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.navyMid,
    padding: 18,
    borderRadius: R.lg,
    flex: 0.48,
    marginHorizontal: 0,
    marginBottom: 15,
  },
  label: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  count: {
    color: C.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  streak: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
});

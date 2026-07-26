import { C } from '@/constants/theme';
import { R } from '@/constants/radius';
import { ThemedText } from '@/components/themed-text';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface SeasonInfo {
  season: string;
  label: string;
  color: string;
  emoji: string;
  colorName: string;
}

interface HeroSectionProps {
  greeting: string;
  season: SeasonInfo | null;
  gospelQuote: string | null;
  gospelRef: string | null;
  onPress: () => void;
}

export default function HeroSection({ greeting, season, gospelQuote, gospelRef, onPress }: HeroSectionProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={[C.navyMid, C.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.hero,
          season ? { borderLeftColor: season.color } : { borderLeftColor: C.gold },
        ]}
      >
        {season ? (
          <View style={styles.seasonRow}>
            <View style={[styles.colorDot, { backgroundColor: season.color }]} />
            <ThemedText style={styles.seasonLabel}>
              {season.emoji} {season.label} · {season.colorName}
            </ThemedText>
          </View>
        ) : null}
        <ThemedText style={styles.greeting}>{greeting}</ThemedText>
        <ThemedText style={styles.quote} numberOfLines={4}>
          {'\u201C'}{gospelQuote ?? 'Yo soy el camino, la verdad y la vida.'}{'\u201D'}
        </ThemedText>
        {gospelRef ? <ThemedText style={styles.ref}>{gospelRef}</ThemedText> : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 20,
    borderRadius: R.lg,
    marginBottom: 15,
    marginHorizontal: 20,
    borderLeftWidth: 4,
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  seasonLabel: {
    color: C.goldLight,
    fontSize: 12,
    fontWeight: '600',
  },
  greeting: {
    color: C.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  quote: {
    color: C.text,
    fontSize: 19,
    fontStyle: 'italic',
    lineHeight: 28,
  },
  ref: {
    color: C.muted,
    marginTop: 8,
    textAlign: 'right',
  },
});

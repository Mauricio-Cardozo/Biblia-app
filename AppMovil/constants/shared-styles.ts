import { StyleSheet } from 'react-native';
import { C } from './theme';
import { S } from './spacing';
import { R } from './radius';

export const sharedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.navy },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: S.lg, paddingBottom: S.huge },
  card: {
    backgroundColor: C.navyMid,
    borderRadius: R.lg,
    padding: S.lg,
    marginBottom: S.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 24, marginRight: S.md },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: C.text, fontSize: 14, fontWeight: '600' },
  cardSubtitle: { color: C.muted, fontSize: 13, marginTop: 2 },
  chevron: { color: C.gold, fontSize: 20, marginLeft: 6 },
  errorText: { color: C.error, fontSize: 14, textAlign: 'center', paddingHorizontal: S.xl },
  muted: { color: C.muted, fontSize: 14 },
});

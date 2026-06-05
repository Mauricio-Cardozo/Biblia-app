import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.dateText}>Domingo, 4 de Mayo</Text>
      
      {/* Versículo del Día */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>VERSÍCULO DEL DÍA</Text>
        <Text style={styles.verseText}>"Yo soy el camino, la verdad y la vida."</Text>
        <Text style={styles.verseRef}>— Juan 14:6</Text>
      </View>

      {/* Racha */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <View style={[styles.card, {flex: 0.48}]}>
          <Text style={styles.cardLabel}>RACHA BIBLIA</Text>
          <Text style={styles.streakText}>🔥 5 días</Text>
        </View>
        <View style={[styles.card, {flex: 0.48}]}>
          <Text style={styles.cardLabel}>RACHA ROSARIO</Text>
          <Text style={styles.streakText}>🔥 2 días</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d', padding: 20 },
  dateText: { color: '#e2b15b', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#1c253d', padding: 20, borderRadius: 15, marginBottom: 15 },
  cardLabel: { color: '#e2b15b', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  verseText: { color: '#fff', fontSize: 18, fontStyle: 'italic' },
  verseRef: { color: '#fff', opacity: 0.6, marginTop: 10, textAlign: 'right' },
  streakText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
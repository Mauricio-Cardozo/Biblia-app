import { View, Text, StyleSheet } from 'react-native';

export default function EvangelioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pantalla para mostrar el texto completo del Evangelio y su ubicación</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d', justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { color: '#fff', textAlign: 'center' }
});
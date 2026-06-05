// Dentro de CatecismoScreen.js
// Usa el componente FlatList con este diseño de item:
const renderItem = ({ item }) => (
  <TouchableOpacity style={styles.listItem}>
    <View style={{flex: 1}}>
      <Text style={styles.itemTitle}>Numeral {item.id}</Text>
      <Text style={styles.itemSub}>{item.parte}</Text>
    </View>
    <Text style={{color: '#ccc'}}> 〉 </Text> 
  </TouchableOpacity>
);

// Estilos para simular la lista blanca con flechitas
const listStyles = StyleSheet.create({
  listItem: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemSub: { fontSize: 12, color: '#888' }
});
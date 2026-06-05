import 'react-native-gesture-handler';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import HomeScreen from './screens/HomeScreen';
import CatecismoScreen from './screens/CatecismoScreen';

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <SQLiteProvider databaseName="iglesia_digital.db" assetSource={require('./assets/iglesia_digital.db')}>
        <Drawer.Navigator 
          screenOptions={{
            headerStyle: { backgroundColor: '#12192b' }, // Azul oscuro de tu ref
            headerTintColor: '#e2b15b', // Dorado de tu ref
            drawerStyle: { backgroundColor: '#12192b' },
            drawerActiveTintColor: '#e2b15b',
            drawerInactiveTintColor: '#fff',
          }}
        >
          <Drawer.Screen name="Home" component={HomeScreen} />
          <Drawer.Screen name="Catecismo" component={CatecismoScreen} />
        </Drawer.Navigator>
      </SQLiteProvider>
    </NavigationContainer>
  );
}
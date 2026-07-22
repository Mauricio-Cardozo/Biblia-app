import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingTabBar from '@/components/ui/floating-tab-bar';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => (
          <View style={{ marginBottom: insets.bottom }}>
            <FloatingTabBar {...(props as any)} />
          </View>
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Liturgia' }}
        />
        <Tabs.Screen
          name="biblia"
          options={{ title: 'Biblia' }}
        />
        <Tabs.Screen
          name="calendario"
          options={{ title: 'Calendario' }}
        />
        <Tabs.Screen
          name="oracion"
          options={{ title: 'Oración' }}
        />
        <Tabs.Screen
          name="catecismo"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="misal"
          options={{ href: null }}
        />
      </Tabs>
    </View>
  );
}

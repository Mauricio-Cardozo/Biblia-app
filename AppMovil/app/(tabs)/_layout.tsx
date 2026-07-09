import { Tabs, router } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import FloatingTabBar from '@/components/ui/floating-tab-bar';
import { C } from '@/constants/theme';
import { R } from '@/constants/radius';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => (
          <View style={{ marginBottom: insets.bottom }}>
            <FloatingTabBar {...props} />
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

      <TouchableOpacity
        style={[s.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/ajustes')}
        activeOpacity={0.8}
      >
        <IconSymbol name="questionmark.text.page.fill" size={24} color={C.navy} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  fab: {
    position: 'absolute', right: 20,
    width: 52, height: 52, borderRadius: R.full,
    backgroundColor: C.gold,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ android: { elevation: 6 } }),
  },
});

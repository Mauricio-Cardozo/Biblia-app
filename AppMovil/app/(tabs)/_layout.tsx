import { Tabs } from 'expo-router';
import React from 'react';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="biblia"
        options={{
          title: 'Biblia',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.closed.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="catecismo"
        options={{
          title: 'Catecismo',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="text.book.closed.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="youcat"
        options={{
          title: 'YOUCAT',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="questionmark.text.page.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
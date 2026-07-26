import React, { Suspense, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { C } from '@/constants/theme';
import { ensureDatabaseSchema } from '@/db/init';
import { FontSizeProvider } from '@/contexts/font-size';
import { initNotificationHandler, getPrefEvangelio, getPrefRachas, scheduleBibleNotifications, scheduleStreakNotification } from '@/data/notifications';

initNotificationHandler();

function DatabaseInit({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await ensureDatabaseSchema(db);
        const [ev, ra] = await Promise.all([getPrefEvangelio(), getPrefRachas()]);
        if (ev) scheduleBibleNotifications(db).catch((e: unknown) => console.warn('[notif]', e));
        if (ra) scheduleStreakNotification().catch((e: unknown) => console.warn('[notif]', e));
      } catch (e: unknown) {
        console.warn("Migration error:", e instanceof Error ? e.message : e);
      }
      setReady(true);
    })();
  }, [db]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    NavigationBar.setHidden(true);
  }, []);

  return (
    <Suspense fallback={<ActivityIndicator size="large" style={{ flex: 1 }} />}>
      <StatusBar hidden />
      <SQLiteProvider 
        databaseName="iglesia_digital.db" 
        assetSource={{ assetId: require('../assets/iglesia_digital.db') }}
        useSuspense
      >
        <DatabaseInit>
          <FontSizeProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="evangelio" options={{ headerShown: false }} />
              <Stack.Screen name="calendario" options={{ headerShown: false }} />
              <Stack.Screen name="favoritos" options={{ headerShown: false }} />
              <Stack.Screen name="test" options={{ headerShown: false }} />
              <Stack.Screen name="rosario/guia" options={{ headerShown: false }} />
              <Stack.Screen name="rosario/coronilla" options={{ headerShown: false }} />
              <Stack.Screen name="oraciones/index" options={{ headerShown: false }} />
              <Stack.Screen name="oraciones/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="oraciones/jaculatorias" options={{ headerShown: false }} />
              <Stack.Screen name="oraciones/novena/index" options={{ headerShown: false }} />
              <Stack.Screen name="oraciones/novena/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="misal" options={{ headerShown: false }} />
              <Stack.Screen name="ajustes" options={{ headerShown: false }} />
              <Stack.Screen name="santo/[id]" options={{ headerShown: false }} />
            </Stack>
          </FontSizeProvider>
        </DatabaseInit>
      </SQLiteProvider>
    </Suspense>
  );
}
import { Suspense, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { ActivityIndicator, View } from 'react-native';
import { C } from '@/constants/theme';
import { ensureDatabaseSchema } from '@/db/init';
import { FontSizeProvider } from '@/contexts/font-size';
import { BibliaVersionProvider } from '@/contexts/bible-version';

function DatabaseInit({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureDatabaseSchema(db)
      .then(() => setReady(true))
      .catch((e) => {
        console.warn("Migration error:", e);
        setReady(true);
      });
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
  return (
    <Suspense fallback={<ActivityIndicator size="large" style={{ flex: 1 }} />}>
      <SQLiteProvider 
        databaseName="iglesia_digital.db" 
        assetSource={{ assetId: require('../assets/iglesia_digital.db') }}
        useSuspense
      >
        <DatabaseInit>
          <FontSizeProvider>
            <BibliaVersionProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
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
              </Stack>
            </BibliaVersionProvider>
          </FontSizeProvider>
        </DatabaseInit>
      </SQLiteProvider>
    </Suspense>
  );
}
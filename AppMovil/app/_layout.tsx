import { Suspense, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { ActivityIndicator, View } from 'react-native';
import { ensureDatabaseSchema } from '@/db/init';
import { FontSizeProvider } from '@/contexts/font-size';
import { BibliaVersionProvider } from '@/contexts/bible-version';
import { setupNotifications } from '@/data/notifications';

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
    setupNotifications();
  }, [db]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
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
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              </Stack>
            </BibliaVersionProvider>
          </FontSizeProvider>
        </DatabaseInit>
      </SQLiteProvider>
    </Suspense>
  );
}
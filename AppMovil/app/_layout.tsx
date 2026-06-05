import { Suspense } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { ActivityIndicator } from 'react-native';

export default function RootLayout() {
  return (
    <Suspense fallback={<ActivityIndicator size="large" style={{ flex: 1 }} />}>
      <SQLiteProvider 
        databaseName="iglesia_digital.db" 
        assetSource={{ assetId: require('../assets/iglesia_digital.db') }}
        useSuspense
      >
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
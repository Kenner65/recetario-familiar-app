import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colores } from '@/constants/theme';
import { SessionProvider } from '@/context/session';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colores.fondo },
            headerTintColor: Colores.texto,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: Colores.fondo },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="receta/nueva" options={{ title: 'Nueva receta' }} />
          <Stack.Screen name="receta/[id]" options={{ title: 'Receta' }} />
        </Stack>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

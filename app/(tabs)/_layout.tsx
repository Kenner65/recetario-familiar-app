import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { Colores } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colores.primario,
        tabBarInactiveTintColor: Colores.textoSuave,
        tabBarStyle: { backgroundColor: Colores.superficie },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recetas',
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="favoritas"
        options={{
          title: 'Favoritas',
          tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{
          title: 'Cuenta',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}

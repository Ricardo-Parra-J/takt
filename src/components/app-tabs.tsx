import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={tabOptions('Hoy', 'today')} />
      <Tabs.Screen name="comida" options={tabOptions('Comida', 'restaurant')} />
      <Tabs.Screen name="calendario" options={tabOptions('Calendario', 'calendar')} />
      <Tabs.Screen name="deporte" options={tabOptions('Deporte', 'barbell')} />
      <Tabs.Screen name="tareas" options={tabOptions('Tareas', 'checkbox')} />
      <Tabs.Screen name="finanzas" options={tabOptions('Finanzas', 'wallet')} />
    </Tabs>
  );
}

function tabOptions(title: string, icon: IoniconName) {
  return {
    title,
    tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => (
      <Ionicons name={icon} color={color as string} size={size} />
    ),
  };
}

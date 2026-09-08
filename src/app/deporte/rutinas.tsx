import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Link, Stack, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { FabButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { listPresets, PresetRutina } from '@/db/repositories/deporte';

export default function RutinasScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [rutinas, setRutinas] = useState<PresetRutina[]>([]);

  const cargar = useCallback(() => {
    listPresets().then(setRutinas);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Rutinas' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {rutinas.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
            No hay rutinas guardadas todavía.
          </ThemedText>
        )}

        <FlatList
          data={rutinas}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/deporte/rutina-form?id=${item.id}`)}>
              <Card style={styles.row}>
                <ThemedText style={styles.rowText}>{item.nombre}</ThemedText>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Card>
            </Pressable>
          )}
        />

        <Link href="/deporte/rutina-form" asChild>
          <FabButton />
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  vacio: { paddingVertical: Spacing.four, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowText: { flex: 1 },
});

import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Link, Stack, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { FabButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { listRecetas, RecetaListItem } from '@/db/repositories/recetas';

export default function RecetasScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [recetas, setRecetas] = useState<RecetaListItem[]>([]);

  const cargar = useCallback(() => {
    listRecetas(busqueda).then(setRecetas);
  }, [busqueda]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Recetas' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Card style={styles.buscador}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar receta..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.buscadorInput, { color: theme.text }]}
          />
        </Card>

        {recetas.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
            No hay recetas guardadas todavía.
          </ThemedText>
        )}

        <FlatList
          data={recetas}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/comida/receta-form?id=${item.id}`)}>
              <Card style={styles.row}>
                <View style={styles.rowText}>
                  <ThemedText>{item.nombre}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.porciones} {item.porciones === 1 ? 'porción' : 'porciones'}
                    {item.tipos ? ` · ${item.tipos}` : ''}
                  </ThemedText>
                </View>
                {item.favorita === 1 && <Ionicons name="star" size={18} color="#D4A017" />}
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Card>
            </Pressable>
          )}
        />

        <Link href="/comida/receta-form" asChild>
          <FabButton />
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  buscador: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  buscadorInput: { flex: 1, fontSize: 15 },
  vacio: { paddingVertical: Spacing.four, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowText: { flex: 1, gap: 2 },
});

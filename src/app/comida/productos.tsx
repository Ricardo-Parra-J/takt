import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Link, Stack, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { listProductos, Producto } from '@/db/repositories/productos';

export default function ProductosScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);

  const cargar = useCallback(() => {
    listProductos(busqueda).then(setProductos);
  }, [busqueda]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Productos' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ThemedView type="backgroundElement" style={styles.buscador}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar producto o marca..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.buscadorInput, { color: theme.text }]}
          />
        </ThemedView>

        {productos.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
            No hay productos guardados todavía.
          </ThemedText>
        )}

        <FlatList
          data={productos}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/comida/producto-form?id=${item.id}`)}>
              <ThemedView type="backgroundElement" style={styles.row}>
                <View style={styles.rowText}>
                  <ThemedText>{item.nombre}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.marca_nombre ?? 'Sin marca'}
                    {item.info_incompleta === 1 ? ' · Info incompleta' : ''}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </ThemedView>
            </Pressable>
          )}
        />

        <Link href="/comida/producto-form" asChild>
          <Pressable style={styles.fab}>
            <ThemedView type="backgroundSelected" style={styles.fabInner}>
              <Ionicons name="add" size={28} color={theme.text} />
            </ThemedView>
          </Pressable>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  buscadorInput: { flex: 1, fontSize: 15 },
  vacio: { paddingVertical: Spacing.four, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, borderRadius: Spacing.three },
  rowText: { flex: 1, gap: 2 },
  fab: { position: 'absolute', right: Spacing.four, bottom: Spacing.four },
  fabInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

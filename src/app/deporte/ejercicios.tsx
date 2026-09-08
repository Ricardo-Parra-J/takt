import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Link, Stack, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { FabButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { Ejercicio, GrupoMuscular, listEjercicios, listGruposMusculares } from '@/db/repositories/deporte';

export default function EjerciciosScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [grupoId, setGrupoId] = useState<number | null>(null);
  const [grupos, setGrupos] = useState<GrupoMuscular[]>([]);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);

  useEffect(() => {
    listGruposMusculares().then(setGrupos);
  }, []);

  const cargar = useCallback(() => {
    listEjercicios(busqueda, grupoId).then(setEjercicios);
  }, [busqueda, grupoId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Ejercicios' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Card style={styles.buscador}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar ejercicio..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.buscadorInput, { color: theme.text }]}
          />
        </Card>

        {grupos.length > 0 && (
          <View style={styles.chips}>
            <Chip label="Todos" selected={grupoId === null} onPress={() => setGrupoId(null)} />
            {grupos.map((g) => (
              <Chip key={g.id} label={g.nombre} selected={grupoId === g.id} onPress={() => setGrupoId(g.id)} />
            ))}
          </View>
        )}

        {ejercicios.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
            No hay ejercicios guardados todavía.
          </ThemedText>
        )}

        <FlatList
          data={ejercicios}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/deporte/ejercicio-form?id=${item.id}`)}>
              <Card style={styles.row}>
                <View style={styles.rowText}>
                  <ThemedText>{item.nombre}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.grupo_muscular_nombre ?? 'Sin grupo muscular'}
                    {item.ultimo_peso != null || item.ultimas_repeticiones != null
                      ? ` · Último: ${item.ultimo_peso ?? '—'} kg × ${item.ultimas_repeticiones ?? '—'}`
                      : ''}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Card>
            </Pressable>
          )}
        />

        <Link href="/deporte/ejercicio-form" asChild>
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  vacio: { paddingVertical: Spacing.four, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowText: { flex: 1, gap: 2 },
});

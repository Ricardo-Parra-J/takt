import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import {
  actualizarEjercicio,
  buscarOCrearGrupoMuscular,
  crearEjercicio,
  eliminarEjercicio,
  getEjercicio,
  GrupoMuscular,
  listGruposMusculares,
} from '@/db/repositories/deporte';

export default function EjercicioFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = !!id;
  const router = useRouter();
  const theme = useTheme();

  const [nombre, setNombre] = useState('');
  const [grupoId, setGrupoId] = useState<number | null>(null);
  const [grupos, setGrupos] = useState<GrupoMuscular[]>([]);
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [nombreGrupoNuevo, setNombreGrupoNuevo] = useState('');
  const [cargando, setCargando] = useState(editando);

  useEffect(() => {
    listGruposMusculares().then(setGrupos);
  }, []);

  useEffect(() => {
    if (!id) return;
    getEjercicio(Number(id)).then((ej) => {
      if (!ej) return;
      setNombre(ej.nombre);
      setGrupoId(ej.grupo_muscular_id);
      setCargando(false);
    });
  }, [id]);

  async function onCrearGrupo() {
    if (!nombreGrupoNuevo.trim()) return;
    const nuevoId = await buscarOCrearGrupoMuscular(nombreGrupoNuevo);
    const actualizados = await listGruposMusculares();
    setGrupos(actualizados);
    setGrupoId(nuevoId);
    setNombreGrupoNuevo('');
    setCreandoGrupo(false);
  }

  async function onGuardar() {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Ponle un nombre al ejercicio.');
      return;
    }
    const datos = { nombre, grupo_muscular_id: grupoId };
    if (editando) {
      await actualizarEjercicio(Number(id), datos);
    } else {
      await crearEjercicio(datos);
    }
    router.back();
  }

  function onEliminar() {
    Alert.alert('Eliminar ejercicio', `¿Eliminar "${nombre}"? Esto falla si está usado en una rutina o un entrenamiento guardado.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarEjercicio(Number(id));
            router.back();
          } catch {
            Alert.alert('No se pudo eliminar', 'Este ejercicio está siendo usado en una rutina o un entrenamiento guardado.');
          }
        },
      },
    ]);
  }

  if (cargando) return null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: editando ? 'Editar ejercicio' : 'Nuevo ejercicio' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="small" themeColor="textSecondary">
            Nombre
          </ThemedText>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Press de banca"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Grupo muscular
          </ThemedText>
          <View style={styles.chips}>
            <Chip label="Sin grupo" selected={grupoId === null} onPress={() => setGrupoId(null)} />
            {grupos.map((g) => (
              <Chip key={g.id} label={g.nombre} selected={grupoId === g.id} onPress={() => setGrupoId(g.id)} />
            ))}
            {!creandoGrupo && (
              <Pressable onPress={() => setCreandoGrupo(true)}>
                <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                  <Ionicons name="add" size={14} color={theme.accent} />
                </View>
              </Pressable>
            )}
          </View>
          {creandoGrupo && (
            <View style={styles.filaGrupoNuevo}>
              <TextInput
                value={nombreGrupoNuevo}
                onChangeText={setNombreGrupoNuevo}
                placeholder="Ej. Piernas"
                placeholderTextColor={theme.textSecondary}
                autoFocus
                onSubmitEditing={onCrearGrupo}
                style={[styles.input, styles.inputFlex, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
              <Pressable onPress={onCrearGrupo} hitSlop={8}>
                <Ionicons name="checkmark-circle" size={26} color={theme.accent} />
              </Pressable>
            </View>
          )}

          <AppButton label="Guardar" onPress={onGuardar} style={styles.botonGuardar} />

          {editando && (
            <AppButton label="Eliminar ejercicio" variante="peligro" onPress={onEliminar} style={styles.botonEliminar} />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  input: { borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, fontSize: 16 },
  inputFlex: { flex: 1 },
  seccion: { marginTop: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: Radius.pill },
  filaGrupoNuevo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  botonGuardar: { marginTop: Spacing.four },
  botonEliminar: { marginTop: Spacing.three },
});

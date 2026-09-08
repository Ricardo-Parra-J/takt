import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import {
  actualizarPreset,
  crearPreset,
  DatosPresetEjercicio,
  eliminarPreset,
  Ejercicio,
  getPresetDetalle,
  listEjercicios,
} from '@/db/repositories/deporte';

interface ItemRutina extends DatosPresetEjercicio {
  ejercicio_nombre: string;
}

export default function RutinaFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = !!id;
  const router = useRouter();
  const theme = useTheme();

  const [nombre, setNombre] = useState('');
  const [items, setItems] = useState<ItemRutina[]>([]);
  const [cargando, setCargando] = useState(editando);

  const [busquedaEj, setBusquedaEj] = useState('');
  const [resultadosEj, setResultadosEj] = useState<Ejercicio[]>([]);
  const [seleccionadoEj, setSeleccionadoEj] = useState<Ejercicio | null>(null);
  const [seriesObj, setSeriesObj] = useState('');
  const [repsObj, setRepsObj] = useState('');
  const [pesoObj, setPesoObj] = useState('');

  useEffect(() => {
    if (!id) return;
    getPresetDetalle(Number(id)).then((preset) => {
      if (!preset) return;
      setNombre(preset.nombre);
      setItems(
        preset.ejercicios.map((e) => ({
          ejercicio_id: e.ejercicio_id,
          ejercicio_nombre: e.ejercicio_nombre,
          series_objetivo: e.series_objetivo,
          repeticiones_objetivo: e.repeticiones_objetivo,
          peso_objetivo: e.peso_objetivo,
        }))
      );
      setCargando(false);
    });
  }, [id]);

  useEffect(() => {
    if (seleccionadoEj) return;
    if (!busquedaEj.trim()) {
      setResultadosEj([]);
      return;
    }
    listEjercicios(busquedaEj).then((res) => setResultadosEj(res.slice(0, 8)));
  }, [busquedaEj, seleccionadoEj]);

  function cancelarSeleccion() {
    setSeleccionadoEj(null);
    setBusquedaEj('');
    setSeriesObj('');
    setRepsObj('');
    setPesoObj('');
  }

  function confirmarAgregarEjercicio() {
    if (!seleccionadoEj) return;
    setItems((prev) => [
      ...prev,
      {
        ejercicio_id: seleccionadoEj.id,
        ejercicio_nombre: seleccionadoEj.nombre,
        series_objetivo: seriesObj.trim() ? Number(seriesObj) : null,
        repeticiones_objetivo: repsObj.trim() ? Number(repsObj) : null,
        peso_objetivo: pesoObj.trim() ? Number(pesoObj.replace(',', '.')) : null,
      },
    ]);
    cancelarSeleccion();
  }

  function quitarItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function onGuardar() {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Ponle un nombre a la rutina.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Faltan ejercicios', 'Agrega al menos un ejercicio a la rutina.');
      return;
    }
    const datos = {
      nombre,
      ejercicios: items.map(({ ejercicio_id, series_objetivo, repeticiones_objetivo, peso_objetivo }) => ({
        ejercicio_id,
        series_objetivo,
        repeticiones_objetivo,
        peso_objetivo,
      })),
    };
    if (editando) {
      await actualizarPreset(Number(id), datos);
    } else {
      await crearPreset(datos);
    }
    router.back();
  }

  function onEliminar() {
    Alert.alert('Eliminar rutina', `¿Eliminar "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarPreset(Number(id));
            router.back();
          } catch {
            Alert.alert('No se pudo eliminar', 'Esta rutina fue usada en uno o más entrenamientos guardados.');
          }
        },
      },
    ]);
  }

  if (cargando) return null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: editando ? 'Editar rutina' : 'Nueva rutina' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="small" themeColor="textSecondary">
            Nombre
          </ThemedText>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Día de pierna"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Ejercicios
          </ThemedText>
          {items.map((item, index) => (
            <Card key={`${item.ejercicio_id}-${index}`} style={styles.itemAgregado}>
              <View style={styles.itemAgregadoTexto}>
                <ThemedText type="small">{item.ejercicio_nombre}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.series_objetivo ?? '—'} series × {item.repeticiones_objetivo ?? '—'} reps
                  {item.peso_objetivo != null ? ` · ${item.peso_objetivo} kg` : ''}
                </ThemedText>
              </View>
              <Pressable onPress={() => quitarItem(index)}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </Pressable>
            </Card>
          ))}

          {!seleccionadoEj ? (
            <View style={styles.buscarContainer}>
              <TextInput
                value={busquedaEj}
                onChangeText={setBusquedaEj}
                placeholder="Buscar ejercicio..."
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
              {resultadosEj.map((r) => (
                <Pressable key={r.id} onPress={() => setSeleccionadoEj(r)}>
                  <Card style={styles.resultado}>
                    <ThemedText type="small">{r.nombre}</ThemedText>
                  </Card>
                </Pressable>
              ))}
              {busquedaEj.trim() !== '' && resultadosEj.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  Sin resultados. Crea el ejercicio primero en Ejercicios.
                </ThemedText>
              )}
            </View>
          ) : (
            <View style={styles.buscarContainer}>
              <View style={styles.seleccionadoRow}>
                <ThemedText type="smallBold" style={styles.seleccionadoNombre}>
                  {seleccionadoEj.nombre}
                </ThemedText>
                <Pressable onPress={cancelarSeleccion}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Cambiar
                  </ThemedText>
                </Pressable>
              </View>
              <View style={styles.filaObjetivos}>
                <TextInput
                  value={seriesObj}
                  onChangeText={setSeriesObj}
                  keyboardType="number-pad"
                  placeholder="Series"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.inputCorto, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
                <TextInput
                  value={repsObj}
                  onChangeText={setRepsObj}
                  keyboardType="number-pad"
                  placeholder="Reps"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.inputCorto, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
                <TextInput
                  value={pesoObj}
                  onChangeText={setPesoObj}
                  keyboardType="decimal-pad"
                  placeholder="Kg"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.inputCorto, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              </View>
              <AppButton label="Agregar a la rutina" onPress={confirmarAgregarEjercicio} style={styles.botonAgregar} />
            </View>
          )}

          <AppButton label="Guardar" onPress={onGuardar} style={styles.botonGuardar} />

          {editando && (
            <AppButton label="Eliminar rutina" variante="peligro" onPress={onEliminar} style={styles.botonEliminar} />
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
  inputCorto: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  seccion: { marginTop: Spacing.three },
  itemAgregado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemAgregadoTexto: { flex: 1, gap: 2, marginRight: Spacing.two },
  buscarContainer: { gap: Spacing.two, marginTop: Spacing.one },
  resultado: {},
  seleccionadoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seleccionadoNombre: { flex: 1 },
  filaObjetivos: { flexDirection: 'row', gap: Spacing.two },
  botonAgregar: { marginTop: Spacing.one },
  botonGuardar: { marginTop: Spacing.four },
  botonEliminar: { marginTop: Spacing.three },
});

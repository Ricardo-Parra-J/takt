import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CamposNutricionales, VALORES_VACIOS } from '@/components/comida/campos-nutricionales';
import { UnidadPicker } from '@/components/comida/unidad-picker';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { ValoresNutricionales } from '@/db/nutricion';
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  getProducto,
} from '@/db/repositories/productos';

export default function ProductoFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = !!id;
  const router = useRouter();
  const theme = useTheme();

  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [cantidadBase, setCantidadBase] = useState('100');
  const [unidadId, setUnidadId] = useState<number | null>(null);
  const [valores, setValores] = useState<ValoresNutricionales>(VALORES_VACIOS);
  const [cargando, setCargando] = useState(editando);

  useEffect(() => {
    if (!id) return;
    getProducto(Number(id)).then((p) => {
      if (!p) return;
      setNombre(p.nombre);
      setMarca(p.marca_nombre ?? '');
      setCantidadBase(String(p.porcion_base_cantidad));
      setUnidadId(p.porcion_base_unidad_id);
      setValores({
        calorias: p.calorias,
        proteinas_g: p.proteinas_g,
        carbohidratos_g: p.carbohidratos_g,
        grasas_g: p.grasas_g,
        fibra_g: p.fibra_g,
        azucares_g: p.azucares_g,
        sodio_mg: p.sodio_mg,
      });
      setCargando(false);
    });
  }, [id]);

  async function onGuardar() {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Ponle un nombre al producto.');
      return;
    }
    if (!unidadId) {
      Alert.alert('Falta la unidad', 'Elige en qué unidad están dados estos valores nutricionales.');
      return;
    }
    const cantidad = Number(cantidadBase.replace(',', '.'));
    if (!cantidad || cantidad <= 0) {
      Alert.alert('Cantidad inválida', 'La cantidad base debe ser un número mayor a 0.');
      return;
    }

    const datos = { nombre, marca, porcion_base_cantidad: cantidad, porcion_base_unidad_id: unidadId, ...valores };
    if (editando) {
      await actualizarProducto(Number(id), datos);
    } else {
      await crearProducto(datos);
    }
    router.back();
  }

  function onEliminar() {
    Alert.alert('Eliminar producto', `¿Eliminar "${nombre}"? Esto falla si está usado en alguna receta.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarProducto(Number(id));
            router.back();
          } catch {
            Alert.alert('No se pudo eliminar', 'Este producto está siendo usado en una o más recetas.');
          }
        },
      },
    ]);
  }

  if (cargando) return null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: editando ? 'Editar producto' : 'Nuevo producto' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="small" themeColor="textSecondary">
            Nombre
          </ThemedText>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Yogur Vainilla"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Marca
          </ThemedText>
          <TextInput
            value={marca}
            onChangeText={setMarca}
            placeholder="Ej. Soprole"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Estos valores nutricionales están dados por:
          </ThemedText>
          <ThemedView style={styles.filaCantidad}>
            <TextInput
              value={cantidadBase}
              onChangeText={setCantidadBase}
              keyboardType="decimal-pad"
              style={[styles.inputCorto, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            <ThemedView style={styles.unidadPickerFlex}>
              <UnidadPicker value={unidadId} onChange={setUnidadId} />
            </ThemedView>
          </ThemedView>

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Valores nutricionales
          </ThemedText>
          <CamposNutricionales valores={valores} onChange={setValores} />

          <Pressable onPress={onGuardar} style={styles.botonGuardar}>
            <ThemedView type="backgroundSelected" style={styles.botonInner}>
              <ThemedText type="smallBold">Guardar</ThemedText>
            </ThemedView>
          </Pressable>

          {editando && (
            <Pressable onPress={onEliminar} style={styles.botonEliminar}>
              <ThemedText type="small" style={styles.textoEliminar}>
                Eliminar producto
              </ThemedText>
            </Pressable>
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
  inputCorto: { width: 80, borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, fontSize: 16 },
  filaCantidad: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  unidadPickerFlex: { flex: 1 },
  seccion: { marginTop: Spacing.three },
  botonGuardar: { marginTop: Spacing.four },
  botonInner: { padding: Spacing.three, borderRadius: Spacing.three, alignItems: 'center' },
  botonEliminar: { marginTop: Spacing.three, alignItems: 'center' },
  textoEliminar: { color: '#D64545' },
});

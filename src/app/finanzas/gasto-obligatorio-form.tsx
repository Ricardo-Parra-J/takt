import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import {
  actualizarGastoObligatorio,
  buscarOCrearCategoriaFinanzas,
  CategoriaFinanzas,
  crearGastoObligatorio,
  eliminarGastoObligatorio,
  getGastoObligatorio,
  listCategoriasFinanzas,
} from '@/db/repositories/finanzas';

export default function GastoObligatorioFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = !!id;
  const router = useRouter();
  const theme = useTheme();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [diaCobro, setDiaCobro] = useState('1');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<CategoriaFinanzas[]>([]);
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nombreCategoriaNueva, setNombreCategoriaNueva] = useState('');
  const [cargando, setCargando] = useState(editando);

  useEffect(() => {
    listCategoriasFinanzas('gasto').then(setCategorias);
  }, []);

  useEffect(() => {
    if (!id) return;
    getGastoObligatorio(Number(id)).then((g) => {
      if (!g) return;
      setTitulo(g.titulo);
      setDescripcion(g.descripcion ?? '');
      setMonto(String(g.monto));
      setDiaCobro(String(g.dia_cobro));
      setCategoriaId(g.categoria_id);
      setCargando(false);
    });
  }, [id]);

  async function onCrearCategoria() {
    if (!nombreCategoriaNueva.trim()) return;
    const nuevoId = await buscarOCrearCategoriaFinanzas(nombreCategoriaNueva, 'gasto');
    const actualizadas = await listCategoriasFinanzas('gasto');
    setCategorias(actualizadas);
    setCategoriaId(nuevoId);
    setNombreCategoriaNueva('');
    setCreandoCategoria(false);
  }

  async function onGuardar() {
    if (!titulo.trim()) {
      Alert.alert('Falta el título', 'Ponle un título al gasto obligatorio.');
      return;
    }
    const montoNum = Number(monto.replace(',', '.'));
    if (!montoNum || montoNum <= 0) {
      Alert.alert('Monto inválido', 'El monto debe ser un número mayor a 0.');
      return;
    }
    const dia = Number(diaCobro);
    if (!dia || dia < 1 || dia > 31) {
      Alert.alert('Día inválido', 'El día de cobro debe estar entre 1 y 31.');
      return;
    }

    const datos = { titulo, descripcion, monto: montoNum, dia_cobro: dia, categoria_id: categoriaId };
    if (editando) {
      await actualizarGastoObligatorio(Number(id), datos);
    } else {
      await crearGastoObligatorio(datos);
    }
    router.back();
  }

  function onEliminar() {
    Alert.alert('Eliminar gasto obligatorio', `¿Eliminar "${titulo}"? Los movimientos ya generados no se borran.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarGastoObligatorio(Number(id));
            router.back();
          } catch {
            Alert.alert(
              'No se pudo eliminar',
              'Ya generó movimientos financieros. Puedes desactivarlo en vez de eliminarlo.'
            );
          }
        },
      },
    ]);
  }

  if (cargando) return null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: editando ? 'Editar gasto obligatorio' : 'Nuevo gasto obligatorio' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="small" themeColor="textSecondary">
            Título
          </ThemedText>
          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ej. Netflix"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <View style={styles.filaMontoDia}>
            <View style={styles.mitad}>
              <ThemedText type="small" themeColor="textSecondary">
                Monto (CLP)
              </ThemedText>
              <TextInput
                value={monto}
                onChangeText={setMonto}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            </View>
            <View style={styles.mitad}>
              <ThemedText type="small" themeColor="textSecondary">
                Día de cobro
              </ThemedText>
              <TextInput
                value={diaCobro}
                onChangeText={setDiaCobro}
                keyboardType="number-pad"
                placeholder="1-31"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            </View>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Categoría
          </ThemedText>
          <View style={styles.chips}>
            <Pressable onPress={() => setCategoriaId(null)}>
              <ThemedView type={categoriaId === null ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                <ThemedText type="small">Sin categoría</ThemedText>
              </ThemedView>
            </Pressable>
            {categorias.map((c) => (
              <Pressable key={c.id} onPress={() => setCategoriaId(c.id)}>
                <ThemedView type={categoriaId === c.id ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                  <ThemedText type="small">{c.nombre}</ThemedText>
                </ThemedView>
              </Pressable>
            ))}
            {!creandoCategoria && (
              <Pressable onPress={() => setCreandoCategoria(true)}>
                <ThemedView type="backgroundElement" style={styles.chip}>
                  <Ionicons name="add" size={14} color={theme.text} />
                </ThemedView>
              </Pressable>
            )}
          </View>
          {creandoCategoria && (
            <View style={styles.filaCategoriaNueva}>
              <TextInput
                value={nombreCategoriaNueva}
                onChangeText={setNombreCategoriaNueva}
                placeholder="Nombre de la categoría"
                placeholderTextColor={theme.textSecondary}
                autoFocus
                onSubmitEditing={onCrearCategoria}
                style={[styles.input, styles.inputFlex, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
              <Pressable onPress={onCrearCategoria} hitSlop={8}>
                <Ionicons name="checkmark-circle" size={26} color={theme.text} />
              </Pressable>
            </View>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Descripción
          </ThemedText>
          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Detalles opcionales..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            style={[styles.inputMultilinea, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <Pressable onPress={onGuardar} style={styles.botonGuardar}>
            <ThemedView type="backgroundSelected" style={styles.botonInner}>
              <ThemedText type="smallBold">Guardar</ThemedText>
            </ThemedView>
          </Pressable>

          {editando && (
            <Pressable onPress={onEliminar} style={styles.botonEliminar}>
              <ThemedText type="small" style={styles.textoEliminar}>
                Eliminar gasto obligatorio
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
  inputFlex: { flex: 1 },
  inputMultilinea: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  filaMontoDia: { flexDirection: 'row', gap: Spacing.three },
  mitad: { flex: 1, gap: 4 },
  seccion: { marginTop: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: Spacing.four },
  filaCategoriaNueva: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  botonGuardar: { marginTop: Spacing.four },
  botonInner: { padding: Spacing.three, borderRadius: Spacing.three, alignItems: 'center' },
  botonEliminar: { marginTop: Spacing.three, alignItems: 'center' },
  textoEliminar: { color: '#D64545' },
});

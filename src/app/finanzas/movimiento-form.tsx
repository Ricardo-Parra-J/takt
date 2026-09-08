import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import {
  actualizarMovimiento,
  buscarOCrearCategoriaFinanzas,
  CategoriaFinanzas,
  crearMovimiento,
  eliminarMovimiento,
  fechaLocalHoy,
  getMovimiento,
  horaLocal,
  listCategoriasFinanzas,
} from '@/db/repositories/finanzas';

export default function MovimientoFormScreen() {
  const { id, tipo: tipoParam } = useLocalSearchParams<{ id?: string; tipo?: string }>();
  const editando = !!id;
  const router = useRouter();
  const theme = useTheme();

  const [tipo, setTipo] = useState<'gasto' | 'ganancia'>(tipoParam === 'ganancia' ? 'ganancia' : 'gasto');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(fechaLocalHoy());
  const [hora, setHora] = useState(horaLocal());
  const [categorias, setCategorias] = useState<CategoriaFinanzas[]>([]);
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nombreCategoriaNueva, setNombreCategoriaNueva] = useState('');
  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);
  const [cargando, setCargando] = useState(editando);

  useEffect(() => {
    listCategoriasFinanzas(tipo).then(setCategorias);
    setCategoriaId(null);
  }, [tipo]);

  useEffect(() => {
    if (!id) return;
    getMovimiento(Number(id)).then((mov) => {
      if (!mov || (mov.tipo !== 'gasto' && mov.tipo !== 'ganancia')) return;
      setTipo(mov.tipo);
      setTitulo(mov.titulo);
      setDescripcion(mov.descripcion ?? '');
      setMonto(String(mov.monto));
      setCategoriaId(mov.categoria_id);
      setFecha(mov.fecha);
      setHora(mov.hora ?? horaLocal());
      setCargando(false);
    });
  }, [id]);

  async function onCrearCategoria() {
    if (!nombreCategoriaNueva.trim()) return;
    const nuevoId = await buscarOCrearCategoriaFinanzas(nombreCategoriaNueva, tipo);
    const actualizadas = await listCategoriasFinanzas(tipo);
    setCategorias(actualizadas);
    setCategoriaId(nuevoId);
    setNombreCategoriaNueva('');
    setCreandoCategoria(false);
  }

  function onCambiarFecha(_event: unknown, seleccionada?: Date) {
    setMostrarPickerFecha(false);
    if (!seleccionada) return;
    const pad = (n: number) => String(n).padStart(2, '0');
    setFecha(`${seleccionada.getFullYear()}-${pad(seleccionada.getMonth() + 1)}-${pad(seleccionada.getDate())}`);
  }

  function onCambiarHora(_event: unknown, seleccionada?: Date) {
    setMostrarPickerHora(false);
    if (!seleccionada) return;
    setHora(horaLocal(seleccionada));
  }

  async function onGuardar() {
    if (!titulo.trim()) {
      Alert.alert('Falta el título', 'Ponle un título al movimiento.');
      return;
    }
    const montoNum = Number(monto.replace(',', '.'));
    if (!montoNum || montoNum <= 0) {
      Alert.alert('Monto inválido', 'El monto debe ser un número mayor a 0.');
      return;
    }

    const datos = { tipo, titulo, descripcion, monto: montoNum, categoria_id: categoriaId, fecha, hora };
    if (editando) {
      await actualizarMovimiento(Number(id), datos);
    } else {
      await crearMovimiento(datos);
    }
    router.back();
  }

  function onEliminar() {
    Alert.alert('Eliminar movimiento', `¿Eliminar "${titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarMovimiento(Number(id));
          router.back();
        },
      },
    ]);
  }

  if (cargando) return null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: editando ? 'Editar movimiento' : tipo === 'gasto' ? 'Nuevo gasto' : 'Nueva ganancia' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.chips}>
            <Pressable onPress={() => setTipo('gasto')}>
              <ThemedView type={tipo === 'gasto' ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                <ThemedText type="small">Gasto</ThemedText>
              </ThemedView>
            </Pressable>
            <Pressable onPress={() => setTipo('ganancia')}>
              <ThemedView type={tipo === 'ganancia' ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                <ThemedText type="small">Ganancia</ThemedText>
              </ThemedView>
            </Pressable>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Título
          </ThemedText>
          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder={tipo === 'gasto' ? 'Ej. Supermercado' : 'Ej. Venta de bicicleta'}
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
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

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Fecha y hora
          </ThemedText>
          <View style={styles.filaFecha}>
            <Pressable onPress={() => setMostrarPickerFecha(true)}>
              <ThemedView type="backgroundElement" style={styles.chipFecha}>
                <ThemedText type="small">{fecha}</ThemedText>
              </ThemedView>
            </Pressable>
            <Pressable onPress={() => setMostrarPickerHora(true)}>
              <ThemedView type="backgroundElement" style={styles.chipFecha}>
                <ThemedText type="small">{hora}</ThemedText>
              </ThemedView>
            </Pressable>
          </View>
          {mostrarPickerFecha && (
            <DateTimePicker value={new Date(`${fecha}T00:00:00`)} mode="date" display="default" onChange={onCambiarFecha} />
          )}
          {mostrarPickerHora && (
            <DateTimePicker
              value={new Date(`${fecha}T${hora}:00`)}
              mode="time"
              display="default"
              onChange={onCambiarHora}
            />
          )}

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
                Eliminar movimiento
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
  seccion: { marginTop: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: Spacing.four },
  filaFecha: { flexDirection: 'row', gap: Spacing.two },
  chipFecha: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Spacing.two },
  filaCategoriaNueva: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  botonGuardar: { marginTop: Spacing.four },
  botonInner: { padding: Spacing.three, borderRadius: Spacing.three, alignItems: 'center' },
  botonEliminar: { marginTop: Spacing.three, alignItems: 'center' },
  textoEliminar: { color: '#D64545' },
});

import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import {
  actualizarMovimiento,
  actualizarMovimientoRecurrente,
  buscarOCrearCategoriaFinanzas,
  CategoriaFinanzas,
  crearMovimiento,
  crearMovimientoRecurrente,
  eliminarMovimiento,
  eliminarMovimientoRecurrente,
  fechaLocalHoy,
  getMovimiento,
  getMovimientoRecurrente,
  horaLocal,
  listCategoriasFinanzas,
  TipoMovimiento,
} from '@/db/repositories/finanzas';

export default function MovimientoFormScreen() {
  const {
    id,
    recurrenteId,
    tipo: tipoParam,
    recurrente: recurrenteParam,
  } = useLocalSearchParams<{
    id?: string;
    recurrenteId?: string;
    tipo?: string;
    recurrente?: string;
  }>();
  const editandoPuntual = !!id;
  const editandoRecurrente = !!recurrenteId;
  const editando = editandoPuntual || editandoRecurrente;
  const router = useRouter();
  const theme = useTheme();

  const [tipo, setTipo] = useState<TipoMovimiento>(tipoParam === 'ganancia' ? 'ganancia' : 'gasto');
  const [esRecurrente, setEsRecurrente] = useState(editandoRecurrente || recurrenteParam === '1');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(fechaLocalHoy());
  const [hora, setHora] = useState(horaLocal());
  const [diaCobro, setDiaCobro] = useState(String(new Date().getDate()));
  const [categorias, setCategorias] = useState<CategoriaFinanzas[]>([]);
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nombreCategoriaNueva, setNombreCategoriaNueva] = useState('');
  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);
  const [cargando, setCargando] = useState(editando);

  useEffect(() => {
    listCategoriasFinanzas(tipo).then(setCategorias);
    if (!editando) setCategoriaId(null);
  }, [tipo, editando]);

  useEffect(() => {
    if (id) {
      getMovimiento(Number(id)).then((mov) => {
        if (!mov) return;
        setTipo(mov.tipo);
        setTitulo(mov.titulo);
        setDescripcion(mov.descripcion ?? '');
        setMonto(String(mov.monto));
        setCategoriaId(mov.categoria_id);
        setFecha(mov.fecha);
        setHora(mov.hora ?? horaLocal());
        setCargando(false);
      });
    } else if (recurrenteId) {
      getMovimientoRecurrente(Number(recurrenteId)).then((rec) => {
        if (!rec) return;
        setTipo(rec.tipo);
        setTitulo(rec.titulo);
        setDescripcion(rec.descripcion ?? '');
        setMonto(String(rec.monto));
        setCategoriaId(rec.categoria_id);
        setDiaCobro(String(rec.dia_cobro));
        setCargando(false);
      });
    }
  }, [id, recurrenteId]);

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

    if (esRecurrente) {
      const dia = Number(diaCobro);
      if (!dia || dia < 1 || dia > 31) {
        Alert.alert('Día inválido', 'El día del mes debe estar entre 1 y 31.');
        return;
      }
      const datos = { tipo, titulo, descripcion, monto: montoNum, dia_cobro: dia, categoria_id: categoriaId };
      if (editandoRecurrente) {
        await actualizarMovimientoRecurrente(Number(recurrenteId), datos);
      } else {
        await crearMovimientoRecurrente(datos);
      }
    } else {
      const datos = { tipo, titulo, descripcion, monto: montoNum, categoria_id: categoriaId, fecha, hora };
      if (editandoPuntual) {
        await actualizarMovimiento(Number(id), datos);
      } else {
        await crearMovimiento(datos);
      }
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
          try {
            if (editandoRecurrente) {
              await eliminarMovimientoRecurrente(Number(recurrenteId));
            } else {
              await eliminarMovimiento(Number(id));
            }
            router.back();
          } catch {
            Alert.alert('No se pudo eliminar', 'Ya generó movimientos financieros este mes.');
          }
        },
      },
    ]);
  }

  if (cargando) return null;

  const tituloPantalla = editando
    ? esRecurrente
      ? 'Editar recurrente'
      : 'Editar movimiento'
    : tipo === 'gasto'
      ? 'Nuevo gasto'
      : 'Nueva ganancia';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: tituloPantalla }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.chips}>
            <Chip label="Gasto" selected={tipo === 'gasto'} onPress={() => setTipo('gasto')} />
            <Chip label="Ganancia" selected={tipo === 'ganancia'} onPress={() => setTipo('ganancia')} />
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Título
          </ThemedText>
          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder={tipo === 'gasto' ? 'Ej. Supermercado' : 'Ej. Sueldo'}
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

          {!editando && (
            <Pressable onPress={() => setEsRecurrente((v) => !v)} style={styles.recurrenteRow}>
              <Ionicons
                name={esRecurrente ? 'checkbox' : 'square-outline'}
                size={20}
                color={esRecurrente ? theme.accent : theme.textSecondary}
              />
              <View style={styles.recurrenteTexto}>
                <ThemedText type="small">
                  {tipo === 'gasto' ? 'Es un cobro que se repite cada mes' : 'Es un ingreso que se repite cada mes'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Ej. {tipo === 'gasto' ? 'Netflix, arriendo' : 'Sueldo, arriendo que cobras'} — se genera solo cada mes y
                  puedes activarlo/desactivarlo después.
                </ThemedText>
              </View>
            </Pressable>
          )}

          {esRecurrente ? (
            <>
              <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
                Día del mes
              </ThemedText>
              <TextInput
                value={diaCobro}
                onChangeText={setDiaCobro}
                keyboardType="number-pad"
                placeholder="1-31"
                placeholderTextColor={theme.textSecondary}
                style={[styles.inputCorto, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            </>
          ) : (
            <>
              <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
                Fecha y hora
              </ThemedText>
              <View style={styles.filaFecha}>
                <Pressable onPress={() => setMostrarPickerFecha(true)}>
                  <View style={[styles.chipFecha, { backgroundColor: theme.accentSoft }]}>
                    <ThemedText type="small" style={{ color: theme.accent }}>
                      {fecha}
                    </ThemedText>
                  </View>
                </Pressable>
                <Pressable onPress={() => setMostrarPickerHora(true)}>
                  <View style={[styles.chipFecha, { backgroundColor: theme.accentSoft }]}>
                    <ThemedText type="small" style={{ color: theme.accent }}>
                      {hora}
                    </ThemedText>
                  </View>
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
            </>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Categoría
          </ThemedText>
          <View style={styles.chips}>
            <Chip label="Sin categoría" selected={categoriaId === null} onPress={() => setCategoriaId(null)} />
            {categorias.map((c) => (
              <Chip key={c.id} label={c.nombre} selected={categoriaId === c.id} onPress={() => setCategoriaId(c.id)} />
            ))}
            {!creandoCategoria && (
              <Pressable onPress={() => setCreandoCategoria(true)}>
                <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                  <Ionicons name="add" size={14} color={theme.accent} />
                </View>
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
                <Ionicons name="checkmark-circle" size={26} color={theme.accent} />
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

          <AppButton label="Guardar" onPress={onGuardar} style={styles.botonGuardar} />

          {editando && <AppButton label="Eliminar" variante="peligro" onPress={onEliminar} style={styles.botonEliminar} />}
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
  inputCorto: { width: 80, borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, fontSize: 16 },
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
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: Radius.pill },
  recurrenteRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three, alignItems: 'flex-start' },
  recurrenteTexto: { flex: 1, gap: 2 },
  filaFecha: { flexDirection: 'row', gap: Spacing.two },
  chipFecha: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.medium },
  filaCategoriaNueva: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  botonGuardar: { marginTop: Spacing.four },
  botonEliminar: { marginTop: Spacing.three },
});

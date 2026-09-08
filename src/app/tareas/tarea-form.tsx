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
import { buscarOCrearCategoriaTarea, CategoriaTarea, listCategoriasTarea } from '@/db/repositories/categorias-tarea';
import {
  actualizarTareaCompleta,
  crearTareaCompleta,
  DatosSubtarea,
  eliminarTarea,
  formatearFechaHora,
  getTareaDetalle,
  Prioridad,
} from '@/db/repositories/tareas';

const PRIORIDADES: { key: Prioridad | null; label: string }[] = [
  { key: null, label: 'Ninguna' },
  { key: 'baja', label: 'Baja' },
  { key: 'media', label: 'Media' },
  { key: 'alta', label: 'Alta' },
];

/** Parsea 'YYYY-MM-DD HH:MM' (hora local) a un Date. */
function parsearFechaPlazo(texto: string): Date {
  const [fecha, hora] = texto.split(' ');
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [h, m] = (hora ?? '00:00').split(':').map(Number);
  return new Date(anio, mes - 1, dia, h, m);
}

export default function TareaFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = !!id;
  const router = useRouter();
  const theme = useTheme();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<Prioridad | null>(null);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [fechaPlazo, setFechaPlazo] = useState<Date | null>(null);
  const [recordatorioDias, setRecordatorioDias] = useState('');
  const [esMetaLargoPlazo, setEsMetaLargoPlazo] = useState(false);
  const [subtareas, setSubtareas] = useState<DatosSubtarea[]>([]);
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');

  const [categorias, setCategorias] = useState<CategoriaTarea[]>([]);
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nombreCategoriaNueva, setNombreCategoriaNueva] = useState('');

  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);

  const [cargando, setCargando] = useState(editando);

  useEffect(() => {
    listCategoriasTarea().then(setCategorias);
  }, []);

  useEffect(() => {
    if (!id) return;
    getTareaDetalle(Number(id)).then((tarea) => {
      if (!tarea) return;
      setTitulo(tarea.titulo);
      setDescripcion(tarea.descripcion ?? '');
      setPrioridad(tarea.prioridad);
      setCategoriaId(tarea.categoria_id);
      setFechaPlazo(tarea.fecha_plazo ? parsearFechaPlazo(tarea.fecha_plazo) : null);
      setRecordatorioDias(tarea.recordatorio_dias_antes != null ? String(tarea.recordatorio_dias_antes) : '');
      setEsMetaLargoPlazo(tarea.es_meta_largo_plazo === 1);
      setSubtareas(tarea.subtareas.map((s) => ({ titulo: s.titulo, completada: s.completada === 1 })));
      setCargando(false);
    });
  }, [id]);

  async function onCrearCategoria() {
    if (!nombreCategoriaNueva.trim()) return;
    const nuevoId = await buscarOCrearCategoriaTarea(nombreCategoriaNueva);
    const actualizadas = await listCategoriasTarea();
    setCategorias(actualizadas);
    setCategoriaId(nuevoId);
    setNombreCategoriaNueva('');
    setCreandoCategoria(false);
  }

  function onCambiarFecha(_event: unknown, seleccionada?: Date) {
    setMostrarPickerFecha(false);
    if (!seleccionada) return;
    const base = fechaPlazo ?? new Date();
    setFechaPlazo(new Date(seleccionada.getFullYear(), seleccionada.getMonth(), seleccionada.getDate(), base.getHours(), base.getMinutes()));
  }

  function onCambiarHora(_event: unknown, seleccionada?: Date) {
    setMostrarPickerHora(false);
    if (!seleccionada) return;
    const base = fechaPlazo ?? new Date();
    setFechaPlazo(new Date(base.getFullYear(), base.getMonth(), base.getDate(), seleccionada.getHours(), seleccionada.getMinutes()));
  }

  function onAgregarSubtarea() {
    if (!nuevaSubtarea.trim()) return;
    setSubtareas((prev) => [...prev, { titulo: nuevaSubtarea.trim(), completada: false }]);
    setNuevaSubtarea('');
  }

  function onToggleSubtarea(index: number) {
    setSubtareas((prev) => prev.map((s, i) => (i === index ? { ...s, completada: !s.completada } : s)));
  }

  function onQuitarSubtarea(index: number) {
    setSubtareas((prev) => prev.filter((_, i) => i !== index));
  }

  async function onGuardar() {
    if (!titulo.trim()) {
      Alert.alert('Falta el título', 'Ponle un título a la tarea.');
      return;
    }
    const recordatorio = recordatorioDias.trim() ? Number(recordatorioDias) : null;
    if (recordatorio != null && (Number.isNaN(recordatorio) || recordatorio < 0)) {
      Alert.alert('Recordatorio inválido', 'Los días de anticipación deben ser un número mayor o igual a 0.');
      return;
    }

    const datos = {
      titulo,
      descripcion,
      categoria_id: categoriaId,
      prioridad,
      fecha_plazo: fechaPlazo ? formatearFechaHora(fechaPlazo) : null,
      recordatorio_dias_antes: fechaPlazo ? recordatorio : null,
      es_meta_largo_plazo: esMetaLargoPlazo,
      subtareas,
    };

    if (editando) {
      await actualizarTareaCompleta(Number(id), datos);
    } else {
      await crearTareaCompleta(datos);
    }
    router.back();
  }

  function onEliminar() {
    Alert.alert('Eliminar tarea', `¿Eliminar "${titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarTarea(Number(id));
          router.back();
        },
      },
    ]);
  }

  if (cargando) return null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: editando ? 'Editar tarea' : 'Nueva tarea' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="small" themeColor="textSecondary">
            Título
          </ThemedText>
          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ej. Entregar informe"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

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

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Fecha de término
          </ThemedText>
          {fechaPlazo ? (
            <View style={styles.filaFecha}>
              <Pressable onPress={() => setMostrarPickerFecha(true)}>
                <View style={[styles.chipFecha, { backgroundColor: theme.accentSoft }]}>
                  <ThemedText type="small" style={{ color: theme.accent }}>
                    {fechaPlazo.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </ThemedText>
                </View>
              </Pressable>
              <Pressable onPress={() => setMostrarPickerHora(true)}>
                <View style={[styles.chipFecha, { backgroundColor: theme.accentSoft }]}>
                  <ThemedText type="small" style={{ color: theme.accent }}>
                    {fechaPlazo.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </ThemedText>
                </View>
              </Pressable>
              <Pressable onPress={() => setFechaPlazo(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setFechaPlazo(new Date())}>
              <View style={[styles.chipAgregarFecha, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="calendar-outline" size={16} color={theme.accent} />
                <ThemedText type="small" style={{ color: theme.accent }}>
                  Agregar fecha de término
                </ThemedText>
              </View>
            </Pressable>
          )}
          {!fechaPlazo && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.pista}>
              Sin fecha de término la tarea nunca puede quedar "atrasada".
            </ThemedText>
          )}
          {mostrarPickerFecha && (
            <DateTimePicker value={fechaPlazo ?? new Date()} mode="date" display="default" onChange={onCambiarFecha} />
          )}
          {mostrarPickerHora && (
            <DateTimePicker value={fechaPlazo ?? new Date()} mode="time" display="default" onChange={onCambiarHora} />
          )}

          {fechaPlazo && (
            <>
              <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
                Avisar con anticipación (días antes, opcional)
              </ThemedText>
              <TextInput
                value={recordatorioDias}
                onChangeText={setRecordatorioDias}
                keyboardType="number-pad"
                placeholder="Ej. 3"
                placeholderTextColor={theme.textSecondary}
                style={[styles.inputCorto, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            </>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Prioridad
          </ThemedText>
          <View style={styles.chips}>
            {PRIORIDADES.map((p) => (
              <Chip key={p.label} label={p.label} selected={prioridad === p.key} onPress={() => setPrioridad(p.key)} />
            ))}
          </View>

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
                  <Ionicons name="add" size={14} color={theme.text} />
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

          <Pressable onPress={() => setEsMetaLargoPlazo((v) => !v)} style={styles.metaRow}>
            <Ionicons
              name={esMetaLargoPlazo ? 'checkbox' : 'square-outline'}
              size={20}
              color={esMetaLargoPlazo ? theme.accent : theme.textSecondary}
            />
            <ThemedText type="small">Meta de mediano/largo plazo</ThemedText>
          </Pressable>

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Subtareas
          </ThemedText>
          {subtareas.map((s, index) => (
            <View key={index} style={[styles.subtareaRow, { backgroundColor: theme.backgroundElement }]}>
              <Pressable onPress={() => onToggleSubtarea(index)} hitSlop={8}>
                <Ionicons
                  name={s.completada ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={s.completada ? theme.textSecondary : theme.accent}
                />
              </Pressable>
              <ThemedText type="small" style={[styles.subtareaTexto, s.completada && styles.tachado]}>
                {s.titulo}
              </ThemedText>
              <Pressable onPress={() => onQuitarSubtarea(index)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
          ))}
          <View style={styles.filaCategoriaNueva}>
            <TextInput
              value={nuevaSubtarea}
              onChangeText={setNuevaSubtarea}
              placeholder="Agregar subtarea..."
              placeholderTextColor={theme.textSecondary}
              onSubmitEditing={onAgregarSubtarea}
              style={[styles.input, styles.inputFlex, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            <Pressable onPress={onAgregarSubtarea} hitSlop={8}>
              <Ionicons name="add-circle" size={26} color={theme.accent} />
            </Pressable>
          </View>

          <AppButton label="Guardar" onPress={onGuardar} style={styles.botonGuardar} />

          {editando && (
            <AppButton label="Eliminar tarea" variante="peligro" onPress={onEliminar} style={styles.botonEliminar} />
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
  inputCorto: { width: 80, borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, fontSize: 16 },
  seccion: { marginTop: Spacing.three },
  filaFecha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chipFecha: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Spacing.two },
  chipAgregarFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  pista: { marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: Radius.pill },
  filaCategoriaNueva: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  subtareaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    marginBottom: Spacing.one,
  },
  subtareaTexto: { flex: 1 },
  tachado: { textDecorationLine: 'line-through' },
  botonGuardar: { marginTop: Spacing.four },
  botonInner: { padding: Spacing.three, borderRadius: Spacing.three, alignItems: 'center' },
  botonEliminar: { marginTop: Spacing.three, alignItems: 'center' },
  textoEliminar: { color: '#D64545' },
});

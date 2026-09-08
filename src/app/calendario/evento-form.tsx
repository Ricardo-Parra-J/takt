import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Link, Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { CatalogoItem, listTiposComida } from '@/db/repositories/catalogos';
import { listRecetas, RecetaListItem } from '@/db/repositories/recetas';
import { listPresets, PresetRutina } from '@/db/repositories/deporte';
import { listTareas, Tarea } from '@/db/repositories/tareas';
import {
  actualizarEvento,
  crearEvento,
  eliminarEvento,
  fechaLocal,
  Frecuencia,
  FRECUENCIAS,
  getEventoDetalle,
  horaLocal,
  marcarCompletado,
  TipoEvento,
  TIPOS_EVENTO,
} from '@/db/repositories/calendario';

const LETRA_DIA_SEMANA: { key: number; label: string }[] = [
  { key: 0, label: 'L' },
  { key: 1, label: 'M' },
  { key: 2, label: 'M' },
  { key: 3, label: 'J' },
  { key: 4, label: 'V' },
  { key: 5, label: 'S' },
  { key: 6, label: 'D' },
];

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EventoFormScreen() {
  const { id, fecha: fechaParam } = useLocalSearchParams<{ id?: string; fecha?: string }>();
  const editando = !!id;
  const router = useRouter();
  const theme = useTheme();

  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoEvento>('otro');
  const [fecha, setFecha] = useState(fechaParam || fechaLocal());
  const [todoElDia, setTodoElDia] = useState(false);
  const [horaInicio, setHoraInicio] = useState(horaLocal());
  const [horaFin, setHoraFin] = useState<string | null>(null);
  const [notas, setNotas] = useState('');
  const [completado, setCompletado] = useState(false);

  const [esRecurrente, setEsRecurrente] = useState(false);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('semanal');
  const [intervalo, setIntervalo] = useState('1');
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [fechaFin, setFechaFin] = useState<string | null>(null);

  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [mostrarPickerHoraInicio, setMostrarPickerHoraInicio] = useState(false);
  const [mostrarPickerHoraFin, setMostrarPickerHoraFin] = useState(false);
  const [mostrarPickerFechaFin, setMostrarPickerFechaFin] = useState(false);

  const [cargando, setCargando] = useState(editando);

  // --- Vinculación con comida ---
  const [tiposComida, setTiposComida] = useState<CatalogoItem[]>([]);
  const [tipoComidaId, setTipoComidaId] = useState<number | null>(null);
  const [recetaId, setRecetaId] = useState<number | null>(null);
  const [recetaNombre, setRecetaNombre] = useState<string | null>(null);
  const [busquedaReceta, setBusquedaReceta] = useState('');
  const [resultadosReceta, setResultadosReceta] = useState<RecetaListItem[]>([]);
  const [buscandoReceta, setBuscandoReceta] = useState(false);

  // --- Vinculación con entrenamiento (Deporte) ---
  const [presets, setPresets] = useState<PresetRutina[]>([]);
  const [presetRutinaId, setPresetRutinaId] = useState<number | null>(null);
  const [sesionEntrenamientoId, setSesionEntrenamientoId] = useState<number | null>(null);

  // --- Vinculación con tareas ---
  const [tareaId, setTareaId] = useState<number | null>(null);
  const [tareaTitulo, setTareaTitulo] = useState<string | null>(null);
  const [busquedaTarea, setBusquedaTarea] = useState('');
  const [todasTareas, setTodasTareas] = useState<Tarea[]>([]);
  const [buscandoTarea, setBuscandoTarea] = useState(false);

  useEffect(() => {
    listTiposComida().then(setTiposComida);
    listPresets().then(setPresets);
  }, []);

  useEffect(() => {
    if (!id) {
      setCargando(false);
      return;
    }
    getEventoDetalle(Number(id)).then((evento) => {
      if (!evento) return;
      setTitulo(evento.titulo);
      setTipo(evento.tipo);
      setFecha(evento.fecha);
      setTodoElDia(evento.todo_el_dia === 1);
      if (evento.hora_inicio) setHoraInicio(evento.hora_inicio);
      setHoraFin(evento.hora_fin);
      setNotas(evento.notas ?? '');
      setCompletado(evento.completado === 1);
      if (evento.recurrencia) {
        setEsRecurrente(true);
        setFrecuencia(evento.recurrencia.frecuencia);
        setIntervalo(String(evento.recurrencia.intervalo));
        setDiasSemana(evento.recurrencia.dias_semana);
        setFechaFin(evento.recurrencia.fecha_fin);
      }
      setTipoComidaId(evento.tipo_comida_id ?? null);
      setRecetaId(evento.receta_id ?? null);
      setRecetaNombre(evento.receta_nombre ?? null);
      setPresetRutinaId(evento.preset_rutina_id ?? null);
      setSesionEntrenamientoId(evento.sesion_entrenamiento_id ?? null);
      setTareaId(evento.tarea_id ?? null);
      setTareaTitulo(evento.tarea_titulo ?? null);
      setCargando(false);
    });
  }, [id]);

  // Refresca solo el estado de la sesión de entrenamiento vinculada al volver a
  // esta pantalla (por ejemplo, tras registrar el entrenamiento desde Deporte),
  // sin pisar el resto de los cambios que el usuario pueda tener sin guardar.
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getEventoDetalle(Number(id)).then((evento) => {
        if (!evento) return;
        setSesionEntrenamientoId(evento.sesion_entrenamiento_id ?? null);
      });
    }, [id])
  );

  useEffect(() => {
    if (tipo !== 'comida' || busquedaReceta.trim().length === 0) {
      setResultadosReceta([]);
      return;
    }
    setBuscandoReceta(true);
    const manija = setTimeout(() => {
      listRecetas(busquedaReceta).then((res) => {
        setResultadosReceta(res);
        setBuscandoReceta(false);
      });
    }, 250);
    return () => clearTimeout(manija);
  }, [busquedaReceta, tipo]);

  useEffect(() => {
    if (tipo !== 'entrega' && tipo !== 'certamen') return;
    if (todasTareas.length > 0) return;
    setBuscandoTarea(true);
    listTareas('todas').then((res) => {
      setTodasTareas(res);
      setBuscandoTarea(false);
    });
  }, [tipo, todasTareas.length]);

  function onCambiarFecha(_event: unknown, seleccionada?: Date) {
    setMostrarPickerFecha(false);
    if (!seleccionada) return;
    setFecha(fechaLocal(seleccionada));
  }

  function onCambiarHoraInicio(_event: unknown, seleccionada?: Date) {
    setMostrarPickerHoraInicio(false);
    if (!seleccionada) return;
    setHoraInicio(horaLocal(seleccionada));
  }

  function onCambiarHoraFin(_event: unknown, seleccionada?: Date) {
    setMostrarPickerHoraFin(false);
    if (!seleccionada) return;
    setHoraFin(horaLocal(seleccionada));
  }

  function onCambiarFechaFin(_event: unknown, seleccionada?: Date) {
    setMostrarPickerFechaFin(false);
    if (!seleccionada) return;
    setFechaFin(fechaLocal(seleccionada));
  }

  function alternarDiaSemana(dia: number) {
    setDiasSemana((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()));
  }

  function elegirReceta(r: RecetaListItem) {
    setRecetaId(r.id);
    setRecetaNombre(r.nombre);
    setBusquedaReceta('');
    setResultadosReceta([]);
  }

  function elegirTarea(t: Tarea) {
    setTareaId(t.id);
    setTareaTitulo(t.titulo);
    setBusquedaTarea('');
  }

  const tareasFiltradas =
    tipo === 'entrega' || tipo === 'certamen'
      ? todasTareas.filter(
          (t) => busquedaTarea.trim().length > 0 && t.titulo.toLowerCase().includes(busquedaTarea.trim().toLowerCase())
        )
      : [];

  async function onGuardar() {
    if (!titulo.trim()) {
      Alert.alert('Falta el título', 'Ponle un título al evento.');
      return;
    }
    const intervaloNum = Number(intervalo);
    if (esRecurrente && (!Number.isInteger(intervaloNum) || intervaloNum < 1)) {
      Alert.alert('Intervalo inválido', 'Debe ser un número entero mayor o igual a 1.');
      return;
    }
    if (esRecurrente && frecuencia === 'semanal' && diasSemana.length === 0) {
      Alert.alert('Faltan días', 'Elige al menos un día de la semana para la repetición.');
      return;
    }

    const datos = {
      titulo,
      tipo,
      fecha,
      todo_el_dia: todoElDia,
      hora_inicio: todoElDia ? null : horaInicio,
      hora_fin: todoElDia ? null : horaFin,
      notas,
      recurrencia: esRecurrente
        ? {
            frecuencia,
            intervalo: intervaloNum,
            fecha_fin: fechaFin,
            dias_semana: frecuencia === 'semanal' ? diasSemana : [],
          }
        : null,
      tipo_comida_id: tipo === 'comida' ? tipoComidaId : null,
      receta_id: tipo === 'comida' ? recetaId : null,
      preset_rutina_id: tipo === 'gimnasio' ? presetRutinaId : null,
      tarea_id: tipo === 'entrega' || tipo === 'certamen' ? tareaId : null,
    };

    let eventoId = Number(id);
    if (editando) {
      await actualizarEvento(eventoId, datos);
    } else {
      eventoId = await crearEvento(datos);
    }
    if (!esRecurrente) {
      await marcarCompletado(eventoId, completado);
    }
    router.back();
  }

  function onEliminar() {
    const mensaje = esRecurrente
      ? `¿Eliminar "${titulo}"? Esto elimina TODAS sus repeticiones.`
      : `¿Eliminar "${titulo}"?`;
    Alert.alert('Eliminar evento', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarEvento(Number(id));
          router.back();
        },
      },
    ]);
  }

  if (cargando) return null;

  const unidadIntervalo = FRECUENCIAS.find((f) => f.key === frecuencia)?.unidad ?? '';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: editando ? 'Editar evento' : 'Nuevo evento' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="small" themeColor="textSecondary">
            Título
          </ThemedText>
          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ej. Clase de cálculo"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Tipo
          </ThemedText>
          <View style={styles.chips}>
            {TIPOS_EVENTO.map((t) => (
              <Chip key={t.key} label={t.label} selected={tipo === t.key} onPress={() => setTipo(t.key)} />
            ))}
          </View>

          {tipo === 'comida' && (
            <View style={[styles.seccionVinculo, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Tipo de comida
              </ThemedText>
              <View style={styles.chips}>
                {tiposComida.map((tc) => (
                  <Chip
                    key={tc.id}
                    label={tc.nombre}
                    selected={tipoComidaId === tc.id}
                    onPress={() => setTipoComidaId(tipoComidaId === tc.id ? null : tc.id)}
                  />
                ))}
              </View>

              <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
                Receta (opcional)
              </ThemedText>
              {recetaId ? (
                <View style={styles.filaHoras}>
                  <View style={[styles.chipFecha, { backgroundColor: theme.accentSoft }]}>
                    <ThemedText type="small" style={{ color: theme.accent }}>
                      {recetaNombre}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => {
                      setRecetaId(null);
                      setRecetaNombre(null);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
              ) : (
                <>
                  <TextInput
                    value={busquedaReceta}
                    onChangeText={setBusquedaReceta}
                    placeholder="Buscar receta..."
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  />
                  {busquedaReceta.trim().length > 0 && !buscandoReceta && (
                    <View style={styles.listaResultados}>
                      {resultadosReceta.length === 0 ? (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.sinResultados}>
                          Sin resultados.
                        </ThemedText>
                      ) : (
                        resultadosReceta.map((r) => (
                          <Pressable
                            key={r.id}
                            onPress={() => elegirReceta(r)}
                            style={[styles.itemResultado, { borderColor: theme.backgroundSelected }]}
                          >
                            <ThemedText type="small">{r.nombre}</ThemedText>
                          </Pressable>
                        ))
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {tipo === 'gimnasio' && (
            <View style={[styles.seccionVinculo, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Rutina (opcional)
              </ThemedText>
              <View style={styles.chips}>
                {presets.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No tienes rutinas guardadas todavía.
                  </ThemedText>
                ) : (
                  presets.map((p) => (
                    <Chip
                      key={p.id}
                      label={p.nombre}
                      selected={presetRutinaId === p.id}
                      onPress={() => setPresetRutinaId(presetRutinaId === p.id ? null : p.id)}
                    />
                  ))
                )}
              </View>

              {editando && (
                <View style={styles.seccion}>
                  {sesionEntrenamientoId ? (
                    <View style={[styles.chipFecha, { backgroundColor: theme.accentSoft, alignSelf: 'flex-start' }]}>
                      <ThemedText type="small" style={{ color: theme.accent }}>
                        ✓ Entrenamiento registrado
                      </ThemedText>
                    </View>
                  ) : (
                    <Link
                      href={{
                        pathname: '/deporte/sesion-form',
                        params: {
                          eventoId: id,
                          fecha,
                          ...(presetRutinaId ? { presetId: String(presetRutinaId) } : {}),
                        },
                      }}
                      asChild
                    >
                      <AppButton label="Registrar este entrenamiento" variante="secundario" />
                    </Link>
                  )}
                </View>
              )}
            </View>
          )}

          {(tipo === 'entrega' || tipo === 'certamen') && (
            <View style={[styles.seccionVinculo, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Tarea vinculada (opcional)
              </ThemedText>
              {tareaId ? (
                <View style={styles.filaHoras}>
                  <View style={[styles.chipFecha, { backgroundColor: theme.accentSoft }]}>
                    <ThemedText type="small" style={{ color: theme.accent }}>
                      {tareaTitulo}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => {
                      setTareaId(null);
                      setTareaTitulo(null);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
              ) : (
                <>
                  <TextInput
                    value={busquedaTarea}
                    onChangeText={setBusquedaTarea}
                    placeholder="Buscar tarea..."
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  />
                  {busquedaTarea.trim().length > 0 && !buscandoTarea && (
                    <View style={styles.listaResultados}>
                      {tareasFiltradas.length === 0 ? (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.sinResultados}>
                          Sin resultados.
                        </ThemedText>
                      ) : (
                        tareasFiltradas.map((t) => (
                          <Pressable
                            key={t.id}
                            onPress={() => elegirTarea(t)}
                            style={[styles.itemResultado, { borderColor: theme.backgroundSelected }]}
                          >
                            <ThemedText type="small">{t.titulo}</ThemedText>
                          </Pressable>
                        ))
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Fecha
          </ThemedText>
          <Pressable onPress={() => setMostrarPickerFecha(true)}>
            <View style={[styles.chipFecha, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="small" style={{ color: theme.accent }}>
                {formatearFecha(fecha)}
              </ThemedText>
            </View>
          </Pressable>
          {mostrarPickerFecha && (
            <DateTimePicker
              value={new Date(`${fecha}T00:00:00`)}
              mode="date"
              display="default"
              onChange={onCambiarFecha}
            />
          )}

          <Pressable onPress={() => setTodoElDia((v) => !v)} style={styles.checkRow}>
            <Ionicons
              name={todoElDia ? 'checkbox' : 'square-outline'}
              size={20}
              color={todoElDia ? theme.accent : theme.textSecondary}
            />
            <ThemedText type="small">Todo el día</ThemedText>
          </Pressable>

          {!todoElDia && (
            <>
              <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
                Hora
              </ThemedText>
              <View style={styles.filaHoras}>
                <Pressable onPress={() => setMostrarPickerHoraInicio(true)}>
                  <View style={[styles.chipFecha, { backgroundColor: theme.accentSoft }]}>
                    <ThemedText type="small" style={{ color: theme.accent }}>
                      {horaInicio}
                    </ThemedText>
                  </View>
                </Pressable>
                {horaFin ? (
                  <>
                    <Pressable onPress={() => setMostrarPickerHoraFin(true)}>
                      <View style={[styles.chipFecha, { backgroundColor: theme.accentSoft }]}>
                        <ThemedText type="small" style={{ color: theme.accent }}>
                          {horaFin}
                        </ThemedText>
                      </View>
                    </Pressable>
                    <Pressable onPress={() => setHoraFin(null)} hitSlop={8}>
                      <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                    </Pressable>
                  </>
                ) : (
                  <Pressable onPress={() => setHoraFin(horaLocal())}>
                    <View style={[styles.chipFecha, { backgroundColor: theme.backgroundElement }]}>
                      <ThemedText type="small" themeColor="textSecondary">
                        + Hora de término
                      </ThemedText>
                    </View>
                  </Pressable>
                )}
              </View>
              {mostrarPickerHoraInicio && (
                <DateTimePicker
                  value={new Date(`${fecha}T${horaInicio}:00`)}
                  mode="time"
                  display="default"
                  onChange={onCambiarHoraInicio}
                />
              )}
              {mostrarPickerHoraFin && (
                <DateTimePicker
                  value={new Date(`${fecha}T${horaFin ?? horaInicio}:00`)}
                  mode="time"
                  display="default"
                  onChange={onCambiarHoraFin}
                />
              )}
            </>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Notas
          </ThemedText>
          <TextInput
            value={notas}
            onChangeText={setNotas}
            placeholder="Detalles opcionales..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            style={[styles.inputMultilinea, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <Pressable onPress={() => setEsRecurrente((v) => !v)} style={styles.checkRow}>
            <Ionicons
              name={esRecurrente ? 'checkbox' : 'square-outline'}
              size={20}
              color={esRecurrente ? theme.accent : theme.textSecondary}
            />
            <ThemedText type="small">Se repite</ThemedText>
          </Pressable>

          {esRecurrente && (
            <>
              <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
                Frecuencia
              </ThemedText>
              <View style={styles.chips}>
                {FRECUENCIAS.map((f) => (
                  <Chip key={f.key} label={f.label} selected={frecuencia === f.key} onPress={() => setFrecuencia(f.key)} />
                ))}
              </View>

              <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
                Cada cuánto ({unidadIntervalo})
              </ThemedText>
              <TextInput
                value={intervalo}
                onChangeText={setIntervalo}
                keyboardType="number-pad"
                style={[styles.inputCorto, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />

              {frecuencia === 'semanal' && (
                <>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
                    Días de la semana
                  </ThemedText>
                  <View style={styles.chips}>
                    {LETRA_DIA_SEMANA.map((d) => (
                      <Chip
                        key={d.key}
                        label={d.label}
                        selected={diasSemana.includes(d.key)}
                        onPress={() => alternarDiaSemana(d.key)}
                      />
                    ))}
                  </View>
                </>
              )}

              <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
                Fecha de fin
              </ThemedText>
              {fechaFin ? (
                <View style={styles.filaHoras}>
                  <Pressable onPress={() => setMostrarPickerFechaFin(true)}>
                    <View style={[styles.chipFecha, { backgroundColor: theme.accentSoft }]}>
                      <ThemedText type="small" style={{ color: theme.accent }}>
                        {formatearFecha(fechaFin)}
                      </ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => setFechaFin(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setFechaFin(fecha)}>
                  <View style={[styles.chipFecha, { backgroundColor: theme.backgroundElement, alignSelf: 'flex-start' }]}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Sin fecha de fin (se repite siempre)
                    </ThemedText>
                  </View>
                </Pressable>
              )}
              {mostrarPickerFechaFin && (
                <DateTimePicker
                  value={new Date(`${fechaFin ?? fecha}T00:00:00`)}
                  mode="date"
                  display="default"
                  onChange={onCambiarFechaFin}
                />
              )}
            </>
          )}

          {editando && !esRecurrente && (
            <Pressable onPress={() => setCompletado((v) => !v)} style={styles.checkRow}>
              <Ionicons
                name={completado ? 'checkbox' : 'square-outline'}
                size={20}
                color={completado ? theme.accent : theme.textSecondary}
              />
              <ThemedText type="small">Marcar como hecho</ThemedText>
            </Pressable>
          )}

          <AppButton label="Guardar" onPress={onGuardar} style={styles.botonGuardar} />

          {editando && (
            <AppButton label="Eliminar evento" variante="peligro" onPress={onEliminar} style={styles.botonEliminar} />
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
  seccionVinculo: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chipFecha: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Spacing.two },
  filaHoras: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  botonGuardar: { marginTop: Spacing.four },
  botonEliminar: { marginTop: Spacing.three },
  listaResultados: { gap: Spacing.one },
  itemResultado: { borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  sinResultados: { paddingVertical: Spacing.one },
});

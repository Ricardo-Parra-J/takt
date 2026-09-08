import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import {
  actualizarSesionCompleta,
  crearSesionCompleta,
  DatosSesion,
  eliminarSesion,
  Ejercicio,
  fechaLocal,
  getPresetDetalle,
  getSesionDetalle,
  horaLocal,
  listEjercicios,
  listPresets,
  PresetRutina,
} from '@/db/repositories/deporte';
import { vincularSesionAEvento } from '@/db/repositories/calendario';

interface SetEditable {
  repeticiones: string;
  peso: string;
}

interface EjercicioEditable {
  ejercicio_id: number;
  ejercicio_nombre: string;
  placeholderPeso: string;
  placeholderReps: string;
  series: SetEditable[];
}

export default function SesionFormScreen() {
  const { id, presetId: presetIdParam, eventoId, fecha: fechaParam } = useLocalSearchParams<{
    id?: string;
    presetId?: string;
    eventoId?: string;
    fecha?: string;
  }>();
  const editando = !!id;
  const router = useRouter();
  const theme = useTheme();

  const [nombre, setNombre] = useState('Entrenamiento');
  const [presetId, setPresetId] = useState<number | null>(null);
  const [presets, setPresets] = useState<PresetRutina[]>([]);
  const [fecha, setFecha] = useState(fechaParam || fechaLocal());
  const [horaInicio, setHoraInicio] = useState(horaLocal());
  const [duracion, setDuracion] = useState('');
  const [ejercicios, setEjercicios] = useState<EjercicioEditable[]>([]);
  const [cargando, setCargando] = useState(editando);

  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);

  const [busquedaEj, setBusquedaEj] = useState('');
  const [resultadosEj, setResultadosEj] = useState<Ejercicio[]>([]);

  useEffect(() => {
    listPresets().then(setPresets);
  }, []);

  // Si venimos desde un evento de Calendario con una rutina sugerida, la
  // precargamos automáticamente al crear el entrenamiento.
  useEffect(() => {
    if (editando || !presetIdParam) return;
    getPresetDetalle(Number(presetIdParam)).then((detalle) => {
      if (!detalle) return;
      setPresetId(detalle.id);
      setNombre(detalle.nombre);
      setEjercicios(
        detalle.ejercicios.map((e) => ({
          ejercicio_id: e.ejercicio_id,
          ejercicio_nombre: e.ejercicio_nombre,
          placeholderPeso: '',
          placeholderReps: '',
          series: Array.from({ length: e.series_objetivo ?? 1 }, () => ({
            repeticiones: e.repeticiones_objetivo != null ? String(e.repeticiones_objetivo) : '',
            peso: e.peso_objetivo != null ? String(e.peso_objetivo) : '',
          })),
        }))
      );
    });
  }, [editando, presetIdParam]);

  useEffect(() => {
    if (!id) return;
    getSesionDetalle(Number(id)).then((sesion) => {
      if (!sesion) return;
      setNombre(sesion.nombre);
      setPresetId(sesion.preset_id);
      setFecha(sesion.fecha);
      setHoraInicio(sesion.hora_inicio ?? horaLocal());
      setDuracion(sesion.duracion_minutos != null ? String(sesion.duracion_minutos) : '');
      setEjercicios(
        sesion.ejercicios.map((e) => ({
          ejercicio_id: e.ejercicio_id,
          ejercicio_nombre: e.ejercicio_nombre,
          placeholderPeso: '',
          placeholderReps: '',
          series: e.series.map((s) => ({
            repeticiones: s.repeticiones != null ? String(s.repeticiones) : '',
            peso: s.peso != null ? String(s.peso) : '',
          })),
        }))
      );
      setCargando(false);
    });
  }, [id]);

  useEffect(() => {
    if (!busquedaEj.trim()) {
      setResultadosEj([]);
      return;
    }
    listEjercicios(busquedaEj).then((res) => setResultadosEj(res.slice(0, 8)));
  }, [busquedaEj]);

  async function onSeleccionarPreset(preset: PresetRutina) {
    setPresetId(preset.id);
    if (!nombre.trim() || nombre === 'Entrenamiento') setNombre(preset.nombre);
    if (ejercicios.length > 0) return; // no pisar lo que ya se agrego a mano
    const detalle = await getPresetDetalle(preset.id);
    if (!detalle) return;
    setEjercicios(
      detalle.ejercicios.map((e) => ({
        ejercicio_id: e.ejercicio_id,
        ejercicio_nombre: e.ejercicio_nombre,
        placeholderPeso: '',
        placeholderReps: '',
        series: Array.from({ length: e.series_objetivo ?? 1 }, () => ({
          repeticiones: e.repeticiones_objetivo != null ? String(e.repeticiones_objetivo) : '',
          peso: e.peso_objetivo != null ? String(e.peso_objetivo) : '',
        })),
      }))
    );
  }

  function onAgregarEjercicio(ejercicio: Ejercicio) {
    setEjercicios((prev) => [
      ...prev,
      {
        ejercicio_id: ejercicio.id,
        ejercicio_nombre: ejercicio.nombre,
        placeholderPeso: ejercicio.ultimo_peso != null ? String(ejercicio.ultimo_peso) : '',
        placeholderReps: ejercicio.ultimas_repeticiones != null ? String(ejercicio.ultimas_repeticiones) : '',
        series: [{ repeticiones: '', peso: '' }],
      },
    ]);
    setBusquedaEj('');
    setResultadosEj([]);
  }

  function onQuitarEjercicio(index: number) {
    setEjercicios((prev) => prev.filter((_, i) => i !== index));
  }

  function onAgregarSerie(indexEj: number) {
    setEjercicios((prev) =>
      prev.map((e, i) => (i === indexEj ? { ...e, series: [...e.series, { repeticiones: '', peso: '' }] } : e))
    );
  }

  function onQuitarSerie(indexEj: number, indexSerie: number) {
    setEjercicios((prev) =>
      prev.map((e, i) => (i === indexEj ? { ...e, series: e.series.filter((_, si) => si !== indexSerie) } : e))
    );
  }

  function onCambiarSerie(indexEj: number, indexSerie: number, campo: 'repeticiones' | 'peso', valor: string) {
    setEjercicios((prev) =>
      prev.map((e, i) =>
        i === indexEj
          ? { ...e, series: e.series.map((s, si) => (si === indexSerie ? { ...s, [campo]: valor } : s)) }
          : e
      )
    );
  }

  function onCambiarFecha(_event: unknown, seleccionada?: Date) {
    setMostrarPickerFecha(false);
    if (!seleccionada) return;
    setFecha(fechaLocal(seleccionada));
  }

  function onCambiarHora(_event: unknown, seleccionada?: Date) {
    setMostrarPickerHora(false);
    if (!seleccionada) return;
    setHoraInicio(horaLocal(seleccionada));
  }

  async function onGuardar() {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Ponle un nombre al entrenamiento.');
      return;
    }
    if (ejercicios.length === 0) {
      Alert.alert('Faltan ejercicios', 'Agrega al menos un ejercicio a este entrenamiento.');
      return;
    }

    // Se guardan todas las series tal cual quedaron: si el usuario no anotó
    // peso/repeticiones (por ejemplo, un entrenamiento traído de una rutina
    // sin objetivos definidos), quedan en null y se pueden completar después.
    const ejerciciosLimpios = ejercicios.map((e) => ({
      ejercicio_id: e.ejercicio_id,
      series: e.series.map((s) => ({
        repeticiones: s.repeticiones.trim() ? Number(s.repeticiones) : null,
        peso: s.peso.trim() ? Number(s.peso.replace(',', '.')) : null,
      })),
    }));

    const datos: DatosSesion = {
      nombre,
      preset_id: presetId,
      fecha,
      hora_inicio: horaInicio,
      duracion_minutos: duracion.trim() ? Number(duracion) : null,
      ejercicios: ejerciciosLimpios,
    };

    try {
      if (editando) {
        await actualizarSesionCompleta(Number(id), datos);
        if (eventoId) {
          await vincularSesionAEvento(Number(eventoId), Number(id));
        }
      } else {
        const sesionId = await crearSesionCompleta(datos);
        if (eventoId) {
          await vincularSesionAEvento(Number(eventoId), sesionId);
        }
      }
      router.back();
    } catch (error) {
      console.error('Error al guardar el entrenamiento', error);
      Alert.alert('No se pudo guardar', 'Ocurrió un error al guardar el entrenamiento. Intenta de nuevo.');
    }
  }

  function onEliminar() {
    Alert.alert('Eliminar entrenamiento', `¿Eliminar "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarSesion(Number(id));
          router.back();
        },
      },
    ]);
  }

  if (cargando) return null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: editando ? 'Editar entrenamiento' : 'Nuevo entrenamiento' }} />
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

          {presets.length > 0 && (
            <>
              <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
                Rutina (opcional)
              </ThemedText>
              <View style={styles.chips}>
                {presets.map((p) => (
                  <Chip key={p.id} label={p.nombre} selected={presetId === p.id} onPress={() => onSeleccionarPreset(p)} />
                ))}
              </View>
            </>
          )}

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
                  {horaInicio}
                </ThemedText>
              </View>
            </Pressable>
          </View>
          {mostrarPickerFecha && (
            <DateTimePicker value={new Date(`${fecha}T00:00:00`)} mode="date" display="default" onChange={onCambiarFecha} />
          )}
          {mostrarPickerHora && (
            <DateTimePicker
              value={new Date(`${fecha}T${horaInicio}:00`)}
              mode="time"
              display="default"
              onChange={onCambiarHora}
            />
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Duración (minutos, opcional)
          </ThemedText>
          <TextInput
            value={duracion}
            onChangeText={setDuracion}
            keyboardType="number-pad"
            placeholder="Ej. 45"
            placeholderTextColor={theme.textSecondary}
            style={[styles.inputCorto, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Ejercicios
          </ThemedText>
          {ejercicios.map((ej, indexEj) => (
            <Card key={`${ej.ejercicio_id}-${indexEj}`} style={styles.ejercicioCard}>
              <View style={styles.ejercicioHeader}>
                <ThemedText type="smallBold" style={styles.ejercicioNombre}>
                  {ej.ejercicio_nombre}
                </ThemedText>
                <Pressable onPress={() => onQuitarEjercicio(indexEj)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>
              {ej.series.map((serie, indexSerie) => (
                <View key={indexSerie} style={styles.serieRow}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.serieNumero}>
                    {indexSerie + 1}
                  </ThemedText>
                  <TextInput
                    value={serie.repeticiones}
                    onChangeText={(v) => onCambiarSerie(indexEj, indexSerie, 'repeticiones', v)}
                    keyboardType="number-pad"
                    placeholder={ej.placeholderReps || 'Reps'}
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.inputSerie, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  />
                  <TextInput
                    value={serie.peso}
                    onChangeText={(v) => onCambiarSerie(indexEj, indexSerie, 'peso', v)}
                    keyboardType="decimal-pad"
                    placeholder={ej.placeholderPeso || 'Kg'}
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.inputSerie, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  />
                  <Pressable onPress={() => onQuitarSerie(indexEj, indexSerie)} hitSlop={8}>
                    <Ionicons name="remove-circle-outline" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={() => onAgregarSerie(indexEj)} style={styles.agregarSerieRow}>
                <Ionicons name="add-circle" size={18} color={theme.accent} />
                <ThemedText type="small" style={{ color: theme.accent }}>
                  Agregar serie
                </ThemedText>
              </Pressable>
            </Card>
          ))}

          <View style={styles.buscarContainer}>
            <TextInput
              value={busquedaEj}
              onChangeText={setBusquedaEj}
              placeholder="Agregar ejercicio..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            {resultadosEj.map((r) => (
              <Pressable key={r.id} onPress={() => onAgregarEjercicio(r)}>
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

          <AppButton label="Guardar" onPress={onGuardar} style={styles.botonGuardar} />

          {editando && (
            <AppButton label="Eliminar entrenamiento" variante="peligro" onPress={onEliminar} style={styles.botonEliminar} />
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
  inputCorto: { width: 90, borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, fontSize: 16 },
  seccion: { marginTop: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  filaFecha: { flexDirection: 'row', gap: Spacing.two },
  chipFecha: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Spacing.two },
  ejercicioCard: { gap: Spacing.two, marginBottom: Spacing.one },
  ejercicioHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ejercicioNombre: { flex: 1 },
  serieRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  serieNumero: { width: 16, textAlign: 'center' },
  inputSerie: { flex: 1, borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one + 2, fontSize: 15 },
  agregarSerieRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  buscarContainer: { gap: Spacing.two, marginTop: Spacing.one },
  resultado: {},
  botonGuardar: { marginTop: Spacing.four },
  botonEliminar: { marginTop: Spacing.three },
});

import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { FabButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import {
  diasDeLaSemana,
  eliminarEvento,
  EventoDelDia,
  fechaLocal,
  grillaMensual,
  listEventosRango,
  marcarCompletado,
  primerDiaMes,
  sumarDias,
  sumarMeses,
  TIPOS_EVENTO,
} from '@/db/repositories/calendario';

type Modo = 'dia' | 'semana' | 'mes';

const LETRA_DIA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const NOMBRE_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function CalendarioScreen() {
  const theme = useTheme();
  const router = useRouter();
  const hoy = fechaLocal();

  const [modo, setModo] = useState<Modo>('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const [mesAncla, setMesAncla] = useState(() => primerDiaMes(hoy));
  const [eventosPorFecha, setEventosPorFecha] = useState<Record<string, EventoDelDia[]>>({});
  const [cargando, setCargando] = useState(true);

  const rango = useMemo((): [string, string] => {
    if (modo === 'semana') {
      const dias = diasDeLaSemana(fechaSeleccionada);
      return [dias[0], dias[6]];
    }
    if (modo === 'mes') {
      const grilla = grillaMensual(mesAncla);
      return [grilla[0], grilla[grilla.length - 1]];
    }
    return [fechaSeleccionada, fechaSeleccionada];
  }, [modo, fechaSeleccionada, mesAncla]);

  const recargar = useCallback(async ([inicio, fin]: [string, string]) => {
    setCargando(true);
    try {
      const mapa = await listEventosRango(inicio, fin);
      setEventosPorFecha(mapa);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      recargar(rango);
    }, [rango, recargar])
  );

  async function onToggleCompletado(evento: EventoDelDia) {
    await marcarCompletado(evento.id, evento.completado === 0);
    recargar(rango);
  }

  function onEliminar(evento: EventoDelDia) {
    const mensaje = evento.esRecurrente
      ? `¿Eliminar "${evento.titulo}"? Esto elimina TODAS sus repeticiones, no solo esta.`
      : `¿Eliminar "${evento.titulo}"?`;
    Alert.alert('Eliminar evento', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarEvento(evento.id);
          recargar(rango);
        },
      },
    ]);
  }

  function irAHoy() {
    setFechaSeleccionada(hoy);
    setMesAncla(primerDiaMes(hoy));
  }

  function onTocarCeldaMes(fecha: string) {
    setFechaSeleccionada(fecha);
    if (fecha.slice(0, 7) !== mesAncla.slice(0, 7)) setMesAncla(primerDiaMes(fecha));
  }

  const estaEnHoy = modo === 'mes' ? mesAncla.slice(0, 7) === hoy.slice(0, 7) : fechaSeleccionada === hoy;

  const diasSemanaActual = diasDeLaSemana(fechaSeleccionada);
  const grid = modo === 'mes' ? grillaMensual(mesAncla) : [];
  const semanasGrid: string[][] = [];
  for (let i = 0; i < grid.length; i += 7) semanasGrid.push(grid.slice(i, i + 7));

  const eventosDelDiaSeleccionado = eventosPorFecha[fechaSeleccionada] ?? [];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.tituloRow}>
          <ThemedText type="title" style={styles.title}>
            Calendario
          </ThemedText>
          {!estaEnHoy && (
            <Pressable onPress={irAHoy} hitSlop={8}>
              <View style={[styles.botonHoy, { backgroundColor: theme.accentSoft }]}>
                <ThemedText type="small" style={{ color: theme.accent }}>
                  Hoy
                </ThemedText>
              </View>
            </Pressable>
          )}
        </View>

        <View style={styles.modos}>
          <Chip label="Día" selected={modo === 'dia'} onPress={() => setModo('dia')} />
          <Chip label="Semana" selected={modo === 'semana'} onPress={() => setModo('semana')} />
          <Chip label="Mes" selected={modo === 'mes'} onPress={() => setModo('mes')} />
        </View>

        {modo === 'dia' && (
          <View style={styles.semanaRow}>
            <Pressable onPress={() => setFechaSeleccionada((f) => sumarDias(f, -7))} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
            </Pressable>
            <View style={styles.dias}>
              {diasSemanaActual.map((fecha, i) => (
                <DiaChip
                  key={fecha}
                  letra={LETRA_DIA[i]}
                  numero={Number(fecha.slice(-2))}
                  seleccionada={fecha === fechaSeleccionada}
                  esHoy={fecha === hoy}
                  tieneEventos={(eventosPorFecha[fecha]?.length ?? 0) > 0}
                  onPress={() => setFechaSeleccionada(fecha)}
                />
              ))}
            </View>
            <Pressable onPress={() => setFechaSeleccionada((f) => sumarDias(f, 7))} hitSlop={8}>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        )}

        {modo === 'semana' && (
          <View style={styles.semanaNavRow}>
            <Pressable onPress={() => setFechaSeleccionada((f) => sumarDias(f, -7))} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
            </Pressable>
            <ThemedText type="smallBold">
              {formatearRangoSemana(diasSemanaActual[0], diasSemanaActual[6])}
            </ThemedText>
            <Pressable onPress={() => setFechaSeleccionada((f) => sumarDias(f, 7))} hitSlop={8}>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        )}

        {modo === 'mes' && (
          <>
            <View style={styles.semanaNavRow}>
              <Pressable onPress={() => setMesAncla((m) => sumarMeses(m, -1))} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
              </Pressable>
              <ThemedText type="smallBold">
                {capitalizar(new Date(`${mesAncla}T00:00:00`).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }))}
              </ThemedText>
              <Pressable onPress={() => setMesAncla((m) => sumarMeses(m, 1))} hitSlop={8}>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.letrasSemana}>
              {LETRA_DIA.map((l, i) => (
                <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.letraSemanaCelda}>
                  {l}
                </ThemedText>
              ))}
            </View>
            {semanasGrid.map((semana, i) => (
              <View key={i} style={styles.semanaGridRow}>
                {semana.map((fecha) => (
                  <CeldaMes
                    key={fecha}
                    fecha={fecha}
                    enMesActual={fecha.slice(0, 7) === mesAncla.slice(0, 7)}
                    seleccionada={fecha === fechaSeleccionada}
                    esHoy={fecha === hoy}
                    tieneEventos={(eventosPorFecha[fecha]?.length ?? 0) > 0}
                    onPress={() => onTocarCeldaMes(fecha)}
                  />
                ))}
              </View>
            ))}
          </>
        )}

        {modo === 'semana' ? (
          <ScrollView contentContainerStyle={styles.lista}>
            {diasSemanaActual.map((fecha, i) => (
              <View key={fecha} style={styles.diaSeccion}>
                <Pressable onPress={() => setFechaSeleccionada(fecha)} style={styles.diaSeccionHeader}>
                  <ThemedText
                    type="smallBold"
                    style={fecha === hoy ? { color: theme.accent } : undefined}>
                    {NOMBRE_DIA[i]} {Number(fecha.slice(-2))}
                  </ThemedText>
                  {fecha === fechaSeleccionada && <View style={[styles.puntoSeleccion, { backgroundColor: theme.accent }]} />}
                </Pressable>
                {(eventosPorFecha[fecha]?.length ?? 0) === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.sinEventos}>
                    Sin eventos
                  </ThemedText>
                ) : (
                  eventosPorFecha[fecha]!.map((evento) => (
                    <EventoRow
                      key={`${evento.id}-${evento.esRecurrente ? 'r' : 'u'}-${fecha}`}
                      evento={evento}
                      onToggleCompletado={() => onToggleCompletado(evento)}
                      onEliminar={() => onEliminar(evento)}
                      onEditar={() => router.push(`/calendario/evento-form?id=${evento.id}`)}
                    />
                  ))
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <>
            {modo === 'mes' && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.seccionAgenda}>
                {capitalizar(new Date(`${fechaSeleccionada}T00:00:00`).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }))}
              </ThemedText>
            )}
            {!cargando && eventosDelDiaSeleccionado.length === 0 && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
                No hay eventos este día.
              </ThemedText>
            )}
            <FlatList
              data={eventosDelDiaSeleccionado}
              keyExtractor={(e) => `${e.id}-${e.esRecurrente ? 'r' : 'u'}`}
              contentContainerStyle={styles.lista}
              renderItem={({ item }) => (
                <EventoRow
                  evento={item}
                  onToggleCompletado={() => onToggleCompletado(item)}
                  onEliminar={() => onEliminar(item)}
                  onEditar={() => router.push(`/calendario/evento-form?id=${item.id}`)}
                />
              )}
            />
          </>
        )}

        <Link href={`/calendario/evento-form?fecha=${fechaSeleccionada}`} asChild>
          <FabButton />
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

function formatearRangoSemana(inicio: string, fin: string): string {
  const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const dInicio = new Date(`${inicio}T00:00:00`).toLocaleDateString('es-CL', opciones);
  const dFin = new Date(`${fin}T00:00:00`).toLocaleDateString('es-CL', opciones);
  return `${dInicio} – ${dFin}`;
}

function DiaChip({
  letra,
  numero,
  seleccionada,
  esHoy,
  tieneEventos,
  onPress,
}: {
  letra: string;
  numero: number;
  seleccionada: boolean;
  esHoy: boolean;
  tieneEventos: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.diaChipWrap}>
      <View
        style={[
          styles.diaChip,
          { backgroundColor: seleccionada ? theme.accent : theme.backgroundElement },
          !seleccionada && esHoy && { borderWidth: 1.5, borderColor: theme.accent },
        ]}>
        <ThemedText type="small" style={{ color: seleccionada ? theme.onAccent : theme.textSecondary }}>
          {letra}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: seleccionada ? theme.onAccent : theme.text }}>
          {numero}
        </ThemedText>
        {tieneEventos && (
          <View style={[styles.puntoEvento, { backgroundColor: seleccionada ? theme.onAccent : theme.accent }]} />
        )}
      </View>
    </Pressable>
  );
}

function CeldaMes({
  fecha,
  enMesActual,
  seleccionada,
  esHoy,
  tieneEventos,
  onPress,
}: {
  fecha: string;
  enMesActual: boolean;
  seleccionada: boolean;
  esHoy: boolean;
  tieneEventos: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const dia = Number(fecha.slice(-2));
  return (
    <Pressable onPress={onPress} style={styles.celdaMesWrap}>
      <View
        style={[
          styles.celdaMes,
          seleccionada && { backgroundColor: theme.accent },
          !seleccionada && esHoy && { borderWidth: 1.5, borderColor: theme.accent },
        ]}>
        <ThemedText
          type="small"
          style={{
            color: seleccionada ? theme.onAccent : theme.text,
            opacity: enMesActual ? 1 : 0.35,
          }}>
          {dia}
        </ThemedText>
        {tieneEventos && (
          <View style={[styles.puntoEvento, { backgroundColor: seleccionada ? theme.onAccent : theme.accent }]} />
        )}
      </View>
    </Pressable>
  );
}

function EventoRow({
  evento,
  onToggleCompletado,
  onEliminar,
  onEditar,
}: {
  evento: EventoDelDia;
  onToggleCompletado: () => void;
  onEliminar: () => void;
  onEditar: () => void;
}) {
  const theme = useTheme();
  const icono = TIPOS_EVENTO.find((t) => t.key === evento.tipo)?.icono ?? 'ellipse-outline';
  const horaTexto = evento.todo_el_dia
    ? 'Todo el día'
    : evento.hora_inicio
      ? `${evento.hora_inicio}${evento.hora_fin ? ` - ${evento.hora_fin}` : ''}`
      : '';
  const completado = evento.completado === 1;

  return (
    <Card style={styles.row}>
      <Ionicons name={icono as any} size={22} color={theme.accent} />
      <Pressable style={styles.rowText} onPress={onEditar}>
        <ThemedText themeColor={completado ? 'textSecondary' : 'text'} style={completado && styles.tachado}>
          {evento.titulo}
        </ThemedText>
        <View style={styles.rowDetalles}>
          {!!horaTexto && (
            <ThemedText type="small" themeColor="textSecondary">
              {horaTexto}
            </ThemedText>
          )}
          {evento.esRecurrente && <Ionicons name="repeat" size={14} color={theme.textSecondary} />}
        </View>
      </Pressable>
      {!evento.esRecurrente && (
        <Pressable onPress={onToggleCompletado} hitSlop={8}>
          <Ionicons
            name={completado ? 'checkbox' : 'square-outline'}
            size={22}
            color={completado ? theme.textSecondary : theme.accent}
          />
        </Pressable>
      )}
      <Pressable onPress={onEliminar} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  tituloRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, lineHeight: 34 },
  botonHoy: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: Radius.pill },
  modos: { flexDirection: 'row', gap: Spacing.one },
  semanaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  semanaNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dias: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  diaChipWrap: { alignItems: 'center' },
  diaChip: { width: 40, height: 56, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', gap: 2 },
  letrasSemana: { flexDirection: 'row' },
  letraSemanaCelda: { flex: 1, textAlign: 'center' },
  semanaGridRow: { flexDirection: 'row' },
  celdaMesWrap: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  celdaMes: { width: 34, height: 34, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', gap: 2 },
  puntoEvento: { width: 4, height: 4, borderRadius: 2 },
  puntoSeleccion: { width: 6, height: 6, borderRadius: 3 },
  seccionAgenda: { marginTop: -4 },
  diaSeccion: { gap: Spacing.two, marginBottom: Spacing.three },
  diaSeccionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  sinEventos: { paddingLeft: 2 },
  vacio: { paddingVertical: Spacing.four, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rowText: { flex: 1, gap: 2 },
  rowDetalles: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  tachado: { textDecorationLine: 'line-through' },
});

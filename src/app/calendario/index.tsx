import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { FabButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import {
  diasDeLaSemana,
  eliminarEvento,
  EventoDelDia,
  fechaLocal,
  listEventosDia,
  marcarCompletado,
  sumarDias,
  TIPOS_EVENTO,
} from '@/db/repositories/calendario';

const LETRA_DIA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function CalendarioScreen() {
  const theme = useTheme();
  const router = useRouter();
  const hoy = fechaLocal();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const [eventos, setEventos] = useState<EventoDelDia[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async (fecha: string) => {
    setCargando(true);
    try {
      const rows = await listEventosDia(fecha);
      setEventos(rows);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      recargar(fechaSeleccionada);
    }, [fechaSeleccionada, recargar])
  );

  async function onToggleCompletado(evento: EventoDelDia) {
    await marcarCompletado(evento.id, evento.completado === 0);
    recargar(fechaSeleccionada);
  }

  function onEliminar(evento: EventoDelDia) {
    const mensaje = evento.esRecurrente
      ? `¿Eliminar "${evento.titulo}"? Esto elimina TODAS sus repeticiones, no solo la de hoy.`
      : `¿Eliminar "${evento.titulo}"?`;
    Alert.alert('Eliminar evento', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarEvento(evento.id);
          recargar(fechaSeleccionada);
        },
      },
    ]);
  }

  const dias = diasDeLaSemana(fechaSeleccionada);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.tituloRow}>
          <ThemedText type="title" style={styles.title}>
            Calendario
          </ThemedText>
          {fechaSeleccionada !== hoy && (
            <Pressable onPress={() => setFechaSeleccionada(hoy)} hitSlop={8}>
              <View style={[styles.botonHoy, { backgroundColor: theme.accentSoft }]}>
                <ThemedText type="small" style={{ color: theme.accent }}>
                  Hoy
                </ThemedText>
              </View>
            </Pressable>
          )}
        </View>

        <View style={styles.semanaRow}>
          <Pressable onPress={() => setFechaSeleccionada((f) => sumarDias(f, -7))} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
          </Pressable>
          <View style={styles.dias}>
            {dias.map((fecha, i) => (
              <DiaChip
                key={fecha}
                letra={LETRA_DIA[i]}
                numero={Number(fecha.slice(-2))}
                seleccionada={fecha === fechaSeleccionada}
                esHoy={fecha === hoy}
                onPress={() => setFechaSeleccionada(fecha)}
              />
            ))}
          </View>
          <Pressable onPress={() => setFechaSeleccionada((f) => sumarDias(f, 7))} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        {!cargando && eventos.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
            No hay eventos este día.
          </ThemedText>
        )}

        <FlatList
          data={eventos}
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

        <Link href={`/calendario/evento-form?fecha=${fechaSeleccionada}`} asChild>
          <FabButton />
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

function DiaChip({
  letra,
  numero,
  seleccionada,
  esHoy,
  onPress,
}: {
  letra: string;
  numero: number;
  seleccionada: boolean;
  esHoy: boolean;
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
  semanaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  dias: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  diaChipWrap: { alignItems: 'center' },
  diaChip: { width: 40, height: 52, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', gap: 2 },
  vacio: { paddingVertical: Spacing.four, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rowText: { flex: 1, gap: 2 },
  rowDetalles: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  tachado: { textDecorationLine: 'line-through' },
});

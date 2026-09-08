import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import {
  crearTarea,
  eliminarTarea,
  esAtrasada,
  FiltroTareas,
  listTareas,
  marcarCompletada,
  Tarea,
} from '@/db/repositories/tareas';

const FILTROS: { key: FiltroTareas; label: string }[] = [
  { key: 'activas', label: 'Activas' },
  { key: 'atrasadas', label: 'Atrasadas' },
  { key: 'completadas', label: 'Completadas' },
  { key: 'todas', label: 'Todas' },
];

export default function TareasScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filtro, setFiltro] = useState<FiltroTareas>('activas');
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async (f: FiltroTareas) => {
    setCargando(true);
    try {
      const rows = await listTareas(f);
      setTareas(rows);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      recargar(filtro);
    }, [filtro, recargar])
  );

  async function onAgregar() {
    const titulo = nuevoTitulo.trim();
    if (!titulo) return;
    await crearTarea({ titulo });
    setNuevoTitulo('');
    recargar(filtro);
  }

  async function onToggle(tarea: Tarea) {
    await marcarCompletada(tarea.id, tarea.completada === 0);
    recargar(filtro);
  }

  function onEliminar(tarea: Tarea) {
    Alert.alert('Eliminar tarea', `¿Eliminar "${tarea.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarTarea(tarea.id);
            recargar(filtro);
          } catch {
            Alert.alert('No se pudo eliminar', 'Esta tarea está vinculada a un evento del calendario.');
          }
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.tituloRow}>
          <ThemedText type="title" style={styles.title}>
            Tareas
          </ThemedText>
          <Link href="/tareas/tarea-form" asChild>
            <Pressable hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View style={[styles.botonDetalle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="add" size={18} color={theme.accent} />
                <ThemedText type="small" style={{ color: theme.accent }}>
                  Con detalles
                </ThemedText>
              </View>
            </Pressable>
          </Link>
        </View>

        <Card style={styles.addRow}>
          <TextInput
            value={nuevoTitulo}
            onChangeText={setNuevoTitulo}
            placeholder="Nueva tarea..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            onSubmitEditing={onAgregar}
            returnKeyType="done"
          />
          <Pressable onPress={onAgregar} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Ionicons name="add-circle" size={30} color={theme.accent} />
          </Pressable>
        </Card>

        <View style={styles.filtros}>
          {FILTROS.map((f) => (
            <Chip key={f.key} label={f.label} selected={filtro === f.key} onPress={() => setFiltro(f.key)} />
          ))}
        </View>

        {!cargando && tareas.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
            No hay tareas en "{FILTROS.find((f) => f.key === filtro)?.label ?? filtro}".
          </ThemedText>
        )}

        <FlatList
          data={tareas}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <TareaRow
              tarea={item}
              onToggle={() => onToggle(item)}
              onEliminar={() => onEliminar(item)}
              onEditar={() => router.push(`/tareas/tarea-form?id=${item.id}`)}
            />
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function TareaRow({
  tarea,
  onToggle,
  onEliminar,
  onEditar,
}: {
  tarea: Tarea;
  onToggle: () => void;
  onEliminar: () => void;
  onEditar: () => void;
}) {
  const theme = useTheme();
  const atrasada = esAtrasada(tarea);

  return (
    <Card style={styles.row}>
      <Pressable onPress={onToggle} hitSlop={8}>
        <Ionicons
          name={tarea.completada ? 'checkbox' : 'square-outline'}
          size={24}
          color={tarea.completada ? theme.textSecondary : theme.accent}
        />
      </Pressable>

      <Pressable style={styles.rowText} onPress={onEditar}>
        <ThemedText
          style={tarea.completada === 1 ? styles.tachado : undefined}
          themeColor={tarea.completada ? 'textSecondary' : 'text'}>
          {tarea.titulo}
        </ThemedText>
        <View style={styles.rowDetalles}>
          {tarea.fecha_plazo && (
            <ThemedText type="small" themeColor={atrasada ? undefined : 'textSecondary'} style={atrasada && styles.atrasada}>
              {tarea.fecha_plazo}
              {atrasada ? ' · atrasada' : ''}
            </ThemedText>
          )}
          {tarea.prioridad && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.prioridad}>
              {PRIORIDAD_LABEL[tarea.prioridad]}
            </ThemedText>
          )}
        </View>
      </Pressable>

      <Pressable onPress={onEliminar} hitSlop={8}>
        <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
      </Pressable>
    </Card>
  );
}

const PRIORIDAD_LABEL: Record<string, string> = {
  alta: '· Prioridad alta',
  media: '· Prioridad media',
  baja: '· Prioridad baja',
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  tituloRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, lineHeight: 34 },
  botonDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: { flex: 1, fontSize: 16 },
  filtros: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  vacio: { paddingVertical: Spacing.four, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowText: { flex: 1, gap: 2 },
  rowDetalles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  prioridad: {},
  tachado: { textDecorationLine: 'line-through' },
  atrasada: { color: '#D64545' },
});

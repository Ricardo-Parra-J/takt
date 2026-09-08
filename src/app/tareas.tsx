import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
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

  async function onEliminar(tarea: Tarea) {
    await eliminarTarea(tarea.id);
    recargar(filtro);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Tareas
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.addRow}>
          <TextInput
            value={nuevoTitulo}
            onChangeText={setNuevoTitulo}
            placeholder="Nueva tarea..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            onSubmitEditing={onAgregar}
            returnKeyType="done"
          />
          <Pressable onPress={onAgregar} hitSlop={8}>
            <Ionicons name="add-circle" size={30} color={theme.text} />
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.filtros}>
          {FILTROS.map((f) => (
            <Pressable key={f.key} onPress={() => setFiltro(f.key)}>
              <ThemedView
                type={filtro === f.key ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.filtroChip}>
                <ThemedText type="small">{f.label}</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </ThemedView>

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
            <TareaRow tarea={item} onToggle={() => onToggle(item)} onEliminar={() => onEliminar(item)} />
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
}: {
  tarea: Tarea;
  onToggle: () => void;
  onEliminar: () => void;
}) {
  const theme = useTheme();
  const atrasada = esAtrasada(tarea);

  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <Pressable onPress={onToggle} hitSlop={8}>
        <Ionicons
          name={tarea.completada ? 'checkbox' : 'square-outline'}
          size={24}
          color={tarea.completada ? theme.textSecondary : theme.text}
        />
      </Pressable>

      <View style={styles.rowText}>
        <ThemedText
          style={tarea.completada === 1 ? styles.tachado : undefined}
          themeColor={tarea.completada ? 'textSecondary' : 'text'}>
          {tarea.titulo}
        </ThemedText>
        {tarea.fecha_plazo && (
          <ThemedText type="small" themeColor={atrasada ? undefined : 'textSecondary'} style={atrasada && styles.atrasada}>
            {tarea.fecha_plazo}
            {atrasada ? ' · atrasada' : ''}
          </ThemedText>
        )}
      </View>

      <Pressable onPress={onEliminar} hitSlop={8}>
        <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  title: { fontSize: 28, lineHeight: 34 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  input: { flex: 1, fontSize: 16 },
  filtros: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  filtroChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
  },
  vacio: { paddingVertical: Spacing.four, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowText: { flex: 1, gap: 2 },
  tachado: { textDecorationLine: 'line-through' },
  atrasada: { color: '#D64545' },
});

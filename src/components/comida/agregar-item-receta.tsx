import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { UnidadPicker } from '@/components/comida/unidad-picker';
import { listIngredientes } from '@/db/repositories/ingredientes';
import { listProductos } from '@/db/repositories/productos';

interface OpcionSeleccionable {
  id: number;
  nombre: string;
  porcion_base_unidad_id: number;
}

export function AgregarItemReceta({
  tipo,
  onAgregar,
}: {
  tipo: 'ingrediente' | 'producto';
  onAgregar: (item: { id: number; nombre: string }, cantidad: number, unidadId: number) => void;
}) {
  const theme = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<OpcionSeleccionable[]>([]);
  const [seleccionado, setSeleccionado] = useState<OpcionSeleccionable | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [unidadId, setUnidadId] = useState<number | null>(null);

  useEffect(() => {
    if (seleccionado) return;
    if (!busqueda.trim()) {
      setResultados([]);
      return;
    }
    const cargar = tipo === 'ingrediente' ? listIngredientes : listProductos;
    cargar(busqueda).then((items) => setResultados(items.slice(0, 8)));
  }, [busqueda, tipo, seleccionado]);

  function seleccionar(item: OpcionSeleccionable) {
    setSeleccionado(item);
    setUnidadId(item.porcion_base_unidad_id);
    setResultados([]);
  }

  function cancelar() {
    setSeleccionado(null);
    setBusqueda('');
    setCantidad('');
    setUnidadId(null);
  }

  function confirmarAgregar() {
    if (!seleccionado || !unidadId) return;
    const numero = Number(cantidad.replace(',', '.'));
    if (!numero || numero <= 0) return;
    onAgregar({ id: seleccionado.id, nombre: seleccionado.nombre }, numero, unidadId);
    cancelar();
  }

  const etiquetaTipo = tipo === 'ingrediente' ? 'ingrediente' : 'producto';

  if (!seleccionado) {
    return (
      <View style={styles.container}>
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder={`Buscar ${etiquetaTipo}...`}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        />
        {resultados.map((r) => (
          <Pressable key={r.id} onPress={() => seleccionar(r)}>
            <ThemedView type="backgroundElement" style={styles.resultado}>
              <ThemedText type="small">{r.nombre}</ThemedText>
            </ThemedView>
          </Pressable>
        ))}
        {busqueda.trim() !== '' && resultados.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Sin resultados. {tipo === 'ingrediente' ? 'Crea el ingrediente primero.' : 'Crea el producto primero.'}
          </ThemedText>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.seleccionadoRow}>
        <ThemedText type="smallBold" style={styles.seleccionadoNombre}>
          {seleccionado.nombre}
        </ThemedText>
        <Pressable onPress={cancelar}>
          <ThemedText type="small" themeColor="textSecondary">
            Cambiar
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.filaCantidad}>
        <TextInput
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="decimal-pad"
          placeholder="Cantidad"
          placeholderTextColor={theme.textSecondary}
          style={[styles.inputCorto, { color: theme.text, borderColor: theme.backgroundSelected }]}
        />
        <View style={styles.unidadPickerFlex}>
          <UnidadPicker value={unidadId} onChange={setUnidadId} />
        </View>
      </View>
      <Pressable onPress={confirmarAgregar} style={styles.botonAgregar}>
        <ThemedView type="backgroundSelected" style={styles.botonAgregarInner}>
          <ThemedText type="smallBold">Agregar a la receta</ThemedText>
        </ThemedView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, fontSize: 15 },
  resultado: { padding: Spacing.two, borderRadius: Spacing.two },
  seleccionadoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seleccionadoNombre: { flex: 1 },
  filaCantidad: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  inputCorto: { width: 90, borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, fontSize: 15 },
  unidadPickerFlex: { flex: 1 },
  botonAgregar: { marginTop: Spacing.one },
  botonAgregarInner: { padding: Spacing.two, borderRadius: Spacing.two, alignItems: 'center' },
});

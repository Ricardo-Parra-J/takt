import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { CatalogoItem } from '@/db/repositories/catalogos';

/** Selector de chips multi-seleccionables, usado para tipos de comida y etiquetas dieteticas. */
export function SelectorMultiple({
  opciones,
  seleccionados,
  onChange,
}: {
  opciones: CatalogoItem[];
  seleccionados: number[];
  onChange: (ids: number[]) => void;
}) {
  function alternar(id: number) {
    if (seleccionados.includes(id)) {
      onChange(seleccionados.filter((s) => s !== id));
    } else {
      onChange([...seleccionados, id]);
    }
  }

  if (opciones.length === 0) return null;

  return (
    <View style={styles.chips}>
      {opciones.map((op) => (
        <Pressable key={op.id} onPress={() => alternar(op.id)}>
          <ThemedView
            type={seleccionados.includes(op.id) ? 'backgroundSelected' : 'backgroundElement'}
            style={styles.chip}>
            <ThemedText type="small">{op.nombre}</ThemedText>
          </ThemedView>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: Spacing.four },
});

import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
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
        <Chip key={op.id} label={op.nombre} selected={seleccionados.includes(op.id)} onPress={() => alternar(op.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
});

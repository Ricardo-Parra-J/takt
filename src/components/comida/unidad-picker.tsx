import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import { listUnidades, UnidadMedida } from '@/db/repositories/unidades';

const ETIQUETA_DIMENSION: Record<string, string> = {
  masa: 'Masa',
  volumen: 'Volumen',
  conteo: 'Conteo',
};

export function UnidadPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (unidadId: number) => void;
}) {
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);

  useEffect(() => {
    listUnidades().then(setUnidades);
  }, []);

  const grupos = ['masa', 'volumen', 'conteo'] as const;

  return (
    <View style={styles.container}>
      {grupos.map((dim) => {
        const deEstaDimension = unidades.filter((u) => u.dimension === dim);
        if (deEstaDimension.length === 0) return null;
        return (
          <View key={dim} style={styles.grupo}>
            <ThemedText type="small" themeColor="textSecondary">
              {ETIQUETA_DIMENSION[dim]}
            </ThemedText>
            <View style={styles.chips}>
              {deEstaDimension.map((u) => (
                <Chip key={u.id} label={u.nombre} selected={value === u.id} onPress={() => onChange(u.id)} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  grupo: { gap: Spacing.one },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
});

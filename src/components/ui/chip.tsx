import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';

/**
 * Pill seleccionable, usado para selección única o múltiple (prioridad,
 * categoría, tipo de comida, unidad, etc.). Seleccionado = color de acento.
 */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
      <View
        style={[
          styles.chip,
          { backgroundColor: selected ? theme.accent : theme.backgroundElement },
        ]}>
        <ThemedText type="small" style={{ color: selected ? theme.onAccent : theme.text }}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
});

import { StyleSheet, View, ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Radius, Shadows, Spacing } from '@/constants/theme';

/**
 * Superficie elevada estándar de Takt: fondo "backgroundElement" + sombra
 * suave + esquinas redondeadas. Reemplaza el patrón repetido
 * `<ThemedView type="backgroundElement">` para darle profundidad real.
 */
export function Card({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }, Shadows.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
});

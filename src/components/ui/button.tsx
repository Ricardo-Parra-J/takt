import { forwardRef } from 'react';
import { Pressable, PressableProps, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Shadows, Spacing } from '@/constants/theme';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';

/**
 * Botón base de Takt: variante 'primario' usa el color de acento y sombra
 * (para la acción principal de la pantalla, ej. "Guardar"); 'secundario' es
 * un botón discreto con el fondo de tarjeta; 'peligro' para acciones
 * destructivas; 'fantasma' sin fondo, solo texto (ej. "Cancelar"). Da
 * feedback al tocar (baja opacidad). Forwarda `ref` y el resto de props de
 * Pressable, asi que tambien sirve como hijo de `<Link asChild>`.
 */
export const AppButton = forwardRef<View, PressableProps & {
  label: string;
  variante?: Variante;
  icono?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  flex?: boolean;
}>(function AppButton({ label, variante = 'primario', icono, style, flex, disabled, ...rest }, ref) {
  const theme = useTheme();

  const colores: Record<Variante, { bg: string; fg: string; sombra: boolean }> = {
    primario: { bg: theme.accent, fg: theme.onAccent, sombra: true },
    secundario: { bg: theme.backgroundElement, fg: theme.text, sombra: false },
    peligro: { bg: theme.backgroundElement, fg: '#D64545', sombra: false },
    fantasma: { bg: 'transparent', fg: theme.textSecondary, sombra: false },
  };
  const c = colores[variante];

  return (
    <Pressable
      ref={ref}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        flex && styles.flex,
        { backgroundColor: c.bg, opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
        c.sombra && Shadows.button,
        style,
      ]}
      {...rest}>
      {icono && <Ionicons name={icono} size={18} color={c.fg} style={styles.icono} />}
      <ThemedText type="smallBold" style={{ color: c.fg }}>
        {label}
      </ThemedText>
    </Pressable>
  );
});

/** Botón circular flotante (FAB), siempre con el color de acento. Compatible con `<Link asChild>`. */
export const FabButton = forwardRef<View, PressableProps & { icono?: keyof typeof Ionicons.glyphMap }>(
  function FabButton({ icono = 'add', ...rest }, ref) {
    const theme = useTheme();
    return (
      <Pressable ref={ref} style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]} {...rest}>
        <View style={[styles.fabInner, { backgroundColor: theme.accent }, Shadows.button]}>
          <Ionicons name={icono} size={26} color={theme.onAccent} />
        </View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.medium,
  },
  flex: { flex: 1 },
  icono: { marginRight: 2 },
  fab: { position: 'absolute', right: Spacing.four, bottom: Spacing.four },
  fabInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

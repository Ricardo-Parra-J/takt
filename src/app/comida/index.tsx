import { StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const OPCIONES = [
  { href: '/comida/ingredientes', icon: 'nutrition-outline', titulo: 'Ingredientes', desc: 'Alimentos genéricos con valores nutricionales' },
  { href: '/comida/productos', icon: 'pricetags-outline', titulo: 'Productos', desc: 'Productos de marca, con sus propios valores' },
  { href: '/comida/recetas', icon: 'book-outline', titulo: 'Recetas', desc: 'Próximamente: armar recetas con ingredientes y productos' },
] as const;

export default function ComidaHubScreen() {
  const theme = useTheme();
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Comida', headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Comida
        </ThemedText>

        {OPCIONES.map((op) => (
          <Link key={op.href} href={op.href} asChild>
            <ThemedView type="backgroundElement" style={styles.card}>
              <Ionicons name={op.icon as any} size={28} color={theme.text} />
              <ThemedView style={styles.cardTexto}>
                <ThemedText type="smallBold">{op.titulo}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {op.desc}
                </ThemedText>
              </ThemedView>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </ThemedView>
          </Link>
        ))}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  title: { fontSize: 28, lineHeight: 34, marginBottom: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  cardTexto: { flex: 1, gap: 2 },
});

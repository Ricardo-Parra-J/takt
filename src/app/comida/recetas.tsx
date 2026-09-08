import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function RecetasScreen() {
  const theme = useTheme();
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Recetas' }} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.centro}>
          <Ionicons name="book-outline" size={48} color={theme.textSecondary} />
          <ThemedText themeColor="textSecondary" style={styles.texto}>
            Todavía no está construido. Primero conviene tener Ingredientes y Productos
            cargados, ya que las recetas se arman a partir de ellos.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four },
  texto: { textAlign: 'center', lineHeight: 20 },
});

import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function DeporteScreen() {
  const theme = useTheme();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Deporte
        </ThemedText>
        <ThemedView style={styles.centro}>
          <Ionicons name="barbell-outline" size={48} color={theme.textSecondary} />
          <ThemedText themeColor="textSecondary" style={styles.texto}>
            Este módulo todavía no está construido. La base de datos ya tiene las tablas
            listas para él (ver DATABASE.md) — falta armar sus pantallas.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  title: { fontSize: 28, lineHeight: 34 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four },
  texto: { textAlign: 'center', lineHeight: 20 },
});

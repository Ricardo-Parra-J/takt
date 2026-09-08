import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Link, Stack, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import {
  alternarActivoGastoObligatorio,
  formatearMonto,
  GastoObligatorio,
  listGastosObligatorios,
} from '@/db/repositories/finanzas';

export default function GastosObligatoriosScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [gastos, setGastos] = useState<GastoObligatorio[]>([]);

  const cargar = useCallback(() => {
    listGastosObligatorios().then(setGastos);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function onAlternarActivo(gasto: GastoObligatorio) {
    await alternarActivoGastoObligatorio(gasto.id, gasto.activo === 0);
    cargar();
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Gastos obligatorios' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
          Gastos recurrentes (ej. suscripciones, arriendo) que se descuentan solos cada mes en su
          día de cobro.
        </ThemedText>

        {gastos.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
            No hay gastos obligatorios configurados.
          </ThemedText>
        )}

        <FlatList
          data={gastos}
          keyExtractor={(g) => String(g.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.row}>
              <Pressable
                style={styles.rowText}
                onPress={() => router.push(`/finanzas/gasto-obligatorio-form?id=${item.id}`)}>
                <ThemedText style={item.activo === 0 && styles.inactivo}>{item.titulo}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Día {item.dia_cobro} · {formatearMonto(item.monto)}
                  {item.categoria_nombre ? ` · ${item.categoria_nombre}` : ''}
                </ThemedText>
              </Pressable>
              <Switch value={item.activo === 1} onValueChange={() => onAlternarActivo(item)} />
            </ThemedView>
          )}
        />

        <Link href="/finanzas/gasto-obligatorio-form" asChild>
          <Pressable style={styles.fab}>
            <ThemedView type="backgroundSelected" style={styles.fabInner}>
              <Ionicons name="add" size={28} color={theme.text} />
            </ThemedView>
          </Pressable>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  intro: { lineHeight: 18 },
  vacio: { paddingVertical: Spacing.four, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
  rowText: { flex: 1, gap: 2 },
  inactivo: { textDecorationLine: 'line-through' },
  fab: { position: 'absolute', right: Spacing.four, bottom: Spacing.four },
  fabInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

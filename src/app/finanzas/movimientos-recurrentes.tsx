import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Link, Stack, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import {
  alternarActivoMovimientoRecurrente,
  formatearMonto,
  listMovimientosRecurrentes,
  MovimientoRecurrente,
} from '@/db/repositories/finanzas';

export default function MovimientosRecurrentesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<MovimientoRecurrente[]>([]);

  const cargar = useCallback(() => {
    listMovimientosRecurrentes().then(setItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function onAlternarActivo(item: MovimientoRecurrente) {
    await alternarActivoMovimientoRecurrente(item.id, item.activo === 0);
    cargar();
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Movimientos recurrentes' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
          Cobros e ingresos fijos que se repiten cada mes (sueldo, arriendo, suscripciones) — se
          generan y descuentan solos en su día, sin que tengas que anotarlos a mano.
        </ThemedText>

        {items.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
            No hay movimientos recurrentes configurados.
          </ThemedText>
        )}

        <FlatList
          data={items}
          keyExtractor={(g) => String(g.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <Card style={styles.row}>
              <Ionicons
                name={item.tipo === 'ganancia' ? 'add-circle-outline' : 'remove-circle-outline'}
                size={20}
                color={item.tipo === 'ganancia' ? '#3C9A5F' : '#D64545'}
              />
              <Pressable
                style={styles.rowText}
                onPress={() => router.push(`/finanzas/movimiento-form?recurrenteId=${item.id}`)}>
                <ThemedText style={item.activo === 0 && styles.inactivo}>{item.titulo}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Día {item.dia_cobro} · {formatearMonto(item.monto)}
                  {item.categoria_nombre ? ` · ${item.categoria_nombre}` : ''}
                </ThemedText>
              </Pressable>
              <Switch
                value={item.activo === 1}
                onValueChange={() => onAlternarActivo(item)}
                trackColor={{ true: theme.accent }}
                thumbColor={undefined}
              />
            </Card>
          )}
        />

        <View style={styles.botonesAgregar}>
          <Link href="/finanzas/movimiento-form?tipo=gasto&recurrente=1" asChild>
            <AppButton label="Gasto fijo" icono="remove-circle-outline" flex style={styles.botonAgregar} />
          </Link>
          <Link href="/finanzas/movimiento-form?tipo=ganancia&recurrente=1" asChild>
            <AppButton label="Ingreso fijo" icono="add-circle-outline" flex style={styles.botonAgregar} />
          </Link>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  intro: { lineHeight: 18 },
  vacio: { paddingVertical: Spacing.four, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowText: { flex: 1, gap: 2 },
  inactivo: { textDecorationLine: 'line-through' },
  botonesAgregar: { flexDirection: 'row', gap: Spacing.two, paddingBottom: Spacing.three },
  botonAgregar: { flex: 1 },
});

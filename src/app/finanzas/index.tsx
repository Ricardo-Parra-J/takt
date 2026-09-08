import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import {
  calcularResumenMes,
  calcularSaldoTotal,
  eliminarMovimiento,
  formatearMonto,
  listMovimientos,
  mesActualTexto,
  MovimientoFinanciero,
  ResumenMes,
  sincronizarMovimientosAutomaticos,
} from '@/db/repositories/finanzas';

const NOMBRE_MES = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

const TIPO_LABEL: Record<string, string> = {
  ganancia: 'Ganancia',
  gasto: 'Gasto',
};

export default function FinanzasScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [resumen, setResumen] = useState<ResumenMes | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>([]);

  const cargar = useCallback(async () => {
    await sincronizarMovimientosAutomaticos();
    const [saldo, resumenMes, lista] = await Promise.all([
      calcularSaldoTotal(),
      calcularResumenMes(),
      listMovimientos(mesActualTexto()),
    ]);
    setSaldoTotal(saldo);
    setResumen(resumenMes);
    setMovimientos(lista);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function onEliminar(id: number) {
    await eliminarMovimiento(id);
    cargar();
  }

  const maxCategoria = resumen?.porCategoriaGasto[0]?.monto ?? 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.tituloRow}>
          <ThemedText type="title" style={styles.title}>
            Finanzas
          </ThemedText>
          <View style={styles.accionesHeader}>
            <Link href="/finanzas/movimientos-recurrentes" asChild>
              <Pressable hitSlop={8}>
                <View style={[styles.botonIcono, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="repeat" size={18} color={theme.accent} />
                </View>
              </Pressable>
            </Link>
            <Link href="/finanzas/configuracion" asChild>
              <Pressable hitSlop={8}>
                <View style={[styles.botonIcono, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="settings-outline" size={18} color={theme.accent} />
                </View>
              </Pressable>
            </Link>
          </View>
        </View>

        <FlatList
          data={movimientos}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.cards}>
                <Card style={styles.card}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Saldo total
                  </ThemedText>
                  <ThemedText type="title" style={[styles.cardValor, { color: theme.accent }]}>
                    {formatearMonto(saldoTotal)}
                  </ThemedText>
                </Card>
                <Card style={styles.card}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Disponible para gastar
                  </ThemedText>
                  <ThemedText
                    type="title"
                    style={[
                      styles.cardValor,
                      { color: theme.accent },
                      (resumen?.disponible ?? 0) < 0 && styles.negativo,
                    ]}>
                    {formatearMonto(resumen?.disponible ?? 0)}
                  </ThemedText>
                </Card>
              </View>

              <Card style={styles.ahorroCard}>
                <ThemedText type="smallBold">Ahorro de {NOMBRE_MES}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Objetivo: {formatearMonto(resumen?.ahorroObjetivo ?? 0)} · Real hasta ahora:{' '}
                  {formatearMonto(resumen?.ahorroReal ?? 0)}
                </ThemedText>
              </Card>

              {resumen && resumen.porCategoriaGasto.length > 0 && (
                <Card style={styles.resumenCategorias}>
                  <ThemedText type="smallBold">Gasto por categoría</ThemedText>
                  {resumen.porCategoriaGasto.map((c) => (
                    <View key={c.categoria} style={styles.filaCategoria}>
                      <View style={styles.filaCategoriaTexto}>
                        <ThemedText type="small">{c.categoria}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {formatearMonto(c.monto)}
                        </ThemedText>
                      </View>
                      <View style={styles.barraFondo}>
                        <View
                          style={[
                            styles.barraRelleno,
                            { width: `${maxCategoria ? (c.monto / maxCategoria) * 100 : 0}%`, backgroundColor: theme.accent },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </Card>
              )}

              <View style={styles.botonesAgregar}>
                <AppButton
                  label="Gasto"
                  icono="remove-circle-outline"
                  flex
                  onPress={() => router.push('/finanzas/movimiento-form?tipo=gasto')}
                />
                <AppButton
                  label="Ganancia"
                  icono="add-circle-outline"
                  flex
                  onPress={() => router.push('/finanzas/movimiento-form?tipo=ganancia')}
                />
              </View>

              <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
                Movimientos de {NOMBRE_MES}
              </ThemedText>
              {movimientos.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
                  Todavía no hay movimientos este mes.
                </ThemedText>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <MovimientoRow
              movimiento={item}
              onEliminar={() => onEliminar(item.id)}
              onEditar={() => router.push(`/finanzas/movimiento-form?id=${item.id}`)}
            />
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function MovimientoRow({
  movimiento,
  onEliminar,
  onEditar,
}: {
  movimiento: MovimientoFinanciero;
  onEliminar: () => void;
  onEditar?: () => void;
}) {
  const theme = useTheme();
  const esIngreso = movimiento.tipo === 'ganancia';

  return (
    <Card style={styles.row}>
      <Pressable style={styles.rowText} onPress={onEditar} disabled={!onEditar}>
        <ThemedText>{movimiento.titulo}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {movimiento.fecha}
          {movimiento.categoria_nombre ? ` · ${movimiento.categoria_nombre}` : ''} · {TIPO_LABEL[movimiento.tipo]}
          {movimiento.movimiento_recurrente_id ? ' · Recurrente' : ''}
        </ThemedText>
      </Pressable>
      <ThemedText type="smallBold" style={esIngreso ? styles.montoIngreso : styles.montoGasto}>
        {esIngreso ? '+' : '-'}
        {formatearMonto(movimiento.monto)}
      </ThemedText>
      <Pressable onPress={onEliminar} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  tituloRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.three },
  title: { fontSize: 28, lineHeight: 34 },
  accionesHeader: { flexDirection: 'row', gap: Spacing.two },
  botonIcono: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  header: { gap: Spacing.three },
  cards: { flexDirection: 'row', gap: Spacing.three },
  card: { flex: 1, gap: Spacing.one },
  cardValor: { fontSize: 22, lineHeight: 26 },
  negativo: { color: '#D64545' },
  ahorroCard: { gap: 4 },
  resumenCategorias: { gap: Spacing.two },
  filaCategoria: { gap: 4 },
  filaCategoriaTexto: { flexDirection: 'row', justifyContent: 'space-between' },
  barraFondo: { height: 6, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.25)', overflow: 'hidden' },
  barraRelleno: { height: 6, borderRadius: 3 },
  botonesAgregar: { flexDirection: 'row', gap: Spacing.two },
  seccion: { marginTop: Spacing.one },
  vacio: { paddingVertical: Spacing.three, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowText: { flex: 1, gap: 2 },
  montoIngreso: { color: '#3C9A5F' },
  montoGasto: { color: '#D64545' },
});

import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { actualizarConfiguracion, getConfiguracion } from '@/db/repositories/finanzas';

export default function ConfiguracionFinanzasScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [sueldo, setSueldo] = useState('0');
  const [diaPago, setDiaPago] = useState('1');
  const [porcentajeAhorro, setPorcentajeAhorro] = useState('0');
  const [saldoInicial, setSaldoInicial] = useState('0');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getConfiguracion().then((c) => {
      setSueldo(String(c.sueldo_mensual));
      setDiaPago(String(c.dia_pago));
      setPorcentajeAhorro(String(c.porcentaje_ahorro));
      setSaldoInicial(String(c.saldo_inicial));
      setCargando(false);
    });
  }, []);

  async function onGuardar() {
    const dia = Number(diaPago);
    const pct = Number(porcentajeAhorro.replace(',', '.'));
    if (!dia || dia < 1 || dia > 31) {
      Alert.alert('Día inválido', 'El día de pago del sueldo debe estar entre 1 y 31.');
      return;
    }
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert('Porcentaje inválido', 'El % de ahorro debe estar entre 0 y 100.');
      return;
    }
    await actualizarConfiguracion({
      sueldo_mensual: Number(sueldo.replace(',', '.')) || 0,
      dia_pago: dia,
      porcentaje_ahorro: pct,
      saldo_inicial: Number(saldoInicial.replace(',', '.')) || 0,
      moneda: 'CLP',
    });
    router.back();
  }

  if (cargando) return null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Configuración de Finanzas' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="small" themeColor="textSecondary">
            Sueldo mensual (CLP)
          </ThemedText>
          <TextInput
            value={sueldo}
            onChangeText={setSueldo}
            keyboardType="decimal-pad"
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Día del mes en que se paga
          </ThemedText>
          <TextInput
            value={diaPago}
            onChangeText={setDiaPago}
            keyboardType="number-pad"
            placeholder="1-31"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            % de ahorro objetivo
          </ThemedText>
          <TextInput
            value={porcentajeAhorro}
            onChangeText={setPorcentajeAhorro}
            keyboardType="decimal-pad"
            placeholder="0-100"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Saldo inicial (cuánta plata tienes hoy)
          </ThemedText>
          <TextInput
            value={saldoInicial}
            onChangeText={setSaldoInicial}
            keyboardType="decimal-pad"
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.pista}>
            Se usa solo una vez como punto de partida del saldo total acumulado; de ahí en
            adelante ese saldo se actualiza solo con cada movimiento.
          </ThemedText>

          <Pressable onPress={onGuardar} style={styles.botonGuardar}>
            <ThemedView type="backgroundSelected" style={styles.botonInner}>
              <ThemedText type="smallBold">Guardar</ThemedText>
            </ThemedView>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  input: { borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, fontSize: 16 },
  seccion: { marginTop: Spacing.three },
  pista: { marginTop: 4, lineHeight: 18 },
  botonGuardar: { marginTop: Spacing.four },
  botonInner: { padding: Spacing.three, borderRadius: Spacing.three, alignItems: 'center' },
});

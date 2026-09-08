import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { listTareas } from '@/db/repositories/tareas';

export default function HoyScreen() {
  const [activas, setActivas] = useState(0);
  const [atrasadas, setAtrasadas] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      (async () => {
        const [a, r] = await Promise.all([listTareas('activas'), listTareas('atrasadas')]);
        if (vigente) {
          setActivas(a.length);
          setAtrasadas(r.length);
        }
      })();
      return () => {
        vigente = false;
      };
    }, [])
  );

  const hoy = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.fecha}>
          {hoy}
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          Hoy
        </ThemedText>

        <View style={styles.cards}>
          <StatCard label="Tareas activas" valor={activas} />
          <StatCard label="Tareas atrasadas" valor={atrasadas} resaltado={atrasadas > 0} />
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.nota}>
          Esta pantalla va a ir juntando lo de todos los módulos (próximo bloque del
          calendario, comidas planeadas, disponible para gastar, etc.) — por ahora
          muestra un resumen simple de Tareas para probar que la base de datos ya
          funciona de punta a punta.
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

function StatCard({ label, valor, resaltado }: { label: string; valor: number; resaltado?: boolean }) {
  const theme = useTheme();
  return (
    <Card style={styles.card}>
      <ThemedText type="title" style={[styles.cardValor, { color: resaltado ? '#D64545' : theme.accent }]}>
        {valor}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.two },
  fecha: { textTransform: 'capitalize' },
  title: { fontSize: 32, lineHeight: 38, marginBottom: Spacing.three },
  cards: { flexDirection: 'row', gap: Spacing.three },
  card: { flex: 1, gap: Spacing.one },
  cardValor: { fontSize: 36, lineHeight: 40 },
  nota: { marginTop: Spacing.five, lineHeight: 20 },
});

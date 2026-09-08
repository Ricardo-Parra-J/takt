import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { eliminarSesion, listSesiones, SesionEntrenamiento } from '@/db/repositories/deporte';

export default function DeporteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [sesiones, setSesiones] = useState<SesionEntrenamiento[]>([]);

  const cargar = useCallback(() => {
    listSesiones().then(setSesiones);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  function onEliminar(sesion: SesionEntrenamiento) {
    Alert.alert('Eliminar entrenamiento', `¿Eliminar "${sesion.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarSesion(sesion.id);
          cargar();
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.tituloRow}>
          <ThemedText type="title" style={styles.title}>
            Deporte
          </ThemedText>
          <View style={styles.accionesHeader}>
            <Link href="/deporte/ejercicios" asChild>
              <Pressable hitSlop={8}>
                <View style={[styles.botonIcono, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="body-outline" size={18} color={theme.accent} />
                </View>
              </Pressable>
            </Link>
            <Link href="/deporte/rutinas" asChild>
              <Pressable hitSlop={8}>
                <View style={[styles.botonIcono, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="list-outline" size={18} color={theme.accent} />
                </View>
              </Pressable>
            </Link>
          </View>
        </View>

        <Link href="/deporte/sesion-form" asChild>
          <AppButton label="Iniciar entrenamiento" icono="barbell-outline" style={styles.botonIniciar} />
        </Link>

        {sesiones.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
            Todavía no has registrado ningún entrenamiento.
          </ThemedText>
        )}

        <FlatList
          data={sesiones}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <SesionRow
              sesion={item}
              onEditar={() => router.push(`/deporte/sesion-form?id=${item.id}`)}
              onEliminar={() => onEliminar(item)}
            />
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function SesionRow({
  sesion,
  onEditar,
  onEliminar,
}: {
  sesion: SesionEntrenamiento;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const theme = useTheme();
  return (
    <Card style={styles.row}>
      <Ionicons name="barbell-outline" size={22} color={theme.accent} />
      <Pressable style={styles.rowText} onPress={onEditar}>
        <ThemedText>{sesion.nombre}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {sesion.fecha}
          {sesion.hora_inicio ? ` · ${sesion.hora_inicio}` : ''}
          {sesion.duracion_minutos ? ` · ${sesion.duracion_minutos} min` : ''}
          {sesion.preset_nombre ? ` · ${sesion.preset_nombre}` : ''}
        </ThemedText>
      </Pressable>
      <Pressable onPress={onEliminar} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  tituloRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, lineHeight: 34 },
  accionesHeader: { flexDirection: 'row', gap: Spacing.two },
  botonIcono: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  botonIniciar: {},
  vacio: { paddingVertical: Spacing.four, textAlign: 'center' },
  lista: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rowText: { flex: 1, gap: 2 },
});

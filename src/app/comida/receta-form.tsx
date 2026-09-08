import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { SelectorMultiple } from '@/components/comida/selector-multiple';
import { AgregarItemReceta } from '@/components/comida/agregar-item-receta';
import { CAMPOS_NUTRICIONALES, ValoresNutricionales } from '@/db/nutricion';
import { listUnidades, UnidadMedida } from '@/db/repositories/unidades';
import { listTiposComida, listEtiquetasDieteticas, CatalogoItem } from '@/db/repositories/catalogos';
import { getIngrediente } from '@/db/repositories/ingredientes';
import { getProducto } from '@/db/repositories/productos';
import { listEquivalenciasIngrediente, listEquivalenciasProducto } from '@/db/repositories/equivalencias';
import {
  actualizarReceta,
  crearReceta,
  eliminarReceta,
  getRecetaDetalle,
  RecetaIngredienteItem,
  RecetaProductoItem,
} from '@/db/repositories/recetas';
import { convertirACantidadBase, dividirValores, escalarValores, sumarValores, valoresVacios } from '@/db/nutricion-calc';

export default function RecetaFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = !!id;
  const router = useRouter();
  const theme = useTheme();

  const [nombre, setNombre] = useState('');
  const [porciones, setPorciones] = useState('1');
  const [instrucciones, setInstrucciones] = useState('');
  const [favorita, setFavorita] = useState(false);
  const [tipoComidaIds, setTipoComidaIds] = useState<number[]>([]);
  const [etiquetaIds, setEtiquetaIds] = useState<number[]>([]);
  const [ingredientesAgregados, setIngredientesAgregados] = useState<RecetaIngredienteItem[]>([]);
  const [productosAgregados, setProductosAgregados] = useState<RecetaProductoItem[]>([]);

  const [tiposComida, setTiposComida] = useState<CatalogoItem[]>([]);
  const [etiquetas, setEtiquetas] = useState<CatalogoItem[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [cargando, setCargando] = useState(editando);

  const [nutricion, setNutricion] = useState<{
    total: ValoresNutricionales;
    porPorcion: ValoresNutricionales;
    incompleta: boolean;
  } | null>(null);

  useEffect(() => {
    Promise.all([listTiposComida(), listEtiquetasDieteticas(), listUnidades()]).then(
      ([tc, et, un]) => {
        setTiposComida(tc);
        setEtiquetas(et);
        setUnidades(un);
      }
    );
  }, []);

  useEffect(() => {
    if (!id) return;
    getRecetaDetalle(Number(id)).then((receta) => {
      if (!receta) return;
      setNombre(receta.nombre);
      setPorciones(String(receta.porciones));
      setInstrucciones(receta.instrucciones ?? '');
      setFavorita(receta.favorita === 1);
      setTipoComidaIds(receta.tipoComidaIds);
      setEtiquetaIds(receta.etiquetaIds);
      setIngredientesAgregados(receta.ingredientes);
      setProductosAgregados(receta.productos);
      setCargando(false);
    });
  }, [id]);

  useEffect(() => {
    if (unidades.length === 0) return;
    let cancelado = false;

    async function calcular() {
      let total = valoresVacios();
      let incompleta = false;

      for (const item of ingredientesAgregados) {
        const ing = await getIngrediente(item.ingrediente_id);
        if (!ing) {
          incompleta = true;
          continue;
        }
        if (ing.info_incompleta === 1) incompleta = true;
        const equivalencias = await listEquivalenciasIngrediente(item.ingrediente_id);
        const cantidadBase = convertirACantidadBase(item.cantidad, item.unidad_id, ing.porcion_base_unidad_id, unidades, equivalencias);
        if (cantidadBase == null) {
          incompleta = true;
          continue;
        }
        const factor = cantidadBase / ing.porcion_base_cantidad;
        total = sumarValores(total, escalarValores(ing, factor));
      }

      for (const item of productosAgregados) {
        const prod = await getProducto(item.producto_id);
        if (!prod) {
          incompleta = true;
          continue;
        }
        if (prod.info_incompleta === 1) incompleta = true;
        const equivalencias = await listEquivalenciasProducto(item.producto_id);
        const cantidadBase = convertirACantidadBase(item.cantidad, item.unidad_id, prod.porcion_base_unidad_id, unidades, equivalencias);
        if (cantidadBase == null) {
          incompleta = true;
          continue;
        }
        const factor = cantidadBase / prod.porcion_base_cantidad;
        total = sumarValores(total, escalarValores(prod, factor));
      }

      if (cancelado) return;
      const porcionesNum = Number(porciones.replace(',', '.')) || 1;
      setNutricion({ total, porPorcion: dividirValores(total, porcionesNum), incompleta });
    }

    calcular();
    return () => {
      cancelado = true;
    };
  }, [ingredientesAgregados, productosAgregados, porciones, unidades]);

  function agregarIngrediente(item: { id: number; nombre: string }, cantidad: number, unidadId: number) {
    const unidad = unidades.find((u) => u.id === unidadId);
    setIngredientesAgregados((prev) => [
      ...prev,
      { ingrediente_id: item.id, nombre: item.nombre, cantidad, unidad_id: unidadId, unidad_nombre: unidad?.nombre ?? '' },
    ]);
  }

  function agregarProducto(item: { id: number; nombre: string }, cantidad: number, unidadId: number) {
    const unidad = unidades.find((u) => u.id === unidadId);
    setProductosAgregados((prev) => [
      ...prev,
      { producto_id: item.id, nombre: item.nombre, cantidad, unidad_id: unidadId, unidad_nombre: unidad?.nombre ?? '' },
    ]);
  }

  function quitarIngrediente(index: number) {
    setIngredientesAgregados((prev) => prev.filter((_, i) => i !== index));
  }

  function quitarProducto(index: number) {
    setProductosAgregados((prev) => prev.filter((_, i) => i !== index));
  }

  async function onGuardar() {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Ponle un nombre a la receta.');
      return;
    }
    const porcionesNum = Number(porciones.replace(',', '.'));
    if (!porcionesNum || porcionesNum <= 0) {
      Alert.alert('Porciones inválidas', 'La receta debe rendir al menos 1 porción.');
      return;
    }
    if (ingredientesAgregados.length === 0 && productosAgregados.length === 0) {
      Alert.alert('Faltan ingredientes', 'Agrega al menos un ingrediente o producto a la receta.');
      return;
    }

    const datos = {
      nombre,
      porciones: porcionesNum,
      instrucciones,
      favorita,
      tipoComidaIds,
      etiquetaIds,
      ingredientes: ingredientesAgregados.map((i) => ({
        ingrediente_id: i.ingrediente_id,
        cantidad: i.cantidad,
        unidad_id: i.unidad_id,
      })),
      productos: productosAgregados.map((p) => ({
        producto_id: p.producto_id,
        cantidad: p.cantidad,
        unidad_id: p.unidad_id,
      })),
    };

    if (editando) {
      await actualizarReceta(Number(id), datos);
    } else {
      await crearReceta(datos);
    }
    router.back();
  }

  function onEliminar() {
    Alert.alert('Eliminar receta', `¿Eliminar "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarReceta(Number(id));
          router.back();
        },
      },
    ]);
  }

  if (cargando) return null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: editando ? 'Editar receta' : 'Nueva receta' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="small" themeColor="textSecondary">
            Nombre
          </ThemedText>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Tallarines con salsa"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <View style={styles.filaPorcionesFavorita}>
            <View style={styles.porcionesBox}>
              <ThemedText type="small" themeColor="textSecondary">
                Porciones
              </ThemedText>
              <TextInput
                value={porciones}
                onChangeText={setPorciones}
                keyboardType="decimal-pad"
                style={[styles.inputCorto, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            </View>
            <Pressable onPress={() => setFavorita((f) => !f)} style={styles.favoritaBoton}>
              <Ionicons name={favorita ? 'star' : 'star-outline'} size={22} color={favorita ? '#D4A017' : theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                Favorita
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Tipo de comida
          </ThemedText>
          <SelectorMultiple opciones={tiposComida} seleccionados={tipoComidaIds} onChange={setTipoComidaIds} />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Etiquetas dietéticas
          </ThemedText>
          <SelectorMultiple opciones={etiquetas} seleccionados={etiquetaIds} onChange={setEtiquetaIds} />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Ingredientes
          </ThemedText>
          {ingredientesAgregados.map((item, index) => (
            <ThemedView key={`${item.ingrediente_id}-${index}`} type="backgroundElement" style={styles.itemAgregado}>
              <ThemedText type="small" style={styles.itemAgregadoTexto}>
                {item.nombre} — {item.cantidad} {item.unidad_nombre}
              </ThemedText>
              <Pressable onPress={() => quitarIngrediente(index)}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </Pressable>
            </ThemedView>
          ))}
          <AgregarItemReceta tipo="ingrediente" onAgregar={agregarIngrediente} />

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Productos
          </ThemedText>
          {productosAgregados.map((item, index) => (
            <ThemedView key={`${item.producto_id}-${index}`} type="backgroundElement" style={styles.itemAgregado}>
              <ThemedText type="small" style={styles.itemAgregadoTexto}>
                {item.nombre} — {item.cantidad} {item.unidad_nombre}
              </ThemedText>
              <Pressable onPress={() => quitarProducto(index)}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </Pressable>
            </ThemedView>
          ))}
          <AgregarItemReceta tipo="producto" onAgregar={agregarProducto} />

          {nutricion && (ingredientesAgregados.length > 0 || productosAgregados.length > 0) && (
            <ThemedView type="backgroundElement" style={[styles.seccion, styles.resumenNutricional]}>
              <ThemedText type="smallBold">Valores nutricionales por porción</ThemedText>
              {nutricion.incompleta && (
                <ThemedText type="small" style={styles.avisoIncompleto}>
                  Info incompleta: algún ingrediente/producto no tiene todos sus valores o su unidad no es convertible.
                </ThemedText>
              )}
              <View style={styles.gridResumen}>
                {CAMPOS_NUTRICIONALES.map((campo) => (
                  <ThemedText key={campo.key} type="small" themeColor="textSecondary" style={styles.campoResumen}>
                    {campo.label}: {nutricion.porPorcion[campo.key] != null ? nutricion.porPorcion[campo.key]!.toFixed(1) : '—'} {campo.unidad}
                  </ThemedText>
                ))}
              </View>
            </ThemedView>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.seccion}>
            Instrucciones
          </ThemedText>
          <TextInput
            value={instrucciones}
            onChangeText={setInstrucciones}
            placeholder="Pasos para prepararla..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={5}
            style={[styles.inputMultilinea, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <Pressable onPress={onGuardar} style={styles.botonGuardar}>
            <ThemedView type="backgroundSelected" style={styles.botonInner}>
              <ThemedText type="smallBold">Guardar</ThemedText>
            </ThemedView>
          </Pressable>

          {editando && (
            <Pressable onPress={onEliminar} style={styles.botonEliminar}>
              <ThemedText type="small" style={styles.textoEliminar}>
                Eliminar receta
              </ThemedText>
            </Pressable>
          )}
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
  inputMultilinea: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputCorto: { width: 80, borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, fontSize: 16 },
  filaPorcionesFavorita: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.three },
  porcionesBox: { gap: 4 },
  favoritaBoton: { alignItems: 'center', gap: 2, paddingBottom: Spacing.one },
  seccion: { marginTop: Spacing.three },
  itemAgregado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    marginBottom: Spacing.one,
  },
  itemAgregadoTexto: { flex: 1, marginRight: Spacing.two },
  resumenNutricional: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  avisoIncompleto: { color: '#B8860B' },
  gridResumen: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  campoResumen: { width: '47%' },
  botonGuardar: { marginTop: Spacing.four },
  botonInner: { padding: Spacing.three, borderRadius: Spacing.three, alignItems: 'center' },
  botonEliminar: { marginTop: Spacing.three, alignItems: 'center' },
  textoEliminar: { color: '#D64545' },
});

import { ValoresNutricionales } from './nutricion';
import { UnidadMedida } from './repositories/unidades';
import { EquivalenciaUnidad } from './repositories/equivalencias';

/**
 * Convierte una cantidad dada en una unidad cualquiera a la unidad base de una
 * entidad (ingrediente o producto), usando:
 *  1. Conversion universal si comparten dimension con la unidad base (masa<->masa, volumen<->volumen), o
 *  2. La equivalencia especifica de esa entidad para esa unidad, si existe.
 * Devuelve null si no hay forma de convertir (falta la equivalencia).
 */
export function convertirACantidadBase(
  cantidad: number,
  unidadId: number,
  porcionBaseUnidadId: number,
  unidades: UnidadMedida[],
  equivalencias: EquivalenciaUnidad[]
): number | null {
  if (unidadId === porcionBaseUnidadId) return cantidad;

  const unidad = unidades.find((u) => u.id === unidadId);
  const base = unidades.find((u) => u.id === porcionBaseUnidadId);
  if (!unidad || !base) return null;

  if (
    unidad.dimension === base.dimension &&
    unidad.dimension !== 'conteo' &&
    unidad.factor_a_base != null &&
    base.factor_a_base != null
  ) {
    return cantidad * (unidad.factor_a_base / base.factor_a_base);
  }

  const equivalencia = equivalencias.find((e) => e.unidad_id === unidadId);
  if (equivalencia) return cantidad * equivalencia.equivale_a_cantidad;

  return null;
}

const VALORES_CERO: ValoresNutricionales = {
  calorias: 0,
  proteinas_g: 0,
  carbohidratos_g: 0,
  grasas_g: 0,
  fibra_g: 0,
  azucares_g: 0,
  sodio_mg: 0,
};

/** Escala los valores nutricionales de una entidad segun la cantidad usada, ya convertida a su unidad base. */
export function escalarValores(valores: ValoresNutricionales, factor: number): ValoresNutricionales {
  const escalar = (v: number | null) => (v == null ? null : v * factor);
  return {
    calorias: escalar(valores.calorias),
    proteinas_g: escalar(valores.proteinas_g),
    carbohidratos_g: escalar(valores.carbohidratos_g),
    grasas_g: escalar(valores.grasas_g),
    fibra_g: escalar(valores.fibra_g),
    azucares_g: escalar(valores.azucares_g),
    sodio_mg: escalar(valores.sodio_mg),
  };
}

/** Suma dos conjuntos de valores nutricionales. Si un campo es null en ambos, el resultado es null (info desconocida). */
export function sumarValores(a: ValoresNutricionales, b: ValoresNutricionales): ValoresNutricionales {
  const sumar = (x: number | null, y: number | null) => (x == null && y == null ? null : (x ?? 0) + (y ?? 0));
  return {
    calorias: sumar(a.calorias, b.calorias),
    proteinas_g: sumar(a.proteinas_g, b.proteinas_g),
    carbohidratos_g: sumar(a.carbohidratos_g, b.carbohidratos_g),
    grasas_g: sumar(a.grasas_g, b.grasas_g),
    fibra_g: sumar(a.fibra_g, b.fibra_g),
    azucares_g: sumar(a.azucares_g, b.azucares_g),
    sodio_mg: sumar(a.sodio_mg, b.sodio_mg),
  };
}

export function valoresVacios(): ValoresNutricionales {
  return { ...VALORES_CERO };
}

/** Divide los valores totales de una receta por el numero de porciones. */
export function dividirValores(valores: ValoresNutricionales, divisor: number): ValoresNutricionales {
  if (!divisor) return valores;
  const dividir = (v: number | null) => (v == null ? null : v / divisor);
  return {
    calorias: dividir(valores.calorias),
    proteinas_g: dividir(valores.proteinas_g),
    carbohidratos_g: dividir(valores.carbohidratos_g),
    grasas_g: dividir(valores.grasas_g),
    fibra_g: dividir(valores.fibra_g),
    azucares_g: dividir(valores.azucares_g),
    sodio_mg: dividir(valores.sodio_mg),
  };
}

/** Campos nutricionales comunes a Ingredientes y Productos. */
export interface ValoresNutricionales {
  calorias: number | null;
  proteinas_g: number | null;
  carbohidratos_g: number | null;
  grasas_g: number | null;
  fibra_g: number | null;
  azucares_g: number | null;
  sodio_mg: number | null;
}

export const CAMPOS_NUTRICIONALES: { key: keyof ValoresNutricionales; label: string; unidad: string }[] = [
  { key: 'calorias', label: 'Calorías', unidad: 'kcal' },
  { key: 'proteinas_g', label: 'Proteínas', unidad: 'g' },
  { key: 'carbohidratos_g', label: 'Carbohidratos', unidad: 'g' },
  { key: 'grasas_g', label: 'Grasas', unidad: 'g' },
  { key: 'fibra_g', label: 'Fibra', unidad: 'g' },
  { key: 'azucares_g', label: 'Azúcares', unidad: 'g' },
  { key: 'sodio_mg', label: 'Sodio', unidad: 'mg' },
];

/** Se considera "info incompleta" si falta cualquiera de los 4 macros principales. */
export function calcularInfoIncompleta(valores: ValoresNutricionales): boolean {
  return (
    valores.calorias == null ||
    valores.proteinas_g == null ||
    valores.carbohidratos_g == null ||
    valores.grasas_g == null
  );
}

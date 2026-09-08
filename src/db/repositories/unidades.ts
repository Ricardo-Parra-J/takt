import { getDb } from '../client';

export type Dimension = 'masa' | 'volumen' | 'conteo';

export interface UnidadMedida {
  id: number;
  nombre: string;
  dimension: Dimension;
  factor_a_base: number | null;
}

let cache: UnidadMedida[] | null = null;

/** El catálogo es fijo (seed en el esquema), así que se puede cachear en memoria. */
export async function listUnidades(): Promise<UnidadMedida[]> {
  if (cache) return cache;
  const db = await getDb();
  cache = await db.getAllAsync<UnidadMedida>('SELECT * FROM unidades_medida ORDER BY dimension, nombre');
  return cache;
}

export async function getUnidad(id: number): Promise<UnidadMedida | null> {
  const unidades = await listUnidades();
  return unidades.find((u) => u.id === id) ?? null;
}

export async function getUnidadPorNombre(nombre: string): Promise<UnidadMedida | null> {
  const unidades = await listUnidades();
  return unidades.find((u) => u.nombre === nombre) ?? null;
}

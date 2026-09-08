import { getDb } from '../client';

export interface EquivalenciaUnidad {
  unidad_id: number;
  equivale_a_cantidad: number;
}

export async function listEquivalenciasIngrediente(ingredienteId: number): Promise<EquivalenciaUnidad[]> {
  const db = await getDb();
  return db.getAllAsync<EquivalenciaUnidad>(
    'SELECT unidad_id, equivale_a_cantidad FROM ingrediente_equivalencias_unidad WHERE ingrediente_id = ?',
    ingredienteId
  );
}

export async function listEquivalenciasProducto(productoId: number): Promise<EquivalenciaUnidad[]> {
  const db = await getDb();
  return db.getAllAsync<EquivalenciaUnidad>(
    'SELECT unidad_id, equivale_a_cantidad FROM producto_equivalencias_unidad WHERE producto_id = ?',
    productoId
  );
}

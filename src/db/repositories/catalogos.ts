import { getDb } from '../client';

export interface CatalogoItem {
  id: number;
  nombre: string;
}

export async function listTiposComida(): Promise<CatalogoItem[]> {
  const db = await getDb();
  return db.getAllAsync<CatalogoItem>('SELECT * FROM tipos_comida ORDER BY id');
}

export async function listEtiquetasDieteticas(): Promise<CatalogoItem[]> {
  const db = await getDb();
  return db.getAllAsync<CatalogoItem>('SELECT * FROM etiquetas_dieteticas ORDER BY nombre');
}

import { getDb } from '../client';

export interface CategoriaTarea {
  id: number;
  nombre: string;
}

export async function listCategoriasTarea(): Promise<CategoriaTarea[]> {
  const db = await getDb();
  return db.getAllAsync<CategoriaTarea>('SELECT * FROM categorias_tarea ORDER BY nombre');
}

/** Busca una categoria de tarea por nombre (sin distinguir mayusculas) o la crea si no existe. */
export async function buscarOCrearCategoriaTarea(nombre: string): Promise<number> {
  const db = await getDb();
  const limpio = nombre.trim();
  const existente = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM categorias_tarea WHERE nombre = ? COLLATE NOCASE',
    limpio
  );
  if (existente) return existente.id;
  const result = await db.runAsync('INSERT INTO categorias_tarea (nombre) VALUES (?)', limpio);
  return result.lastInsertRowId;
}

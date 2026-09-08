import { getDb } from '../client';

export interface Marca {
  id: number;
  nombre: string;
}

export async function listMarcas(): Promise<Marca[]> {
  const db = await getDb();
  return db.getAllAsync<Marca>('SELECT * FROM marcas ORDER BY nombre');
}

/** Busca una marca por nombre (sin distinguir mayúsculas) o la crea si no existe. */
export async function buscarOCrearMarca(nombre: string): Promise<number> {
  const db = await getDb();
  const limpio = nombre.trim();
  const existente = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM marcas WHERE nombre = ? COLLATE NOCASE',
    limpio
  );
  if (existente) return existente.id;
  const result = await db.runAsync('INSERT INTO marcas (nombre) VALUES (?)', limpio);
  return result.lastInsertRowId;
}

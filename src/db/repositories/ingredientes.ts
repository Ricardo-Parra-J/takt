import { getDb } from '../client';
import { calcularInfoIncompleta, ValoresNutricionales } from '../nutricion';

export interface Ingrediente extends ValoresNutricionales {
  id: number;
  nombre: string;
  porcion_base_cantidad: number;
  porcion_base_unidad_id: number;
  info_incompleta: number; // 0 | 1
  creado_en: string;
  actualizado_en: string;
}

export interface DatosIngrediente extends ValoresNutricionales {
  nombre: string;
  porcion_base_cantidad: number;
  porcion_base_unidad_id: number;
}

export async function listIngredientes(busqueda = ''): Promise<Ingrediente[]> {
  const db = await getDb();
  if (busqueda.trim()) {
    return db.getAllAsync<Ingrediente>(
      'SELECT * FROM ingredientes WHERE nombre LIKE ? COLLATE NOCASE ORDER BY nombre',
      `%${busqueda.trim()}%`
    );
  }
  return db.getAllAsync<Ingrediente>('SELECT * FROM ingredientes ORDER BY nombre');
}

export async function getIngrediente(id: number): Promise<Ingrediente | null> {
  const db = await getDb();
  return db.getFirstAsync<Ingrediente>('SELECT * FROM ingredientes WHERE id = ?', id);
}

export async function crearIngrediente(datos: DatosIngrediente): Promise<number> {
  const db = await getDb();
  const infoIncompleta = calcularInfoIncompleta(datos) ? 1 : 0;
  const result = await db.runAsync(
    `INSERT INTO ingredientes
       (nombre, porcion_base_cantidad, porcion_base_unidad_id, calorias, proteinas_g, carbohidratos_g, grasas_g, fibra_g, azucares_g, sodio_mg, info_incompleta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    datos.nombre.trim(),
    datos.porcion_base_cantidad,
    datos.porcion_base_unidad_id,
    datos.calorias,
    datos.proteinas_g,
    datos.carbohidratos_g,
    datos.grasas_g,
    datos.fibra_g,
    datos.azucares_g,
    datos.sodio_mg,
    infoIncompleta
  );
  return result.lastInsertRowId;
}

export async function actualizarIngrediente(id: number, datos: DatosIngrediente): Promise<void> {
  const db = await getDb();
  const infoIncompleta = calcularInfoIncompleta(datos) ? 1 : 0;
  await db.runAsync(
    `UPDATE ingredientes SET
       nombre = ?, porcion_base_cantidad = ?, porcion_base_unidad_id = ?,
       calorias = ?, proteinas_g = ?, carbohidratos_g = ?, grasas_g = ?,
       fibra_g = ?, azucares_g = ?, sodio_mg = ?, info_incompleta = ?,
       actualizado_en = datetime('now')
     WHERE id = ?`,
    datos.nombre.trim(),
    datos.porcion_base_cantidad,
    datos.porcion_base_unidad_id,
    datos.calorias,
    datos.proteinas_g,
    datos.carbohidratos_g,
    datos.grasas_g,
    datos.fibra_g,
    datos.azucares_g,
    datos.sodio_mg,
    infoIncompleta,
    id
  );
}

export async function eliminarIngrediente(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM ingredientes WHERE id = ?', id);
}

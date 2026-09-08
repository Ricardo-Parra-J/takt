import { getDb } from '../client';
import { calcularInfoIncompleta, ValoresNutricionales } from '../nutricion';
import { buscarOCrearMarca } from './marcas';

export interface Producto extends ValoresNutricionales {
  id: number;
  nombre: string;
  marca_id: number | null;
  marca_nombre: string | null;
  porcion_base_cantidad: number;
  porcion_base_unidad_id: number;
  info_incompleta: number;
  creado_en: string;
  actualizado_en: string;
}

export interface DatosProducto extends ValoresNutricionales {
  nombre: string;
  marca: string; // nombre de la marca en texto; se resuelve a marca_id al guardar
  porcion_base_cantidad: number;
  porcion_base_unidad_id: number;
}

const SELECT_BASE = `
  SELECT p.*, m.nombre AS marca_nombre
  FROM productos p LEFT JOIN marcas m ON m.id = p.marca_id
`;

export async function listProductos(busqueda = ''): Promise<Producto[]> {
  const db = await getDb();
  if (busqueda.trim()) {
    return db.getAllAsync<Producto>(
      `${SELECT_BASE} WHERE p.nombre LIKE ? COLLATE NOCASE OR m.nombre LIKE ? COLLATE NOCASE ORDER BY p.nombre`,
      `%${busqueda.trim()}%`,
      `%${busqueda.trim()}%`
    );
  }
  return db.getAllAsync<Producto>(`${SELECT_BASE} ORDER BY p.nombre`);
}

export async function getProducto(id: number): Promise<Producto | null> {
  const db = await getDb();
  return db.getFirstAsync<Producto>(`${SELECT_BASE} WHERE p.id = ?`, id);
}

export async function crearProducto(datos: DatosProducto): Promise<number> {
  const db = await getDb();
  const marcaId = datos.marca.trim() ? await buscarOCrearMarca(datos.marca) : null;
  const infoIncompleta = calcularInfoIncompleta(datos) ? 1 : 0;
  const result = await db.runAsync(
    `INSERT INTO productos
       (nombre, marca_id, porcion_base_cantidad, porcion_base_unidad_id, calorias, proteinas_g, carbohidratos_g, grasas_g, fibra_g, azucares_g, sodio_mg, info_incompleta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    datos.nombre.trim(),
    marcaId,
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

export async function actualizarProducto(id: number, datos: DatosProducto): Promise<void> {
  const db = await getDb();
  const marcaId = datos.marca.trim() ? await buscarOCrearMarca(datos.marca) : null;
  const infoIncompleta = calcularInfoIncompleta(datos) ? 1 : 0;
  await db.runAsync(
    `UPDATE productos SET
       nombre = ?, marca_id = ?, porcion_base_cantidad = ?, porcion_base_unidad_id = ?,
       calorias = ?, proteinas_g = ?, carbohidratos_g = ?, grasas_g = ?,
       fibra_g = ?, azucares_g = ?, sodio_mg = ?, info_incompleta = ?,
       actualizado_en = datetime('now')
     WHERE id = ?`,
    datos.nombre.trim(),
    marcaId,
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

export async function eliminarProducto(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM productos WHERE id = ?', id);
}

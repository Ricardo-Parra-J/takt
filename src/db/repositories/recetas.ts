import { getDb } from '../client';

export interface Receta {
  id: number;
  nombre: string;
  porciones: number;
  instrucciones: string | null;
  favorita: number; // 0 | 1
  creado_en: string;
  actualizado_en: string;
}

export interface RecetaListItem extends Receta {
  tipos: string; // nombres de tipos de comida, separados por coma (para mostrar en la lista)
}

export interface RecetaIngredienteItem {
  ingrediente_id: number;
  nombre: string;
  cantidad: number;
  unidad_id: number;
  unidad_nombre: string;
}

export interface RecetaProductoItem {
  producto_id: number;
  nombre: string;
  cantidad: number;
  unidad_id: number;
  unidad_nombre: string;
}

export interface RecetaDetalle extends Receta {
  ingredientes: RecetaIngredienteItem[];
  productos: RecetaProductoItem[];
  tipoComidaIds: number[];
  etiquetaIds: number[];
}

export interface DatosReceta {
  nombre: string;
  porciones: number;
  instrucciones: string;
  favorita: boolean;
  ingredientes: { ingrediente_id: number; cantidad: number; unidad_id: number }[];
  productos: { producto_id: number; cantidad: number; unidad_id: number }[];
  tipoComidaIds: number[];
  etiquetaIds: number[];
}

export async function listRecetas(busqueda = ''): Promise<RecetaListItem[]> {
  const db = await getDb();
  const query = `
    SELECT r.*, COALESCE(GROUP_CONCAT(tc.nombre, ', '), '') AS tipos
    FROM recetas r
    LEFT JOIN receta_tipos_comida rtc ON rtc.receta_id = r.id
    LEFT JOIN tipos_comida tc ON tc.id = rtc.tipo_comida_id
    ${busqueda.trim() ? 'WHERE r.nombre LIKE ? COLLATE NOCASE' : ''}
    GROUP BY r.id
    ORDER BY r.favorita DESC, r.nombre
  `;
  if (busqueda.trim()) {
    return db.getAllAsync<RecetaListItem>(query, `%${busqueda.trim()}%`);
  }
  return db.getAllAsync<RecetaListItem>(query);
}

export async function getRecetaDetalle(id: number): Promise<RecetaDetalle | null> {
  const db = await getDb();
  const receta = await db.getFirstAsync<Receta>('SELECT * FROM recetas WHERE id = ?', id);
  if (!receta) return null;

  const ingredientes = await db.getAllAsync<RecetaIngredienteItem>(
    `SELECT ri.ingrediente_id, i.nombre, ri.cantidad, ri.unidad_id, u.nombre AS unidad_nombre
     FROM receta_ingredientes ri
     JOIN ingredientes i ON i.id = ri.ingrediente_id
     JOIN unidades_medida u ON u.id = ri.unidad_id
     WHERE ri.receta_id = ?`,
    id
  );
  const productos = await db.getAllAsync<RecetaProductoItem>(
    `SELECT rp.producto_id, p.nombre, rp.cantidad, rp.unidad_id, u.nombre AS unidad_nombre
     FROM receta_productos rp
     JOIN productos p ON p.id = rp.producto_id
     JOIN unidades_medida u ON u.id = rp.unidad_id
     WHERE rp.receta_id = ?`,
    id
  );
  const tipos = await db.getAllAsync<{ tipo_comida_id: number }>(
    'SELECT tipo_comida_id FROM receta_tipos_comida WHERE receta_id = ?',
    id
  );
  const etiquetas = await db.getAllAsync<{ etiqueta_id: number }>(
    'SELECT etiqueta_id FROM receta_etiquetas_dieteticas WHERE receta_id = ?',
    id
  );

  return {
    ...receta,
    ingredientes,
    productos,
    tipoComidaIds: tipos.map((t) => t.tipo_comida_id),
    etiquetaIds: etiquetas.map((e) => e.etiqueta_id),
  };
}

async function guardarRelaciones(db: Awaited<ReturnType<typeof getDb>>, recetaId: number, datos: DatosReceta) {
  await db.runAsync('DELETE FROM receta_ingredientes WHERE receta_id = ?', recetaId);
  for (const item of datos.ingredientes) {
    await db.runAsync(
      'INSERT INTO receta_ingredientes (receta_id, ingrediente_id, cantidad, unidad_id) VALUES (?, ?, ?, ?)',
      recetaId,
      item.ingrediente_id,
      item.cantidad,
      item.unidad_id
    );
  }

  await db.runAsync('DELETE FROM receta_productos WHERE receta_id = ?', recetaId);
  for (const item of datos.productos) {
    await db.runAsync(
      'INSERT INTO receta_productos (receta_id, producto_id, cantidad, unidad_id) VALUES (?, ?, ?, ?)',
      recetaId,
      item.producto_id,
      item.cantidad,
      item.unidad_id
    );
  }

  await db.runAsync('DELETE FROM receta_tipos_comida WHERE receta_id = ?', recetaId);
  for (const tipoId of datos.tipoComidaIds) {
    await db.runAsync('INSERT INTO receta_tipos_comida (receta_id, tipo_comida_id) VALUES (?, ?)', recetaId, tipoId);
  }

  await db.runAsync('DELETE FROM receta_etiquetas_dieteticas WHERE receta_id = ?', recetaId);
  for (const etiquetaId of datos.etiquetaIds) {
    await db.runAsync(
      'INSERT INTO receta_etiquetas_dieteticas (receta_id, etiqueta_id) VALUES (?, ?)',
      recetaId,
      etiquetaId
    );
  }
}

export async function crearReceta(datos: DatosReceta): Promise<number> {
  const db = await getDb();
  let nuevoId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      'INSERT INTO recetas (nombre, porciones, instrucciones, favorita) VALUES (?, ?, ?, ?)',
      datos.nombre.trim(),
      datos.porciones,
      datos.instrucciones.trim() || null,
      datos.favorita ? 1 : 0
    );
    nuevoId = result.lastInsertRowId;
    await guardarRelaciones(db, nuevoId, datos);
  });
  return nuevoId;
}

export async function actualizarReceta(id: number, datos: DatosReceta): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE recetas SET nombre = ?, porciones = ?, instrucciones = ?, favorita = ?, actualizado_en = datetime('now')
       WHERE id = ?`,
      datos.nombre.trim(),
      datos.porciones,
      datos.instrucciones.trim() || null,
      datos.favorita ? 1 : 0,
      id
    );
    await guardarRelaciones(db, id, datos);
  });
}

export async function eliminarReceta(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM recetas WHERE id = ?', id);
}

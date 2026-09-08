import { getDb } from '../client';

export interface ConfiguracionFinanzas {
  porcentaje_ahorro: number; // 0-100, aplicado sobre el total de ganancias recurrentes activas
  saldo_inicial: number;
  moneda: string;
}

export type TipoCategoriaFinanzas = 'gasto' | 'ganancia';

export interface CategoriaFinanzas {
  id: number;
  nombre: string;
  tipo: TipoCategoriaFinanzas;
}

export type TipoMovimiento = 'ganancia' | 'gasto';

export interface MovimientoFinanciero {
  id: number;
  tipo: TipoMovimiento;
  titulo: string;
  descripcion: string | null;
  monto: number;
  categoria_id: number | null;
  categoria_nombre: string | null;
  fecha: string; // 'YYYY-MM-DD'
  hora: string | null; // 'HH:MM'
  movimiento_recurrente_id: number | null;
  creado_en: string;
}

export interface DatosMovimiento {
  tipo: TipoMovimiento;
  titulo: string;
  descripcion: string;
  monto: number;
  categoria_id: number | null;
  fecha: string;
  hora: string;
}

export interface MovimientoRecurrente {
  id: number;
  tipo: TipoMovimiento;
  titulo: string;
  descripcion: string | null;
  monto: number;
  dia_cobro: number;
  categoria_id: number | null;
  categoria_nombre: string | null;
  activo: number; // 0 | 1
  creado_en: string;
}

export interface DatosMovimientoRecurrente {
  tipo: TipoMovimiento;
  titulo: string;
  descripcion: string;
  monto: number;
  dia_cobro: number;
  categoria_id: number | null;
}

export interface ResumenMes {
  ingresos: number;
  gastos: number;
  ahorroObjetivo: number;
  ahorroReal: number;
  disponible: number;
  porCategoriaGasto: { categoria: string; monto: number }[];
}

/** 'YYYY-MM-DD' en hora local. */
function fechaLocal(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'HH:MM' en hora local. */
export function horaLocal(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fechaLocalHoy(): string {
  return fechaLocal();
}

export function mesActualTexto(): string {
  return fechaLocal().slice(0, 7);
}

/** Formatea un monto como pesos chilenos: "$12.345" (sin decimales, punto como separador de miles). */
export function formatearMonto(monto: number): string {
  const signo = monto < 0 ? '-' : '';
  const entero = String(Math.round(Math.abs(monto)));
  const grupos: string[] = [];
  let resto = entero;
  while (resto.length > 3) {
    grupos.unshift(resto.slice(-3));
    resto = resto.slice(0, -3);
  }
  grupos.unshift(resto);
  return `${signo}$${grupos.join('.')}`;
}

export async function getConfiguracion(): Promise<ConfiguracionFinanzas> {
  const db = await getDb();
  const fila = await db.getFirstAsync<ConfiguracionFinanzas>(
    'SELECT porcentaje_ahorro, saldo_inicial, moneda FROM configuracion_finanzas WHERE id = 1'
  );
  if (fila) return fila;
  await db.runAsync('INSERT INTO configuracion_finanzas (id) VALUES (1)');
  return { porcentaje_ahorro: 0, saldo_inicial: 0, moneda: 'CLP' };
}

export async function actualizarConfiguracion(datos: ConfiguracionFinanzas): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE configuracion_finanzas SET porcentaje_ahorro = ?, saldo_inicial = ?, moneda = ? WHERE id = 1',
    datos.porcentaje_ahorro,
    datos.saldo_inicial,
    datos.moneda
  );
}

export async function listCategoriasFinanzas(tipo: TipoCategoriaFinanzas): Promise<CategoriaFinanzas[]> {
  const db = await getDb();
  return db.getAllAsync<CategoriaFinanzas>(
    'SELECT * FROM categorias_finanzas WHERE tipo = ? ORDER BY nombre',
    tipo
  );
}

export async function buscarOCrearCategoriaFinanzas(nombre: string, tipo: TipoCategoriaFinanzas): Promise<number> {
  const db = await getDb();
  const limpio = nombre.trim();
  const existente = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM categorias_finanzas WHERE nombre = ? COLLATE NOCASE AND tipo = ?',
    limpio,
    tipo
  );
  if (existente) return existente.id;
  const result = await db.runAsync('INSERT INTO categorias_finanzas (nombre, tipo) VALUES (?, ?)', limpio, tipo);
  return result.lastInsertRowId;
}

const SELECT_MOVIMIENTOS = `
  SELECT m.*, c.nombre AS categoria_nombre
  FROM movimientos_financieros m
  LEFT JOIN categorias_finanzas c ON c.id = m.categoria_id
`;

export async function listMovimientos(mes: string = mesActualTexto()): Promise<MovimientoFinanciero[]> {
  const db = await getDb();
  return db.getAllAsync<MovimientoFinanciero>(
    `${SELECT_MOVIMIENTOS} WHERE m.fecha LIKE ? ORDER BY m.fecha DESC, m.hora DESC, m.id DESC`,
    `${mes}%`
  );
}

export async function getMovimiento(id: number): Promise<MovimientoFinanciero | null> {
  const db = await getDb();
  return db.getFirstAsync<MovimientoFinanciero>(`${SELECT_MOVIMIENTOS} WHERE m.id = ?`, id);
}

export async function crearMovimiento(datos: DatosMovimiento): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO movimientos_financieros (tipo, titulo, descripcion, monto, categoria_id, fecha, hora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    datos.tipo,
    datos.titulo.trim(),
    datos.descripcion.trim() || null,
    datos.monto,
    datos.categoria_id,
    datos.fecha,
    datos.hora || null
  );
  return result.lastInsertRowId;
}

export async function actualizarMovimiento(id: number, datos: DatosMovimiento): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE movimientos_financieros SET tipo = ?, titulo = ?, descripcion = ?, monto = ?, categoria_id = ?, fecha = ?, hora = ?
     WHERE id = ?`,
    datos.tipo,
    datos.titulo.trim(),
    datos.descripcion.trim() || null,
    datos.monto,
    datos.categoria_id,
    datos.fecha,
    datos.hora || null,
    id
  );
}

export async function eliminarMovimiento(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM movimientos_financieros WHERE id = ?', id);
}

const SELECT_RECURRENTES = `
  SELECT r.*, c.nombre AS categoria_nombre
  FROM movimientos_recurrentes r
  LEFT JOIN categorias_finanzas c ON c.id = r.categoria_id
`;

export async function listMovimientosRecurrentes(): Promise<MovimientoRecurrente[]> {
  const db = await getDb();
  return db.getAllAsync<MovimientoRecurrente>(`${SELECT_RECURRENTES} ORDER BY r.tipo, r.dia_cobro`);
}

export async function getMovimientoRecurrente(id: number): Promise<MovimientoRecurrente | null> {
  const db = await getDb();
  return db.getFirstAsync<MovimientoRecurrente>(`${SELECT_RECURRENTES} WHERE r.id = ?`, id);
}

export async function crearMovimientoRecurrente(datos: DatosMovimientoRecurrente): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO movimientos_recurrentes (tipo, titulo, descripcion, monto, dia_cobro, categoria_id) VALUES (?, ?, ?, ?, ?, ?)',
    datos.tipo,
    datos.titulo.trim(),
    datos.descripcion.trim() || null,
    datos.monto,
    datos.dia_cobro,
    datos.categoria_id
  );
  return result.lastInsertRowId;
}

export async function actualizarMovimientoRecurrente(id: number, datos: DatosMovimientoRecurrente): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE movimientos_recurrentes SET tipo = ?, titulo = ?, descripcion = ?, monto = ?, dia_cobro = ?, categoria_id = ? WHERE id = ?',
    datos.tipo,
    datos.titulo.trim(),
    datos.descripcion.trim() || null,
    datos.monto,
    datos.dia_cobro,
    datos.categoria_id,
    id
  );
}

export async function alternarActivoMovimientoRecurrente(id: number, activo: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE movimientos_recurrentes SET activo = ? WHERE id = ?', activo ? 1 : 0, id);
}

export async function eliminarMovimientoRecurrente(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM movimientos_recurrentes WHERE id = ?', id);
}

/**
 * Revisa cada movimiento recurrente activo y genera su instancia del mes
 * actual (segun su dia de cobro) si todavia no existe. Se debe llamar al
 * entrar a Finanzas.
 */
export async function sincronizarMovimientosAutomaticos(): Promise<void> {
  const db = await getDb();
  const hoy = new Date();
  const mes = mesActualTexto();
  const diaHoy = hoy.getDate();
  const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();

  const recurrentes = await db.getAllAsync<MovimientoRecurrente>(
    'SELECT * FROM movimientos_recurrentes WHERE activo = 1'
  );
  for (const r of recurrentes) {
    const diaCobro = Math.min(r.dia_cobro, diasEnMes);
    if (diaHoy < diaCobro) continue;
    const yaExiste = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM movimientos_financieros WHERE movimiento_recurrente_id = ? AND fecha LIKE ? LIMIT 1`,
      r.id,
      `${mes}%`
    );
    if (yaExiste) continue;
    const fecha = `${mes}-${String(diaCobro).padStart(2, '0')}`;
    await db.runAsync(
      `INSERT INTO movimientos_financieros (tipo, titulo, descripcion, monto, categoria_id, fecha, movimiento_recurrente_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      r.tipo,
      r.titulo,
      r.descripcion,
      r.monto,
      r.categoria_id,
      fecha,
      r.id
    );
  }
}

export async function calcularSaldoTotal(): Promise<number> {
  const db = await getDb();
  const config = await getConfiguracion();
  const fila = await db.getFirstAsync<{ ingresos: number; egresos: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN tipo = 'ganancia' THEN monto ELSE 0 END), 0) AS ingresos,
       COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END), 0) AS egresos
     FROM movimientos_financieros`
  );
  return config.saldo_inicial + (fila?.ingresos ?? 0) - (fila?.egresos ?? 0);
}

export async function calcularResumenMes(mes: string = mesActualTexto()): Promise<ResumenMes> {
  const db = await getDb();
  const config = await getConfiguracion();
  const movimientos = await listMovimientos(mes);

  const filaRecurrentes = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(monto), 0) AS total FROM movimientos_recurrentes WHERE tipo = 'ganancia' AND activo = 1`
  );
  const gananciasRecurrentesActivas = filaRecurrentes?.total ?? 0;

  let ingresos = 0;
  let gastos = 0;
  const porCategoria = new Map<string, number>();

  for (const m of movimientos) {
    if (m.tipo === 'ganancia') {
      ingresos += m.monto;
    } else {
      gastos += m.monto;
      const nombre = m.categoria_nombre ?? 'Sin categoría';
      porCategoria.set(nombre, (porCategoria.get(nombre) ?? 0) + m.monto);
    }
  }

  const ahorroObjetivo = (config.porcentaje_ahorro / 100) * gananciasRecurrentesActivas;
  const ahorroReal = ingresos - gastos;
  const disponible = ingresos - ahorroObjetivo - gastos;
  const porCategoriaGasto = [...porCategoria.entries()]
    .map(([categoria, monto]) => ({ categoria, monto }))
    .sort((a, b) => b.monto - a.monto);

  return { ingresos, gastos, ahorroObjetivo, ahorroReal, disponible, porCategoriaGasto };
}

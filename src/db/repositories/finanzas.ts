import { getDb } from '../client';

export interface ConfiguracionFinanzas {
  sueldo_mensual: number;
  dia_pago: number; // 1-31
  porcentaje_ahorro: number; // 0-100
  saldo_inicial: number;
  moneda: string;
}

export type TipoCategoriaFinanzas = 'gasto' | 'ganancia';

export interface CategoriaFinanzas {
  id: number;
  nombre: string;
  tipo: TipoCategoriaFinanzas;
}

export type TipoMovimiento = 'sueldo' | 'ganancia' | 'gasto' | 'gasto_obligatorio';

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
  gasto_obligatorio_id: number | null;
  creado_en: string;
}

export interface DatosMovimiento {
  tipo: 'gasto' | 'ganancia';
  titulo: string;
  descripcion: string;
  monto: number;
  categoria_id: number | null;
  fecha: string;
  hora: string;
}

export interface GastoObligatorio {
  id: number;
  titulo: string;
  descripcion: string | null;
  monto: number;
  dia_cobro: number;
  categoria_id: number | null;
  categoria_nombre: string | null;
  activo: number; // 0 | 1
  creado_en: string;
}

export interface DatosGastoObligatorio {
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
  const fila = await db.getFirstAsync<ConfiguracionFinanzas>('SELECT * FROM configuracion_finanzas WHERE id = 1');
  if (fila) return fila;
  await db.runAsync('INSERT INTO configuracion_finanzas (id) VALUES (1)');
  return {
    sueldo_mensual: 0,
    dia_pago: 1,
    porcentaje_ahorro: 0,
    saldo_inicial: 0,
    moneda: 'CLP',
  };
}

export async function actualizarConfiguracion(datos: ConfiguracionFinanzas): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE configuracion_finanzas
     SET sueldo_mensual = ?, dia_pago = ?, porcentaje_ahorro = ?, saldo_inicial = ?, moneda = ?
     WHERE id = 1`,
    datos.sueldo_mensual,
    datos.dia_pago,
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

const SELECT_GASTOS_OBLIGATORIOS = `
  SELECT g.*, c.nombre AS categoria_nombre
  FROM gastos_obligatorios g
  LEFT JOIN categorias_finanzas c ON c.id = g.categoria_id
`;

export async function listGastosObligatorios(): Promise<GastoObligatorio[]> {
  const db = await getDb();
  return db.getAllAsync<GastoObligatorio>(`${SELECT_GASTOS_OBLIGATORIOS} ORDER BY g.dia_cobro`);
}

export async function getGastoObligatorio(id: number): Promise<GastoObligatorio | null> {
  const db = await getDb();
  return db.getFirstAsync<GastoObligatorio>(`${SELECT_GASTOS_OBLIGATORIOS} WHERE g.id = ?`, id);
}

export async function crearGastoObligatorio(datos: DatosGastoObligatorio): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO gastos_obligatorios (titulo, descripcion, monto, dia_cobro, categoria_id) VALUES (?, ?, ?, ?, ?)',
    datos.titulo.trim(),
    datos.descripcion.trim() || null,
    datos.monto,
    datos.dia_cobro,
    datos.categoria_id
  );
  return result.lastInsertRowId;
}

export async function actualizarGastoObligatorio(id: number, datos: DatosGastoObligatorio): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE gastos_obligatorios SET titulo = ?, descripcion = ?, monto = ?, dia_cobro = ?, categoria_id = ? WHERE id = ?',
    datos.titulo.trim(),
    datos.descripcion.trim() || null,
    datos.monto,
    datos.dia_cobro,
    datos.categoria_id,
    id
  );
}

export async function alternarActivoGastoObligatorio(id: number, activo: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE gastos_obligatorios SET activo = ? WHERE id = ?', activo ? 1 : 0, id);
}

export async function eliminarGastoObligatorio(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM gastos_obligatorios WHERE id = ?', id);
}

/**
 * Revisa si corresponde generar el movimiento del sueldo del mes y/o de algun
 * gasto obligatorio activo (segun su dia de cobro) y los crea si todavia no
 * existen para el mes actual. Se debe llamar al entrar a Finanzas.
 */
export async function sincronizarMovimientosAutomaticos(): Promise<void> {
  const db = await getDb();
  const hoy = new Date();
  const mes = mesActualTexto();
  const diaHoy = hoy.getDate();
  const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const config = await getConfiguracion();

  if (config.sueldo_mensual > 0) {
    const diaPago = Math.min(config.dia_pago, diasEnMes);
    if (diaHoy >= diaPago) {
      const yaExiste = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM movimientos_financieros WHERE tipo = 'sueldo' AND fecha LIKE ? LIMIT 1`,
        `${mes}%`
      );
      if (!yaExiste) {
        const fecha = `${mes}-${String(diaPago).padStart(2, '0')}`;
        await db.runAsync(
          `INSERT INTO movimientos_financieros (tipo, titulo, monto, fecha) VALUES ('sueldo', 'Sueldo', ?, ?)`,
          config.sueldo_mensual,
          fecha
        );
      }
    }
  }

  const obligatorios = await db.getAllAsync<GastoObligatorio>('SELECT * FROM gastos_obligatorios WHERE activo = 1');
  for (const g of obligatorios) {
    const diaCobro = Math.min(g.dia_cobro, diasEnMes);
    if (diaHoy < diaCobro) continue;
    const yaExiste = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM movimientos_financieros WHERE tipo = 'gasto_obligatorio' AND gasto_obligatorio_id = ? AND fecha LIKE ? LIMIT 1`,
      g.id,
      `${mes}%`
    );
    if (yaExiste) continue;
    const fecha = `${mes}-${String(diaCobro).padStart(2, '0')}`;
    await db.runAsync(
      `INSERT INTO movimientos_financieros (tipo, titulo, descripcion, monto, categoria_id, fecha, gasto_obligatorio_id)
       VALUES ('gasto_obligatorio', ?, ?, ?, ?, ?, ?)`,
      g.titulo,
      g.descripcion,
      g.monto,
      g.categoria_id,
      fecha,
      g.id
    );
  }
}

export async function calcularSaldoTotal(): Promise<number> {
  const db = await getDb();
  const config = await getConfiguracion();
  const fila = await db.getFirstAsync<{ ingresos: number; egresos: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN tipo IN ('sueldo', 'ganancia') THEN monto ELSE 0 END), 0) AS ingresos,
       COALESCE(SUM(CASE WHEN tipo IN ('gasto', 'gasto_obligatorio') THEN monto ELSE 0 END), 0) AS egresos
     FROM movimientos_financieros`
  );
  return config.saldo_inicial + (fila?.ingresos ?? 0) - (fila?.egresos ?? 0);
}

export async function calcularResumenMes(mes: string = mesActualTexto()): Promise<ResumenMes> {
  const config = await getConfiguracion();
  const movimientos = await listMovimientos(mes);

  let ingresos = 0;
  let gastos = 0;
  const porCategoria = new Map<string, number>();

  for (const m of movimientos) {
    if (m.tipo === 'sueldo' || m.tipo === 'ganancia') {
      ingresos += m.monto;
    } else {
      gastos += m.monto;
      const nombre = m.categoria_nombre ?? 'Sin categoría';
      porCategoria.set(nombre, (porCategoria.get(nombre) ?? 0) + m.monto);
    }
  }

  const ahorroObjetivo = (config.porcentaje_ahorro / 100) * config.sueldo_mensual;
  const ahorroReal = ingresos - gastos;
  const disponible = ingresos - ahorroObjetivo - gastos;
  const porCategoriaGasto = [...porCategoria.entries()]
    .map(([categoria, monto]) => ({ categoria, monto }))
    .sort((a, b) => b.monto - a.monto);

  return { ingresos, gastos, ahorroObjetivo, ahorroReal, disponible, porCategoriaGasto };
}

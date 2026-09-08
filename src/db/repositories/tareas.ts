import { getDb } from '../client';

export type Prioridad = 'alta' | 'media' | 'baja';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string | null;
  categoria_id: number | null;
  prioridad: Prioridad | null;
  fecha_plazo: string | null; // ISO 'YYYY-MM-DD HH:MM'
  recordatorio_dias_antes: number | null;
  es_meta_largo_plazo: number; // 0 | 1
  completada: number; // 0 | 1
  completada_en: string | null;
  creado_en: string;
}

export interface NuevaTarea {
  titulo: string;
  descripcion?: string;
  categoria_id?: number;
  prioridad?: Prioridad;
  fecha_plazo?: string;
  recordatorio_dias_antes?: number;
  es_meta_largo_plazo?: boolean;
}

export interface Subtarea {
  id: number;
  tarea_id: number;
  titulo: string;
  completada: number; // 0 | 1
  orden: number;
}

export interface DatosSubtarea {
  titulo: string;
  completada: boolean;
}

export interface DatosTarea {
  titulo: string;
  descripcion: string;
  categoria_id: number | null;
  prioridad: Prioridad | null;
  fecha_plazo: string | null; // 'YYYY-MM-DD HH:MM', null = sin plazo
  recordatorio_dias_antes: number | null;
  es_meta_largo_plazo: boolean;
  subtareas: DatosSubtarea[];
}

export interface TareaDetalle extends Tarea {
  subtareas: Subtarea[];
}

export type FiltroTareas = 'todas' | 'activas' | 'atrasadas' | 'completadas';

/**
 * 'YYYY-MM-DD HH:MM' en hora LOCAL del dispositivo (no UTC). fecha_plazo se
 * guarda siempre en este mismo formato (ver tarea-form.tsx), asi que hay que
 * comparar "ahora" de la misma forma -- si se usara toISOString() (UTC) el
 * calculo de "atrasada" quedaria desfasado por el huso horario local.
 */
export function formatearFechaHora(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * "Atrasada" no es un estado guardado: se calcula como una tarea activa
 * (completada = 0) que tiene plazo y ese plazo ya pasó. Ver FEATURES.md,
 * sección Tareas.
 */
export async function listTareas(filtro: FiltroTareas = 'todas'): Promise<Tarea[]> {
  const db = await getDb();
  const ahora = formatearFechaHora(new Date());

  switch (filtro) {
    case 'activas':
      return db.getAllAsync<Tarea>(
        'SELECT * FROM tareas WHERE completada = 0 ORDER BY (fecha_plazo IS NULL), fecha_plazo ASC'
      );
    case 'atrasadas':
      return db.getAllAsync<Tarea>(
        'SELECT * FROM tareas WHERE completada = 0 AND fecha_plazo IS NOT NULL AND fecha_plazo < ? ORDER BY fecha_plazo ASC',
        ahora
      );
    case 'completadas':
      return db.getAllAsync<Tarea>(
        'SELECT * FROM tareas WHERE completada = 1 ORDER BY completada_en DESC'
      );
    case 'todas':
    default:
      return db.getAllAsync<Tarea>(
        'SELECT * FROM tareas ORDER BY completada ASC, (fecha_plazo IS NULL), fecha_plazo ASC'
      );
  }
}

export async function getTareaDetalle(id: number): Promise<TareaDetalle | null> {
  const db = await getDb();
  const tarea = await db.getFirstAsync<Tarea>('SELECT * FROM tareas WHERE id = ?', id);
  if (!tarea) return null;
  const subtareas = await db.getAllAsync<Subtarea>(
    'SELECT * FROM subtareas WHERE tarea_id = ? ORDER BY orden',
    id
  );
  return { ...tarea, subtareas };
}

export async function crearTarea(nueva: NuevaTarea): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO tareas (titulo, descripcion, categoria_id, prioridad, fecha_plazo, recordatorio_dias_antes, es_meta_largo_plazo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    nueva.titulo,
    nueva.descripcion ?? null,
    nueva.categoria_id ?? null,
    nueva.prioridad ?? null,
    nueva.fecha_plazo ?? null,
    nueva.recordatorio_dias_antes ?? null,
    nueva.es_meta_largo_plazo ? 1 : 0
  );
  return result.lastInsertRowId;
}

async function guardarSubtareas(db: Awaited<ReturnType<typeof getDb>>, tareaId: number, subtareas: DatosSubtarea[]) {
  await db.runAsync('DELETE FROM subtareas WHERE tarea_id = ?', tareaId);
  for (let i = 0; i < subtareas.length; i++) {
    await db.runAsync(
      'INSERT INTO subtareas (tarea_id, titulo, completada, orden) VALUES (?, ?, ?, ?)',
      tareaId,
      subtareas[i].titulo.trim(),
      subtareas[i].completada ? 1 : 0,
      i
    );
  }
}

/** Crea una tarea con todos sus campos (formulario completo), incluidas sus subtareas. */
export async function crearTareaCompleta(datos: DatosTarea): Promise<number> {
  const db = await getDb();
  let nuevoId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO tareas (titulo, descripcion, categoria_id, prioridad, fecha_plazo, recordatorio_dias_antes, es_meta_largo_plazo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      datos.titulo.trim(),
      datos.descripcion.trim() || null,
      datos.categoria_id,
      datos.prioridad,
      datos.fecha_plazo,
      datos.recordatorio_dias_antes,
      datos.es_meta_largo_plazo ? 1 : 0
    );
    nuevoId = result.lastInsertRowId;
    await guardarSubtareas(db, nuevoId, datos.subtareas);
  });
  return nuevoId;
}

/** Actualiza todos los campos de una tarea existente (formulario completo), incluidas sus subtareas. */
export async function actualizarTareaCompleta(id: number, datos: DatosTarea): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE tareas SET titulo = ?, descripcion = ?, categoria_id = ?, prioridad = ?, fecha_plazo = ?,
         recordatorio_dias_antes = ?, es_meta_largo_plazo = ?
       WHERE id = ?`,
      datos.titulo.trim(),
      datos.descripcion.trim() || null,
      datos.categoria_id,
      datos.prioridad,
      datos.fecha_plazo,
      datos.recordatorio_dias_antes,
      datos.es_meta_largo_plazo ? 1 : 0,
      id
    );
    await guardarSubtareas(db, id, datos.subtareas);
  });
}

export async function marcarCompletada(id: number, completada: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE tareas SET completada = ?, completada_en = ? WHERE id = ?',
    completada ? 1 : 0,
    completada ? new Date().toISOString() : null,
    id
  );
}

export async function eliminarTarea(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM tareas WHERE id = ?', id);
}

/** true si la tarea está fuera de plazo (para pintarla en rojo en la UI). */
export function esAtrasada(tarea: Tarea): boolean {
  if (tarea.completada || !tarea.fecha_plazo) return false;
  return tarea.fecha_plazo < formatearFechaHora(new Date());
}

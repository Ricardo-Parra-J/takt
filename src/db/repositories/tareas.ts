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

export type FiltroTareas = 'todas' | 'activas' | 'atrasadas' | 'completadas';

/**
 * "Atrasada" no es un estado guardado: se calcula como una tarea activa
 * (completada = 0) que tiene plazo y ese plazo ya pasó. Ver FEATURES.md,
 * sección Tareas.
 */
export async function listTareas(filtro: FiltroTareas = 'todas'): Promise<Tarea[]> {
  const db = await getDb();
  const ahora = new Date().toISOString().slice(0, 16).replace('T', ' ');

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
  return tarea.fecha_plazo < new Date().toISOString().slice(0, 16).replace('T', ' ');
}

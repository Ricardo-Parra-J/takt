import { getDb } from '../client';

export type TipoEvento = 'clase' | 'gimnasio' | 'comida' | 'viaje' | 'estudio' | 'entrega' | 'certamen' | 'otro';
export type Frecuencia = 'diaria' | 'semanal' | 'mensual' | 'anual';

export interface RecurrenciaInfo {
  frecuencia: Frecuencia;
  intervalo: number; // cada cuantos dias/semanas/meses/anios
  fecha_fin: string | null; // 'YYYY-MM-DD', null = indefinida
  dias_semana: number[]; // solo si frecuencia === 'semanal'; 0=lunes .. 6=domingo
}

export interface EventoCalendario {
  id: number;
  titulo: string;
  tipo: TipoEvento;
  fecha: string; // 'YYYY-MM-DD' -- fecha del evento, o fecha ancla si es recurrente
  hora_inicio: string | null; // 'HH:MM'
  hora_fin: string | null;
  todo_el_dia: number; // 0 | 1
  notas: string | null;
  recurrencia_id: number | null;
  tipo_comida_id: number | null; // solo si tipo === 'comida'
  tipo_comida_nombre: string | null;
  receta_id: number | null; // receta asignada al bloque de comida
  receta_nombre: string | null;
  preset_rutina_id: number | null; // rutina planificada si tipo === 'gimnasio'
  preset_rutina_nombre: string | null;
  sesion_entrenamiento_id: number | null; // sesion real ya registrada para este evento
  tarea_id: number | null; // si viene de una entrega/certamen
  tarea_titulo: string | null;
  completado: number; // 0 | 1 -- solo tiene sentido para eventos no recurrentes
  creado_en: string;
}

export interface EventoDetalle extends EventoCalendario {
  recurrencia: RecurrenciaInfo | null;
}

/** Un evento del dia calculado para mostrar en la agenda: puede ser una fila real o una ocurrencia virtual de un evento recurrente. */
export interface EventoDelDia extends EventoCalendario {
  esRecurrente: boolean;
}

export interface DatosEvento {
  titulo: string;
  tipo: TipoEvento;
  fecha: string;
  todo_el_dia: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
  notas: string;
  recurrencia: RecurrenciaInfo | null;
  tipo_comida_id: number | null;
  receta_id: number | null;
  preset_rutina_id: number | null;
  tarea_id: number | null;
}

const TIPOS_EVENTO: { key: TipoEvento; label: string; icono: string }[] = [
  { key: 'clase', label: 'Clase', icono: 'school-outline' },
  { key: 'gimnasio', label: 'Gimnasio', icono: 'barbell-outline' },
  { key: 'comida', label: 'Comida', icono: 'restaurant-outline' },
  { key: 'viaje', label: 'Viaje', icono: 'airplane-outline' },
  { key: 'estudio', label: 'Estudio', icono: 'book-outline' },
  { key: 'entrega', label: 'Entrega', icono: 'document-text-outline' },
  { key: 'certamen', label: 'Certamen', icono: 'school-outline' },
  { key: 'otro', label: 'Otro', icono: 'ellipse-outline' },
];
export { TIPOS_EVENTO };

const FRECUENCIAS: { key: Frecuencia; label: string; unidad: string }[] = [
  { key: 'diaria', label: 'Diaria', unidad: 'día(s)' },
  { key: 'semanal', label: 'Semanal', unidad: 'semana(s)' },
  { key: 'mensual', label: 'Mensual', unidad: 'mes(es)' },
  { key: 'anual', label: 'Anual', unidad: 'año(s)' },
];
export { FRECUENCIAS };

/** 'YYYY-MM-DD' en hora local, sin desfase de zona horaria. */
export function fechaLocal(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'HH:MM' en hora local. */
export function horaLocal(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseFechaISO(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/** Suma (o resta, con n negativo) `n` dias a una fecha 'YYYY-MM-DD'. */
export function sumarDias(fecha: string, n: number): string {
  const d = parseFechaISO(fecha);
  d.setDate(d.getDate() + n);
  return fechaLocal(d);
}

/** Las 7 fechas ('YYYY-MM-DD') de la semana (lunes a domingo) que contiene `fecha`. */
export function diasDeLaSemana(fecha: string): string[] {
  const lunes = lunesDeSemana(parseFechaISO(fecha));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return fechaLocal(d);
  });
}

/** El dia 1 del mes que contiene `fecha`, ej. '2026-09-15' -> '2026-09-01'. */
export function primerDiaMes(fecha: string): string {
  const [anio, mes] = fecha.split('-').map(Number);
  return `${anio}-${String(mes).padStart(2, '0')}-01`;
}

/** Suma (o resta) `n` meses a `mesISO` (se espera dia 01), devuelve el dia 01 del mes resultante. */
export function sumarMeses(mesISO: string, n: number): string {
  const [anio, mes] = mesISO.split('-').map(Number);
  return fechaLocal(new Date(anio, mes - 1 + n, 1));
}

/**
 * Todas las fechas ('YYYY-MM-DD') de la grilla mensual tipo calendario para
 * el mes de `mesISO` (dia 01): desde el lunes de la semana que contiene el
 * dia 1, hasta el domingo de la semana que contiene el ultimo dia del mes.
 * Siempre resulta en un multiplo de 7 fechas (5 o 6 semanas completas).
 */
export function grillaMensual(mesISO: string): string[] {
  const [anio, mes] = mesISO.split('-').map(Number);
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);
  const inicio = lunesDeSemana(primerDia);
  const fin = new Date(ultimoDia);
  fin.setDate(ultimoDia.getDate() + (6 - diaSemanaISO(ultimoDia)));

  const dias: string[] = [];
  const cursor = new Date(inicio);
  while (cursor.getTime() <= fin.getTime()) {
    dias.push(fechaLocal(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

function diasEnMes(anio: number, mesIndice0: number): number {
  return new Date(anio, mesIndice0 + 1, 0).getDate();
}

/** 0=lunes .. 6=domingo (a diferencia de Date.getDay(), que usa 0=domingo). */
function diaSemanaISO(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function lunesDeSemana(d: Date): Date {
  const dia = diaSemanaISO(d);
  const resultado = new Date(d);
  resultado.setDate(d.getDate() - dia);
  return resultado;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Determina si un evento recurrente (con fecha ancla `fechaBase` y config
 * `recurrencia`) tiene una ocurrencia en `fechaConsulta`. Algoritmo validado
 * con simulacion en Python (casos: diaria/semanal/mensual/anual, distintos
 * intervalos, clamping de dia de mes y 29 de febrero, y fecha_fin).
 */
export function ocurreEnFecha(fechaBase: string, recurrencia: RecurrenciaInfo, fechaConsulta: string): boolean {
  if (fechaConsulta < fechaBase) return false;
  if (recurrencia.fecha_fin && fechaConsulta > recurrencia.fecha_fin) return false;

  const base = parseFechaISO(fechaBase);
  const consulta = parseFechaISO(fechaConsulta);
  const intervalo = Math.max(1, recurrencia.intervalo);

  switch (recurrencia.frecuencia) {
    case 'diaria': {
      const diff = Math.round((consulta.getTime() - base.getTime()) / MS_POR_DIA);
      return diff % intervalo === 0;
    }
    case 'semanal': {
      if (!recurrencia.dias_semana.includes(diaSemanaISO(consulta))) return false;
      const lunesBase = lunesDeSemana(base);
      const lunesConsulta = lunesDeSemana(consulta);
      const diffSemanas = Math.round((lunesConsulta.getTime() - lunesBase.getTime()) / (7 * MS_POR_DIA));
      return diffSemanas % intervalo === 0;
    }
    case 'mensual': {
      const diffMeses = (consulta.getFullYear() - base.getFullYear()) * 12 + (consulta.getMonth() - base.getMonth());
      if (diffMeses < 0 || diffMeses % intervalo !== 0) return false;
      const diaEsperado = Math.min(base.getDate(), diasEnMes(consulta.getFullYear(), consulta.getMonth()));
      return consulta.getDate() === diaEsperado;
    }
    case 'anual': {
      const diffAnios = consulta.getFullYear() - base.getFullYear();
      if (diffAnios < 0 || diffAnios % intervalo !== 0) return false;
      const diaEsperado = Math.min(base.getDate(), diasEnMes(consulta.getFullYear(), base.getMonth()));
      return consulta.getMonth() === base.getMonth() && consulta.getDate() === diaEsperado;
    }
    default:
      return false;
  }
}

async function guardarRecurrencia(
  db: Awaited<ReturnType<typeof getDb>>,
  recurrenciaIdActual: number | null,
  recurrencia: RecurrenciaInfo | null
): Promise<number | null> {
  if (!recurrencia) {
    if (recurrenciaIdActual) {
      await db.runAsync('DELETE FROM recurrencias WHERE id = ?', recurrenciaIdActual);
    }
    return null;
  }

  let recurrenciaId = recurrenciaIdActual;
  if (recurrenciaId) {
    await db.runAsync(
      'UPDATE recurrencias SET frecuencia = ?, intervalo = ?, fecha_fin = ? WHERE id = ?',
      recurrencia.frecuencia,
      recurrencia.intervalo,
      recurrencia.fecha_fin,
      recurrenciaId
    );
    await db.runAsync('DELETE FROM recurrencia_dias_semana WHERE recurrencia_id = ?', recurrenciaId);
  } else {
    const result = await db.runAsync(
      'INSERT INTO recurrencias (frecuencia, intervalo, fecha_fin) VALUES (?, ?, ?)',
      recurrencia.frecuencia,
      recurrencia.intervalo,
      recurrencia.fecha_fin
    );
    recurrenciaId = result.lastInsertRowId;
  }

  if (recurrencia.frecuencia === 'semanal') {
    for (const dia of recurrencia.dias_semana) {
      await db.runAsync('INSERT INTO recurrencia_dias_semana (recurrencia_id, dia_semana) VALUES (?, ?)', recurrenciaId, dia);
    }
  }
  return recurrenciaId;
}

export async function crearEvento(datos: DatosEvento): Promise<number> {
  const db = await getDb();
  let nuevoId = 0;
  await db.withTransactionAsync(async () => {
    const recurrenciaId = await guardarRecurrencia(db, null, datos.recurrencia);
    const result = await db.runAsync(
      `INSERT INTO eventos_calendario
         (titulo, tipo, fecha, hora_inicio, hora_fin, todo_el_dia, notas, recurrencia_id, tipo_comida_id, receta_id, preset_rutina_id, tarea_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      datos.titulo.trim(),
      datos.tipo,
      datos.fecha,
      datos.todo_el_dia ? null : datos.hora_inicio,
      datos.todo_el_dia ? null : datos.hora_fin,
      datos.todo_el_dia ? 1 : 0,
      datos.notas.trim() || null,
      recurrenciaId,
      datos.tipo_comida_id,
      datos.receta_id,
      datos.preset_rutina_id,
      datos.tarea_id
    );
    nuevoId = result.lastInsertRowId;
  });
  return nuevoId;
}

export async function actualizarEvento(id: number, datos: DatosEvento): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const actual = await db.getFirstAsync<{ recurrencia_id: number | null }>(
      'SELECT recurrencia_id FROM eventos_calendario WHERE id = ?',
      id
    );
    const recurrenciaId = await guardarRecurrencia(db, actual?.recurrencia_id ?? null, datos.recurrencia);
    await db.runAsync(
      `UPDATE eventos_calendario SET
         titulo = ?, tipo = ?, fecha = ?, hora_inicio = ?, hora_fin = ?, todo_el_dia = ?, notas = ?, recurrencia_id = ?,
         tipo_comida_id = ?, receta_id = ?, preset_rutina_id = ?, tarea_id = ?
       WHERE id = ?`,
      datos.titulo.trim(),
      datos.tipo,
      datos.fecha,
      datos.todo_el_dia ? null : datos.hora_inicio,
      datos.todo_el_dia ? null : datos.hora_fin,
      datos.todo_el_dia ? 1 : 0,
      datos.notas.trim() || null,
      recurrenciaId,
      datos.tipo_comida_id,
      datos.receta_id,
      datos.preset_rutina_id,
      datos.tarea_id,
      id
    );
  });
}

export async function marcarCompletado(id: number, completado: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE eventos_calendario SET completado = ? WHERE id = ?', completado ? 1 : 0, id);
}

/**
 * Vincula una sesion de entrenamiento ya guardada con el evento de
 * calendario que la origino (ambos lados de la relacion: el evento sabe
 * que sesion lo cumplio, y la sesion sabe de que evento vino), y marca el
 * evento como completado.
 */
export async function vincularSesionAEvento(eventoId: number, sesionId: number): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE eventos_calendario SET sesion_entrenamiento_id = ?, completado = 1 WHERE id = ?',
      sesionId,
      eventoId
    );
    await db.runAsync('UPDATE sesiones_entrenamiento SET evento_calendario_id = ? WHERE id = ?', eventoId, sesionId);
  });
}

export async function eliminarEvento(id: number): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const actual = await db.getFirstAsync<{ recurrencia_id: number | null }>(
      'SELECT recurrencia_id FROM eventos_calendario WHERE id = ?',
      id
    );
    // Ninguna sesion de entrenamiento puede quedar apuntando a un evento borrado.
    await db.runAsync('UPDATE sesiones_entrenamiento SET evento_calendario_id = NULL WHERE evento_calendario_id = ?', id);
    await db.runAsync('DELETE FROM eventos_calendario WHERE id = ?', id);
    if (actual?.recurrencia_id) {
      await db.runAsync('DELETE FROM recurrencias WHERE id = ?', actual.recurrencia_id);
    }
  });
}

const SELECT_EVENTOS = `
  SELECT e.*,
    tc.nombre AS tipo_comida_nombre,
    r.nombre AS receta_nombre,
    pr.nombre AS preset_rutina_nombre,
    t.titulo AS tarea_titulo
  FROM eventos_calendario e
  LEFT JOIN tipos_comida tc ON tc.id = e.tipo_comida_id
  LEFT JOIN recetas r ON r.id = e.receta_id
  LEFT JOIN presets_rutina pr ON pr.id = e.preset_rutina_id
  LEFT JOIN tareas t ON t.id = e.tarea_id
`;

export async function getEventoDetalle(id: number): Promise<EventoDetalle | null> {
  const db = await getDb();
  const evento = await db.getFirstAsync<EventoCalendario>(`${SELECT_EVENTOS} WHERE e.id = ?`, id);
  if (!evento) return null;

  let recurrencia: RecurrenciaInfo | null = null;
  if (evento.recurrencia_id) {
    const rec = await db.getFirstAsync<{ frecuencia: Frecuencia; intervalo: number; fecha_fin: string | null }>(
      'SELECT frecuencia, intervalo, fecha_fin FROM recurrencias WHERE id = ?',
      evento.recurrencia_id
    );
    if (rec) {
      const dias = await db.getAllAsync<{ dia_semana: number }>(
        'SELECT dia_semana FROM recurrencia_dias_semana WHERE recurrencia_id = ? ORDER BY dia_semana',
        evento.recurrencia_id
      );
      recurrencia = { ...rec, dias_semana: dias.map((d) => d.dia_semana) };
    }
  }

  return { ...evento, recurrencia };
}

function compararEventosDelDia(a: EventoDelDia, b: EventoDelDia): number {
  if (a.todo_el_dia !== b.todo_el_dia) return b.todo_el_dia - a.todo_el_dia;
  return (a.hora_inicio ?? '99:99').localeCompare(b.hora_inicio ?? '99:99');
}

/**
 * Todos los eventos entre `fechaInicio` y `fechaFin` (ambas inclusive),
 * agrupados por fecha: filas reales de esos dias + ocurrencias virtuales de
 * eventos recurrentes (calculadas dia por dia con `ocurreEnFecha`). Pensado
 * para la vista semanal/mensual, que necesitan varios dias de una vez sin
 * repetir la consulta de recurrentes por cada uno.
 */
export async function listEventosRango(fechaInicio: string, fechaFin: string): Promise<Record<string, EventoDelDia[]>> {
  const db = await getDb();
  const resultado: Record<string, EventoDelDia[]> = {};

  const eventosDelRango = await db.getAllAsync<EventoCalendario>(
    `${SELECT_EVENTOS} WHERE e.recurrencia_id IS NULL AND e.fecha BETWEEN ? AND ?`,
    fechaInicio,
    fechaFin
  );
  for (const e of eventosDelRango) {
    (resultado[e.fecha] ??= []).push({ ...e, esRecurrente: false });
  }

  const eventosRecurrentes = await db.getAllAsync<EventoCalendario>(
    `${SELECT_EVENTOS} WHERE e.recurrencia_id IS NOT NULL`
  );
  const recurrenciasPorId = new Map<number, RecurrenciaInfo>();
  for (const evento of eventosRecurrentes) {
    if (!evento.recurrencia_id) continue;
    let recurrencia = recurrenciasPorId.get(evento.recurrencia_id);
    if (!recurrencia) {
      const rec = await db.getFirstAsync<{ frecuencia: Frecuencia; intervalo: number; fecha_fin: string | null }>(
        'SELECT frecuencia, intervalo, fecha_fin FROM recurrencias WHERE id = ?',
        evento.recurrencia_id
      );
      if (!rec) continue;
      const dias = await db.getAllAsync<{ dia_semana: number }>(
        'SELECT dia_semana FROM recurrencia_dias_semana WHERE recurrencia_id = ?',
        evento.recurrencia_id
      );
      recurrencia = { ...rec, dias_semana: dias.map((d) => d.dia_semana) };
      recurrenciasPorId.set(evento.recurrencia_id, recurrencia);
    }
    let cursor = fechaInicio;
    while (cursor <= fechaFin) {
      if (ocurreEnFecha(evento.fecha, recurrencia, cursor)) {
        (resultado[cursor] ??= []).push({ ...evento, fecha: cursor, esRecurrente: true });
      }
      cursor = sumarDias(cursor, 1);
    }
  }

  for (const fecha of Object.keys(resultado)) {
    resultado[fecha].sort(compararEventosDelDia);
  }
  return resultado;
}

/** Todos los eventos del dia `fecha`: filas reales de ese dia + ocurrencias virtuales de eventos recurrentes. */
export async function listEventosDia(fecha: string): Promise<EventoDelDia[]> {
  const rango = await listEventosRango(fecha, fecha);
  return rango[fecha] ?? [];
}

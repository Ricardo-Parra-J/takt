import { getDb } from '../client';

export interface GrupoMuscular {
  id: number;
  nombre: string;
}

export async function listGruposMusculares(): Promise<GrupoMuscular[]> {
  const db = await getDb();
  return db.getAllAsync<GrupoMuscular>('SELECT * FROM grupos_musculares ORDER BY nombre');
}

export async function buscarOCrearGrupoMuscular(nombre: string): Promise<number> {
  const db = await getDb();
  const limpio = nombre.trim();
  const existente = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM grupos_musculares WHERE nombre = ? COLLATE NOCASE',
    limpio
  );
  if (existente) return existente.id;
  const result = await db.runAsync('INSERT INTO grupos_musculares (nombre) VALUES (?)', limpio);
  return result.lastInsertRowId;
}

export interface Ejercicio {
  id: number;
  nombre: string;
  grupo_muscular_id: number | null;
  grupo_muscular_nombre: string | null;
  ultimo_peso: number | null;
  ultimas_repeticiones: number | null;
  ultima_fecha_uso: string | null;
  creado_en: string;
}

export interface DatosEjercicio {
  nombre: string;
  grupo_muscular_id: number | null;
}

const SELECT_EJERCICIOS = `
  SELECT e.*, g.nombre AS grupo_muscular_nombre
  FROM ejercicios e LEFT JOIN grupos_musculares g ON g.id = e.grupo_muscular_id
`;

export async function listEjercicios(busqueda = '', grupoMuscularId: number | null = null): Promise<Ejercicio[]> {
  const db = await getDb();
  const texto = busqueda.trim();
  if (texto && grupoMuscularId != null) {
    return db.getAllAsync<Ejercicio>(
      `${SELECT_EJERCICIOS} WHERE e.nombre LIKE ? COLLATE NOCASE AND e.grupo_muscular_id = ? ORDER BY e.nombre`,
      `%${texto}%`,
      grupoMuscularId
    );
  }
  if (texto) {
    return db.getAllAsync<Ejercicio>(`${SELECT_EJERCICIOS} WHERE e.nombre LIKE ? COLLATE NOCASE ORDER BY e.nombre`, `%${texto}%`);
  }
  if (grupoMuscularId != null) {
    return db.getAllAsync<Ejercicio>(`${SELECT_EJERCICIOS} WHERE e.grupo_muscular_id = ? ORDER BY e.nombre`, grupoMuscularId);
  }
  return db.getAllAsync<Ejercicio>(`${SELECT_EJERCICIOS} ORDER BY e.nombre`);
}

export async function getEjercicio(id: number): Promise<Ejercicio | null> {
  const db = await getDb();
  return db.getFirstAsync<Ejercicio>(`${SELECT_EJERCICIOS} WHERE e.id = ?`, id);
}

export async function crearEjercicio(datos: DatosEjercicio): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO ejercicios (nombre, grupo_muscular_id) VALUES (?, ?)',
    datos.nombre.trim(),
    datos.grupo_muscular_id
  );
  return result.lastInsertRowId;
}

export async function actualizarEjercicio(id: number, datos: DatosEjercicio): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE ejercicios SET nombre = ?, grupo_muscular_id = ? WHERE id = ?',
    datos.nombre.trim(),
    datos.grupo_muscular_id,
    id
  );
}

export async function eliminarEjercicio(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM ejercicios WHERE id = ?', id);
}

export interface PresetRutina {
  id: number;
  nombre: string;
  creado_en: string;
}

export interface PresetEjercicioItem {
  id: number;
  ejercicio_id: number;
  ejercicio_nombre: string;
  orden: number;
  series_objetivo: number | null;
  repeticiones_objetivo: number | null;
  peso_objetivo: number | null;
}

export interface DatosPresetEjercicio {
  ejercicio_id: number;
  series_objetivo: number | null;
  repeticiones_objetivo: number | null;
  peso_objetivo: number | null;
}

export interface PresetDetalle extends PresetRutina {
  ejercicios: PresetEjercicioItem[];
}

export interface DatosPreset {
  nombre: string;
  ejercicios: DatosPresetEjercicio[];
}

export async function listPresets(): Promise<PresetRutina[]> {
  const db = await getDb();
  return db.getAllAsync<PresetRutina>('SELECT * FROM presets_rutina ORDER BY nombre');
}

async function guardarEjerciciosPreset(
  db: Awaited<ReturnType<typeof getDb>>,
  presetId: number,
  ejercicios: DatosPresetEjercicio[]
) {
  await db.runAsync('DELETE FROM preset_ejercicios WHERE preset_id = ?', presetId);
  for (let i = 0; i < ejercicios.length; i++) {
    const ej = ejercicios[i];
    await db.runAsync(
      'INSERT INTO preset_ejercicios (preset_id, ejercicio_id, orden, series_objetivo, repeticiones_objetivo, peso_objetivo) VALUES (?, ?, ?, ?, ?, ?)',
      presetId,
      ej.ejercicio_id,
      i,
      ej.series_objetivo,
      ej.repeticiones_objetivo,
      ej.peso_objetivo
    );
  }
}

export async function crearPreset(datos: DatosPreset): Promise<number> {
  const db = await getDb();
  let nuevoId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync('INSERT INTO presets_rutina (nombre) VALUES (?)', datos.nombre.trim());
    nuevoId = result.lastInsertRowId;
    await guardarEjerciciosPreset(db, nuevoId, datos.ejercicios);
  });
  return nuevoId;
}

export async function actualizarPreset(id: number, datos: DatosPreset): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE presets_rutina SET nombre = ? WHERE id = ?', datos.nombre.trim(), id);
    await guardarEjerciciosPreset(db, id, datos.ejercicios);
  });
}

export async function getPresetDetalle(id: number): Promise<PresetDetalle | null> {
  const db = await getDb();
  const preset = await db.getFirstAsync<PresetRutina>('SELECT * FROM presets_rutina WHERE id = ?', id);
  if (!preset) return null;
  const ejercicios = await db.getAllAsync<PresetEjercicioItem>(
    `SELECT pe.id, pe.ejercicio_id, e.nombre AS ejercicio_nombre, pe.orden, pe.series_objetivo, pe.repeticiones_objetivo, pe.peso_objetivo
     FROM preset_ejercicios pe JOIN ejercicios e ON e.id = pe.ejercicio_id
     WHERE pe.preset_id = ? ORDER BY pe.orden`,
    id
  );
  return { ...preset, ejercicios };
}

export async function eliminarPreset(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM presets_rutina WHERE id = ?', id);
}

export interface SesionEntrenamiento {
  id: number;
  nombre: string;
  preset_id: number | null;
  preset_nombre: string | null;
  fecha: string; // 'YYYY-MM-DD'
  hora_inicio: string | null; // 'HH:MM'
  duracion_minutos: number | null;
  creado_en: string;
}

export interface SerieRegistrada {
  numero_serie: number;
  repeticiones: number | null;
  peso: number | null;
}

export interface SesionEjercicioItem {
  id: number;
  ejercicio_id: number;
  ejercicio_nombre: string;
  orden: number;
  series: SerieRegistrada[];
}

export interface SesionDetalle extends SesionEntrenamiento {
  ejercicios: SesionEjercicioItem[];
}

export interface DatosSerie {
  repeticiones: number | null;
  peso: number | null;
}

export interface DatosSesionEjercicio {
  ejercicio_id: number;
  series: DatosSerie[];
}

export interface DatosSesion {
  nombre: string;
  preset_id: number | null;
  fecha: string;
  hora_inicio: string | null;
  duracion_minutos: number | null;
  ejercicios: DatosSesionEjercicio[];
}

const SELECT_SESIONES = `
  SELECT s.*, p.nombre AS preset_nombre
  FROM sesiones_entrenamiento s LEFT JOIN presets_rutina p ON p.id = s.preset_id
`;

export async function listSesiones(): Promise<SesionEntrenamiento[]> {
  const db = await getDb();
  return db.getAllAsync<SesionEntrenamiento>(`${SELECT_SESIONES} ORDER BY s.fecha DESC, s.id DESC`);
}

/**
 * Guarda los ejercicios y series de una sesion (borra y reinserta, igual que
 * las subtareas de Tareas), y actualiza en `ejercicios` el ultimo peso y
 * repeticiones usados con la ULTIMA serie cargada de cada ejercicio -- es lo
 * que se sugiere la proxima vez que se agregue ese ejercicio a una sesion.
 */
async function guardarEjerciciosSesion(
  db: Awaited<ReturnType<typeof getDb>>,
  sesionId: number,
  fecha: string,
  ejercicios: DatosSesionEjercicio[]
) {
  await db.runAsync('DELETE FROM sesion_ejercicios WHERE sesion_id = ?', sesionId);
  for (let i = 0; i < ejercicios.length; i++) {
    const ej = ejercicios[i];
    const result = await db.runAsync(
      'INSERT INTO sesion_ejercicios (sesion_id, ejercicio_id, orden) VALUES (?, ?, ?)',
      sesionId,
      ej.ejercicio_id,
      i
    );
    const sesionEjercicioId = result.lastInsertRowId;
    for (let s = 0; s < ej.series.length; s++) {
      const serie = ej.series[s];
      await db.runAsync(
        'INSERT INTO sesion_series (sesion_ejercicio_id, numero_serie, repeticiones, peso) VALUES (?, ?, ?, ?)',
        sesionEjercicioId,
        s + 1,
        serie.repeticiones,
        serie.peso
      );
    }
    const ultimaSerie = ej.series[ej.series.length - 1];
    if (ultimaSerie && (ultimaSerie.peso != null || ultimaSerie.repeticiones != null)) {
      await db.runAsync(
        'UPDATE ejercicios SET ultimo_peso = ?, ultimas_repeticiones = ?, ultima_fecha_uso = ? WHERE id = ?',
        ultimaSerie.peso,
        ultimaSerie.repeticiones,
        fecha,
        ej.ejercicio_id
      );
    }
  }
}

export async function crearSesionCompleta(datos: DatosSesion): Promise<number> {
  const db = await getDb();
  let nuevoId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      'INSERT INTO sesiones_entrenamiento (nombre, preset_id, fecha, hora_inicio, duracion_minutos) VALUES (?, ?, ?, ?, ?)',
      datos.nombre.trim(),
      datos.preset_id,
      datos.fecha,
      datos.hora_inicio,
      datos.duracion_minutos
    );
    nuevoId = result.lastInsertRowId;
    await guardarEjerciciosSesion(db, nuevoId, datos.fecha, datos.ejercicios);
  });
  return nuevoId;
}

export async function actualizarSesionCompleta(id: number, datos: DatosSesion): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE sesiones_entrenamiento SET nombre = ?, preset_id = ?, fecha = ?, hora_inicio = ?, duracion_minutos = ? WHERE id = ?',
      datos.nombre.trim(),
      datos.preset_id,
      datos.fecha,
      datos.hora_inicio,
      datos.duracion_minutos,
      id
    );
    await guardarEjerciciosSesion(db, id, datos.fecha, datos.ejercicios);
  });
}

export async function getSesionDetalle(id: number): Promise<SesionDetalle | null> {
  const db = await getDb();
  const sesion = await db.getFirstAsync<SesionEntrenamiento>(`${SELECT_SESIONES} WHERE s.id = ?`, id);
  if (!sesion) return null;

  const ejerciciosRaw = await db.getAllAsync<{ id: number; ejercicio_id: number; ejercicio_nombre: string; orden: number }>(
    `SELECT se.id, se.ejercicio_id, e.nombre AS ejercicio_nombre, se.orden
     FROM sesion_ejercicios se JOIN ejercicios e ON e.id = se.ejercicio_id
     WHERE se.sesion_id = ? ORDER BY se.orden`,
    id
  );

  const ejercicios: SesionEjercicioItem[] = [];
  for (const ej of ejerciciosRaw) {
    const series = await db.getAllAsync<SerieRegistrada>(
      'SELECT numero_serie, repeticiones, peso FROM sesion_series WHERE sesion_ejercicio_id = ? ORDER BY numero_serie',
      ej.id
    );
    ejercicios.push({ ...ej, series });
  }

  return { ...sesion, ejercicios };
}

export async function eliminarSesion(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sesiones_entrenamiento WHERE id = ?', id);
}

/** 'YYYY-MM-DD' en hora local. */
export function fechaLocal(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'HH:MM' en hora local. */
export function horaLocal(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

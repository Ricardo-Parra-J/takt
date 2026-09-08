-- ============================================================
-- Takt — Esquema de base de datos SQLite
-- Basado en FEATURES.md (borrador v15)
-- Convenciones: fechas como TEXT ISO-8601 ('YYYY-MM-DD' o 'YYYY-MM-DD HH:MM'),
-- booleanos como INTEGER (0/1). SQLite permite referencias FK "hacia adelante"
-- (una tabla puede referenciar otra creada más abajo en este archivo), por eso
-- el orden sigue los módulos de FEATURES.md y no un orden estricto de dependencias.
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- MÓDULO 1: COMIDA
-- ============================================================

CREATE TABLE ingredientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  porcion_base_cantidad REAL NOT NULL DEFAULT 100,
  porcion_base_unidad TEXT NOT NULL DEFAULT 'g',
  calorias REAL,
  proteinas_g REAL,
  carbohidratos_g REAL,
  grasas_g REAL,
  fibra_g REAL,
  azucares_g REAL,
  sodio_mg REAL,
  info_incompleta INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ingredientes_nombre ON ingredientes(nombre);

CREATE TABLE marcas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  marca_id INTEGER REFERENCES marcas(id),
  porcion_base_cantidad REAL NOT NULL DEFAULT 100,
  porcion_base_unidad TEXT NOT NULL DEFAULT 'g',
  calorias REAL,
  proteinas_g REAL,
  carbohidratos_g REAL,
  grasas_g REAL,
  fibra_g REAL,
  azucares_g REAL,
  sodio_mg REAL,
  info_incompleta INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_marca ON productos(marca_id);

CREATE TABLE tipos_comida ( -- desayuno, almuerzo, cena, snack, etc.
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE etiquetas_dieteticas ( -- vegetariano, sin gluten, vegano, etc.
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE recetas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  porciones REAL NOT NULL DEFAULT 1,
  instrucciones TEXT,
  favorita INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_recetas_favorita ON recetas(favorita);

CREATE TABLE receta_tipos_comida (
  receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  tipo_comida_id INTEGER NOT NULL REFERENCES tipos_comida(id) ON DELETE CASCADE,
  PRIMARY KEY (receta_id, tipo_comida_id)
);

CREATE TABLE receta_etiquetas_dieteticas (
  receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  etiqueta_id INTEGER NOT NULL REFERENCES etiquetas_dieteticas(id) ON DELETE CASCADE,
  PRIMARY KEY (receta_id, etiqueta_id)
);

CREATE TABLE receta_ingredientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  ingrediente_id INTEGER NOT NULL REFERENCES ingredientes(id) ON DELETE RESTRICT,
  cantidad REAL NOT NULL,
  unidad TEXT NOT NULL
);
CREATE INDEX idx_receta_ingredientes_receta ON receta_ingredientes(receta_id);

CREATE TABLE receta_productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad REAL NOT NULL,
  unidad TEXT NOT NULL
);
CREATE INDEX idx_receta_productos_receta ON receta_productos(receta_id);

-- Registro diario de lo efectivamente comido (manual, o autogenerado al completar
-- un bloque de comida del calendario que tiene una receta asignada).
CREATE TABLE registro_comidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  hora TEXT,
  receta_id INTEGER REFERENCES recetas(id) ON DELETE SET NULL,
  ingrediente_id INTEGER REFERENCES ingredientes(id) ON DELETE SET NULL,
  producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  cantidad REAL NOT NULL DEFAULT 1, -- porciones si es receta; cantidad si es ingrediente/producto suelto
  unidad TEXT,
  origen TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'bloque_calendario'
  evento_calendario_id INTEGER REFERENCES eventos_calendario(id) ON DELETE SET NULL,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (
    (receta_id IS NOT NULL) + (ingrediente_id IS NOT NULL) + (producto_id IS NOT NULL) = 1
  )
);
CREATE INDEX idx_registro_comidas_fecha ON registro_comidas(fecha);

-- Metas nutricionales diarias, con historial (vigente_desde) por si cambian con el tiempo
CREATE TABLE metas_nutricionales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vigente_desde TEXT NOT NULL,
  calorias_min REAL, calorias_max REAL,
  proteinas_min_g REAL, proteinas_max_g REAL,
  carbohidratos_min_g REAL, carbohidratos_max_g REAL,
  grasas_min_g REAL, grasas_max_g REAL,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cumplimiento nutricional por día (se recalcula cuando cambia el registro del día)
CREATE TABLE cumplimiento_nutricional_diario (
  fecha TEXT PRIMARY KEY,
  calorias_total REAL, proteinas_total_g REAL, carbohidratos_total_g REAL, grasas_total_g REAL,
  cumplio_calorias INTEGER, cumplio_proteinas INTEGER, cumplio_carbohidratos INTEGER, cumplio_grasas INTEGER
);

CREATE TABLE registro_agua (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  hora TEXT,
  cantidad_ml REAL NOT NULL
);
CREATE INDEX idx_registro_agua_fecha ON registro_agua(fecha);

-- Planificador semanal: qué receta va en qué día/tipo de comida de la semana
CREATE TABLE plan_semanal_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semana_inicio TEXT NOT NULL, -- lunes de la semana planificada, YYYY-MM-DD
  fecha TEXT NOT NULL,
  tipo_comida_id INTEGER NOT NULL REFERENCES tipos_comida(id),
  receta_id INTEGER NOT NULL REFERENCES recetas(id)
);
CREATE INDEX idx_plan_semanal_semana ON plan_semanal_items(semana_inicio);

CREATE TABLE listas_compra (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semana_inicio TEXT NOT NULL,
  generado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE lista_compra_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lista_id INTEGER NOT NULL REFERENCES listas_compra(id) ON DELETE CASCADE,
  ingrediente_id INTEGER REFERENCES ingredientes(id),
  producto_id INTEGER REFERENCES productos(id),
  cantidad REAL NOT NULL,
  unidad TEXT,
  conseguido INTEGER NOT NULL DEFAULT 0, -- marcado por el usuario al revisar la lista
  eliminado INTEGER NOT NULL DEFAULT 0,  -- quitado por el usuario porque ya lo tenía
  CHECK ((ingrediente_id IS NOT NULL) <> (producto_id IS NOT NULL))
);

-- ============================================================
-- MÓDULO 2: CALENDARIO
-- ============================================================

CREATE TABLE recurrencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  frecuencia TEXT NOT NULL, -- 'diaria' | 'semanal' | 'mensual' | 'anual'
  intervalo INTEGER NOT NULL DEFAULT 1,
  fecha_fin TEXT -- NULL = se repite indefinidamente hasta que se elimine
);

-- Días de la semana de una recurrencia semanal (una fila por día, no una lista en texto)
CREATE TABLE recurrencia_dias_semana (
  recurrencia_id INTEGER NOT NULL REFERENCES recurrencias(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL, -- 0=lunes .. 6=domingo
  PRIMARY KEY (recurrencia_id, dia_semana)
);

CREATE TABLE eventos_calendario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'clase' | 'gimnasio' | 'comida' | 'viaje' | 'estudio' | 'entrega' | 'certamen' | 'otro'
  fecha TEXT NOT NULL,
  hora_inicio TEXT,
  hora_fin TEXT,
  todo_el_dia INTEGER NOT NULL DEFAULT 0,
  notas TEXT,
  recurrencia_id INTEGER REFERENCES recurrencias(id) ON DELETE SET NULL,
  tipo_comida_id INTEGER REFERENCES tipos_comida(id),       -- si tipo='comida'
  receta_id INTEGER REFERENCES recetas(id),                 -- receta asignada al bloque de comida
  preset_rutina_id INTEGER REFERENCES presets_rutina(id),   -- rutina planificada si tipo='gimnasio'
  sesion_entrenamiento_id INTEGER REFERENCES sesiones_entrenamiento(id), -- sesión real ya registrada
  tarea_id INTEGER REFERENCES tareas(id),                   -- si viene de una entrega/certamen
  completado INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_eventos_fecha ON eventos_calendario(fecha);
CREATE INDEX idx_eventos_tipo ON eventos_calendario(tipo);

CREATE TABLE plantillas_horario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL
);

CREATE TABLE plantilla_horario_bloques (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plantilla_id INTEGER NOT NULL REFERENCES plantillas_horario(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL, -- 0=lunes .. 6=domingo
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL
);

-- ============================================================
-- MÓDULO 3: TAREAS
-- ============================================================

CREATE TABLE categorias_tarea (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE tareas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria_id INTEGER REFERENCES categorias_tarea(id),
  prioridad TEXT, -- 'alta' | 'media' | 'baja' | NULL
  fecha_plazo TEXT, -- NULL = sin plazo -> siempre Activa hasta completarse
  recordatorio_dias_antes INTEGER,
  es_meta_largo_plazo INTEGER NOT NULL DEFAULT 0,
  completada INTEGER NOT NULL DEFAULT 0,
  completada_en TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_tareas_plazo ON tareas(fecha_plazo);
CREATE INDEX idx_tareas_completada ON tareas(completada);
-- "Atrasada" NO se guarda: es completada=0 AND fecha_plazo IS NOT NULL AND fecha_plazo < ahora,
-- calculado en la consulta que arma esa vista/filtro.

CREATE TABLE subtareas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tarea_id INTEGER NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  completada INTEGER NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- MÓDULO 4: FINANZAS
-- ============================================================

CREATE TABLE configuracion_finanzas (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- fila única
  sueldo_mensual REAL NOT NULL DEFAULT 0,
  dia_pago INTEGER NOT NULL DEFAULT 1, -- día del mes en que se acredita el sueldo
  porcentaje_ahorro REAL NOT NULL DEFAULT 0, -- 0-100
  saldo_inicial REAL NOT NULL DEFAULT 0,
  moneda TEXT NOT NULL DEFAULT 'CLP'
);

CREATE TABLE categorias_finanzas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'gasto' | 'ganancia'
  UNIQUE(nombre, tipo)
);

CREATE TABLE gastos_obligatorios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  monto REAL NOT NULL,
  dia_cobro INTEGER NOT NULL, -- 1-31
  categoria_id INTEGER REFERENCES categorias_finanzas(id),
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Todo movimiento real de dinero: sueldo del mes, ganancias puntuales, gastos puntuales,
-- y la instancia mensual generada de cada gasto obligatorio.
CREATE TABLE movimientos_financieros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL, -- 'sueldo' | 'ganancia' | 'gasto' | 'gasto_obligatorio'
  titulo TEXT NOT NULL,
  descripcion TEXT,
  monto REAL NOT NULL, -- siempre positivo; el signo (suma o resta) lo da 'tipo'
  categoria_id INTEGER REFERENCES categorias_finanzas(id),
  fecha TEXT NOT NULL,
  hora TEXT,
  gasto_obligatorio_id INTEGER REFERENCES gastos_obligatorios(id), -- si tipo='gasto_obligatorio'
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_movimientos_fecha ON movimientos_financieros(fecha);
CREATE INDEX idx_movimientos_tipo ON movimientos_financieros(tipo);

-- Fase 2: metas de ahorro con nombre y propósito
CREATE TABLE metas_ahorro (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  monto_objetivo REAL NOT NULL,
  monto_actual REAL NOT NULL DEFAULT 0,
  fecha_objetivo TEXT,
  activa INTEGER NOT NULL DEFAULT 1
);

-- Nota: el "saldo total acumulado" y el "disponible para gastar del mes" NO se guardan
-- como columnas — se calculan sumando configuracion_finanzas.saldo_inicial más los
-- movimientos_financieros correspondientes, para que nunca puedan desalinearse del detalle.

-- ============================================================
-- MÓDULO 5: DEPORTE / ENTRENAMIENTO
-- ============================================================

CREATE TABLE grupos_musculares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE -- pecho, espalda, piernas, cardio, etc.
);

CREATE TABLE ejercicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  grupo_muscular_id INTEGER REFERENCES grupos_musculares(id),
  ultimo_peso REAL,
  ultimas_repeticiones INTEGER,
  ultima_fecha_uso TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ejercicios_nombre ON ejercicios(nombre);

CREATE TABLE presets_rutina (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE preset_ejercicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_id INTEGER NOT NULL REFERENCES presets_rutina(id) ON DELETE CASCADE,
  ejercicio_id INTEGER NOT NULL REFERENCES ejercicios(id),
  orden INTEGER NOT NULL DEFAULT 0,
  series_objetivo INTEGER,
  repeticiones_objetivo INTEGER,
  peso_objetivo REAL
);

CREATE TABLE sesiones_entrenamiento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  preset_id INTEGER REFERENCES presets_rutina(id), -- NULL si fue libre, sin preset
  fecha TEXT NOT NULL,
  hora_inicio TEXT,
  duracion_minutos INTEGER,
  evento_calendario_id INTEGER REFERENCES eventos_calendario(id),
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sesiones_fecha ON sesiones_entrenamiento(fecha);

CREATE TABLE sesion_ejercicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sesion_id INTEGER NOT NULL REFERENCES sesiones_entrenamiento(id) ON DELETE CASCADE,
  ejercicio_id INTEGER NOT NULL REFERENCES ejercicios(id),
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE sesion_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sesion_ejercicio_id INTEGER NOT NULL REFERENCES sesion_ejercicios(id) ON DELETE CASCADE,
  numero_serie INTEGER NOT NULL,
  repeticiones INTEGER,
  peso REAL
);

-- ============================================================
-- MÉTRICAS DE SALUD (Sueño y Peso corporal — viven en el Dashboard)
-- ============================================================

CREATE TABLE registro_sueno (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL UNIQUE,
  horas_dormidas REAL,
  calidad INTEGER -- escala 1-5
);

CREATE TABLE registro_peso_corporal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  peso_kg REAL NOT NULL
);
CREATE INDEX idx_peso_fecha ON registro_peso_corporal(fecha);

-- ============================================================
-- CONFIGURACIÓN GENERAL Y RESPALDOS
-- ============================================================

CREATE TABLE configuracion_app (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- fila única
  tema TEXT NOT NULL DEFAULT 'sistema', -- 'claro' | 'oscuro' | 'sistema'
  bloqueo_tipo TEXT, -- NULL | 'pin' | 'biometria'
  pin_hash TEXT,
  dias_aviso_respaldo INTEGER NOT NULL DEFAULT 14,
  ultimo_respaldo_en TEXT
);

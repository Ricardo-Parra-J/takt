# Takt — Modelo de base de datos (SQLite)

Basado en `FEATURES.md` (borrador v15). El esquema completo en SQL está en `db/schema.sql` (44 tablas, ya probado: se ejecuta sin errores, las reglas de integridad funcionan, y el cálculo nutricional de una receta con conversión de unidades se probó de punta a punta con datos reales).

## Cómo leer esto

Por cada módulo, las tablas principales y para qué sirven. El detalle de columnas está en `db/schema.sql` (con comentarios).

## 0. Unidades de medida — NUEVO

- `unidades_medida` — catálogo fijo y seleccionable (g, kg, ml, l, taza, cucharada, cucharadita, unidad, rebanada, diente, pizca), cada una con una `dimension` (masa / volumen / conteo). Dentro de la misma dimensión, la conversión es universal (ej. 1 taza siempre son 240 ml, 1 kg siempre son 1000 g) vía `factor_a_base`.
- Lo que **no** es universal es convertir entre masa y volumen (depende de la densidad de cada ingrediente — 1 taza de harina no pesa lo mismo que 1 taza de agua), ni las unidades de "conteo" (1 huevo, 1 diente de ajo). Para esos casos existen `ingrediente_equivalencias_unidad` y `producto_equivalencias_unidad`: por ejemplo, "harina: 1 taza = 120 g" queda guardado ahí, específico para ese ingrediente.
- Cada Ingrediente/Producto guarda sus valores nutricionales relativos a su propia `porcion_base_cantidad` + `porcion_base_unidad_id` (ej. "por 100 g" para harina, o "por 1 unidad" directamente para huevo) — se elige la unidad que tenga más sentido para ese ingrediente en particular, no siempre 100 g.
- **Cómo se calcula la nutrición de una receta:** por cada ingrediente/producto de la receta, se convierte su cantidad a la unidad base de ese ingrediente (usando conversión universal si es la misma dimensión, o la equivalencia propia del ingrediente si no), se calcula la proporción respecto a su porción base, y se multiplica por sus valores nutricionales. Esto ya se probó con un caso real (una receta con "2 tazas de harina" + "3 huevos") y da el resultado esperado.

## 1. Comida

- `ingredientes`, `productos` — con valores nutricionales y `info_incompleta` para marcar los que quedaron a medio llenar.
- `recetas`, `receta_ingredientes`, `receta_productos` — una receta se arma con cantidades de ingredientes y/o productos.
- `tipos_comida`, `etiquetas_dieteticas` — catálogos reutilizables (desayuno/cena/snack, vegetariano/sin gluten/etc.), conectados a `recetas` mediante tablas puente (`receta_tipos_comida`, `receta_etiquetas_dieteticas`) porque una receta puede tener varias a la vez.
- `registro_comidas` — el diario de lo efectivamente comido cada día; una fila puede venir de una receta, un ingrediente suelto o un producto suelto (nunca más de uno a la vez — reglas validadas por la base de datos).
- `metas_nutricionales`, `cumplimiento_nutricional_diario` — metas objetivo (con historial si cambian) y si se cumplieron día a día.
- `plan_semanal_items`, `listas_compra`, `lista_compra_items` — el plan semanal genera una lista de compras editable (marcar conseguido o eliminar ítems).

## 2. Calendario

- `eventos_calendario` — todos los tipos de evento (clase, gimnasio, comida, viaje, estudio, entrega, certamen). Tiene enlaces opcionales a receta, preset de rutina, sesión de entrenamiento ya registrada, o tarea, según el tipo de bloque.
- `recurrencias` — un evento recurrente apunta a una fila acá; se repite hasta que se borre (sin fecha de fin obligatoria).
- `plantillas_horario`, `plantilla_horario_bloques` — semanas tipo reutilizables para generar bloques de golpe.

## 3. Tareas

- `tareas` — incluye prioridad, plazo opcional, recordatorio con anticipación, y si es una meta de mediano/largo plazo.
- `subtareas` — checklist interno de una tarea.
- **Importante:** "Atrasada" no es una columna ni un estado guardado — se calcula al consultar (`completada = 0 AND fecha_plazo < ahora`), tal como quedó definido en la especificación.

## 4. Finanzas

- `configuracion_finanzas` — una sola fila con sueldo mensual, día de pago, % de ahorro objetivo, saldo inicial y moneda.
- `gastos_obligatorios` — plantillas recurrentes (ej. "Netflix, día 5"); cada mes generan una fila en `movimientos_financieros`.
- `movimientos_financieros` — la tabla central: cada sueldo, ganancia, gasto puntual o gasto obligatorio ya cobrado queda acá como una fila.
- `categorias_finanzas` — categorías tanto de gasto como de ganancia.
- `metas_ahorro` — fondos de ahorro con nombre (fase 2).
- **Importante:** ni el "saldo total acumulado" ni el "disponible para gastar del mes" se guardan como un número aparte — se calculan sumando `configuracion_finanzas.saldo_inicial` más los movimientos correspondientes. Así nunca pueden desalinearse del detalle real.

## 5. Deporte

- `grupos_musculares`, `ejercicios` — los ejercicios recuerdan el último peso/repeticiones usado.
- `presets_rutina`, `preset_ejercicios` — el plan: qué ejercicios, series/repeticiones/peso objetivo.
- `sesiones_entrenamiento`, `sesion_ejercicios`, `sesion_series` — el registro real ejecutado, serie por serie, pudiendo diferir del preset del que partió (o sin preset, libre).

## Métricas de salud

- `registro_sueno`, `registro_peso_corporal` — simples, una fila por día, sin módulo propio (viven en el Dashboard).

## Configuración general

- `configuracion_app` — tema, bloqueo (PIN/huella), y cuándo fue el último respaldo (para el recordatorio periódico de exportar).

## Normalización (hasta 4FN)

Se revisó tabla por tabla contra 1FN, 2FN, 3FN, BCNF y 4FN. Se encontró y corrigió una violación real:

- **1FN violada (corregido):** `recurrencias` tenía un campo `dias_semana` con una lista separada por comas (ej. `'1,3,5'`) — eso es un grupo repetido metido en una sola columna, no un valor atómico. Se separó en una tabla `recurrencia_dias_semana` (una fila por día), que de paso ya cumple 4FN para esa relación (no mezcla dos hechos multivaluados independientes en una sola tabla).
- **Mejora aplicada (no era una violación estricta, pero valía la pena):** `productos.marca` era texto libre repetido en cada fila (riesgo de inconsistencias como "Soprole" vs "soprole"). Se normalizó a una tabla `marcas` con `productos.marca_id` como referencia.
- **2FN:** no aplica ningún problema — casi todas las tablas usan una clave sustituta de una sola columna (`id`), y las únicas con clave compuesta (`receta_tipos_comida`, `receta_etiquetas_dieteticas`, `recurrencia_dias_semana`) son tablas puente sin atributos no clave, así que no puede haber dependencia parcial.
- **3FN / BCNF:** revisadas, no encontré dependencias transitivas reales. El único caso dudoso era `movimientos_financieros.tipo` pareciendo redundante con `gasto_obligatorio_id` (si `gasto_obligatorio_id` no es nulo, `tipo` siempre es `'gasto_obligatorio'`) — pero como esa relación no se cumple para todas las filas (cuando `gasto_obligatorio_id` es nulo, `tipo` puede ser `sueldo`, `ganancia` o `gasto`), no es una dependencia funcional real en el sentido estricto, así que se deja como está: es un campo "discriminador" útil para no tener que revisar nulls y hacer join en cada consulta de saldo.
- **4FN:** revisadas las tablas puente (`receta_ingredientes`, `receta_productos`, `receta_tipos_comida`, etc.) — cada una representa una sola relación, sin mezclar dos hechos multivaluados independientes en la misma tabla, que es justo lo que 4FN exige.

**Una excepción de diseño, a propósito:** `eventos_calendario` tiene varias columnas de referencia opcionales (`receta_id`, `preset_rutina_id`, `sesion_entrenamiento_id`, `tarea_id`, etc.) donde solo una aplica según el `tipo` de evento. Esto no es una violación de 1FN-4FN (ninguna de esas columnas es multivaluada), pero tampoco es la forma más "pura" posible — un diseño estrictamente purista dividiría esto en una tabla por tipo de evento. Se optó deliberadamente por no hacerlo: separarlo complicaría mucho consultas básicas como "muéstrame el calendario de esta semana" (habría que unir muchas tablas con UNION) a cambio de un beneficio casi nulo en una app personal de un solo usuario.

## Decisiones de diseño a tener presente

- **Números calculados, no guardados:** saldo total, disponible para gastar, y valores nutricionales de una receta se calculan a partir del detalle (ingredientes, movimientos) en vez de guardarse como un campo aparte. Es más código en la app, pero evita que un número se desincronice de la realidad.
- **"Atrasada" en Tareas** tampoco se guarda: se calcula al consultar.
- Todas las fechas se guardan como texto ISO (`YYYY-MM-DD`), compatible con ordenar y comparar directamente en SQLite.

## Supuestos que hice y quedan por confirmar

- **Macronutrientes trackeados:** además de calorías, proteínas y carbohidratos (que mencionaste), agregué grasas, fibra, azúcares y sodio como campos opcionales en Ingredientes/Productos/metas nutricionales, ya que son los datos típicos de una etiqueta nutricional. ¿Te sirven todos, o los recortamos a solo los que realmente vas a usar?
- **Unidades de medida** (`unidad` en recetas/lista de compras) las dejé como texto libre (ej. "g", "ml", "unidad", "taza") en vez de una lista fija — más simple de implementar ahora, se puede restringir a opciones fijas después si prefieres.
- **Recurrencia de eventos:** implementé un modelo simple (frecuencia + intervalo + días de la semana + fecha de fin opcional), suficiente para "todas las semanas los mismos días", pero más simple que Google Calendar. Si necesitas patrones más raros (ej. "cada dos semanas los martes y jueves excepto feriados") habría que ampliarlo.
- **Escala de calidad del sueño:** la dejé como número del 1 al 5. Dime si prefieres otra escala.

---

**Siguiente paso:** con el modelo de datos definido, lo natural es diseñar las pantallas principales de cada módulo (empezando por el Dashboard) o armar el proyecto base en Expo con esta base de datos ya conectada.

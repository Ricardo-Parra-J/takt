# Takt — Modelo de base de datos (SQLite)

Basado en `FEATURES.md` (borrador v15). El esquema completo en SQL está en `db/schema.sql` (39 tablas, ya probado: se ejecuta sin errores y las reglas de integridad funcionan como se espera).

## Cómo leer esto

Por cada módulo, las tablas principales y para qué sirven. El detalle de columnas está en `db/schema.sql` (con comentarios).

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

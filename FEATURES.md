# Takt — Especificación funcional (borrador v10)

Dashboard principal con 5 módulos: **Comida, Calendario, Deporte, Tareas, Finanzas**.

## Arquitectura de datos — DECIDIDO

**Todo local, sin nube ni cuenta.** Base de datos SQLite dentro del propio teléfono (vía `expo-sqlite`, incluido en Expo, sin configuración nativa extra). Encaja bien con lo relacional de los datos de Takt (recetas hechas de ingredientes con cantidades, rutinas hechas de ejercicios con series/repeticiones/peso, tareas con categorías, gastos con categorías).

**Exportación e importación de datos — funcionalidad central (no opcional).** Ya que no hay nube, esto cumple dos roles: respaldo manual de tus datos, y forma de pasar tus datos a otro teléfono si algún día cambias de equipo. Exporta todo (recetas, ingredientes, productos, rutinas, ejercicios, tareas, gastos, etc.) a un archivo — la idea es un archivo JSON legible y portable — que luego se puede importar de vuelta o en otro dispositivo. Se guarda/comparte con las herramientas propias del teléfono (ej. guardarlo en Google Drive, enviarlo por correo, etc., a elección tuya al momento de exportar).

**Nota:** al ser local, no hay sincronización automática entre dispositivos — si usas la app en más de un teléfono, la forma de mantenerlos al día es exportar en uno e importar en el otro.

## Exportación e Importación

No es solo respaldo: es la forma central de traer contenido a la app sin tipear todo a mano.

### Backup completo
- Exporta todo el contenido de la app (recetas, ingredientes, productos, rutinas, ejercicios, tareas, gastos, etc.) a un archivo JSON.
- Se puede importar de vuelta o llevar a otro teléfono.

### Importación asistida por IA (por tipo de contenido) — NUEVO

Idea: formatos de importación específicos y documentados para tipos de contenido puntuales — para empezar, **Receta** (con sus ingredientes) y **Sesión de entrenamiento** (con sus ejercicios, series, repeticiones y peso) — pensados para poder pedirle a cualquier chat de IA (ChatGPT, Claude, etc.) que convierta texto libre a ese formato. Ejemplo de uso: encuentras una receta en internet, se la pasas a un chat de IA junto con el formato de Takt, la IA te devuelve el archivo/texto ya estructurado, y lo importas directo — sin tipear cada ingrediente a mano. Mismo flujo para describir en palabras una sesión de entrenamiento que acabas de hacer.

Para que esto funcione bien conviene que la propia app incluya un botón "copiar instrucciones para IA", que copie el formato exacto + un prompt listo para pegar en cualquier chat junto con el contenido original — así no hay que memorizar el formato.

- **Confirmado:** si al importar una Receta o Sesión aparece un ingrediente/ejercicio que no existe todavía guardado en la app, la app pregunta antes de crearlo (no se crea automático). Si se crea un Ingrediente/Producto nuevo sin toda su info nutricional, queda marcado como "info incompleta" (ver sección Comida).

**Dudas pendientes:**
- ¿La importación asistida por IA la dejamos solo para Recetas y Entrenamientos por ahora, o de una vez la pensamos también para otros tipos (ej. una Tarea a partir del enunciado de una evaluación, un Gasto a partir de una boleta)?

## 1. Comida

**Entidades:** Ingredientes, Productos, Recetas.

- **Ingrediente**: alimento genérico (huevo, lechuga, zanahoria) con valores nutricionales, normalmente por 100g/100ml.
- **Producto**: item de marca específica comprado (ej. jugo de una marca), con campo de **marca** (para poder buscarlo por marca después) y sus propios valores nutricionales.
- Las Recetas se arman seleccionando **ingredientes y/o productos** guardados, con unidad de medida y cantidad para cada uno.
- El valor nutricional de una receta se calcula automáticamente en base a los valores nutricionales y cantidades de sus componentes.
- **Porciones — confirmado.** Cada Receta tiene rendimiento/porciones (ej. "rinde 4 porciones"), para poder ver el valor nutricional total o por porción.
- **Info nutricional incompleta**: si un Ingrediente o Producto queda guardado sin todos sus valores nutricionales completos (por ejemplo, uno creado al vuelo durante una importación), debe quedar marcado visualmente como "info incompleta" para poder encontrarlo y completarlo/editarlo después fácilmente.
- Registro de consumo de agua durante el día — confirmado.
- Las Recetas tienen categorías multi-seleccionables (desayuno, cena, snack, etc.), que conectan con el Calendario: un bloque "desayuno" muestra directamente las recetas de esa categoría.
- **Etiquetas dietéticas — confirmado.** No se agregan como un perfil de restricciones personales, sino como categorías/etiquetas adicionales de la Receta (vegetariano, sin gluten, vegano, etc.), multi-seleccionables igual que las de tipo de comida, para poder filtrar recetas al buscarlas.
- **Recetas favoritas — confirmado, NUEVO.** Marcar recetas como favoritas para acceso rápido.

**Registro diario de comidas — confirmado, NUEVO.**
- Se lleva un registro de lo efectivamente comido cada día (no solo marcar el bloque del calendario como hecho).
- El usuario define **metas nutricionales diarias**: rangos objetivo de calorías, proteínas, carbohidratos (y otros macros que se quieran trackear).
- Cada día queda guardado si se cumplió o no cada meta (calorías, proteínas, carbohidratos, etc.), formando un historial de cumplimiento nutricional día a día.

**Planificador semanal de comidas — confirmado, NUEVO.**
- Se pueden asignar recetas a los días/bloques de comida de la semana.
- A partir de ese plan semanal, se arma automáticamente la lista de compras.

**Dudas pendientes:**
- La lista de compras automática, ¿resta lo que ya tienes en casa (inventario/despensa) o simplemente junta todos los ingredientes de las recetas planificadas de la semana, sin llevar inventario?

## 2. Calendario

- Tipos de evento: clases, gimnasio, comidas, viajes, estudio, entrega de trabajos, certámenes (evaluaciones), etc.
- Conexión con otros módulos: comida → Comida, gimnasio → Deporte, clases/entregas/evaluaciones → Tareas.
- Sincronización con Google Calendar — confirmado, Fase 2 (requiere integración con API externa).
- Reacomodo automático de bloques si una actividad se atrasa — confirmado, Fase 2 (función avanzada).
- Plantillas de horario reutilizables (ej. semana tipo con clases y gimnasio fijos) — confirmado, Fase 1.
- **Recurrencia — confirmado.** Un evento recurrente se ingresa una sola vez y se repite automáticamente hasta que se elimine.
- **Vistas de calendario — confirmado.** Día, semana y mes, las tres.
- **Bloque de gimnasio — confirmado.** Se puede planificar de antemano qué rutina (preset) se va a hacer, asignándola al bloque. Ver sección Deporte para el detalle de presets vs. sesión real ejecutada.
- **Bloque de comida — confirmado.** Conectado al planificador semanal de Comida: seleccionar recetas para la semana arma automáticamente la lista de compras.

## 3. Tareas

- Crear tareas, con categorías personalizables (ej. "tareas", "evaluaciones").
- Se conecta con Calendario (fechas de entrega/evaluación aparecen ahí también).
- Se puede marcar como completada (como una to-do list).
- Metas de mediano/largo plazo (objetivos trimestrales o anuales) — confirmado, se modelan como tareas de plazo largo dentro de este mismo módulo.

**Estados de tarea — CONFIRMADO:**

Solo dos estados guardados, más una vista calculada:

- **Activa**: estado por defecto de toda tarea no completada.
- **Completada**: se marca manualmente cuando la terminas (como una to-do list).
- **Atrasada**: no es un estado que se guarda aparte, es una condición automática = una tarea Activa que tiene plazo y ese plazo ya pasó. Se muestra como una vista/filtro (con marca visual, ej. en rojo) dentro de las Activas, no como una cuarta lista independiente.
- Una tarea **sin plazo definido** siempre es Activa hasta que se completa — nunca puede quedar "atrasada" porque no hay fecha que vencer.
- Vistas finales: Todas / Activas / Atrasadas (subconjunto de Activas) / Completadas. Se elimina el nombre "Pendiente" para no tener dos palabras significando lo mismo.

**Confirmado, NUEVO:**
- Prioridad de tarea (alta/media/baja).
- Subtareas/checklist dentro de una tarea, para tareas grandes que se dividen en pasos.

## 4. Finanzas

- Sueldo mensual, que se renueva/aumenta el saldo disponible cada mes.
- % de ahorro objetivo.
- Registro de gastos puntuales y de **Ganancias / Ingresos extra** (venta de algo, trabajo extra remunerado, etc.), ambos sumando/restando del saldo disponible del mes (sueldo + ganancias − gastos obligatorios − gastos puntuales).
- **Campos de Gasto/Ganancia — confirmado:** título (obligatorio), descripción (opcional), monto, fecha y hora, categoría.
- **Categorías — confirmado.** Tanto gastos como ganancias tienen categoría (ej. gastos: comida, transporte, entretenimiento — ganancias: venta, trabajo extra, regalo).
- **Gastos obligatorios — confirmado.** Se configuran una sola vez como gasto recurrente (ej. "Netflix, se cobra el día 5 de cada mes"), y la app genera/descuenta automáticamente el gasto en la fecha de cobro correspondiente cada mes.
- **Moneda — confirmado.** CLP (pesos chilenos) por defecto.
- **Resumen financiero mensual — confirmado, NUEVO.** Vista con gráfico de gasto por categoría, para ver de un vistazo en qué se va la plata.
- **Seguimiento del % de ahorro — confirmado, NUEVO.** No solo definir el % objetivo, sino ver mes a mes si realmente se está cumpliendo.

## 5. Deporte / Entrenamiento

**Se confirmaron dos entidades separadas — plan y registro real:**

- **Preset de rutina** (plantilla planificada): tiene nombre propio y una lista de ejercicios planeados con series/repeticiones/peso objetivo. Reutilizable, se puede asignar de antemano a un bloque de gimnasio en el Calendario.
- **Sesión de entrenamiento** (registro real ejecutado): puede partir de un preset o ser libre. Guarda lo que realmente se hizo: ejercicios, series, repeticiones y peso por ejercicio, y duración total — incluyendo cualquier cambio respecto al preset (ejercicios distintos, más/menos series, otro peso). Queda en el historial y vinculada al Calendario.
- Los ejercicios son entidades reutilizables entre presets y sesiones, y recuerdan la última serie/repeticiones/peso usado para llevar continuidad del progreso.
- **Agrupación por grupo muscular — confirmado.** Los ejercicios se agrupan por grupo muscular (pecho, espalda, piernas, cardio, etc.).

**Confirmado, NUEVO:**
- Gráfico de progreso por ejercicio a lo largo del tiempo (peso/repeticiones), para ver la evolución real.
- Temporizador de descanso entre series durante un entrenamiento en vivo.

## Métricas de salud (Sueño y Peso corporal)

No encajan de lleno en ninguno de los 5 módulos, así que viven como registros rápidos desde el Dashboard en vez de tener módulo propio.

- **Sueño** — confirmado que se agrega: horas dormidas y calidad del descanso. A confirmar si vive en el Dashboard como propuse.
- **Peso corporal — confirmado, NUEVO.** Registro simple de peso a lo largo del tiempo, que conecta con las metas nutricionales de Comida y el progreso de entrenamiento de Deporte.

## Transversales confirmadas

- Modo oscuro y claro — Fase 1, estándar.
- Exportar/Importar datos — ver sección dedicada más abajo.
- Widgets de pantalla de inicio — Fase 2 (requiere trabajo nativo extra).
- Personalización visual (temas, colores, íconos) — Fase 2.
- Multi-dispositivo — no automático al ser local; se logra exportando desde un teléfono e importando en el otro.
- **Bloqueo de la app (PIN / huella / Face ID) — confirmado, NUEVO.** Importante al guardar datos financieros y de salud sensibles en un dispositivo local.
- **Recordatorio periódico de respaldo — confirmado, NUEVO.** Como el respaldo depende de exportar manualmente (no hay nube), la app avisa si ha pasado mucho tiempo sin un respaldo.
- **Resumen diario automático — confirmado, NUEVO.** Recuento generado por la app (no un diario manual) de lo comido, entrenado, completado y gastado en el día.

## Descartado

- **Estado de ánimo (mood tracker)** — descartado.
- **Módulo de Hábitos generales con rachas** (leer, meditar, no fumar, etc.) — descartado, la app se queda con los 5 módulos definidos.
- **Journaling / notas personales** — descartado, ya usas Obsidian en tu computador para esto.

---

**Siguiente paso:** resolver las dudas pendientes de cada módulo (marcadas arriba) para cerrar la especificación.

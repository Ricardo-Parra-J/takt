# Takt — Especificación funcional (borrador v7)

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
- Las Recetas se arman seleccionando **ingredientes y/o productos** guardados — confirmado que ambos pueden ser componentes de una receta — con unidad de medida y cantidad para cada uno.
- El valor nutricional de una receta se calcula automáticamente en base a los valores nutricionales y cantidades de sus componentes.
- **Info nutricional incompleta**: si un Ingrediente o Producto queda guardado sin todos sus valores nutricionales completos (por ejemplo, uno creado al vuelo durante una importación), debe quedar marcado visualmente como "info incompleta" para poder encontrarlo y completarlo/editarlo después fácilmente.
- Registro de calorías y macronutrientes — confirmado.
- Registro de consumo de agua durante el día — confirmado.
- Las Recetas tienen categorías multi-seleccionables (desayuno, cena, snack, etc.), que conectan con el Calendario: un bloque "desayuno" muestra directamente las recetas de esa categoría.

**Dudas pendientes:**
- ¿Las Recetas tienen porciones/rendimiento (ej. "rinde 4 porciones") para saber si el valor nutricional calculado es total o por porción?
- ¿Quieres un registro diario de lo que efectivamente comiste, aparte de completar el bloque del calendario?
- ¿Restricciones o preferencias alimentarias (vegetariano, sin gluten, alergias) para filtrar recetas — la agregamos?

## 2. Calendario

- Tipos de evento: clases, gimnasio, comidas, viajes, estudio, entrega de trabajos, certámenes (evaluaciones), etc.
- Conexión con otros módulos: comida → Comida, gimnasio → Deporte, clases/entregas/evaluaciones → Tareas.
- Sincronización con Google Calendar — confirmado, Fase 2 (requiere integración con API externa).
- Reacomodo automático de bloques si una actividad se atrasa — confirmado, Fase 2 (función avanzada).
- Plantillas de horario reutilizables (ej. semana tipo con clases y gimnasio fijos) — confirmado, Fase 1.

**Dudas pendientes:**
- Recurrencia de eventos (clases semanales) — ¿se configura una vez y se repite sola?
- ¿En un bloque de gimnasio se puede planificar de antemano qué rutina se hará?
- ¿Seleccionar una receta desde el calendario arma automáticamente la lista de compras semanal?
- Vista de calendario por día / semana / mes — ¿las tres, o alguna en particular?

## 3. Tareas

- Crear tareas, con categorías personalizables (ej. "tareas", "evaluaciones").
- Se conecta con Calendario (fechas de entrega/evaluación aparecen ahí también).
- Se puede marcar como completada (como una to-do list).
- Metas de mediano/largo plazo (objetivos trimestrales o anuales) — confirmado, se modelan como tareas de plazo largo dentro de este mismo módulo.

**Propuesta para resolver Pendiente/Activa/Atrasada (a confirmar):**

Como tu definición de "pendiente" (fuera de plazo) es exactamente lo mismo que "atrasada", tener las dos como vistas separadas sería redundante. Propongo simplificar a solo dos estados guardados, más una vista calculada:

- **Activa**: estado por defecto de toda tarea no completada.
- **Completada**: se marca manualmente cuando la terminas (como una to-do list).
- **Atrasada**: no es un estado que se guarda aparte, es una condición automática = una tarea Activa que tiene plazo y ese plazo ya pasó. Se muestra como una vista/filtro (y probablemente una marca visual, ej. en rojo) dentro de las Activas, no como una cuarta lista independiente.
- Una tarea **sin plazo definido** siempre es Activa hasta que se completa — nunca puede quedar "atrasada" porque no hay fecha que vencer.

Con esto, las vistas finales serían: Todas / Activas / Atrasadas (subconjunto de Activas) / Completadas — y se elimina el nombre "Pendiente" para no tener dos palabras significando lo mismo. ¿Te hace sentido o prefieres mantener "Pendiente" como el nombre de esa vista en vez de "Atrasada"?

## 4. Finanzas

- Sueldo mensual, que se renueva/aumenta el saldo disponible cada mes.
- % de ahorro objetivo.
- Gastos obligatorios estimados mensuales (suscripciones, cuentas, etc.).
- Registro de gastos puntuales con fecha y hora, generando historial de gastos.

**Dudas pendientes:**
- ¿Los gastos obligatorios se configuran una vez como plantilla recurrente que se descuenta solo cada mes?
- ¿Los gastos deben tener categoría (comida, transporte, entretenimiento, etc.)?
- Moneda: ¿pesos chilenos (CLP)?

## 5. Deporte / Entrenamiento

- Rutinas con nombre propio, que quedan guardadas en el calendario cuando se realizan.
- Por sesión se guarda: ejercicios, **series, repeticiones y peso** por ejercicio, y duración total del entrenamiento.
- Los ejercicios son entidades reutilizables entre rutinas, y recuerdan la última serie/repeticiones/peso usado.
- Todo queda como historial.

**Dudas pendientes:**
- ¿Una Rutina es una plantilla planificada que después ejecutas y comparas contra lo real, o el registro ES directamente lo que hiciste ese día?
- ¿Los ejercicios se agrupan por grupo muscular (pecho, espalda, piernas, cardio)?

## Sueño

Confirmado que se agrega, pero no encaja de lleno en ninguno de los 5 módulos. Propuesta: registro rápido de horas y calidad de sueño directo desde el Dashboard (sin ser un módulo aparte), ya que no tiene módulo propio como los otros. A confirmar.

## Transversales confirmadas

- Modo oscuro y claro — Fase 1, estándar.
- Exportar/Importar datos — ver sección dedicada más abajo.
- Widgets de pantalla de inicio — Fase 2 (requiere trabajo nativo extra).
- Personalización visual (temas, colores, íconos) — Fase 2.
- Multi-dispositivo — no automático al ser local; se logra exportando desde un teléfono e importando en el otro.

## Descartado

- **Estado de ánimo (mood tracker)** — descartado.
- **Módulo de Hábitos generales con rachas** (leer, meditar, no fumar, etc.) — descartado, la app se queda con los 5 módulos definidos.
- **Journaling / notas personales** — descartado, ya usas Obsidian en tu computador para esto.

---

**Siguiente paso:** resolver las dudas pendientes de cada módulo (marcadas arriba) para cerrar la especificación.

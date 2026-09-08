# Takt — Especificación funcional (borrador v2)

Dashboard principal con 5 módulos: **Comida, Calendario, Deporte, Tareas, Finanzas**. Cada módulo se detalla abajo con lo que ya definimos, seguido de dudas a resolver y propuestas de cosas a agregar.

## 1. Comida

**Entidades:** Ingredientes, Productos, Recetas.

- Ingredientes y Productos pueden tener valores nutricionales asignados.
- Las Recetas se arman seleccionando ingredientes/productos ya guardados en la base de datos, con unidad de medida y cantidad para cada uno.
- El valor nutricional de una receta se calcula automáticamente en base a los valores nutricionales y cantidades de sus ingredientes.
- Las Recetas tienen categorías multi-seleccionables (desayuno, cena, snack, etc.).
- Esta categoría es la que conecta con el Calendario: un bloque "desayuno" en el calendario debe poder mostrar directamente las recetas guardadas con esa categoría.

**Dudas:**
- ¿Cuál es la diferencia entre "Ingrediente" y "Producto"? Mi interpretación: Ingrediente = alimento genérico (ej. "pechuga de pollo", "arroz") con valores nutricionales por 100g/100ml, y Producto = algo comprado con marca específica (ej. "Yogur Soprole 150g") con los datos nutricionales de su etiqueta. ¿Es así, o los quieres tratar como lo mismo?
- ¿Un Producto puede usarse también como componente de una Receta (igual que un Ingrediente), o los Productos son solo para registrar compras/despensa?
- ¿Las Recetas tienen porciones/rendimiento (ej. "esta receta rinde 4 porciones") para saber si el valor nutricional calculado es total o por porción?
- ¿Quieres un registro diario de lo que efectivamente comiste (aparte de simplemente completar el bloque del calendario), o el cumplimiento del bloque de comida ya cuenta como "comida registrada"?

## 2. Calendario

- Tipos de evento: clases, gimnasio, comidas, viajes, estudio, entrega de trabajos, certámenes (evaluaciones), etc.
- Conexión con otros módulos:
  - Bloque de comida → sección Comida (sugiere recetas de esa categoría).
  - Bloque de gimnasio → sección Deporte.
  - Clases, entregas de trabajo, evaluaciones → sección Tareas.
- Viaje y estudio, por ahora, parecieran ser eventos "libres" sin módulo dedicado propio.

**Dudas:**
- ¿Los eventos recurrentes (clases todas las semanas a la misma hora) se configuran una vez y se repiten solos, o se crean manualmente cada semana?
- En un bloque de gimnasio, ¿quieres poder asignarle de antemano qué rutina vas a hacer (planificación), o el vínculo con Deporte es solo después, al registrar lo que hiciste?
- En un bloque de comida, cuando seleccionas una receta desde el calendario, ¿eso también debería armar automáticamente la lista de compras de la semana?

## 3. Tareas

- Crear tareas, con vistas de: pendientes, activas, completadas y atrasadas (si tienen plazo vencido).
- Categorías de tareas personalizables (ej. "tareas", "evaluaciones").
- Se conecta con Calendario (fechas de entrega/evaluación aparecen ahí también).

**Dudas:**
- ¿Qué diferencia a una tarea "pendiente" de una "activa"? (ej. ¿pendiente = no iniciada, activa = en progreso?)
- ¿Las tareas necesitan prioridad (alta/media/baja), subtareas o checklist interno, o solo título + descripción + plazo + categoría?
- Al completar una tarea con fecha en el calendario, ¿su evento en el calendario debería marcarse como hecho automáticamente?

## 4. Finanzas

- Sueldo mensual, que se renueva/aumenta el saldo disponible cada vez que empieza un mes nuevo.
- % de ahorro objetivo.
- Gastos obligatorios estimados mensuales (suscripciones, cuentas, etc.).
- Registro de gastos puntuales con fecha y hora, generando historial de gastos.

**Dudas:**
- Los "gastos obligatorios" (suscripciones, cuentas) ¿se configuran una vez como una plantilla recurrente que se descuenta solo cada mes, o hay que registrarlos manualmente cada vez que se pagan?
- ¿Los gastos deben tener categoría (comida, transporte, entretenimiento, etc.) para poder ver en qué se te va la plata, o por ahora solo un monto + fecha + descripción?
- Asumo que la moneda es pesos chilenos (CLP) — ¿correcto?

## 5. Deporte / Entrenamiento

- Rutinas con nombre propio, que quedan guardadas en el calendario cuando se realizan.
- Por sesión se guarda: ejercicios realizados, cantidad, peso usado y duración total del entrenamiento.
- Los ejercicios son entidades reutilizables entre rutinas, y recuerdan la última cantidad y peso usado, para llevar continuidad del progreso.
- Todo queda como historial.

**Dudas:**
- "Cantidad" en un ejercicio, ¿se refiere a series × repeticiones (ej. 4 series de 8 repeticiones), o es un solo número por ejercicio?
- ¿Una Rutina es una plantilla planificada (ej. "Rutina Push: press banca 4x8, ...") que después ejecutas y comparas contra lo real, o el registro de la rutina ES directamente lo que hiciste ese día, sin plan previo?
- ¿Los ejercicios se agrupan por grupo muscular o tipo (pecho, espalda, piernas, cardio) para organizarlos mejor?

## Cosas del primer borrador que no aparecen aquí todavía

El borrador original incluía hábitos generales (tomar agua, dormir, ánimo, lectura, meditación) que no calzan directamente en ninguno de los 5 módulos actuales. ¿Los dejamos fuera de la app, los integramos como un 6to módulo "Hábitos", o los repartimos dentro de los módulos existentes (ej. agua y sueño dentro de Comida/Deporte)?

## Propuestas (funcionalidades que podrían sumar valor)

- Lista de compras automática generada desde el plan semanal de comidas.
- Gráfico de progreso de peso/repeticiones por ejercicio a lo largo del tiempo.
- Vista de balance financiero proyectado: sueldo − gastos obligatorios − gastos variables = disponible vs. meta de ahorro.
- Plantillas de rutina de entrenamiento reutilizables (separando plan de lo realmente ejecutado).
- Recurrencia configurable de eventos en el calendario (clases semanales, pago mensual de cuentas).
- Prioridad y/o subtareas dentro de una tarea.
- Notificaciones/recordatorios configurables por módulo (comida, gimnasio, tareas, pago de cuentas).
- Dashboard con resumen del día: próxima clase/comida/entrenamiento, tareas del día, gasto acumulado del mes.

---

**Siguiente paso:** responder las dudas marcadas arriba y decidir qué propuestas suman, para dejar la especificación cerrada antes de empezar a construir.

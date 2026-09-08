# Takt — Especificación funcional (borrador v4)

Dashboard principal con 5 módulos: **Comida, Calendario, Deporte, Tareas, Finanzas**.

## Arquitectura de datos — DECIDIDO

**Backend: Supabase (plan gratuito), sin costo.**

Motivo: los datos de Takt son muy relacionales (recetas hechas de ingredientes con cantidades, rutinas hechas de ejercicios con series/repeticiones/peso, tareas con categorías, gastos con categorías), y Supabase es una base de datos Postgres real, más natural para esto que una base NoSQL como Firebase/Firestore. Además incluye autenticación de usuario y sincroniza automáticamente entre dispositivos.

Límites del plan gratuito de Supabase (suficiente de sobra para un solo usuario): 500 MB de base de datos, 1 GB de almacenamiento de archivos, 5 GB de tráfico de salida al mes, solicitudes a la API ilimitadas. La única letra chica: un proyecto gratuito se pausa si pasa **1 semana sin actividad** — no se pierden datos, solo hay que "despausarlo" con un clic en el panel de Supabase; en un uso diario normal esto no debería pasar nunca.

## 1. Comida

**Entidades:** Ingredientes, Productos, Recetas.

- **Ingrediente**: alimento genérico (huevo, lechuga, zanahoria) con valores nutricionales, normalmente por 100g/100ml.
- **Producto**: item de marca específica comprado (ej. jugo de una marca) con sus propios valores nutricionales.
- Las Recetas se arman seleccionando ingredientes/productos guardados, con unidad de medida y cantidad para cada uno.
- El valor nutricional de una receta se calcula automáticamente en base a los valores nutricionales y cantidades de sus componentes.
- Registro de calorías y macronutrientes — confirmado.
- Registro de consumo de agua durante el día — confirmado.
- Las Recetas tienen categorías multi-seleccionables (desayuno, cena, snack, etc.), que conectan con el Calendario: un bloque "desayuno" muestra directamente las recetas de esa categoría.

**Dudas pendientes:**
- ¿Un Producto puede usarse también como componente de una Receta (igual que un Ingrediente), o los Productos son solo para registrar compras/despensa?
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
- **Pendiente** = fuera de plazo. **Activa** = aún dentro de plazo.
- Metas de mediano/largo plazo (objetivos trimestrales o anuales) — confirmado, se modelan como tareas de plazo largo dentro de este mismo módulo.

**⚠️ Punto a confirmar:** esta definición hace que "pendiente" sea básicamente lo mismo que "atrasada" (mencionado en la idea original como una cuarta vista aparte). ¿"Pendiente" y "Atrasada" son la misma vista, o quieres que sean cosas distintas? Y las tareas sin plazo definido, ¿son siempre "activas" hasta completarse?

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
- Exportar datos (CSV/PDF) — Fase 2, principalmente útil para Finanzas.
- Widgets de pantalla de inicio — Fase 2 (requiere trabajo nativo extra).
- Personalización visual (temas, colores, íconos) — Fase 2.
- Multi-dispositivo — viene incluido al usar Supabase como backend.

## Descartado

- **Estado de ánimo (mood tracker)** — descartado.
- **Módulo de Hábitos generales con rachas** (leer, meditar, no fumar, etc.) — descartado, la app se queda con los 5 módulos definidos.
- **Journaling / notas personales** — descartado, ya usas Obsidian en tu computador para esto.

---

**Siguiente paso:** resolver las dudas pendientes de cada módulo (marcadas arriba) para cerrar la especificación.

# Takt — Especificación funcional (borrador v3)

Dashboard principal con 5 módulos: **Comida, Calendario, Deporte, Tareas, Finanzas**.

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

## Funcionalidades del borrador original — pendientes de decidir

Del primer brainstorm, esto es lo que **todavía no está incluido** en la especificación actual. Van con mi recomendación:

**Sueño, ánimo y hábitos generales**
- Sueño (horas y calidad) — confirmado que se agrega. Falta decidir en qué módulo vive (¿Comida? ¿uno nuevo?).
- Estado de ánimo diario (mood tracker) — no se ha confirmado. Recomendación: agregarlo, es liviano de construir y complementa bien el dashboard.
- Hábitos personalizados con rachas/streaks (ej. leer, meditar, no fumar) — no hay módulo para esto en el diseño actual de 5 módulos. Recomendación: si te importa mantener hábitos generales (no solo comida/deporte/tareas), conviene un 6to módulo "Hábitos"; si no, lo dejamos fuera.
- Journaling / notas personales — no incluido. Recomendación: opcional, baja prioridad, se puede agregar después sin afectar el resto.
- Metas de mediano/largo plazo (trimestrales/anuales) — no incluido. Recomendación: útil pero se puede posponer a una fase 2.

**Horarios**
- Sincronización con calendario del teléfono (Google Calendar) — no incluido. Recomendación: agregar más adelante, no es crítico para la v1 y es más trabajo técnico (requiere integrarse con APIs externas).
- Reacomodo automático de bloques si una actividad se atrasa — no incluido. Recomendación: es una función avanzada, dejar para después.
- Plantillas de horario reutilizables — no incluido. Recomendación: agregar, es simple y muy útil dado que mencionaste rutinas fijas (clases, gimnasio).

**Transversales / técnicas**
- Modo oscuro y claro — no incluido explícitamente. Recomendación: sí, es estándar hoy en día.
- Backup automático / sincronización en la nube — no incluido. Esto es una decisión de arquitectura importante: define si la app funciona solo local en tu teléfono o si necesita una cuenta/servidor. Recomendación: definirlo pronto porque afecta cómo se construye todo lo demás.
- Multi-dispositivo — depende directamente de la decisión anterior.
- Exportar datos (CSV/PDF) — no incluido. Recomendación: útil sobre todo para Finanzas, se puede agregar sin apuro.
- Widgets de pantalla de inicio — no incluido. Recomendación: dejar para una fase posterior (requiere trabajo nativo extra).
- Personalización visual (temas/colores/íconos) — no incluido. Recomendación: baja prioridad, fase posterior.

---

**Siguiente paso:** decidir sobre estos puntos pendientes y las dudas de cada módulo.

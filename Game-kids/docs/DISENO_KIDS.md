# Solo en el Espacio: Misión de Regreso

## Dirección actual

**Público objetivo:** 10 a 19 años.

**Género:** aventura educativa de acertijos, exploración point-and-click y reparación de sistemas.

**Tono:** serio, científico y accesible. La tensión proviene de la nave averiada, el tiempo, los recursos limitados y la responsabilidad de regresar a la Tierra; no del terror.

Se eliminan por completo el terror psicológico, las sombras, las apariciones, las alucinaciones, los sustos, los monstruos, las muertes y cualquier elemento paranormal. León debe resolver una emergencia operacional y recuperar el control del vehículo.

## Premisa

León regresa de una misión cerca de Júpiter. A 2.77 UA de la Tierra, el transportador pierde combustible, energía y comunicaciones. La nave todavía puede regresar, pero necesita una secuencia correcta de reparaciones. León debe diagnosticar los sistemas, encontrar herramientas, interpretar diagramas y elegir cómo usar los recursos antes de iniciar la trayectoria de regreso.

## Dificultad por edad

- **10–13 años:** instrucciones claras, glosario técnico, pistas graduales, cálculos sencillos, símbolos y diagramas visuales.
- **14–19 años:** más variables simultáneas, lectura de esquemas, prioridades de misión, límites numéricos, administración de recursos y consecuencias menos obvias.

El juego debe ser comprensible sin ser infantil. Los errores explican el principio técnico y permiten reintentar; no existe game over injusto.

## Actos iniciales

### Acto 1 — Energía

León investiga la cabina, el entrepuente, las bahías de aviónica y las celdas de combustible. Debe restaurar la distribución eléctrica, reparar una línea de reactantes y activar las celdas en una secuencia segura.

Minijuegos principales:

- **M01 Panel de distribución:** tres buses, cinco circuitos, consumo y prioridad de misión.
- **M02 Red de reactantes:** conectar LH2 y LO2 con las tres celdas, reparar una tubería y activar las celdas en orden.

Conceptos: fusibles, buses, circuitos, hidrógeno, oxígeno y generación de energía.

### Acto 2 — Aire y agua

Con la energía restaurada, la nave presenta una fuga de presión, aumento de CO₂ y exceso de temperatura. León debe estabilizar el soporte vital y preparar los radiadores.

Minijuegos principales:

- **M03 Presión de cabina:** alcanzar 14.7 psia y mantener el oxígeno en rango seguro.
- **M04 Cartuchos de CO₂:** sustituir filtros sin gastar prematuramente las reservas.
- **M05 Lazos térmicos:** repartir cargas de calor sin superar el límite de cada lazo.
- **M06 Gestión de agua:** dirigir el agua a los depósitos correctos sin desperdiciarla.

Conceptos: presión, mezcla de gases, CO₂, temperatura, radiadores y agua producida por celdas de combustible.

## Estilo visual

- Ilustración 2D digital con contornos oscuros limpios.
- Proporciones técnicas creíbles, inspiradas en los diagramas NASA.
- Paleta azul pizarra, grafito, malva, crema y ámbar.
- Iluminación de emergencia controlada, sin oscuridad extrema.
- Objetos grandes, reconocibles y con suficiente espacio para hotspots.
- Desgaste moderado: cables, etiquetas, paneles, herramientas y escarcha técnica.
- Sin niebla, humo, siluetas amenazantes ni elementos paranormales.
- Los textos, botones, flechas, inventario y hotspots se agregan con Phaser; no se generan dentro de los fondos.

## Tecnología

- Phaser 3.
- TypeScript.
- Vite.
- VS Code.
- Ejecución local con `npm run dev`.
- Arte y audio cargados como recursos locales.

## Regla de fuentes

La distribución de las salas debe basarse en el PDF técnico NASA incluido en `docs/references/space-shuttle-orbiter-drawings.pdf`. Cada vista debe registrarse en `docs/map-traceability.md`, indicando qué referencia se utilizó y qué simplificaciones se hicieron para convertirla en una escena jugable.

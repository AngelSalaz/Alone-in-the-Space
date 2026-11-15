# Solo en el Espacio: Misión de Regreso

Juego local de acertijos técnicos desarrollado con **Phaser 3, TypeScript y Vite**.

## Público y tono

Diseñado para jugadores de 10 a 19 años. La aventura tiene una narrativa seria, científica y accesible: León debe reparar un transportador espacial averiado y regresar a la Tierra. No contiene terror psicológico, apariciones, sangre, monstruos, sustos ni elementos paranormales.

## Ejecutar localmente

Requisitos: Node.js y npm.

```bash
npm install
npm run dev
```

Para comprobar tipos, ejecutar pruebas y construir:

```bash
npm run typecheck
npm test
npm run build
```

## Estructura

- `src/`: escenas, sistemas, datos y UI del juego.
- `public/art/`: fondos y objetos visuales.
- `public/audio/`: audio local; actualmente preparado para incorporar ambiente y efectos.
- `docs/`: diseño de actos, prompts para Leonardo AI y referencias NASA.

## Diseño actual

- Acto 1: Energía.
- Acto 2: Aire y agua.
- Actos posteriores: comunicaciones, navegación y regreso a la Tierra.
- Mapa basado en diagramas técnicos NASA del orbitador.
- Acertijos con dificultad gradual, pistas y explicaciones técnicas.

## Generación de arte

Los fondos, mapas y objetos se generan con Leonardo AI siguiendo `docs/PROMPTS_LEONARDO_AI.md`. Las imágenes deben conservar composición, paleta y proporciones entre escenas. Los textos, botones, flechas, inventario y hotspots se implementan en Phaser, no dentro de las imágenes.

## Nota de inspiración

El juego toma referencias generales del género de aventuras point-and-click ilustradas, pero es un producto original, no oficial y no afiliado a ningún estudio externo.

## Licencia

MIT (ver `LICENSE`).

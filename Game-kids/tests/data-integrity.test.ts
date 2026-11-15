import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import factsData from '../src/data/facts.json';
import itemsData from '../src/data/items.json';
import objectivesData from '../src/data/objectives.json';
import puzzlesData from '../src/data/puzzles.json';
import roomsData from '../src/data/rooms.json';
import type { Action, FactDef, Objective, PuzzleDef, RoomView } from '../src/types';

const rooms = roomsData as unknown as RoomView[];
const puzzles = puzzlesData as unknown as Record<string, PuzzleDef>;
const facts = factsData as unknown as FactDef[];
const objectives = objectivesData as unknown as Objective[];
const itemIds = new Set(itemsData.items.map((i) => i.id));
const roomIds = new Set(rooms.map((r) => r.id));
const factIds = new Set(facts.map((f) => f.id));

function allActions(): Action[] {
  const out: Action[] = [];
  for (const r of rooms) {
    out.push(...(r.onEnter ?? []));
    for (const h of r.hotspots) {
      out.push(...h.actions);
      for (const u of h.use ?? []) out.push(...u.actions);
    }
  }
  for (const p of Object.values(puzzles)) {
    out.push(...p.onSolve);
    if (p.type === 'symbolLock') out.push(...p.onFail);
  }
  return out;
}

describe('integridad de los datos', () => {
  it('los ids de sala son únicos y cada fondo existe en public/art', () => {
    expect(roomIds.size).toBe(rooms.length);
    for (const r of rooms) expect(existsSync(`public/art/${r.background}.png`), r.background).toBe(true);
  });

  it('los goto apuntan a salas existentes', () => {
    for (const a of allActions()) if (a.type === 'goto') expect(roomIds.has(a.view), a.view).toBe(true);
  });

  it('los objetos y datos referenciados existen', () => {
    for (const a of allActions()) {
      if (a.type === 'give' || a.type === 'take') expect(itemIds.has(a.item), a.item).toBe(true);
      if (a.type === 'fact') expect(factIds.has(a.id), a.id).toBe(true);
      if (a.type === 'puzzle') expect(puzzles[a.id], a.id).toBeDefined();
    }
    for (const r of rooms) for (const h of r.hotspots) for (const u of h.use ?? []) expect(itemIds.has(u.item), u.item).toBe(true);
  });

  it('las recetas usan objetos válidos', () => {
    for (const r of itemsData.recipes) expect(itemIds.has(r.a) && itemIds.has(r.b) && itemIds.has(r.result), `${r.a}+${r.b}`).toBe(true);
  });

  it('cada bandera de un objetivo la activa alguna acción del juego', () => {
    const set = new Set<string>();
    for (const a of allActions()) if (a.type === 'setFlag') set.add(a.flag);
    for (const o of objectives) {
      for (const c of o.doneIf) expect(set.has(c.replace('flag:', '')), `${o.id}: ${c}`).toBe(true);
      expect(o.hints.length, o.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('cada dato curioso se puede conseguir jugando', () => {
    const used = new Set<string>();
    for (const a of allActions()) if (a.type === 'fact') used.add(a.id);
    for (const f of facts) expect(used.has(f.id), f.id).toBe(true);
  });

  it('el casillero 2B usa el código 6-4-5 (ventanas, estación, camas)', () => {
    const p = puzzles.locker2B;
    expect(p.type === 'symbolLock' && p.code).toEqual([6, 4, 5]);
  });

  it('el contenido no incluye elementos de terror', () => {
    const text = JSON.stringify([rooms, facts, objectives, puzzles]).toLowerCase();
    for (const w of ['muerte', 'muerto', 'sombra', 'terror', 'sangre', 'fantasma', 'vigilad']) {
      expect(text.includes(w), w).toBe(false);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { GameState } from '../src/systems/GameState';
import { InventorySystem } from '../src/systems/InventorySystem';
import { checkCode, wrapDigit } from '../src/systems/LockLogic';
import { emptyBoard, patternMismatches } from '../src/systems/PatternLogic';
import { E, N, S, W, analyze, rotate } from '../src/systems/PipeLogic';
import { ALL_DONE_TEXT, nextHint } from '../src/systems/HintSystem';
import { runActions } from '../src/systems/ActionRunner';
import type { ActionHost } from '../src/systems/ActionRunner';
import itemsData from '../src/data/items.json';
import objectivesData from '../src/data/objectives.json';
import puzzlesData from '../src/data/puzzles.json';
import type { ItemDef, Objective, PipePuzzle, Recipe } from '../src/types';

const inv = () => new InventorySystem(itemsData.items as ItemDef[], itemsData.recipes as Recipe[]);
const OBJECTIVES = objectivesData as unknown as Objective[];
const PIPES = puzzlesData.tuberias1 as unknown as PipePuzzle;

describe('GameState', () => {
  it('gestiona banderas, inventario y datos sin duplicados', () => {
    const s = new GameState('a');
    expect(s.addItem('linterna')).toBe(true);
    expect(s.addItem('linterna')).toBe(false);
    expect(s.removeItem('linterna')).toBe(true);
    expect(s.removeItem('linterna')).toBe(false);
    expect(s.unlockFact('ventanas')).toBe(true);
    expect(s.unlockFact('ventanas')).toBe(false);
    s.setFlag('x');
    expect(s.hasFlag('x')).toBe(true);
  });

  it('evalúa condiciones con negación', () => {
    const s = new GameState('a');
    expect(s.check(['!item:linterna'])).toBe(true);
    s.addItem('linterna');
    s.unlockFact('f');
    expect(s.check(['item:linterna', 'fact:f', '!flag:visto'])).toBe(true);
    s.setFlag('visto');
    expect(s.check(['item:linterna', '!flag:visto'])).toBe(false);
    expect(s.check()).toBe(true);
  });

  it('guarda y restaura la partida', () => {
    const s = new GameState('a');
    s.addItem('cinta');
    s.setFlag('f');
    s.unlockFact('ventanas');
    s.bumpHint('abrir_locker', 3);
    s.setView('b');
    const t = new GameState('a');
    t.restore(JSON.parse(JSON.stringify(s.serialize())));
    expect(t.hasItem('cinta')).toBe(true);
    expect(t.hasFlag('f')).toBe(true);
    expect(t.facts.has('ventanas')).toBe(true);
    expect(t.hintLevel('abrir_locker')).toBe(1);
    expect(t.currentView).toBe('b');
  });
});

describe('InventorySystem', () => {
  it('combina cable + fusible en fusible puente', () => {
    const s = new GameState('a');
    s.addItem('cable');
    s.addItem('fusible');
    expect(inv().combine(s, 'fusible', 'cable')?.result).toBe('fusible_puente');
    expect(s.items).toEqual(['fusible_puente']);
  });
  it('rechaza combinaciones inválidas', () => {
    const s = new GameState('a');
    s.addItem('cinta');
    s.addItem('linterna');
    expect(inv().combine(s, 'cinta', 'linterna')).toBeNull();
    expect(inv().combine(s, 'cinta', 'cinta')).toBeNull();
    expect(s.items).toHaveLength(2);
  });
});

describe('HintSystem', () => {
  it('da pistas progresivas del primer objetivo pendiente', () => {
    const s = new GameState('a');
    const hints = OBJECTIVES[0].hints;
    expect(nextHint(s, OBJECTIVES)).toBe(hints[0]);
    expect(nextHint(s, OBJECTIVES)).toBe(hints[1]);
    expect(nextHint(s, OBJECTIVES)).toBe(hints[2]);
    expect(nextHint(s, OBJECTIVES)).toBe(hints[2]); // se queda en la solución
  });
  it('pasa al siguiente objetivo cuando se cumple el anterior', () => {
    const s = new GameState('a');
    s.setFlag('locker_abierto');
    expect(nextHint(s, OBJECTIVES)).toBe(OBJECTIVES[1].hints[0]);
  });
  it('avisa cuando todo está hecho', () => {
    const s = new GameState('a');
    for (const o of OBJECTIVES) for (const c of o.doneIf) s.setFlag(c.replace('flag:', ''));
    expect(nextHint(s, OBJECTIVES)).toBe(ALL_DONE_TEXT);
  });
});

describe('LockLogic', () => {
  it('valida el código 6-4-5', () => {
    expect(checkCode([6, 4, 5], [6, 4, 5])).toBe(true);
    expect(checkCode([6, 4, 5], [6, 5, 4])).toBe(false);
  });
  it('las ruedas dan la vuelta', () => {
    expect(wrapDigit(9, 1)).toBe(0);
    expect(wrapDigit(0, -1)).toBe(9);
  });
});

describe('PatternLogic', () => {
  it('detecta las casillas que no coinciden', () => {
    const target = [[1, 0], [0, 1]];
    expect(patternMismatches(emptyBoard(2), target)).toEqual([[0, 0], [1, 1]]);
    expect(patternMismatches(target, target)).toEqual([]);
  });
});

describe('PipeLogic', () => {
  it('cuatro giros devuelven la ficha original', () => {
    for (const m of [1, 3, 5, 6, 7, 9, 10, 12]) {
      expect(rotate(rotate(rotate(rotate(m))))).toBe(m);
    }
    expect(rotate(N)).toBe(E);
    expect(rotate(E)).toBe(S);
    expect(rotate(S)).toBe(W);
    expect(rotate(W)).toBe(N);
  });

  it('el tablero del juego empieza sin resolver', () => {
    expect(analyze(PIPES.tiles, PIPES.sourceRow, PIPES.targetRow).connected).toBe(false);
  });

  it('el tablero tiene solución girando fichas', () => {
    const tiles = PIPES.tiles.map((r) => [...r]);
    // Camino pensado: (1,0)=O-E, (1,1)=O-N, (0,1)=S-E, (0,2)=O-E, (0,3)=O-S, (1,3)=N-E
    const solved: [number, number, number][] = [[1, 0, 10], [1, 1, 9], [0, 1, 6], [0, 2, 10], [0, 3, 12], [1, 3, 3]];
    for (const [r, c, want] of solved) {
      let guard = 0;
      while (tiles[r][c] !== want && guard++ < 4) tiles[r][c] = rotate(tiles[r][c]);
      expect(tiles[r][c], `${r},${c}`).toBe(want);
    }
    expect(analyze(tiles, PIPES.sourceRow, PIPES.targetRow).connected).toBe(true);
  });

  it('una ficha sin salida al oeste no conecta con el tanque', () => {
    expect(analyze([[E | S]], 0, 0).connected).toBe(false);
    expect(analyze([[W | E]], 0, 0).connected).toBe(true);
  });
});

describe('ActionRunner', () => {
  it('ejecuta acciones y se detiene tras un goto', () => {
    const state = new GameState('a');
    const said: string[] = [];
    let went = '';
    const facts: string[] = [];
    const host: ActionHost = {
      state,
      say: (t) => said.push(t),
      goto: (v) => (went = v),
      openPuzzle: () => {},
      showFact: (id) => facts.push(id),
      itemName: (id) => id,
    };
    runActions(
      [
        { type: 'give', item: 'linterna' },
        { type: 'setFlag', flag: 'ok' },
        { type: 'fact', id: 'ventanas' },
        { type: 'goto', view: 'b' },
        { type: 'say', text: 'no debe salir' },
      ],
      host,
    );
    expect(state.hasItem('linterna')).toBe(true);
    expect(state.hasFlag('ok')).toBe(true);
    expect(facts).toEqual(['ventanas']);
    expect(went).toBe('b');
    expect(said).toEqual(['¡Conseguiste: linterna!']);
  });
});

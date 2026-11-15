/** Condiciones: 'flag:x', '!flag:x', 'item:x', '!item:x', 'fact:x', '!fact:x' */
export type Cond = string;

export type Action =
  | { type: 'say'; text: string }
  | { type: 'setFlag'; flag: string; value?: boolean }
  | { type: 'give'; item: string }
  | { type: 'take'; item: string }
  | { type: 'goto'; view: string }
  | { type: 'puzzle'; id: string }
  | { type: 'fact'; id: string };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UseRule {
  item: string;
  showIf?: Cond[];
  actions: Action[];
}

export interface Hotspot {
  id: string;
  label?: string;
  rect: Rect;
  showIf?: Cond[];
  actions: Action[];
  /** Reglas al usar un objeto del inventario sobre este hotspot. */
  use?: UseRule[];
}

export interface RoomView {
  id: string;
  name: string;
  background: string;
  hotspots: Hotspot[];
  onEnter?: Action[];
}

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Recipe {
  a: string;
  b: string;
  result: string;
  text: string;
}

/** Tarjeta educativa: 'story' presenta la misión; 'fact' es un dato curioso coleccionable. */
export interface FactDef {
  id: string;
  kind: 'fact' | 'story';
  title: string;
  text: string;
  button: string;
}

/** Objetivo con pistas progresivas para el botón "?". */
export interface Objective {
  id: string;
  doneIf: Cond[];
  hints: string[];
}

export interface SymbolLockPuzzle {
  type: 'symbolLock';
  title: string;
  symbols: string[];
  code: number[];
  onSolve: Action[];
  onFail: Action[];
}

export interface PatternPuzzle {
  type: 'pattern';
  title: string;
  rounds: { target: number[][] }[];
  onSolve: Action[];
}

export interface PipePuzzle {
  type: 'pipes';
  title: string;
  /** Máscaras de cada ficha: N=1, E=2, S=4, O=8. */
  tiles: number[][];
  sourceRow: number;
  targetRow: number;
  onSolve: Action[];
}

export type PuzzleDef = SymbolLockPuzzle | PatternPuzzle | PipePuzzle;

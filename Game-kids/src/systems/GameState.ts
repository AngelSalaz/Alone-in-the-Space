import type { Cond } from '../types';

type Listener = () => void;

export interface SaveData {
  flags: string[];
  items: string[];
  facts: string[];
  hintLevels: Record<string, number>;
  view: string;
}

/** Estado global del juego. Lógica pura (sin Phaser) para poder probarla con Vitest. */
export class GameState {
  flags = new Set<string>();
  items: string[] = [];
  facts = new Set<string>();
  hintLevels: Record<string, number> = {};
  currentView: string;
  private listeners: Listener[] = [];

  constructor(startView: string) {
    this.currentView = startView;
  }

  onChange(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }

  hasFlag(f: string): boolean {
    return this.flags.has(f);
  }
  setFlag(f: string, value = true): void {
    if (value) this.flags.add(f);
    else this.flags.delete(f);
    this.emit();
  }

  hasItem(id: string): boolean {
    return this.items.includes(id);
  }
  addItem(id: string): boolean {
    if (this.hasItem(id)) return false;
    this.items.push(id);
    this.emit();
    return true;
  }
  removeItem(id: string): boolean {
    const i = this.items.indexOf(id);
    if (i < 0) return false;
    this.items.splice(i, 1);
    this.emit();
    return true;
  }

  /** Marca una tarjeta como vista. Devuelve true solo la primera vez. */
  unlockFact(id: string): boolean {
    if (this.facts.has(id)) return false;
    this.facts.add(id);
    this.emit();
    return true;
  }

  hintLevel(objectiveId: string): number {
    return this.hintLevels[objectiveId] ?? 0;
  }
  /** Avanza al siguiente nivel de pista (sin pasar del último). */
  bumpHint(objectiveId: string, totalHints: number): void {
    this.hintLevels[objectiveId] = Math.min(this.hintLevel(objectiveId) + 1, totalHints - 1);
    this.emit();
  }

  setView(id: string): void {
    this.currentView = id;
    this.emit();
  }

  /** Evalúa una lista de condiciones (todas deben cumplirse). */
  check(conds?: Cond[]): boolean {
    if (!conds || conds.length === 0) return true;
    return conds.every((c) => this.evalCond(c));
  }

  private evalCond(raw: Cond): boolean {
    const negate = raw.startsWith('!');
    const c = negate ? raw.slice(1) : raw;
    const [kind, value] = c.split(':');
    let result = false;
    if (kind === 'flag') result = this.hasFlag(value);
    else if (kind === 'item') result = this.hasItem(value);
    else if (kind === 'fact') result = this.facts.has(value);
    return negate ? !result : result;
  }

  serialize(): SaveData {
    return {
      flags: [...this.flags],
      items: [...this.items],
      facts: [...this.facts],
      hintLevels: { ...this.hintLevels },
      view: this.currentView,
    };
  }

  restore(data: SaveData): void {
    this.flags = new Set(data.flags);
    this.items = [...data.items];
    this.facts = new Set(data.facts);
    this.hintLevels = { ...data.hintLevels };
    this.currentView = data.view;
    this.emit();
  }
}

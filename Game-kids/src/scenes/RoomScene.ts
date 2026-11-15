import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from '../config';
import factsData from '../data/facts.json';
import objectivesData from '../data/objectives.json';
import puzzlesData from '../data/puzzles.json';
import roomsData from '../data/rooms.json';
import { runActions } from '../systems/ActionRunner';
import type { ActionHost } from '../systems/ActionRunner';
import type { GameState } from '../systems/GameState';
import { nextHint } from '../systems/HintSystem';
import type { InventorySystem } from '../systems/InventorySystem';
import type { FactDef, Hotspot, Objective, PuzzleDef, RoomView } from '../types';
import { Dialogue } from '../ui/Dialogue';
import { Hud } from '../ui/Hud';

const ROOMS = roomsData as unknown as RoomView[];
const PUZZLES = puzzlesData as unknown as Record<string, PuzzleDef>;
const FACTS = factsData as unknown as FactDef[];
const OBJECTIVES = objectivesData as unknown as Objective[];
const TOTAL_FACTS = FACTS.filter((f) => f.kind === 'fact').length;

const PUZZLE_SCENE: Record<PuzzleDef['type'], string> = {
  symbolLock: 'LockPuzzle',
  pattern: 'PatternPuzzle',
  pipes: 'PipePuzzle',
};

interface PuzzleResult {
  id: string;
  solved: boolean;
  cancelled: boolean;
}

/** Sala point-and-click: fondo ilustrado + zonas interactivas + inventario + pistas. */
export default class RoomScene extends Phaser.Scene {
  private state!: GameState;
  private inv!: InventorySystem;
  private hud!: Hud;
  private dialogue!: Dialogue;
  private host!: ActionHost;
  private bg?: Phaser.GameObjects.Image;
  private zones: Phaser.GameObjects.GameObject[] = [];
  private outline!: Phaser.GameObjects.Graphics;
  private debugG?: Phaser.GameObjects.Graphics;
  private current?: RoomView;
  private selected: string | null = null;
  private debug = false;
  private factQueue: string[] = [];
  private factOpen = false;

  constructor() {
    super('Room');
  }

  create(): void {
    this.state = this.registry.get('state') as GameState;
    this.inv = this.registry.get('inventory') as InventorySystem;
    this.input.mouse?.disableContextMenu();
    this.debug = new URLSearchParams(window.location.search).has('debug');
    this.factQueue = [];
    this.factOpen = false;

    this.outline = this.add.graphics().setDepth(10);
    this.dialogue = new Dialogue(this);
    this.hud = new Hud(
      this,
      this.state,
      this.inv,
      TOTAL_FACTS,
      () => this.countFacts(),
      (id) => this.onInventoryClick(id),
      () => {
        this.dialogue.clear();
        this.dialogue.say(nextHint(this.state, OBJECTIVES));
      },
    );

    this.host = {
      state: this.state,
      say: (t) => this.dialogue.say(t),
      goto: (v) => this.enterView(v),
      openPuzzle: (id) => this.openPuzzle(id),
      showFact: (id) => this.showFact(id),
      itemName: (id) => this.inv.def(id).name,
    };

    const off = this.state.onChange(() => {
      this.hud.refresh();
      if (this.current) this.buildHotspots();
    });
    this.game.events.on('puzzle-result', this.onPuzzleResult, this);
    this.game.events.on('fact-closed', this.onFactClosed, this);
    this.events.once('shutdown', () => {
      off();
      this.game.events.off('puzzle-result', this.onPuzzleResult, this);
      this.game.events.off('fact-closed', this.onFactClosed, this);
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) this.select(null);
    });

    this.enterView(this.state.currentView);
    this.cameras.main.fadeIn(600, 255, 255, 255);
  }

  private countFacts(): number {
    return FACTS.filter((f) => f.kind === 'fact' && this.state.facts.has(f.id)).length;
  }

  // ---------- vistas ----------
  private enterView(id: string): void {
    const view = ROOMS.find((r) => r.id === id);
    if (!view) {
      console.warn(`Vista no encontrada: ${id}`);
      return;
    }
    this.current = view;
    if (!this.bg) this.bg = this.add.image(GAME_W / 2, GAME_H / 2, view.background).setDepth(0);
    else this.bg.setTexture(view.background);
    this.bg.setDisplaySize(GAME_W, GAME_H); // ajusta cualquier fondo 16:9 al tamaño del juego
    this.select(null);
    this.state.setView(id); // emite cambio → reconstruye zonas
    if (view.onEnter) {
      const actions = view.onEnter;
      this.time.delayedCall(50, () => runActions(actions, this.host));
    }
  }

  private buildHotspots(): void {
    for (const z of this.zones) z.destroy();
    this.zones = [];
    this.debugG?.destroy();
    this.outline.clear();
    this.hud.setHover('');
    if (!this.current) return;
    if (this.debug) this.debugG = this.add.graphics().setDepth(11);

    for (const h of this.current.hotspots) {
      if (!this.state.check(h.showIf)) continue;
      const { x, y, w, h: hh } = h.rect;
      const zone = this.add
        .zone(x + w / 2, y + hh / 2, w, hh)
        .setDepth(5)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => {
        this.outline.clear().lineStyle(4, COLORS.yellow, 0.9).strokeRoundedRect(x, y, w, hh, 10);
        this.hud.setHover(this.selected ? `Usar sobre: ${h.label ?? h.id}` : (h.label ?? ''));
      });
      zone.on('pointerout', () => {
        this.outline.clear();
        this.hud.setHover('');
      });
      zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) return;
        this.onHotspot(h);
      });
      this.zones.push(zone);
      this.debugG?.lineStyle(1, COLORS.green, 0.9).strokeRect(x, y, w, hh);
    }
  }

  // ---------- interacción ----------
  private onHotspot(h: Hotspot): void {
    this.dialogue.clear();
    if (this.selected) {
      const rule = h.use?.find((u) => u.item === this.selected && this.state.check(u.showIf));
      this.select(null);
      if (rule) runActions(rule.actions, this.host);
      else this.dialogue.say('Eso no funciona aquí. ¡Prueba con otra cosa!');
      return;
    }
    runActions(h.actions, this.host);
  }

  private onInventoryClick(id: string): void {
    this.dialogue.clear();
    if (this.selected && this.selected !== id) {
      const a = this.selected;
      this.select(null);
      const recipe = this.inv.combine(this.state, a, id);
      this.dialogue.say(recipe ? recipe.text : 'Estas dos cosas no se pueden unir.');
      return;
    }
    this.select(this.selected === id ? null : id);
  }

  private select(id: string | null): void {
    this.selected = id;
    this.hud.setSelected(id);
    this.input.setDefaultCursor(id ? 'crosshair' : 'default');
  }

  // ---------- tarjetas de datos curiosos ----------
  private showFact(id: string): void {
    if (!this.state.unlockFact(id)) return;
    this.factQueue.push(id);
    if (!this.factOpen) this.openNextFact();
  }

  private openNextFact(): void {
    const id = this.factQueue.shift();
    if (id === undefined) return;
    this.factOpen = true;
    this.scene.launch('Fact', { id });
    this.scene.pause();
  }

  private onFactClosed(): void {
    this.factOpen = false;
    if (this.factQueue.length > 0) this.openNextFact();
    else this.scene.resume();
  }

  // ---------- acertijos ----------
  private openPuzzle(id: string): void {
    const def = PUZZLES[id];
    if (!def) {
      console.warn(`Puzzle no encontrado: ${id}`);
      return;
    }
    this.scene.launch(PUZZLE_SCENE[def.type], { id });
    this.scene.pause();
  }

  private onPuzzleResult(res: PuzzleResult): void {
    this.scene.resume();
    const def = PUZZLES[res.id];
    if (!def) return;
    if (res.solved) runActions(def.onSolve, this.host);
    else if (!res.cancelled && def.type === 'symbolLock') runActions(def.onFail, this.host);
  }
}

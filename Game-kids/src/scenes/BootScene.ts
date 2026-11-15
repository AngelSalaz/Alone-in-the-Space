import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W, SAVE_KEY, START_VIEW } from '../config';
import itemsData from '../data/items.json';
import roomsData from '../data/rooms.json';
import { GameState } from '../systems/GameState';
import type { SaveData } from '../systems/GameState';
import { InventorySystem } from '../systems/InventorySystem';
import type { ItemDef, Recipe, RoomView } from '../types';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const t = this.add
      .text(GAME_W / 2, GAME_H / 2, 'Cargando…', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '24px', color: '#2b2540' })
      .setOrigin(0.5);
    this.load.on('progress', (v: number) => t.setText(`Cargando… ${Math.round(v * 100)}%`));
    for (const r of roomsData as unknown as RoomView[]) this.load.image(r.background, `art/${r.background}.png`);
  }

  create(): void {
    const state = new GameState(START_VIEW);
    const params = new URLSearchParams(window.location.search);
    if (params.has('reset')) localStorage.removeItem(SAVE_KEY);
    if (params.has('continue')) {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) state.restore(JSON.parse(raw) as SaveData);
    }
    state.onChange(() => localStorage.setItem(SAVE_KEY, JSON.stringify(state.serialize())));

    this.registry.set('state', state);
    this.registry.set('inventory', new InventorySystem(itemsData.items as ItemDef[], itemsData.recipes as Recipe[]));
    this.cameras.main.setBackgroundColor(COLORS.wall);
    this.scene.start('Room');
  }
}

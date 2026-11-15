import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from '../config';
import type { GameState } from '../systems/GameState';
import type { InventorySystem } from '../systems/InventorySystem';

const SLOT_W = 58;
const SLOT_GAP = 4;
const MAX_SLOTS = 10;

/** Capa fija: contador de datos curiosos, botón de pista (?), inventario y texto de ayuda. */
export class Hud {
  private g: Phaser.GameObjects.Graphics;
  private starLabel: Phaser.GameObjects.Text;
  private hoverLabel: Phaser.GameObjects.Text;
  private slotObjs: Phaser.GameObjects.GameObject[] = [];
  private selected: string | null = null;

  constructor(
    private scene: Phaser.Scene,
    private state: GameState,
    private inv: InventorySystem,
    private totalFacts: number,
    private countFacts: () => number,
    private onItemClick: (id: string) => void,
    onHint: () => void,
  ) {
    this.g = scene.add.graphics().setDepth(70);
    this.starLabel = scene.add
      .text(64, 28, '', { fontFamily: 'Trebuchet MS, Verdana, sans-serif', fontSize: '20px', color: '#2b2540', fontStyle: 'bold' })
      .setDepth(72);
    this.hoverLabel = scene.add
      .text(GAME_W / 2, 30, '', { fontFamily: 'Trebuchet MS, Verdana, sans-serif', fontSize: '22px', color: '#2b2540', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(72);

    // Botón de pista
    const btn = scene.add.circle(GAME_W - 46, 46, 26, COLORS.yellow).setStrokeStyle(4, COLORS.ink).setDepth(72);
    btn.setInteractive({ useHandCursor: true });
    scene.add
      .text(GAME_W - 46, 46, '?', { fontFamily: 'Trebuchet MS, Verdana, sans-serif', fontSize: '34px', color: '#2b2540', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(73);
    btn.on('pointerover', () => this.setHover('Pista'));
    btn.on('pointerout', () => this.setHover(''));
    btn.on('pointerdown', onHint);
    this.refresh();
  }

  setHover(text: string): void {
    this.hoverLabel.setText(text);
  }

  setSelected(id: string | null): void {
    this.selected = id;
    this.refresh();
  }

  private drawStar(cx: number, cy: number, r: number): void {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i++) {
      const rad = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.45;
      pts.push(new Phaser.Math.Vector2(cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)));
    }
    this.g.fillStyle(COLORS.yellow, 1).lineStyle(3, COLORS.ink, 1).fillPoints(pts, true).strokePoints(pts, true);
  }

  refresh(): void {
    const g = this.g;
    g.clear();

    // Datos curiosos
    this.drawStar(40, 40, 18);
    this.starLabel.setText(`Datos ${this.countFacts()}/${this.totalFacts}`);

    // Inventario
    for (const o of this.slotObjs) o.destroy();
    this.slotObjs = [];
    const total = MAX_SLOTS * (SLOT_W + SLOT_GAP) - SLOT_GAP;
    const x0 = (GAME_W - total) / 2;
    const y = GAME_H - 52;
    g.fillStyle(COLORS.ink, 0.85).fillRoundedRect(x0 - 10, y - 8, total + 20, 58, 10);
    for (let i = 0; i < MAX_SLOTS; i++) {
      const x = x0 + i * (SLOT_W + SLOT_GAP);
      const id = this.state.items[i];
      const sel = id !== undefined && id === this.selected;
      g.fillStyle(COLORS.cream, 1).fillRoundedRect(x, y, SLOT_W, 42, 8);
      g.lineStyle(sel ? 5 : 3, sel ? COLORS.coral : 0x6d6480).strokeRoundedRect(x, y, SLOT_W, 42, 8);
      if (id === undefined) continue;
      const def = this.inv.def(id);
      const swatch = this.scene.add
        .rectangle(x + SLOT_W / 2, y + 13, 26, 12, Phaser.Display.Color.HexStringToColor(def.color).color)
        .setStrokeStyle(2, COLORS.ink)
        .setDepth(72);
      const label = this.scene.add
        .text(x + SLOT_W / 2, y + 30, def.name.slice(0, 11), { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '10px', color: '#2b2540' })
        .setOrigin(0.5)
        .setDepth(72);
      const hit = this.scene.add
        .rectangle(x + SLOT_W / 2, y + 21, SLOT_W, 42, 0xffffff, 0.001)
        .setDepth(73)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.setHover(`${def.name}: ${def.description}`));
      hit.on('pointerout', () => this.setHover(''));
      hit.on('pointerdown', () => this.onItemClick(id));
      this.slotObjs.push(swatch, label, hit);
    }
  }
}

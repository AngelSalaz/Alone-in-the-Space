import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from '../config';
import factsData from '../data/facts.json';
import type { FactDef } from '../types';

const FACTS = factsData as unknown as FactDef[];
const FONT = 'Trebuchet MS, Verdana, sans-serif';

/** Tarjeta educativa a pantalla completa (misión o dato curioso). */
export default class FactScene extends Phaser.Scene {
  private factId = '';

  constructor() {
    super('Fact');
  }

  init(data: { id: string }): void {
    this.factId = data.id;
  }

  create(): void {
    const f = FACTS.find((x) => x.id === this.factId);
    if (!f) {
      this.close();
      return;
    }
    const cx = GAME_W / 2;
    const cy = GAME_H / 2;
    this.add.rectangle(cx, cy, GAME_W, GAME_H, 0x1d2a5b, 0.6).setInteractive();
    this.add.rectangle(cx, cy, 880, 440, COLORS.cream).setStrokeStyle(6, COLORS.ink);

    const badge = f.kind === 'fact' ? '¡DATO CURIOSO!' : 'TU MISIÓN';
    this.add.rectangle(cx, cy - 190, 300, 46, f.kind === 'fact' ? COLORS.teal : COLORS.coral).setStrokeStyle(4, COLORS.ink);
    this.add.text(cx, cy - 190, badge, { fontFamily: FONT, fontSize: '24px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(cx, cy - 125, f.title, { fontFamily: FONT, fontSize: '36px', color: '#2b2540', fontStyle: 'bold', align: 'center', wordWrap: { width: 800 } })
      .setOrigin(0.5);
    this.add
      .text(cx, cy - 10, f.text, { fontFamily: FONT, fontSize: '26px', color: '#2b2540', align: 'center', wordWrap: { width: 780 }, lineSpacing: 8 })
      .setOrigin(0.5);

    const btn = this.add
      .rectangle(cx, cy + 175, 260, 56, COLORS.yellow)
      .setStrokeStyle(5, COLORS.ink)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 175, f.button, { fontFamily: FONT, fontSize: '26px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5);
    btn.on('pointerdown', () => this.close());
    this.input.keyboard?.once('keydown-ENTER', () => this.close());
  }

  private close(): void {
    this.game.events.emit('fact-closed');
    this.scene.stop();
  }
}

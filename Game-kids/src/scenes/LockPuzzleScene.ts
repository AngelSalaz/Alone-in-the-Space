import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from '../config';
import puzzlesData from '../data/puzzles.json';
import { checkCode, wrapDigit } from '../systems/LockLogic';
import type { PuzzleDef, SymbolLockPuzzle } from '../types';

const PUZZLES = puzzlesData as unknown as Record<string, PuzzleDef>;
const FONT = 'Trebuchet MS, Verdana, sans-serif';

/** Cerradura de símbolos (ruedas 0-9). Se muestra sobre la sala, que queda en pausa. */
export default class LockPuzzleScene extends Phaser.Scene {
  private puzzleId = '';
  private def!: SymbolLockPuzzle;
  private digits: number[] = [];
  private digitTexts: Phaser.GameObjects.Text[] = [];
  private message!: Phaser.GameObjects.Text;

  constructor() {
    super('LockPuzzle');
  }

  init(data: { id: string }): void {
    this.puzzleId = data.id;
  }

  create(): void {
    const d = PUZZLES[this.puzzleId];
    if (d.type !== 'symbolLock') throw new Error(`El puzzle ${this.puzzleId} no es una cerradura`);
    this.def = d;
    this.digits = d.symbols.map(() => 0);
    this.digitTexts = [];

    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1d2a5b, 0.6).setInteractive();
    this.add.rectangle(GAME_W / 2, GAME_H / 2, 800, 440, COLORS.cream).setStrokeStyle(6, COLORS.ink);
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 185, d.title, { fontFamily: FONT, fontSize: '28px', color: '#2b2540', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 150, 'Cada dibujo es un número. ¡Elige el código!', { fontFamily: FONT, fontSize: '20px', color: '#6d6480' })
      .setOrigin(0.5);

    d.symbols.forEach((sym, i) => {
      const cx = GAME_W / 2 + (i - (d.symbols.length - 1) / 2) * 230;
      const cy = GAME_H / 2 - 30;
      this.add.rectangle(cx, cy - 60, 120, 100, 0xffffff).setStrokeStyle(4, COLORS.ink);
      this.drawIcon(sym, cx, cy - 60);
      this.add.text(cx, cy - 2, sym.toUpperCase(), { fontFamily: FONT, fontSize: '16px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5);
      const t = this.add.text(cx, cy + 55, '0', { fontFamily: FONT, fontSize: '64px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5);
      this.digitTexts.push(t);
      this.arrow(cx, cy + 12, true, i);
      this.arrow(cx, cy + 106, false, i);
    });

    this.message = this.add
      .text(GAME_W / 2, GAME_H / 2 + 140, '', { fontFamily: FONT, fontSize: '22px', color: '#c0392b', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.button(GAME_W / 2 - 120, GAME_H / 2 + 185, 'ABRIR', COLORS.yellow, () => this.tryOpen());
    this.button(GAME_W / 2 + 120, GAME_H / 2 + 185, 'SALIR', COLORS.grey, () => this.finish(false, true));
    this.input.keyboard?.on('keydown-ESC', () => this.finish(false, true));
  }

  private arrow(x: number, y: number, up: boolean, index: number): void {
    const tri = this.add
      .triangle(x, y, 0, up ? 18 : 0, 18, up ? 18 : 0, 9, up ? 0 : 18, COLORS.coral)
      .setStrokeStyle(3, COLORS.ink)
      .setScale(1.7)
      .setInteractive({ useHandCursor: true });
    tri.on('pointerdown', () => {
      this.digits[index] = wrapDigit(this.digits[index], up ? 1 : -1);
      this.digitTexts[index].setText(String(this.digits[index]));
      this.message.setText('');
    });
  }

  private button(x: number, y: number, label: string, color: number, cb: () => void): void {
    const r = this.add.rectangle(x, y, 180, 48, color).setStrokeStyle(4, COLORS.ink).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: FONT, fontSize: '22px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5);
    r.on('pointerdown', cb);
  }

  private tryOpen(): void {
    if (checkCode(this.def.code, this.digits)) {
      this.finish(true, false);
      return;
    }
    const fail = this.def.onFail.find((a) => a.type === 'say');
    this.message.setText(fail && fail.type === 'say' ? fail.text : 'No abre. ¡Inténtalo otra vez!');
    this.cameras.main.shake(160, 0.004);
  }

  private finish(solved: boolean, cancelled: boolean): void {
    this.game.events.emit('puzzle-result', { id: this.puzzleId, solved, cancelled });
    this.scene.stop();
  }

  /** Iconos simples de ventana, estación (asiento) y litera. */
  private drawIcon(kind: string, cx: number, cy: number): void {
    const g = this.add.graphics().lineStyle(4, COLORS.ink);
    if (kind === 'ventana') {
      g.strokeRect(cx - 26, cy - 20, 52, 40).lineBetween(cx, cy - 20, cx, cy + 20).lineBetween(cx - 26, cy, cx + 26, cy);
    } else if (kind === 'estación') {
      g.strokeRoundedRect(cx - 20, cy - 30, 40, 30, 8).strokeRoundedRect(cx - 28, cy - 2, 56, 24, 6);
    } else {
      g.strokeRoundedRect(cx - 34, cy - 14, 68, 28, 13).strokeCircle(cx - 20, cy, 8);
    }
  }
}

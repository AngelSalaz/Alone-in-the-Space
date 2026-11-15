import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from '../config';
import puzzlesData from '../data/puzzles.json';
import { E, N, S, W, analyze, rotate } from '../systems/PipeLogic';
import type { PipePuzzle, PuzzleDef } from '../types';

const PUZZLES = puzzlesData as unknown as Record<string, PuzzleDef>;
const FONT = 'Trebuchet MS, Verdana, sans-serif';
export const TILE = 120;

/** Tablero de tuberías: gira las piezas para llevar el hidrógeno del tanque a la celda. */
export default class PipePuzzleScene extends Phaser.Scene {
  private puzzleId = '';
  private def!: PipePuzzle;
  private tiles: number[][] = [];
  private g!: Phaser.GameObjects.Graphics;
  private msg!: Phaser.GameObjects.Text;
  private locked = false;

  constructor() {
    super('PipePuzzle');
  }

  init(data: { id: string }): void {
    this.puzzleId = data.id;
  }

  private get rows(): number {
    return this.tiles.length;
  }
  private get cols(): number {
    return this.tiles[0].length;
  }
  private get gx(): number {
    return GAME_W / 2 - (this.cols * TILE) / 2;
  }
  private get gy(): number {
    return 320 - (this.rows * TILE) / 2;
  }

  create(): void {
    const d = PUZZLES[this.puzzleId];
    if (d.type !== 'pipes') throw new Error(`El puzzle ${this.puzzleId} no es un tablero de tuberías`);
    this.def = d;
    this.tiles = d.tiles.map((r) => [...r]);
    this.locked = false;

    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1d2a5b, 0.6).setInteractive();
    this.add.rectangle(GAME_W / 2, GAME_H / 2, 1080, 540, COLORS.cream).setStrokeStyle(6, COLORS.ink);
    this.add.text(GAME_W / 2, 102, d.title, { fontFamily: FONT, fontSize: '30px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 136, 'Toca una pieza para girarla y une el tanque con la celda.', { fontFamily: FONT, fontSize: '20px', color: '#6d6480' })
      .setOrigin(0.5);
    this.msg = this.add.text(GAME_W / 2, 528, '', { fontFamily: FONT, fontSize: '24px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5);
    this.g = this.add.graphics();

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const zone = this.add
          .zone(this.gx + c * TILE + TILE / 2, this.gy + r * TILE + TILE / 2, TILE, TILE)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => this.rotateTile(r, c));
      }
    }

    const btn = this.add.rectangle(GAME_W / 2, 576, 200, 44, COLORS.grey).setStrokeStyle(4, COLORS.ink).setInteractive({ useHandCursor: true });
    this.add.text(GAME_W / 2, 576, 'SALIR', { fontFamily: FONT, fontSize: '22px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5);
    btn.on('pointerdown', () => this.finish(false, true));
    this.input.keyboard?.on('keydown-ESC', () => this.finish(false, true));
    this.draw();
  }

  private rotateTile(r: number, c: number): void {
    if (this.locked) return;
    this.tiles[r][c] = rotate(this.tiles[r][c]);
    this.draw();
    if (analyze(this.tiles, this.def.sourceRow, this.def.targetRow).connected) {
      this.locked = true;
      this.msg.setText('¡Conectado! El hidrógeno llega a la celda.');
      this.time.delayedCall(1100, () => this.finish(true, false));
    }
  }

  private draw(): void {
    const g = this.g;
    g.clear();
    const res = analyze(this.tiles, this.def.sourceRow, this.def.targetRow);
    const cyOf = (row: number) => this.gy + row * TILE + TILE / 2;
    const flow = (on: boolean) => (on ? COLORS.yellow : COLORS.teal);

    // Tanque y celda
    const sy = cyOf(this.def.sourceRow);
    const ty = cyOf(this.def.targetRow);
    g.fillStyle(0x6fa8dc, 1).lineStyle(5, COLORS.ink).fillRoundedRect(this.gx - 170, sy - 60, 110, 120, 30).strokeRoundedRect(this.gx - 170, sy - 60, 110, 120, 30);
    g.fillStyle(res.connected ? COLORS.green : 0xcfd6c2, 1)
      .lineStyle(5, COLORS.ink)
      .fillRoundedRect(this.gx + this.cols * TILE + 60, ty - 60, 110, 120, 14)
      .strokeRoundedRect(this.gx + this.cols * TILE + 60, ty - 60, 110, 120, 14);
    g.lineStyle(22, flow(true)).lineBetween(this.gx - 60, sy, this.gx, sy);
    g.lineStyle(22, flow(res.connected)).lineBetween(this.gx + this.cols * TILE, ty, this.gx + this.cols * TILE + 60, ty);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = this.gx + c * TILE;
        const y = this.gy + r * TILE;
        const cx = x + TILE / 2;
        const cy = y + TILE / 2;
        const m = this.tiles[r][c];
        const on = res.visited.has(`${r},${c}`);
        g.fillStyle(0xfffaf0, 1).lineStyle(4, COLORS.ink).fillRoundedRect(x + 4, y + 4, TILE - 8, TILE - 8, 12).strokeRoundedRect(x + 4, y + 4, TILE - 8, TILE - 8, 12);
        g.lineStyle(22, flow(on));
        if (m & N) g.lineBetween(cx, cy, cx, y + 4);
        if (m & E) g.lineBetween(cx, cy, x + TILE - 4, cy);
        if (m & S) g.lineBetween(cx, cy, cx, y + TILE - 4);
        if (m & W) g.lineBetween(cx, cy, x + 4, cy);
        if (m) g.fillStyle(flow(on), 1).fillCircle(cx, cy, 11);
      }
    }
  }

  private finish(solved: boolean, cancelled: boolean): void {
    this.game.events.emit('puzzle-result', { id: this.puzzleId, solved, cancelled });
    this.scene.stop();
  }
}

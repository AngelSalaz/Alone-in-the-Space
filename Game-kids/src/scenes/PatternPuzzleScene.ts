import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from '../config';
import puzzlesData from '../data/puzzles.json';
import { emptyBoard, patternMismatches } from '../systems/PatternLogic';
import type { PatternPuzzle, PuzzleDef } from '../types';

const PUZZLES = puzzlesData as unknown as Record<string, PuzzleDef>;
const FONT = 'Trebuchet MS, Verdana, sans-serif';
export const CELL = 96;
export const GAP = 12;

/** Panel de interruptores: copia el dibujo encendiendo y apagando casillas. */
export default class PatternPuzzleScene extends Phaser.Scene {
  private puzzleId = '';
  private def!: PatternPuzzle;
  private round = 0;
  private board: number[][] = [];
  private cells: Phaser.GameObjects.Rectangle[][] = [];
  private dyn: Phaser.GameObjects.GameObject[] = [];
  private msg!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private locked = false;

  constructor() {
    super('PatternPuzzle');
  }

  init(data: { id: string }): void {
    this.puzzleId = data.id;
  }

  create(): void {
    const d = PUZZLES[this.puzzleId];
    if (d.type !== 'pattern') throw new Error(`El puzzle ${this.puzzleId} no es un panel de interruptores`);
    this.def = d;
    this.round = 0;
    this.locked = false;

    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1d2a5b, 0.6).setInteractive();
    this.add.rectangle(GAME_W / 2, GAME_H / 2, 1000, 540, COLORS.cream).setStrokeStyle(6, COLORS.ink);
    this.add.text(GAME_W / 2, 105, d.title, { fontFamily: FONT, fontSize: '30px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5);
    this.roundText = this.add.text(GAME_W / 2, 138, '', { fontFamily: FONT, fontSize: '20px', color: '#6d6480' }).setOrigin(0.5);
    this.msg = this.add.text(GAME_W / 2, 528, '', { fontFamily: FONT, fontSize: '22px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5);
    this.button(380, 572, 'COMPROBAR', COLORS.yellow, () => this.check());
    this.button(820, 572, 'SALIR', COLORS.grey, () => this.finish(false, true));
    this.input.keyboard?.on('keydown-ESC', () => this.finish(false, true));
    this.buildRound();
  }

  private button(x: number, y: number, label: string, color: number, cb: () => void): void {
    const r = this.add.rectangle(x, y, 220, 48, color).setStrokeStyle(4, COLORS.ink).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: FONT, fontSize: '22px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5);
    r.on('pointerdown', cb);
  }

  private buildRound(): void {
    for (const o of this.dyn) o.destroy();
    this.dyn = [];
    this.cells = [];
    const target = this.def.rounds[this.round].target;
    const size = target.length;
    this.board = emptyBoard(size);
    this.roundText.setText(`Panel ${this.round + 1} de ${this.def.rounds.length}`);

    // Tablero del jugador (centro en x=380)
    const gridW = size * CELL + (size - 1) * GAP;
    const gx = 380 - gridW / 2;
    const gy = 342 - gridW / 2;
    this.dyn.push(this.add.text(380, gy - 22, 'TU PANEL', { fontFamily: FONT, fontSize: '20px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5));
    for (let r = 0; r < size; r++) {
      this.cells.push([]);
      for (let c = 0; c < size; c++) {
        const cell = this.add
          .rectangle(gx + c * (CELL + GAP) + CELL / 2, gy + r * (CELL + GAP) + CELL / 2, CELL, CELL, 0x39446e)
          .setStrokeStyle(5, COLORS.ink)
          .setInteractive({ useHandCursor: true });
        cell.on('pointerdown', () => this.toggle(r, c));
        this.cells[r].push(cell);
        this.dyn.push(cell);
      }
    }

    // Dibujo objetivo (centro en x=820)
    const pc = 70;
    const pg = 8;
    const pw = size * pc + (size - 1) * pg;
    const px = 820 - pw / 2;
    const py = 342 - pw / 2;
    this.dyn.push(this.add.text(820, py - 22, 'DIBUJO', { fontFamily: FONT, fontSize: '20px', color: '#2b2540', fontStyle: 'bold' }).setOrigin(0.5));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        this.dyn.push(
          this.add
            .rectangle(px + c * (pc + pg) + pc / 2, py + r * (pc + pg) + pc / 2, pc, pc, target[r][c] ? COLORS.yellow : 0x39446e)
            .setStrokeStyle(4, COLORS.ink),
        );
      }
    }
    this.msg.setText('Deja tu panel igual que el dibujo.');
  }

  private toggle(r: number, c: number): void {
    if (this.locked) return;
    this.board[r][c] = this.board[r][c] ? 0 : 1;
    this.cells[r][c].setFillStyle(this.board[r][c] ? COLORS.yellow : 0x39446e).setStrokeStyle(5, COLORS.ink);
  }

  private check(): void {
    if (this.locked) return;
    const target = this.def.rounds[this.round].target;
    const wrong = patternMismatches(this.board, target);
    if (wrong.length === 0) {
      if (this.round + 1 < this.def.rounds.length) {
        this.locked = true;
        this.msg.setText('¡Muy bien! Ahora el siguiente panel.');
        this.time.delayedCall(900, () => {
          this.round += 1;
          this.locked = false;
          this.buildRound();
        });
      } else {
        this.locked = true;
        this.msg.setText('¡Perfecto! Todos los interruptores están bien.');
        this.time.delayedCall(900, () => this.finish(true, false));
      }
      return;
    }
    for (const [r, c] of wrong) this.cells[r][c].setStrokeStyle(8, COLORS.red);
    this.msg.setText('Casi… Las casillas con borde rojo no coinciden con el dibujo.');
    this.time.delayedCall(1200, () => {
      for (const [r, c] of wrong) this.cells[r]?.[c]?.setStrokeStyle(5, COLORS.ink);
    });
  }

  private finish(solved: boolean, cancelled: boolean): void {
    this.game.events.emit('puzzle-result', { id: this.puzzleId, solved, cancelled });
    this.scene.stop();
  }
}

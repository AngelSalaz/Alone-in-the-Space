import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from '../config';

/** Cuadro de texto inferior con cola de mensajes. No captura clics; Espacio para saltar. */
export class Dialogue {
  private box: Phaser.GameObjects.Rectangle;
  private txt: Phaser.GameObjects.Text;
  private queue: string[] = [];
  private busy = false;
  private timer?: Phaser.Time.TimerEvent;

  constructor(private scene: Phaser.Scene) {
    const y = GAME_H - 135;
    this.box = scene.add
      .rectangle(GAME_W / 2, y, 960, 64, COLORS.cream, 0.95)
      .setStrokeStyle(4, COLORS.ink)
      .setDepth(60)
      .setVisible(false);
    this.txt = scene.add
      .text(GAME_W / 2, y, '', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '24px',
        color: '#2b2540',
        align: 'center',
        wordWrap: { width: 920 },
      })
      .setOrigin(0.5)
      .setDepth(61)
      .setVisible(false);
    scene.input.keyboard?.on('keydown-SPACE', () => this.skip());
  }

  /** Descarta los mensajes pendientes (se llama al empezar una nueva acción del jugador). */
  clear(): void {
    this.queue = [];
    this.timer?.remove();
    this.busy = false;
    this.box.setVisible(false);
    this.txt.setVisible(false);
  }

  say(text: string): void {
    this.queue.push(text);
    if (!this.busy) this.next();
  }

  private next(): void {
    const t = this.queue.shift();
    if (t === undefined) {
      this.busy = false;
      this.box.setVisible(false);
      this.txt.setVisible(false);
      return;
    }
    this.busy = true;
    this.txt.setText(t).setVisible(true);
    this.box.setVisible(true).setSize(960, Math.max(64, this.txt.height + 28));
    this.timer = this.scene.time.delayedCall(2200 + t.length * 55, () => this.next());
  }

  skip(): void {
    this.timer?.remove();
    this.next();
  }
}

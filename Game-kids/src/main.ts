import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from './config';
import BootScene from './scenes/BootScene';
import FactScene from './scenes/FactScene';
import LockPuzzleScene from './scenes/LockPuzzleScene';
import PatternPuzzleScene from './scenes/PatternPuzzleScene';
import PipePuzzleScene from './scenes/PipePuzzleScene';
import RoomScene from './scenes/RoomScene';

const params = new URLSearchParams(window.location.search);

const game = new Phaser.Game({
  // ?canvas fuerza el modo Canvas (útil en equipos sin aceleración gráfica)
  type: params.has('canvas') ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: COLORS.wall,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, RoomScene, FactScene, LockPuzzleScene, PatternPuzzleScene, PipePuzzleScene],
});

// Solo para depurar en el navegador: añade ?debug a la URL.
if (params.has('debug')) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}

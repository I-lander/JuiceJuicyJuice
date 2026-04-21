import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { UIScene } from './scenes/UIScene';
import { EpilepsyWarningScene } from './scenes/EpilepsyWarningScene';
import { LoadingScene } from './scenes/LoadingScene';
import { TitleScene } from './scenes/TitleScene';

Phaser.GameObjects.TextStyle.prototype.syncStyle = function (
  this: { color: string; stroke: string; strokeThickness: number },
  _canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) {
  context.textBaseline = 'alphabetic';
  context.fillStyle = this.color;
  context.strokeStyle = this.stroke;
  context.lineWidth = this.strokeThickness;
  context.lineCap = 'butt';
  context.lineJoin = 'miter';
  context.miterLimit = 10;
};

export function initPhaserGame() {
  window.splashStartTime = Date.now();

  const isPortrait = window.innerHeight > window.innerWidth;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    width: isPortrait ? 1440 : 2560,
    height: isPortrait ? 2560 : 1440,
    backgroundColor: '#000000',
    antialias: false,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      zoom: 1,
    },
    disableContextMenu: true,
    parent: 'game-container',
    scene: [LoadingScene, EpilepsyWarningScene, TitleScene, MainScene, UIScene],
    powerPreference: 'high-performance',
    autoMobilePipeline: true,
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
  };

  new Phaser.Game(config);
}

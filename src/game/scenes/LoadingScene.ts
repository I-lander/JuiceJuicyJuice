import { spriteAtlas } from '../elements/SpriteAtlas';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  preload() {
    document.fonts.load('16px "KenneyPixel"').then(() => {});

    this.load.atlas('spriteAtlas', './assets/images/sprite-atlas.png', spriteAtlas);
  }

  async create() {
    this.scene.start('MainScene');
    this.scene.start('UIScene');
    this.scene.bringToTop('UIScene');
  }
}

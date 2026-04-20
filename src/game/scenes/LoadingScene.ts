import { particleAtlas } from '../elements/Particles';
import { spriteAtlas } from '../elements/SpriteAtlas';
import { uiAtlas } from '../elements/UiAtlas';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  preload() {
    document.fonts.load('16px "KenneyPixel"').then(() => {});

    this.load.atlas('spriteAtlas', './assets/images/sprite-atlas.png', spriteAtlas);
    this.load.atlas('particleAtlas', './assets/images/particle-atlas.png', particleAtlas);
    this.load.atlas('uiAtlas', './assets/images/ui-atlas.png', uiAtlas);
    this.load.audio('bgMusic', './assets/music/ambient_loop.wav');
    this.load.audio('clickParticles', './assets/sounds/click_particles.wav');
    this.load.audio('wallBounce', './assets/sounds/wall_bounce.wav');
    this.load.audio('spriteBounce', './assets/sounds/sprite_bounce.wav');
    this.load.audio('buttonClick', './assets/sounds/button_click.wav');
    this.load.audio('purchase', './assets/sounds/purchase.wav');
  }

  async create() {
    this.scene.start('TitleScene');
  }
}

import {
  discoverParticleFrames,
  PARTICLE_ATLAS_CELL_SIZE,
  PARTICLE_ATLAS_KEY,
} from '../elements/Particles';
import {
  discoverSpriteFrames,
  SPRITE_ATLAS_CELL_SIZE,
  SPRITE_ATLAS_KEY,
} from '../elements/SpriteAtlas';
import { uiAtlas } from '../elements/UiAtlas';
import { WARNING_DISMISSED_KEY } from './EpilepsyWarningScene';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  preload() {
    document.fonts.load('16px "KenneyPixel"').then(() => {});

    this.load.spritesheet(SPRITE_ATLAS_KEY, './assets/images/sprite-atlas.png', {
      frameWidth: SPRITE_ATLAS_CELL_SIZE,
      frameHeight: SPRITE_ATLAS_CELL_SIZE,
    });
    this.load.spritesheet(PARTICLE_ATLAS_KEY, './assets/images/particle-atlas.png', {
      frameWidth: PARTICLE_ATLAS_CELL_SIZE,
      frameHeight: PARTICLE_ATLAS_CELL_SIZE,
    });
    this.load.atlas('uiAtlas', './assets/images/ui-atlas.png', uiAtlas);
    this.load.audio('bgMusic', './assets/music/funky_loop.wav');
    this.load.audio('clickParticles', './assets/sounds/click_particles.wav');
    this.load.audio('wallBounce', './assets/sounds/wall_bounce.wav');
    this.load.audio('spriteBounce', './assets/sounds/sprite_bounce.wav');
    this.load.audio('buttonClick', './assets/sounds/button_click.wav');
    this.load.audio('purchase', './assets/sounds/purchase.wav');
  }

  async create() {
    discoverSpriteFrames(this);
    discoverParticleFrames(this);
    const warningDismissed = localStorage.getItem(WARNING_DISMISSED_KEY) === 'true';
    this.scene.start(warningDismissed ? 'TitleScene' : 'EpilepsyWarningScene');
  }
}

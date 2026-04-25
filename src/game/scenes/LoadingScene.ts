import {
  PARTICLE_ATLAS_CELL_SIZE,
  PARTICLE_ATLAS_KEY,
  setParticleFrames,
} from '../elements/Particles';
import {
  SPRITE_ATLAS_CELL_SIZE,
  SPRITE_ATLAS_KEY,
  setSpriteFrames,
} from '../elements/SpriteAtlas';
import { uiAtlas } from '../elements/UiAtlas';
import { WARNING_DISMISSED_KEY } from './EpilepsyWarningScene';

const ATLAS_FRAMES_KEY = 'atlasFrames';

interface AtlasFramesData {
  sprite: number[];
  particle: number[];
}

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
    this.load.json(ATLAS_FRAMES_KEY, './assets/data/atlas-frames.json');
    this.load.atlas('uiAtlas', './assets/images/ui-atlas.png', uiAtlas);
    this.load.audio('bgMusic', './assets/music/funky_loop.wav');
    this.load.audio('prestigeMusic', './assets/music/prestige_loop.wav');
    this.load.audio('clickParticles', './assets/sounds/click_particles.wav');
    this.load.audio('wallBounce', './assets/sounds/wall_bounce.wav');
    this.load.audio('spriteBounce', './assets/sounds/sprite_bounce.wav');
    this.load.audio('buttonClick', './assets/sounds/button_click.wav');
    this.load.audio('purchase', './assets/sounds/purchase.wav');
  }

  async create() {
    const atlasFrames = this.cache.json.get(ATLAS_FRAMES_KEY) as AtlasFramesData;
    setSpriteFrames(atlasFrames.sprite);
    setParticleFrames(atlasFrames.particle);
    const warningDismissed = localStorage.getItem(WARNING_DISMISSED_KEY) === 'true';
    this.scene.start(warningDismissed ? 'TitleScene' : 'EpilepsyWarningScene');
  }
}

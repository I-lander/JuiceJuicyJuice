import { MainScene } from '../scenes/MainScene';
import { Particle } from './Particle';
import { SPRITE_BASE_UNIT } from '../utils/utils';
import { Progression } from '../Progression';

export class Sprite extends Phaser.GameObjects.Sprite {
  particles: Particle[] = [];

  constructor(scene: MainScene, x: number, y: number) {
    super(scene, x, y, 'spriteAtlas', '');

    this.x = x;
    this.y = y;
    this.setScale(scene.tileSize / SPRITE_BASE_UNIT);
    scene.add.existing(this);

    this.setInteractive();
    this.on('pointerdown', () => {
      this.onClick();
    });
  }

  init(texture: string) {
    this.setTexture('spriteAtlas', texture);
  }

  onClick() {
    this.spawnParticles();
  }

  spawnParticles() {
    const scene = this.scene as MainScene;
    for (let i = 0; i < Progression.particlesPerClick; i++) {
      if (scene.getTotalParticleCount() >= Progression.maxParticles) {
        return;
      }
      this.particles.push(new Particle(scene, this.x, this.y, 'particle'));
    }
  }

  update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const alive = this.particles[i].update(delta);
      if (!alive) {
        this.particles.splice(i, 1);
      }
    }
  }
}

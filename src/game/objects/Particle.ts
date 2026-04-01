import { MainScene } from '../scenes/MainScene';
import { SPRITE_BASE_UNIT } from '../utils/utils';

const GRAVITY = 300;
const LIFESPAN = 500;

export class Particle extends Phaser.GameObjects.Image {
  scene: MainScene;
  private vx: number;
  private vy: number;
  private life: number = 0;
  private maxLife: number;

  constructor(scene: MainScene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.scene = scene;

    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 120;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 100;
    this.maxLife = LIFESPAN;

    this.setScale(scene.tileSize / SPRITE_BASE_UNIT);
    scene.add.existing(this);
  }

  update(delta: number) {
    const dt = delta / 1000;
    this.life += delta;

    if (this.life >= this.maxLife) {
      this.destroy();
      return false;
    }

    this.vy += GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.setAlpha(1 - this.life / this.maxLife);

    return true;
  }

  static createTexture(scene: MainScene) {
    if (scene.textures.exists('particle')) return;
    const pixelUnit = scene.pixelUnit;
    const PARTICLE_SIZE = pixelUnit * 4;
    const g = scene.make.graphics();
    g.fillStyle(0xffffff);
    g.fillRect(0, pixelUnit, PARTICLE_SIZE, PARTICLE_SIZE / 2);
    g.fillRect(pixelUnit, 0, PARTICLE_SIZE / 2, PARTICLE_SIZE);
    g.generateTexture('particle', PARTICLE_SIZE, PARTICLE_SIZE);
    g.destroy();
  }
}

import { MainScene } from '../scenes/MainScene';
import { Particle } from './Particle';
import { SPRITE_BASE_UNIT } from '../utils/utils';
import { Progression } from '../Progression';

export class Sprite extends Phaser.GameObjects.Sprite {
  particles: Particle[] = [];
  scene: MainScene;

  originalScale: number;
  velocity: { x: number; y: number };
  speed: number;

  constructor(scene: MainScene, x: number, y: number) {
    super(scene, x, y, 'spriteAtlas', '');
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.speed = 3 + Math.random() * 3;
    this.originalScale = this.scene.tileSize / SPRITE_BASE_UNIT;
    this.setScale(this.originalScale);
    scene.add.existing(this);

    this.setInteractive();
    this.on('pointerdown', () => {
      this.onClick();
    });

    this.velocity = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 };
  }

  init(texture: string) {
    this.setTexture('spriteAtlas', texture);
  }

  onClick() {
    this.spawnParticles();
    this.bounce();
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

  bounce() {
    if (Progression.isBounceEnabled) {
      const bounceAmount = 0.2;
      this.scene.tweens.add({
        targets: this,
        scale: this.scale * (1 + bounceAmount),
        yoyo: true,
        duration: 100,
        ease: 'Power1',
        onComplete: () => {
          this.setScale(this.originalScale);
        },
      });
    }
  }

  move(delta: number) {
    this.x += this.velocity.x * this.speed * (delta / 1000);
    this.y += this.velocity.y * this.speed * (delta / 1000);

    if (this.x < 0) {
      this.x = 0;
      this.velocity.x *= -1;
    } else if (this.x > this.scene.canvasWidth) {
      this.x = this.scene.canvasWidth;
      this.velocity.x *= -1;
    }
    if (this.y < 0) {
      this.y = 0;
      this.velocity.y *= -1;
    } else if (this.y > this.scene.canvasHeight) {
      this.y = this.scene.canvasHeight;
      this.velocity.y *= -1;
    }

    if (Progression.isSpriteCollisionEnabled) {
      this.handleCollisions();
    }
  }

  handleCollisions() {
    const otherSprites = this.scene.sprites.filter((s) => s !== this);
    for (const other of otherSprites) {
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.width * this.scale) {
        const angle = Math.atan2(dy, dx);
        const overlap = (this.width * this.scale - distance) / 2;
        const moveX = Math.cos(angle) * overlap;
        const moveY = Math.sin(angle) * overlap;

        this.x -= moveX;
        this.y -= moveY;
        other.x += moveX;
        other.y += moveY;

        const vxTotal = this.velocity.x - other.velocity.x;
        const vyTotal = this.velocity.y - other.velocity.y;

        this.velocity.x =
          (this.velocity.x * (this.speed - 1) + other.velocity.x * (other.speed - 1) + vxTotal) /
          (this.speed + other.speed - 2);
        this.velocity.y =
          (this.velocity.y * (this.speed - 1) + other.velocity.y * (other.speed - 1) + vyTotal) /
          (this.speed + other.speed - 2);
        other.velocity.x =
          (other.velocity.x * (other.speed - 1) + this.velocity.x * (this.speed - 1) - vxTotal) /
          (this.speed + other.speed - 2);
        other.velocity.y =
          (other.velocity.y * (other.speed - 1) + this.velocity.y * (this.speed - 1) - vyTotal) /
          (this.speed + other.speed - 2);
      }
    }
  }

  update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const alive = this.particles[i].update(delta);
      if (!alive) {
        this.particles.splice(i, 1);
      }
    }
    if (Progression.isSpriteMovementEnabled) {
      this.move(delta);
    }
  }
}

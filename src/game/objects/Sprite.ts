import { MainScene } from '../scenes/MainScene';
import { SPRITE_BASE_UNIT } from '../utils/utils';
import { Progression } from '../Progression';
import { PARTICLE_CONFIG } from '../elements/Particles';

export class Sprite extends Phaser.GameObjects.Sprite {
  particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  scene: MainScene;

  originalScale: number;
  velocity: { x: number; y: number };
  speed: number;

  constructor(scene: MainScene, x: number, y: number) {
    super(scene, x, y, 'spriteAtlas', '');
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.speed = 100 + Math.random() * 50;
    this.originalScale = this.scene.tileSize / SPRITE_BASE_UNIT;
    this.setScale(this.originalScale);
    scene.add.existing(this);

    this.particleEmitter = scene.add.particles(0, 0, 'particleAtlas', {
      ...PARTICLE_CONFIG,
      scale: scene.tileSize / SPRITE_BASE_UNIT,
    });

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
    const totalParticles = scene.getTotalParticleCount();
    const fragmentsToAdd = Math.min(
      Progression.particlesPerClick,
      Progression.maxParticles - totalParticles,
    );

    if (fragmentsToAdd <= 0) return;

    Progression.fragments += fragmentsToAdd;
    Progression.addExperience(fragmentsToAdd);

    const visualParticles = Math.min(fragmentsToAdd, Progression.maxParticlesPerSpawn);
    this.particleEmitter.explode(visualParticles, this.x, this.y);
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
    const radius = (this.width * this.scale) / 2;
    this.x += this.velocity.x * this.speed * (delta / 1000);
    this.y += this.velocity.y * this.speed * (delta / 1000);

    if (this.x < radius) {
      this.x = radius;
      this.velocity.x *= -1;
    } else if (this.x > this.scene.canvasWidth - radius) {
      this.x = this.scene.canvasWidth - radius;
      this.velocity.x *= -1;
    }
    if (this.y < radius) {
      this.y = radius;
      this.velocity.y *= -1;
    } else if (this.y > this.scene.canvasHeight - radius) {
      this.y = this.scene.canvasHeight - radius;
      this.velocity.y *= -1;
    }

    if (Progression.isSpriteCollisionEnabled) {
      this.handleCollisions();
    }
  }

  handleCollisions() {
    const radius = (this.width * this.scale) / 2;

    const otherSprites = this.scene.sprites.filter((s) => s !== this);
    for (const other of otherSprites) {
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < radius + (other.width * other.scale) / 2) {
        const angle = Math.atan2(dy, dx);
        const overlap = (radius + (other.width * other.scale) / 2 - distance) / 2;
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

  getAliveParticleCount(): number {
    return this.particleEmitter.getAliveParticleCount();
  }

  update(delta: number) {
    if (Progression.isSpriteMovementEnabled) {
      this.move(delta);
    }
  }
}

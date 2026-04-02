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
      if (Progression.isSpriteCollisionEnabled) Progression.addCollisionCpu();
    } else if (this.x > this.scene.cameras.main.width - radius) {
      this.x = this.scene.cameras.main.width - radius;
      this.velocity.x *= -1;
      if (Progression.isSpriteCollisionEnabled) Progression.addCollisionCpu();
    }
    if (this.y < radius) {
      this.y = radius;
      this.velocity.y *= -1;
      if (Progression.isSpriteCollisionEnabled) Progression.addCollisionCpu();
    } else if (this.y > this.scene.cameras.main.height - radius) {
      this.y = this.scene.cameras.main.height - radius;
      this.velocity.y *= -1;
      if (Progression.isSpriteCollisionEnabled) Progression.addCollisionCpu();
    }

    if (Progression.isSpriteCollisionEnabled) {
      this.handleCollisions();
    }
  }

  handleCollisions() {
    const radius = (this.width * this.scale) / 2;

    for (const other of this.scene.sprites) {
      if (other === this) continue;
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const otherRadius = (other.width * other.scale) / 2;
      const minDistance = radius + otherRadius;

      if (distance < minDistance && distance > 0) {
        const normalX = dx / distance;
        const normalY = dy / distance;

        const overlap = (minDistance - distance) / 2;
        this.x -= normalX * overlap;
        this.y -= normalY * overlap;
        other.x += normalX * overlap;
        other.y += normalY * overlap;

        const relativeVelocity =
          (this.velocity.x * this.speed - other.velocity.x * other.speed) * normalX +
          (this.velocity.y * this.speed - other.velocity.y * other.speed) * normalY;

        if (relativeVelocity > 0) {
          this.velocity.x -= (relativeVelocity * normalX) / this.speed;
          this.velocity.y -= (relativeVelocity * normalY) / this.speed;
          other.velocity.x += (relativeVelocity * normalX) / other.speed;
          other.velocity.y += (relativeVelocity * normalY) / other.speed;
        }

        Progression.addCollisionCpu();
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

import { MainScene } from '../scenes/MainScene';
import { getRandomInt, SPRITE_BASE_UNIT } from '../utils/utils';
import { Progression } from '../Progression';
import { Particle } from './Particle';

export class Sprite extends Phaser.GameObjects.Sprite {
  scene: MainScene;

  originalScale: number;
  velocity: { x: number; y: number };
  speed: number;
  rotationSpeed: number = 0;
  private spriteJuiceAccumulator: number = 0;
  private bounceJuiceAccumulator: number = 0;
  private movementJuiceAccumulator: number = 0;
  private rotationJuiceAccumulator: number = 0;

  constructor(scene: MainScene, x: number, y: number) {
    super(scene, x, y, 'spriteAtlas', '');
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.speed = 100 + Math.random() * 50;
    this.rotationSpeed = (0.5 + Math.random() * 1.5) * (Math.random() < 0.5 ? -1 : 1);
    this.originalScale = this.scene.tileSize / SPRITE_BASE_UNIT;
    this.setScale(this.originalScale);
    scene.add.existing(this);

    this.velocity = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 };
  }

  init(texture: string) {
    this.setTexture('spriteAtlas', texture);
    this.setDepth(1);
  }

  bounce() {
    if (Progression.isBounceEnabled && this.scale === this.originalScale) {
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

  spawnBounceParticles(contactX: number, contactY: number) {
    if (!Progression.isBounceParticlesEnabled) return;
    const particleScale = this.scene.tileSize / SPRITE_BASE_UNIT;
    const bounceParticleCount = getRandomInt(3, 5);
    for (let i = 0; i < bounceParticleCount; i++) {
      const particle = new Particle(this.scene, contactX, contactY, particleScale * 0.5);
      this.scene.particles.push(particle);
    }
  }

  move(delta: number) {
    const radius = (this.width * this.scale) / 2;
    this.x += this.velocity.x * this.speed * (delta / 1000);
    this.y += this.velocity.y * this.speed * (delta / 1000);

    if (this.x < radius) {
      this.x = radius;
      this.velocity.x *= -1;
      if (Progression.isBounceEnabled) Progression.addJuice(1);
      this.spawnBounceParticles(radius, this.y);
      if (Progression.isSpriteCollisionEnabled) Progression.addCollisionCpu();
    } else if (this.x > this.scene.cameras.main.width - radius) {
      this.x = this.scene.cameras.main.width - radius;
      this.velocity.x *= -1;
      if (Progression.isBounceEnabled) Progression.addJuice(1);
      this.spawnBounceParticles(this.scene.cameras.main.width - radius, this.y);
      if (Progression.isSpriteCollisionEnabled) Progression.addCollisionCpu();
    }
    if (this.y < radius) {
      this.y = radius;
      this.velocity.y *= -1;
      if (Progression.isBounceEnabled) Progression.addJuice(1);
      this.spawnBounceParticles(this.x, radius);
      if (Progression.isSpriteCollisionEnabled) Progression.addCollisionCpu();
    } else if (this.y > this.scene.cameras.main.height - radius) {
      this.y = this.scene.cameras.main.height - radius;
      this.velocity.y *= -1;
      if (Progression.isBounceEnabled) Progression.addJuice(1);
      this.spawnBounceParticles(this.x, this.scene.cameras.main.height - radius);
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

          if (Progression.isBounceEnabled) Progression.addJuice(1);
          const contactX = (this.x + other.x) / 2;
          const contactY = (this.y + other.y) / 2;
          this.spawnBounceParticles(contactX, contactY);
        }

        Progression.addCollisionCpu();
      }
    }
  }

  private generateJuice(accumulator: number, rate: number, delta: number): number {
    accumulator += rate * (delta / 1000);
    const earned = Math.floor(accumulator);
    if (earned > 0) {
      Progression.addJuice(earned);
      accumulator -= earned;
    }
    return accumulator;
  }

  update(delta: number) {
    this.spriteJuiceAccumulator = this.generateJuice(
      this.spriteJuiceAccumulator,
      Progression.spriteJuiceRate,
      delta,
    );

    if (Progression.isBounceEnabled) {
      this.bounceJuiceAccumulator += Progression.bounceJuiceRate * (delta / 1000);
      const earnedBounce = Math.floor(this.bounceJuiceAccumulator);
      if (earnedBounce > 0) {
        Progression.addJuice(earnedBounce);
        this.bounceJuiceAccumulator -= earnedBounce;
        this.bounce();
      }
    }

    if (Progression.isSpriteMovementEnabled) {
      this.move(delta);
      this.movementJuiceAccumulator = this.generateJuice(
        this.movementJuiceAccumulator,
        Progression.movementJuiceRate,
        delta,
      );
    }

    if (Progression.isSpriteRotationEnabled) {
      this.rotation += this.rotationSpeed * (delta / 1000);
      this.rotationJuiceAccumulator = this.generateJuice(
        this.rotationJuiceAccumulator,
        Progression.rotationJuiceRate,
        delta,
      );
    }
  }
}

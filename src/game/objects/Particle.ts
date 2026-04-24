import { getParticleFrames, PARTICLE_ATLAS_KEY } from '../elements/Particles';
import { Progression } from '../Progression';
import type { ParticleColorDefinition } from './ShopUpgrades';

const PARTICLE_LIFESPAN = 500;

export class Particle extends Phaser.GameObjects.Image {
  velocity: { x: number; y: number };
  lifespan: number;
  maxLifespan: number;
  startScale: number;
  juicePerParticle: number;

  constructor(scene: Phaser.Scene, x: number, y: number, startScale: number) {
    const frames = getParticleFrames();
    const frame = frames[Math.floor(Math.random() * frames.length)];
    super(scene, x, y, PARTICLE_ATLAS_KEY, frame);

    this.startScale = startScale;
    this.maxLifespan = PARTICLE_LIFESPAN;
    this.lifespan = PARTICLE_LIFESPAN;

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 300 + 100;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };

    const colors = Progression.unlockedParticleColors;
    if (colors.length > 0) {
      const colorDef: ParticleColorDefinition = colors[Math.floor(Math.random() * colors.length)];
      this.setTint(colorDef.tint);
      this.juicePerParticle = Progression.maxJuicePerParticle;
    } else {
      this.juicePerParticle = 1;
    }
    this.setDepth(0);
    this.setScale(startScale);
    scene.add.existing(this);
  }

  update(delta: number): boolean {
    this.lifespan -= delta;
    if (this.lifespan <= 0) {
      this.destroy();
      return false;
    }

    const progress = this.lifespan / this.maxLifespan;
    const eased = 1 - Math.pow(1 - progress, 3);
    this.setScale(this.startScale * eased);

    this.x += this.velocity.x * (delta / 1000);
    this.y += this.velocity.y * (delta / 1000);

    return true;
  }
}

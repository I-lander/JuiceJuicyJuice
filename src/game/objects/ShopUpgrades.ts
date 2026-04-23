import { Progression } from '../Progression';
import { MainScene } from '../scenes/MainScene';

export const PRICE_INCREASE = 1.15;

export interface UpgradeDefinition {
  baseCost: number;
  maxLevel?: number;
  levelToUnlock: number;
  requires?: string;
  onPurchase: (scene: MainScene) => void;
}

export const UPGRADES: Record<string, UpgradeDefinition> = {
  addSprite: {
    baseCost: 15,
    levelToUnlock: 0,
    onPurchase: (scene: MainScene) => {
      scene.spawnSprite(scene.pickNextSpriteFrame());
    },
  },
  yellowParticle: {
    baseCost: 100,
    maxLevel: 1,
    levelToUnlock: 3,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.yellowParticle);
    },
  },
  autoClicker: {
    baseCost: 1_100,
    levelToUnlock: 10,
    onPurchase: () => {
      Progression.autoClickers++;
    },
  },
  particlesPerClick: {
    baseCost: 3_500,
    levelToUnlock: 15,
    onPurchase: () => {
      Progression.particlesPerClick++;
    },
  },
  bounce: {
    baseCost: 12_000,
    maxLevel: 1,
    levelToUnlock: 18,
    onPurchase: () => {
      Progression.isBounceEnabled = true;
    },
  },
  bounceSizeUp: {
    baseCost: 15_000,
    levelToUnlock: 18,
    requires: 'bounce',
    onPurchase: () => {
      Progression.bounceScaleMultiplier += 0.25;
    },
  },
  redParticle: {
    baseCost: 60_000,
    maxLevel: 1,
    levelToUnlock: 22,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.redParticle);
    },
  },
  bounceParticles: {
    baseCost: 500_000,
    maxLevel: 1,
    levelToUnlock: 28,
    onPurchase: () => {
      Progression.isBounceParticlesEnabled = true;
    },
  },
  blueParticle: {
    baseCost: 2_000_000,
    maxLevel: 1,
    levelToUnlock: 32,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.blueParticle);
    },
  },
  spriteMovement: {
    baseCost: 2_500_000,
    maxLevel: 1,
    levelToUnlock: 35,
    onPurchase: () => {
      Progression.isSpriteMovementEnabled = true;
    },
  },
  spriteSpeedUp: {
    baseCost: 3_000_000,
    levelToUnlock: 35,
    requires: 'spriteMovement',
    onPurchase: () => {
      Progression.spriteSpeedMultiplier += 0.2;
    },
  },
  spriteCollision: {
    baseCost: 30_000_000,
    maxLevel: 1,
    levelToUnlock: 42,
    onPurchase: () => {
      Progression.isSpriteCollisionEnabled = true;
    },
  },
  spriteCollisionForce: {
    baseCost: 50_000_000,
    levelToUnlock: 44,
    requires: 'spriteCollision',
    onPurchase: () => {
      Progression.collisionForceMultiplier += 0.25;
    },
  },
  greenParticle: {
    baseCost: 200_000_000,
    maxLevel: 1,
    levelToUnlock: 48,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.greenParticle);
    },
  },
  spriteRotation: {
    baseCost: 500_000_000,
    maxLevel: 1,
    levelToUnlock: 52,
    onPurchase: () => {
      Progression.isSpriteRotationEnabled = true;
    },
  },
  purpleParticle: {
    baseCost: 3_500_000_000,
    maxLevel: 1,
    levelToUnlock: 58,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.purpleParticle);
    },
  },
  spriteRotationSpeedUp: {
    baseCost: 20_000_000_000,
    levelToUnlock: 65,
    requires: 'spriteRotation',
    onPurchase: () => {
      Progression.spriteRotationSpeedMultiplier += 0.25;
    },
  },
};

export interface ParticleColorDefinition {
  tint: number;
  juicePerParticle: number;
}

export const PARTICLE_COLOR_UPGRADES: Record<string, ParticleColorDefinition> = {
  whiteParticle: { tint: 0xffffff, juicePerParticle: 1 },
  yellowParticle: { tint: 0xffd700, juicePerParticle: 10 },
  redParticle: { tint: 0xff4444, juicePerParticle: 100 },
  blueParticle: { tint: 0x44aaff, juicePerParticle: 1000 },
  greenParticle: { tint: 0x44ff44, juicePerParticle: 10_000 },
  purpleParticle: { tint: 0xaa44ff, juicePerParticle: 100_000 },
};

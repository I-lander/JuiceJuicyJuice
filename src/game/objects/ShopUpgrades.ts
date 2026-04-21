import { spriteElements } from '../elements/SpriteAtlas';
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
      const randomFrame = spriteElements[Math.floor(Math.random() * spriteElements.length)].id;
      scene.spawnSprite(randomFrame);
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
    baseCost: 3_000,
    levelToUnlock: 15,
    onPurchase: () => {
      Progression.particlesPerClick++;
    },
  },
  bounce: {
    baseCost: 10_000,
    maxLevel: 1,
    levelToUnlock: 20,
    onPurchase: () => {
      Progression.isBounceEnabled = true;
    },
  },
  spriteMovement: {
    baseCost: 1_000_000,
    maxLevel: 1,
    levelToUnlock: 35,
    onPurchase: () => {
      Progression.isSpriteMovementEnabled = true;
    },
  },
  bounceParticles: {
    baseCost: 3_000_000,
    maxLevel: 1,
    levelToUnlock: 38,
    onPurchase: () => {
      Progression.isBounceParticlesEnabled = true;
    },
  },
  spriteCollision: {
    baseCost: 10_000_000,
    maxLevel: 1,
    levelToUnlock: 42,
    onPurchase: () => {
      Progression.isSpriteCollisionEnabled = true;
    },
  },
  spriteRotation: {
    baseCost: 300_000_000,
    maxLevel: 1,
    levelToUnlock: 52,
    onPurchase: () => {
      Progression.isSpriteRotationEnabled = true;
    },
  },
  bounceSizeUp: {
    baseCost: 1_000_000,
    levelToUnlock: 20,
    requires: 'bounce',
    onPurchase: () => {
      Progression.bounceScaleMultiplier += 0.25;
    },
  },
  spriteSpeedUp: {
    baseCost: 20_000_000,
    levelToUnlock: 35,
    requires: 'spriteMovement',
    onPurchase: () => {
      Progression.spriteSpeedMultiplier += 0.1;
    },
  },
  spriteRotationSpeedUp: {
    baseCost: 330_000_000,
    levelToUnlock: 52,
    requires: 'spriteRotation',
    onPurchase: () => {
      Progression.spriteRotationSpeedMultiplier += 0.1;
    },
  },
  yellowParticle: {
    baseCost: 150,
    maxLevel: 1,
    levelToUnlock: 3,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.yellowParticle);
    },
  },
  redParticle: {
    baseCost: 50_000,
    maxLevel: 1,
    levelToUnlock: 24,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.redParticle);
    },
  },
  blueParticle: {
    baseCost: 1_000_000_000,
    maxLevel: 1,
    levelToUnlock: 55,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.blueParticle);
    },
  },
  greenParticle: {
    baseCost: 70_000_000_000,
    maxLevel: 1,
    levelToUnlock: 68,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.greenParticle);
    },
  },
  purpleParticle: {
    baseCost: 5_000_000_000_000,
    maxLevel: 1,
    levelToUnlock: 80,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.purpleParticle);
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
  greenParticle: { tint: 0x44ff44, juicePerParticle: 100_000 },
  purpleParticle: { tint: 0xaa44ff, juicePerParticle: 1_000_000 },
};

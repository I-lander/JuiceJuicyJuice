import { spriteElements } from '../elements/SpriteAtlas';
import { Progression } from '../Progression';
import { MainScene } from '../scenes/MainScene';

export interface UpgradeDefinition {
  baseCost: number;
  growthFactor: number;
  maxLevel: number;
  levelToUnlock: number;
  requires?: string;
  onPurchase: (scene: MainScene) => void;
}

export const UPGRADES: Record<string, UpgradeDefinition> = {
  particlesPerClick: {
    baseCost: 10,
    growthFactor: 1.25,
    maxLevel: 100,
    levelToUnlock: 0,
    onPurchase: () => {
      Progression.particlesPerClick++;
    },
  },
  autoClicker: {
    baseCost: 50,
    growthFactor: 1.3,
    maxLevel: 100,
    levelToUnlock: 5,
    onPurchase: () => {
      Progression.autoClickers++;
    },
  },
  cooldownReduction: {
    baseCost: 75,
    growthFactor: 1.45,
    maxLevel: 25,
    levelToUnlock: 7,
    onPurchase: () => {
      Progression.autoClickerCooldown = Math.max(200, Progression.autoClickerCooldown - 100);
    },
  },
  addSprite: {
    baseCost: 100,
    growthFactor: 1.3,
    maxLevel: 100,
    levelToUnlock: 10,
    onPurchase: (scene: MainScene) => {
      const randomFrame = spriteElements[Math.floor(Math.random() * spriteElements.length)].id;
      scene.spawnSprite(randomFrame);
    },
  },
  bounce: {
    baseCost: 800,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 15,
    onPurchase: () => {
      Progression.isBounceEnabled = true;
    },
  },
  spriteMovement: {
    baseCost: 4_000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 20,
    onPurchase: () => {
      Progression.isSpriteMovementEnabled = true;
    },
  },
  bounceParticles: {
    baseCost: 10_000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 23,
    onPurchase: () => {
      Progression.isBounceParticlesEnabled = true;
    },
  },
  spriteCollision: {
    baseCost: 25_000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 25,
    onPurchase: () => {
      Progression.isSpriteCollisionEnabled = true;
    },
  },
  spriteRotation: {
    baseCost: 120_000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 30,
    onPurchase: () => {
      Progression.isSpriteRotationEnabled = true;
    },
  },
  spriteJuiceUp: {
    baseCost: 150,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 11,
    onPurchase: () => {
      Progression.spriteJuiceAmount += 5;
    },
  },
  bounceJuiceUp: {
    baseCost: 1200,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 16,
    requires: 'bounce',
    onPurchase: () => {
      Progression.bounceJuiceAmount += 50;
    },
  },
  movementJuiceUp: {
    baseCost: 6_000,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 21,
    requires: 'spriteMovement',
    onPurchase: () => {
      Progression.movementJuiceAmount += 500;
    },
  },
  rotationJuiceUp: {
    baseCost: 180_000,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 31,
    requires: 'spriteRotation',
    onPurchase: () => {
      Progression.rotationJuiceAmount += 50_000;
    },
  },
  yellowParticle: {
    baseCost: 300,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 12,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.yellowParticle);
    },
  },
  redParticle: {
    baseCost: 20_000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 22,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.redParticle);
    },
  },
  blueParticle: {
    baseCost: 2_000_000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 38,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.blueParticle);
    },
  },
  greenParticle: {
    baseCost: 500_000_000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 52,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.greenParticle);
    },
  },
  purpleParticle: {
    baseCost: 100_000_000_000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 65,
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

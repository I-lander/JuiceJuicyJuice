import { spriteElements } from '../elements/SpriteAtlas';
import { Progression } from '../Progression';
import { MainScene } from '../scenes/MainScene';

export interface UpgradeDefinition {
  baseCost: number;
  growthFactor: number;
  maxLevel: number;
  levelToUnlock: number;
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
    growthFactor: 1.5,
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
      Progression.autoClickerCooldown -= 100;
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
    baseCost: 4000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 20,
    onPurchase: () => {
      Progression.isSpriteMovementEnabled = true;
    },
  },
  bounceParticles: {
    baseCost: 10000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 23,
    onPurchase: () => {
      Progression.isBounceParticlesEnabled = true;
    },
  },
  spriteCollision: {
    baseCost: 25000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 25,
    onPurchase: () => {
      Progression.isSpriteCollisionEnabled = true;
    },
  },
  spriteRotation: {
    baseCost: 120000,
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
      Progression.spriteJuiceAmount += 0.1;
    },
  },
  bounceJuiceUp: {
    baseCost: 1200,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 16,
    onPurchase: () => {
      Progression.bounceJuiceAmount += 0.1;
    },
  },
  movementJuiceUp: {
    baseCost: 6000,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 21,
    onPurchase: () => {
      Progression.movementJuiceAmount += 0.1;
    },
  },
  rotationJuiceUp: {
    baseCost: 180000,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 31,
    onPurchase: () => {
      Progression.rotationJuiceAmount += 0.1;
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
    baseCost: 20000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 22,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.redParticle);
    },
  },
  blueParticle: {
    baseCost: 3500000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 38,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.blueParticle);
    },
  },
  greenParticle: {
    baseCost: 1500000000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 52,
    onPurchase: () => {
      Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES.greenParticle);
    },
  },
  purpleParticle: {
    baseCost: 800000000000,
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
  yellowParticle: { tint: 0xffd700, juicePerParticle: 2 },
  redParticle: { tint: 0xff4444, juicePerParticle: 3 },
  blueParticle: { tint: 0x44aaff, juicePerParticle: 5 },
  greenParticle: { tint: 0x44ff44, juicePerParticle: 8 },
  purpleParticle: { tint: 0xaa44ff, juicePerParticle: 13 },
};

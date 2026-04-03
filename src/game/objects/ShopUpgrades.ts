export interface UpgradeDefinition {
  name: string;
  baseCost: number;
  growthFactor: number;
  maxLevel: number;
  levelToUnlock: number;
}

export const UPGRADES: Record<string, UpgradeDefinition> = {
  particlesPerClick: {
    name: 'Particles/Click',
    baseCost: 10,
    growthFactor: 1.15,
    maxLevel: 50,
    levelToUnlock: 0,
  },
  autoClicker: {
    name: 'Autoclicker',
    baseCost: 50,
    growthFactor: 1.6,
    maxLevel: 50,
    levelToUnlock: 5,
  },
  cooldownReduction: {
    name: 'Cooldown -',
    baseCost: 30,
    growthFactor: 1.5,
    maxLevel: 15,
    levelToUnlock: 7,
  },
  basicSprite: {
    name: 'Basic Sprite',
    baseCost: 50,
    growthFactor: 1.15,
    maxLevel: 50,
    levelToUnlock: 10,
  },
  bounce: {
    name: 'Bounce',
    baseCost: 100,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 15,
  },
  spriteMovement: {
    name: 'Movement',
    baseCost: 500,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 20,
  },
  spriteCollision: {
    name: 'Collision',
    baseCost: 2000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 25,
  },
  yellowParticle: {
    name: 'Yellow Particle',
    baseCost: 5000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 10,
  },
  redParticle: {
    name: 'Red Particle',
    baseCost: 8000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 25,
  },
  blueParticle: {
    name: 'Blue Particle',
    baseCost: 12000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 40,
  },
  greenParticle: {
    name: 'Green Particle',
    baseCost: 18000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 55,
  },
  purpleParticle: {
    name: 'Purple Particle',
    baseCost: 25000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 70,
  },
};

export interface ParticleColorDefinition {
  tint: number;
  fragmentsPerParticle: number;
}

export const PARTICLE_COLOR_UPGRADES: Record<string, ParticleColorDefinition> = {
  whiteParticle: { tint: 0xffffff, fragmentsPerParticle: 1 },
  yellowParticle: { tint: 0xffd700, fragmentsPerParticle: 2 },
  redParticle: { tint: 0xff4444, fragmentsPerParticle: 3 },
  blueParticle: { tint: 0x44aaff, fragmentsPerParticle: 5 },
  greenParticle: { tint: 0x44ff44, fragmentsPerParticle: 8 },
  purpleParticle: { tint: 0xaa44ff, fragmentsPerParticle: 13 },
};

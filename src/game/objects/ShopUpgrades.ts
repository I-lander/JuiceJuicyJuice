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
    growthFactor: 1.25,
    maxLevel: 100,
    levelToUnlock: 0,
  },
  autoClicker: {
    name: 'Autoclicker',
    baseCost: 50,
    growthFactor: 1.5,
    maxLevel: 100,
    levelToUnlock: 5,
  },
  cooldownReduction: {
    name: 'Cooldown -',
    baseCost: 75,
    growthFactor: 1.45,
    maxLevel: 25,
    levelToUnlock: 7,
  },
  addSprite: {
    name: 'Add Sprite',
    baseCost: 100,
    growthFactor: 1.3,
    maxLevel: 100,
    levelToUnlock: 10,
  },
  bounce: {
    name: 'Bounce',
    baseCost: 800,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 15,
  },
  spriteMovement: {
    name: 'Movement',
    baseCost: 4000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 20,
  },
  bounceParticles: {
    name: 'Bounce Particles',
    baseCost: 10000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 23,
  },
  spriteCollision: {
    name: 'Collision',
    baseCost: 25000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 25,
  },
  spriteRotation: {
    name: 'Rotation',
    baseCost: 120000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 30,
  },
  spriteFragRate: {
    name: 'Sprite Rate +',
    baseCost: 150,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 11,
  },
  bounceFragRate: {
    name: 'Bounce Rate +',
    baseCost: 1200,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 16,
  },
  movementFragRate: {
    name: 'Movement Rate +',
    baseCost: 6000,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 21,
  },
  rotationFragRate: {
    name: 'Rotation Rate +',
    baseCost: 180000,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 31,
  },
  yellowParticle: {
    name: 'Yellow Particle',
    baseCost: 300,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 12,
  },
  redParticle: {
    name: 'Red Particle',
    baseCost: 20000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 22,
  },
  blueParticle: {
    name: 'Blue Particle',
    baseCost: 3500000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 38,
  },
  greenParticle: {
    name: 'Green Particle',
    baseCost: 1500000000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 52,
  },
  purpleParticle: {
    name: 'Purple Particle',
    baseCost: 800000000000,
    growthFactor: 1,
    maxLevel: 1,
    levelToUnlock: 65,
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

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
    baseCost: 5,
    growthFactor: 1.4,
    maxLevel: 25,
    levelToUnlock: 0,
  },
  maxParticles: {
    name: 'Max Particles',
    baseCost: 15,
    growthFactor: 1.45,
    maxLevel: 25,
    levelToUnlock: 3,
  },
  autoClicker: {
    name: 'Autoclicker',
    baseCost: 50,
    growthFactor: 1.6,
    maxLevel: 25,
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
    growthFactor: 1.5,
    maxLevel: 25,
    levelToUnlock: 10,
  },
};

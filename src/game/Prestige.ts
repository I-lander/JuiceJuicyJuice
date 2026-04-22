const MAX_POINTS_BASE = 10;
const LEVELS_PER_BONUS_POINT = 15;

export type PrestigeBranch = 'bootstrap' | 'overclock' | 'hardware' | 'mastery';

export const PRESTIGE_BRANCHES: PrestigeBranch[] = ['bootstrap', 'overclock', 'hardware', 'mastery'];

export const UNLOCK_COLOR_ORDER = [
  'yellowParticle',
  'redParticle',
  'blueParticle',
  'greenParticle',
  'purpleParticle',
];

export interface PrestigeUpgradeDefinition {
  branch: PrestigeBranch;
  costs: number[];
  requires?: string;
}

export const PRESTIGE_UPGRADES: Record<string, PrestigeUpgradeDefinition> = {
  startSprites: {
    branch: 'bootstrap',
    costs: [1, 1, 2, 2, 3],
  },
  startAutoClickers: {
    branch: 'bootstrap',
    costs: [1, 2, 3, 4, 5],
    requires: 'startSprites',
  },
  startColors: {
    branch: 'bootstrap',
    costs: [2, 3, 4, 5, 6],
    requires: 'startAutoClickers',
  },
  startJuice: {
    branch: 'bootstrap',
    costs: [2, 3, 4, 5, 6],
    requires: 'startColors',
  },

  spriteYield: {
    branch: 'overclock',
    costs: [1, 2, 3, 4, 5],
  },
  clickSpeed: {
    branch: 'overclock',
    costs: [2, 3, 4, 5, 6],
    requires: 'spriteYield',
  },
  particleBoost: {
    branch: 'overclock',
    costs: [3, 5, 7],
    requires: 'clickSpeed',
  },
  juiceMultiplier: {
    branch: 'overclock',
    costs: [3, 5, 7, 9, 11],
    requires: 'particleBoost',
  },

  cpuCapacity: {
    branch: 'hardware',
    costs: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
  },
  cpuEfficiency: {
    branch: 'hardware',
    costs: [2, 3, 4, 5, 6],
    requires: 'cpuCapacity',
  },
  particleCpuDrop: {
    branch: 'hardware',
    costs: [2, 3, 4],
    requires: 'cpuEfficiency',
  },
  spriteCpuDrop: {
    branch: 'hardware',
    costs: [3, 5, 7],
    requires: 'particleCpuDrop',
  },

  discount: {
    branch: 'mastery',
    costs: [2, 3, 4, 5, 6],
  },
  persistentJuice: {
    branch: 'mastery',
    costs: [3, 5, 7],
    requires: 'discount',
  },
  prestigeGain: {
    branch: 'mastery',
    costs: [5, 7, 10, 13, 16],
    requires: 'persistentJuice',
  },
};

const START_SPRITES_PER_LEVEL = 2;
const START_AUTOCLICKERS_PER_LEVEL = 5;
const START_JUICE_BASE = 1000;
const START_JUICE_SCALE = 20;
const SPRITE_YIELD_PER_LEVEL = 0.5;
const CLICK_SPEED_PER_LEVEL = 0.1;
const PARTICLE_BOOST_PER_LEVEL = 1;
const JUICE_MULT_PER_LEVEL = 0.1;
const CPU_CAPACITY_PER_LEVEL = [100, 200, 300, 400, 500, 700, 1000, 1500, 2000, 3000];
const CPU_EFFICIENCY_PER_LEVEL = 0.05;
const PARTICLE_CPU_DROP_PER_LEVEL = 0.25;
const SPRITE_CPU_DROP_PER_LEVEL = 0.15;
const DISCOUNT_PER_LEVEL = 0.05;
const PERSISTENT_JUICE_PER_LEVEL = 0.05;
const PRESTIGE_GAIN_PER_LEVEL = 1;

function buildDefaultLevels(): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const key of Object.keys(PRESTIGE_UPGRADES)) {
    defaults[key] = 0;
  }
  return defaults;
}

export class Prestige {
  static points: number = 0;
  static totalEarned: number = 0;
  static upgradeLevels: Record<string, number> = buildDefaultLevels();

  static getLevel(upgradeKey: string): number {
    return Prestige.upgradeLevels[upgradeKey] ?? 0;
  }

  static getMaxLevel(upgradeKey: string): number {
    return PRESTIGE_UPGRADES[upgradeKey].costs.length;
  }

  static isMaxed(upgradeKey: string): boolean {
    return Prestige.getLevel(upgradeKey) >= Prestige.getMaxLevel(upgradeKey);
  }

  static getUpgradeCost(upgradeKey: string): number {
    const definition = PRESTIGE_UPGRADES[upgradeKey];
    const level = Prestige.getLevel(upgradeKey);
    if (level >= definition.costs.length) return Number.POSITIVE_INFINITY;
    return definition.costs[level];
  }

  static isUnlocked(upgradeKey: string): boolean {
    const definition = PRESTIGE_UPGRADES[upgradeKey];
    if (!definition.requires) return true;
    return Prestige.getLevel(definition.requires) > 0;
  }

  static canAfford(upgradeKey: string): boolean {
    return Prestige.points >= Prestige.getUpgradeCost(upgradeKey);
  }

  static purchase(upgradeKey: string): boolean {
    if (Prestige.isMaxed(upgradeKey)) return false;
    if (!Prestige.isUnlocked(upgradeKey)) return false;
    const cost = Prestige.getUpgradeCost(upgradeKey);
    if (Prestige.points < cost) return false;
    Prestige.points -= cost;
    Prestige.upgradeLevels[upgradeKey] = Prestige.getLevel(upgradeKey) + 1;
    return true;
  }

  static getStartingSprites(): number {
    return Prestige.getLevel('startSprites') * START_SPRITES_PER_LEVEL;
  }

  static getStartingAutoClickers(): number {
    return Prestige.getLevel('startAutoClickers') * START_AUTOCLICKERS_PER_LEVEL;
  }

  static getUnlockedColorKeys(): string[] {
    const level = Prestige.getLevel('startColors');
    return UNLOCK_COLOR_ORDER.slice(0, level);
  }

  static getStartingJuice(): number {
    const level = Prestige.getLevel('startJuice');
    if (level <= 0) return 0;
    return START_JUICE_BASE * Math.pow(START_JUICE_SCALE, level - 1);
  }

  static getSpriteYieldMultiplier(): number {
    return 1 + Prestige.getLevel('spriteYield') * SPRITE_YIELD_PER_LEVEL;
  }

  static getClickSpeedMultiplier(): number {
    return 1 - Prestige.getLevel('clickSpeed') * CLICK_SPEED_PER_LEVEL;
  }

  static getParticleBoost(): number {
    return Prestige.getLevel('particleBoost') * PARTICLE_BOOST_PER_LEVEL;
  }

  static getJuiceMultiplier(): number {
    return 1 + Prestige.getLevel('juiceMultiplier') * JUICE_MULT_PER_LEVEL;
  }

  static getCpuCapacityBonus(): number {
    const level = Prestige.getLevel('cpuCapacity');
    let total = 0;
    for (let i = 0; i < level && i < CPU_CAPACITY_PER_LEVEL.length; i++) {
      total += CPU_CAPACITY_PER_LEVEL[i];
    }
    return total;
  }

  static getCpuCostMultiplier(): number {
    return 1 - Prestige.getLevel('cpuEfficiency') * CPU_EFFICIENCY_PER_LEVEL;
  }

  static getParticleCpuMultiplier(): number {
    return 1 - Prestige.getLevel('particleCpuDrop') * PARTICLE_CPU_DROP_PER_LEVEL;
  }

  static getSpriteCpuMultiplier(): number {
    return 1 - Prestige.getLevel('spriteCpuDrop') * SPRITE_CPU_DROP_PER_LEVEL;
  }

  static getUpgradeDiscountMultiplier(): number {
    return 1 - Prestige.getLevel('discount') * DISCOUNT_PER_LEVEL;
  }

  static getPersistentJuicePercent(): number {
    return Prestige.getLevel('persistentJuice') * PERSISTENT_JUICE_PER_LEVEL;
  }

  static getMaxPointsPerRun(): number {
    return MAX_POINTS_BASE + Prestige.getLevel('prestigeGain') * PRESTIGE_GAIN_PER_LEVEL;
  }

  static computePointsForLevel(level: number): number {
    return Math.min(Prestige.getMaxPointsPerRun(), 1 + Math.floor(level / LEVELS_PER_BONUS_POINT));
  }

  static awardPoint(): void {
    Prestige.awardPoints(1);
  }

  static awardPoints(count: number): void {
    if (count <= 0) return;
    Prestige.points += count;
    Prestige.totalEarned += count;
  }

  static reset(): void {
    Prestige.points = 0;
    Prestige.totalEarned = 0;
    Prestige.upgradeLevels = buildDefaultLevels();
  }
}

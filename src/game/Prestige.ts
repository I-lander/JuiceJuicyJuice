const BASE_START_AUTOCLICKERS_PER_LEVEL = 5;
const BASE_START_SPRITES_PER_LEVEL = 2;
const BASE_CPU_CAPACITY_PER_LEVEL = 100;
const MAX_POINTS_PER_RUN = 10;
const LEVELS_PER_BONUS_POINT = 10;

export const UNLOCK_COLOR_ORDER = [
  'yellowParticle',
  'redParticle',
  'blueParticle',
  'greenParticle',
  'purpleParticle',
];

export interface PrestigeUpgradeDefinition {
  baseCost: number;
  costMultiplier: number;
  maxLevel?: number;
}

export const PRESTIGE_UPGRADES: Record<string, PrestigeUpgradeDefinition> = {
  startAutoClickers: { baseCost: 1, costMultiplier: 2 },
  startSprites: { baseCost: 1, costMultiplier: 2, maxLevel: 5 },
  unlockColors: { baseCost: 2, costMultiplier: 2, maxLevel: UNLOCK_COLOR_ORDER.length },
};

export const CPU_CAPACITY_BONUS_PER_POINT = BASE_CPU_CAPACITY_PER_LEVEL;

export class Prestige {
  static points: number = 0;
  static totalEarned: number = 0;
  static upgradeLevels: Record<string, number> = {
    startAutoClickers: 0,
    startSprites: 0,
    unlockColors: 0,
  };

  static getStartingAutoClickers(): number {
    const level = Prestige.upgradeLevels.startAutoClickers ?? 0;
    return level * BASE_START_AUTOCLICKERS_PER_LEVEL;
  }

  static getStartingSprites(): number {
    const level = Prestige.upgradeLevels.startSprites ?? 0;
    return level * BASE_START_SPRITES_PER_LEVEL;
  }

  static getUnlockedColorKeys(): string[] {
    const level = Prestige.upgradeLevels.unlockColors ?? 0;
    return UNLOCK_COLOR_ORDER.slice(0, level);
  }

  static getCpuCapacityBonus(): number {
    return Prestige.totalEarned * BASE_CPU_CAPACITY_PER_LEVEL;
  }

  static computePointsForLevel(level: number): number {
    return Math.min(MAX_POINTS_PER_RUN, 1 + Math.floor(level / LEVELS_PER_BONUS_POINT));
  }

  static getUpgradeCost(upgradeKey: string): number {
    const definition = PRESTIGE_UPGRADES[upgradeKey];
    const level = Prestige.upgradeLevels[upgradeKey] ?? 0;
    return Math.ceil(definition.baseCost * Math.pow(definition.costMultiplier, level));
  }

  static canAfford(upgradeKey: string): boolean {
    return Prestige.points >= Prestige.getUpgradeCost(upgradeKey);
  }

  static isMaxed(upgradeKey: string): boolean {
    const definition = PRESTIGE_UPGRADES[upgradeKey];
    const level = Prestige.upgradeLevels[upgradeKey] ?? 0;
    return definition.maxLevel !== undefined && level >= definition.maxLevel;
  }

  static purchase(upgradeKey: string): boolean {
    if (Prestige.isMaxed(upgradeKey)) return false;
    const cost = Prestige.getUpgradeCost(upgradeKey);
    if (Prestige.points < cost) return false;
    Prestige.points -= cost;
    Prestige.upgradeLevels[upgradeKey] = (Prestige.upgradeLevels[upgradeKey] ?? 0) + 1;
    return true;
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
    Prestige.upgradeLevels = {
      startAutoClickers: 0,
      startSprites: 0,
      unlockColors: 0,
    };
  }
}

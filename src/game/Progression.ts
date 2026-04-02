import { UPGRADES } from "./objects/ShopUpgrades";

export const CPU_COSTS: Record<string, number> = {
  sprite: 1.0,
  particle: 0.3,
  tween: 0.5,
  movingSprite: 0.5,
  autoClicker: 0.2,
  shader: 2.0,
  uiParasite: 1.5,
};

const CPU_COEFFICIENT = 0.002;

export class Progression {
  static fragments = 0;
  static particlesPerClick = 1;
  static maxParticles = 5;
  static maxParticlesPerSpawn = 500;
  static particleLifetime = 700;
  static sprites = 0;
  static autoClickers = 0;
  static autoClickerCooldown = 3000;
  static isBounceEnabled = false;
  static isSpriteMovementEnabled = false;
  static isSpriteCollisionEnabled = false;

  static cpuUsage = 0;
  static simulatedFps = 60;
  static cpuMultiplier = 1;

  static level = 1;
  static experience = 0;
  static totalExperience = 0;

  static calculateCpuUsage(spriteCount: number, particleCount: number, activeTweenCount: number, movingSpriteCount: number) {
    let totalCpu = 0;
    totalCpu += spriteCount * CPU_COSTS.sprite;
    totalCpu += particleCount * CPU_COSTS.particle;
    totalCpu += activeTweenCount * CPU_COSTS.tween;
    totalCpu += movingSpriteCount * CPU_COSTS.movingSprite;
    totalCpu += Progression.autoClickers * CPU_COSTS.autoClicker;
    totalCpu *= Progression.cpuMultiplier;

    Progression.cpuUsage = totalCpu;
    Progression.simulatedFps = Math.max(0, 60 / (1 + totalCpu * CPU_COEFFICIENT));
  }

  static getExperienceForLevel(level: number): number {
    return Math.floor(20 * Math.pow(1.4, level - 1));
  }

  static addExperience(amount: number) {
    Progression.experience += amount;
    Progression.totalExperience += amount;

    let requiredXp = Progression.getExperienceForLevel(Progression.level);
    while (Progression.experience >= requiredXp) {
      Progression.experience -= requiredXp;
      Progression.level++;
      requiredXp = Progression.getExperienceForLevel(Progression.level);
    }
  }

  static getExperienceProgress(): number {
    return Progression.experience / Progression.getExperienceForLevel(Progression.level);
  }

  static isUpgradeUnlocked(upgradeKey: string): boolean {
    const definition = UPGRADES[upgradeKey];
    return Progression.level >= definition.levelToUnlock;
  }

  static upgradeLevels: Record<string, number> = {
    basicSprite: 0,
    particlesPerClick: 0,
    maxParticles: 0,
    autoClicker: 0,
    cooldownReduction: 0,
  };

  static getUpgradeValue(upgradeKey: string): string {
    switch (upgradeKey) {
      case 'basicSprite':
        return `${Progression.sprites}`;
      case 'particlesPerClick':
        return `${Progression.particlesPerClick}`;
      case 'maxParticles':
        return `${Progression.maxParticles}`;
      case 'autoClicker':
        return `${Progression.autoClickers}`;
      case 'cooldownReduction':
        return `${(Progression.autoClickerCooldown / 1000).toFixed(1)}s`;
      default:
        return '';
    }
  }

  static getUpgradeCost(upgradeKey: string): number {
    const definition = UPGRADES[upgradeKey];
    const level = Progression.upgradeLevels[upgradeKey] ?? 0;
    return Math.floor(definition.baseCost * Math.pow(definition.growthFactor, level));
  }

  static canAffordUpgrade(upgradeKey: string): boolean {
    return Progression.fragments >= Progression.getUpgradeCost(upgradeKey);
  }

  static purchaseUpgrade(upgradeKey: string): boolean {
    const cost = Progression.getUpgradeCost(upgradeKey);
    const definition = UPGRADES[upgradeKey];
    const level = Progression.upgradeLevels[upgradeKey] ?? 0;

    if (Progression.fragments < cost || level >= definition.maxLevel) return false;

    Progression.fragments -= cost;
    Progression.upgradeLevels[upgradeKey] = level + 1;
    return true;
  }
}

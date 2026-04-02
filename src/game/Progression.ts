import { UPGRADES } from "./objects/ShopUpgrades";


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

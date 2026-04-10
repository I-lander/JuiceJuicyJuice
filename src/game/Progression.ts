import {
  PARTICLE_COLOR_UPGRADES,
  type ParticleColorDefinition,
  PRICE_INCREASE,
  UPGRADES,
} from './objects/ShopUpgrades';
import { t } from './utils/i18n';

export const CPU_COSTS: Record<string, number> = {
  sprite: 1.0,
  particle: 0.3,
  tween: 0.5,
  movingSprite: 0.5,
  autoClicker: 0.2,
  shader: 2.0,
  uiParasite: 1.5,
  collision: 0.8,
  rotatingSprite: 0.7,
};

const CPU_COEFFICIENT = 0.002;

export class Progression {
  static juice = 0;
  static sprites = 0;
  static particlesPerClick = 1;
  static autoClickers = 0;
  static autoClickerCooldown = 3000;
  static spriteJuiceAmount = 5;
  static bounceJuiceAmount = 50;
  static movementJuiceAmount = 500;
  static rotationJuiceAmount = 50000;
  static isBounceEnabled = false;
  static isSpriteMovementEnabled = false;
  static isBounceParticlesEnabled = false;
  static isSpriteCollisionEnabled = false;
  static isSpriteRotationEnabled = false;
  static unlockedParticleColors: ParticleColorDefinition[] = [
    PARTICLE_COLOR_UPGRADES.whiteParticle,
  ];

  static cpuUsage = 0;
  static simulatedFps = 60;
  static cpuMultiplier = 1;
  static activeCollisionCpu = 0;

  static level = 1;
  static totalJuice = 0;

  static addCollisionCpu() {
    Progression.activeCollisionCpu += CPU_COSTS.collision;
  }

  static calculateCpuUsage(
    spriteCount: number,
    particleCount: number,
    activeTweenCount: number,
    movingSpriteCount: number,
    rotatingSpriteCount: number,
    delta: number,
  ) {
    Progression.activeCollisionCpu = Math.max(
      0,
      Progression.activeCollisionCpu - (Progression.activeCollisionCpu * delta) / 1000,
    );

    let totalCpu = 0;
    totalCpu += spriteCount * CPU_COSTS.sprite;
    totalCpu += particleCount * CPU_COSTS.particle;
    totalCpu += activeTweenCount * CPU_COSTS.tween;
    totalCpu += movingSpriteCount * CPU_COSTS.movingSprite;
    totalCpu += Progression.autoClickers * CPU_COSTS.autoClicker;
    totalCpu += rotatingSpriteCount * CPU_COSTS.rotatingSprite;
    totalCpu += Progression.activeCollisionCpu;
    totalCpu *= Progression.cpuMultiplier;

    Progression.cpuUsage = totalCpu;
    Progression.simulatedFps = Math.max(0, 60 / (1 + totalCpu * CPU_COEFFICIENT));
  }

  static reset() {
    Progression.juice = 0;
    Progression.totalJuice = 0;
    Progression.level = 1;
    Progression.sprites = 0;
    Progression.particlesPerClick = 1;
    Progression.autoClickers = 0;
    Progression.autoClickerCooldown = 3000;
    Progression.spriteJuiceAmount = 5;
    Progression.bounceJuiceAmount = 50;
    Progression.movementJuiceAmount = 500;
    Progression.rotationJuiceAmount = 50000;
    Progression.isBounceEnabled = false;
    Progression.isSpriteMovementEnabled = false;
    Progression.isBounceParticlesEnabled = false;
    Progression.isSpriteCollisionEnabled = false;
    Progression.isSpriteRotationEnabled = false;
    Progression.unlockedParticleColors = [PARTICLE_COLOR_UPGRADES.whiteParticle];
    Progression.cpuUsage = 0;
    Progression.simulatedFps = 60;
    Progression.cpuMultiplier = 1;
    Progression.activeCollisionCpu = 0;
    Progression.upgradeLevels = {
      addSprite: 0,
      particlesPerClick: 1,
      autoClicker: 0,
      bounce: 0,
      spriteMovement: 0,
      bounceParticles: 0,
      spriteCollision: 0,
      spriteRotation: 0,
      spriteJuiceUp: 0,
      bounceJuiceUp: 0,
      movementJuiceUp: 0,
      rotationJuiceUp: 0,
      yellowParticle: 0,
      redParticle: 0,
      blueParticle: 0,
      greenParticle: 0,
      purpleParticle: 0,
    };
  }

  static getJuiceForLevel(level: number): number {
    return Math.floor(10 * Math.pow(1.4, level - 1));
  }

  static addJuice(amount: number) {
    Progression.juice += amount;
    Progression.totalJuice += amount;
    Progression.recalculateLevel();
  }

  static recalculateLevel() {
    let cumulativeJuice = 0;
    let level = 1;
    while (cumulativeJuice + Progression.getJuiceForLevel(level) <= Progression.totalJuice) {
      cumulativeJuice += Progression.getJuiceForLevel(level);
      level++;
    }
    Progression.level = level;
  }

  static getJuiceInCurrentLevel(): number {
    let cumulativeJuice = 0;
    for (let lvl = 1; lvl < Progression.level; lvl++) {
      cumulativeJuice += Progression.getJuiceForLevel(lvl);
    }
    return Progression.totalJuice - cumulativeJuice;
  }

  static getLevelProgress(): number {
    return Progression.getJuiceInCurrentLevel() / Progression.getJuiceForLevel(Progression.level);
  }

  static getTotalJuicePerSecond(isReadOnly: boolean = false): number {
    let juicePerSecond = Progression.spriteJuiceAmount * Progression.sprites;

    if (Progression.isBounceEnabled) {
      juicePerSecond += Progression.bounceJuiceAmount * Progression.sprites;
    }
    if (Progression.isSpriteMovementEnabled) {
      juicePerSecond += Progression.movementJuiceAmount * Progression.sprites;
    }
    if (Progression.isSpriteRotationEnabled) {
      juicePerSecond += Progression.rotationJuiceAmount * Progression.sprites;
    }
    if (isReadOnly) {
      if (Progression.autoClickers > 0 && Progression.unlockedParticleColors.length > 0) {
        const averageJuicePerParticle =
          Progression.unlockedParticleColors.reduce(
            (sum, color) => sum + color.juicePerParticle,
            0,
          ) / Progression.unlockedParticleColors.length;
        const clicksPerSecond = 1000 / Progression.autoClickerCooldown;
        juicePerSecond +=
          Progression.autoClickers *
          Progression.particlesPerClick *
          averageJuicePerParticle *
          clicksPerSecond;
      }
    }

    return Math.round(juicePerSecond * 10) / 10;
  }

  static isUpgradeUnlocked(upgradeKey: string): boolean {
    const definition = UPGRADES[upgradeKey];
    if (Progression.level < definition.levelToUnlock) return false;
    if (definition.requires) {
      const requiredLevel = Progression.upgradeLevels[definition.requires] ?? 0;
      if (requiredLevel <= 0) return false;
    }
    return true;
  }

  static upgradeLevels: Record<string, number> = {
    addSprite: 0,
    particlesPerClick: 1,
    autoClicker: 0,
    bounce: 0,
    spriteMovement: 0,
    bounceParticles: 0,
    spriteCollision: 0,
    spriteRotation: 0,
    spriteJuiceUp: 0,
    bounceJuiceUp: 0,
    movementJuiceUp: 0,
    rotationJuiceUp: 0,
    yellowParticle: 0,
    redParticle: 0,
    blueParticle: 0,
    greenParticle: 0,
    purpleParticle: 0,
  };

  static getUpgradeValue(upgradeKey: string): string {
    switch (upgradeKey) {
      case 'addSprite':
        return `${Progression.sprites}`;
      case 'particlesPerClick':
        return `${Progression.upgradeLevels['particlesPerClick']}`;
      case 'autoClicker':
        return `${Progression.autoClickers}`;
      case 'spriteJuiceUp':
        return `${Progression.spriteJuiceAmount.toFixed(1)}`;
      case 'bounceJuiceUp':
        return `${Progression.bounceJuiceAmount.toFixed(1)}`;
      case 'movementJuiceUp':
        return `${Progression.movementJuiceAmount.toFixed(1)}`;
      case 'rotationJuiceUp':
        return `${Progression.rotationJuiceAmount.toFixed(1)}`;
      case 'bounce':
        return Progression.isBounceEnabled ? t('ui.on') : t('ui.off');
      case 'spriteMovement':
        return Progression.isSpriteMovementEnabled ? t('ui.on') : t('ui.off');
      case 'bounceParticles':
        return Progression.isBounceParticlesEnabled ? t('ui.on') : t('ui.off');
      case 'spriteCollision':
        return Progression.isSpriteCollisionEnabled ? t('ui.on') : t('ui.off');
      case 'spriteRotation':
        return Progression.isSpriteRotationEnabled ? t('ui.on') : t('ui.off');
      case 'yellowParticle':
      case 'redParticle':
      case 'blueParticle':
      case 'greenParticle':
      case 'purpleParticle': {
        const colorDef = PARTICLE_COLOR_UPGRADES[upgradeKey];
        const owned = (Progression.upgradeLevels[upgradeKey] ?? 0) > 0;
        return owned ? `x${colorDef.juicePerParticle}` : t('ui.off');
      }
      default:
        return '';
    }
  }

  static getUpgradeCost(upgradeKey: string): number {
    const definition = UPGRADES[upgradeKey];
    const level = Progression.upgradeLevels[upgradeKey] ?? 0;
    return Math.ceil(definition.baseCost * Math.pow(PRICE_INCREASE, level));
  }

  static canAffordUpgrade(upgradeKey: string): boolean {
    return Progression.juice >= Progression.getUpgradeCost(upgradeKey);
  }

  static purchaseUpgrade(upgradeKey: string): boolean {
    const cost = Progression.getUpgradeCost(upgradeKey);
    const definition = UPGRADES[upgradeKey];
    const level = Progression.upgradeLevels[upgradeKey] ?? 0;

    if (Progression.juice < cost) return false;
    if (definition.maxLevel !== undefined && level >= definition.maxLevel) return false;

    Progression.juice -= cost;
    Progression.upgradeLevels[upgradeKey] = level + 1;
    return true;
  }
}

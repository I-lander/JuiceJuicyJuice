import {
  PARTICLE_COLOR_UPGRADES,
  type ParticleColorDefinition,
  UPGRADES,
} from './objects/ShopUpgrades';

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
  static autoClickers = 0;
  static autoClickerCooldown = 3000;
  static spriteJuiceRate = 0.1;
  static bounceJuiceRate = 0.1;
  static movementJuiceRate = 0.1;
  static rotationJuiceRate = 0.1;
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

  static getTotalJuicePerSecond(): number {
    let juicePerSecond = Progression.spriteJuiceRate * Progression.sprites;

    if (Progression.isBounceEnabled) {
      juicePerSecond += Progression.bounceJuiceRate * Progression.sprites;
    }
    if (Progression.isSpriteMovementEnabled) {
      juicePerSecond += Progression.movementJuiceRate * Progression.sprites;
    }
    if (Progression.isSpriteRotationEnabled) {
      juicePerSecond += Progression.rotationJuiceRate * Progression.sprites;
    }

    return Math.round(juicePerSecond * 10) / 10;
  }

  static isUpgradeUnlocked(upgradeKey: string): boolean {
    const definition = UPGRADES[upgradeKey];
    return Progression.level >= definition.levelToUnlock;
  }

  static upgradeLevels: Record<string, number> = {
    addSprite: 0,
    particlesPerClick: 1,
    maxParticles: 0,
    autoClicker: 0,
    cooldownReduction: 0,
    bounce: 0,
    spriteMovement: 0,
    bounceParticles: 0,
    spriteCollision: 0,
    spriteRotation: 0,
    spriteFragRate: 0,
    bounceFragRate: 0,
    movementFragRate: 0,
    rotationFragRate: 0,
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
        return `${Progression.upgradeLevels['particlesPerClick'] ?? 0}`;
      case 'autoClicker':
        return `${Progression.autoClickers}`;
      case 'cooldownReduction':
        return `${(Progression.autoClickerCooldown / 1000).toFixed(1)}s`;
      case 'spriteFragRate':
        return `${Progression.spriteJuiceRate.toFixed(1)}/s`;
      case 'bounceFragRate':
        return `${Progression.bounceJuiceRate.toFixed(1)}/s`;
      case 'movementFragRate':
        return `${Progression.movementJuiceRate.toFixed(1)}/s`;
      case 'rotationFragRate':
        return `${Progression.rotationJuiceRate.toFixed(1)}/s`;
      case 'bounce':
        return Progression.isBounceEnabled ? 'ON' : 'OFF';
      case 'spriteMovement':
        return Progression.isSpriteMovementEnabled ? 'ON' : 'OFF';
      case 'bounceParticles':
        return Progression.isBounceParticlesEnabled ? 'ON' : 'OFF';
      case 'spriteCollision':
        return Progression.isSpriteCollisionEnabled ? 'ON' : 'OFF';
      case 'spriteRotation':
        return Progression.isSpriteRotationEnabled ? 'ON' : 'OFF';
      case 'yellowParticle':
      case 'redParticle':
      case 'blueParticle':
      case 'greenParticle':
      case 'purpleParticle': {
        const colorDef = PARTICLE_COLOR_UPGRADES[upgradeKey];
        const owned = (Progression.upgradeLevels[upgradeKey] ?? 0) > 0;
        return owned ? `x${colorDef.juicePerParticle}` : 'OFF';
      }
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
    return Progression.juice >= Progression.getUpgradeCost(upgradeKey);
  }

  static purchaseUpgrade(upgradeKey: string): boolean {
    const cost = Progression.getUpgradeCost(upgradeKey);
    const definition = UPGRADES[upgradeKey];
    const level = Progression.upgradeLevels[upgradeKey] ?? 0;

    if (Progression.juice < cost || level >= definition.maxLevel) return false;

    Progression.juice -= cost;
    Progression.upgradeLevels[upgradeKey] = level + 1;
    return true;
  }
}

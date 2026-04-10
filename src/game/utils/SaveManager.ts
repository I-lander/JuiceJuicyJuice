import { Progression } from '../Progression';
import { PARTICLE_COLOR_UPGRADES } from '../objects/ShopUpgrades';
import type { MainScene } from '../scenes/MainScene';

const SAVE_KEY = 'juice_save_data';
const AUTO_SAVE_INTERVAL = 30_000;

interface SaveData {
  version: number;
  juice: number;
  totalJuice: number;
  upgradeLevels: Record<string, number>;
  spriteFrames: string[];
  particlesPerClick: number;
  autoClickers: number;
  autoClickerCooldown: number;
  spriteJuiceAmount: number;
  bounceJuiceAmount: number;
  movementJuiceAmount: number;
  rotationJuiceAmount: number;
  isBounceEnabled: boolean;
  isSpriteMovementEnabled: boolean;
  isBounceParticlesEnabled: boolean;
  isSpriteCollisionEnabled: boolean;
  isSpriteRotationEnabled: boolean;
}

const PARTICLE_COLOR_KEYS = [
  'yellowParticle',
  'redParticle',
  'blueParticle',
  'greenParticle',
  'purpleParticle',
];

export class SaveManager {
  private static autoSaveTimer: number = 0;

  static save(mainScene: MainScene): void {
    const spriteFrames = mainScene.sprites.map((sprite) => sprite.frame.name);

    const data: SaveData = {
      version: 1,
      juice: Progression.juice,
      totalJuice: Progression.totalJuice,
      upgradeLevels: { ...Progression.upgradeLevels },
      spriteFrames,
      particlesPerClick: Progression.particlesPerClick,
      autoClickers: Progression.autoClickers,
      autoClickerCooldown: Progression.autoClickerCooldown,
      spriteJuiceAmount: Progression.spriteJuiceAmount,
      bounceJuiceAmount: Progression.bounceJuiceAmount,
      movementJuiceAmount: Progression.movementJuiceAmount,
      rotationJuiceAmount: Progression.rotationJuiceAmount,
      isBounceEnabled: Progression.isBounceEnabled,
      isSpriteMovementEnabled: Progression.isSpriteMovementEnabled,
      isBounceParticlesEnabled: Progression.isBounceParticlesEnabled,
      isSpriteCollisionEnabled: Progression.isSpriteCollisionEnabled,
      isSpriteRotationEnabled: Progression.isSpriteRotationEnabled,
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  static load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  static applyLoad(data: SaveData, mainScene: MainScene): void {
    Progression.juice = data.juice;
    Progression.totalJuice = data.totalJuice;
    Progression.upgradeLevels = { ...data.upgradeLevels };
    Progression.particlesPerClick = data.particlesPerClick;
    Progression.autoClickers = data.autoClickers;
    Progression.autoClickerCooldown = data.autoClickerCooldown;
    Progression.spriteJuiceAmount = data.spriteJuiceAmount;
    Progression.bounceJuiceAmount = data.bounceJuiceAmount;
    Progression.movementJuiceAmount = data.movementJuiceAmount;
    Progression.rotationJuiceAmount = data.rotationJuiceAmount;
    Progression.isBounceEnabled = data.isBounceEnabled;
    Progression.isSpriteMovementEnabled = data.isSpriteMovementEnabled;
    Progression.isBounceParticlesEnabled = data.isBounceParticlesEnabled;
    Progression.isSpriteCollisionEnabled = data.isSpriteCollisionEnabled;
    Progression.isSpriteRotationEnabled = data.isSpriteRotationEnabled;

    Progression.unlockedParticleColors = [PARTICLE_COLOR_UPGRADES.whiteParticle];
    for (const key of PARTICLE_COLOR_KEYS) {
      if ((data.upgradeLevels[key] ?? 0) > 0) {
        Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES[key]);
      }
    }

    Progression.recalculateLevel();

    Progression.sprites = 0;
    for (const frame of data.spriteFrames) {
      mainScene.spawnSprite(frame);
    }
  }

  static updateAutoSave(delta: number, mainScene: MainScene): void {
    SaveManager.autoSaveTimer += delta;
    if (SaveManager.autoSaveTimer >= AUTO_SAVE_INTERVAL) {
      SaveManager.autoSaveTimer -= AUTO_SAVE_INTERVAL;
      SaveManager.save(mainScene);
    }
  }

  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  static setupVisibilityListener(mainScene: MainScene): void {
    const saveOnHide = () => {
      if (document.visibilityState === 'hidden') {
        SaveManager.save(mainScene);
      }
    };
    const saveOnUnload = () => {
      SaveManager.save(mainScene);
    };
    document.addEventListener('visibilitychange', saveOnHide);
    window.addEventListener('beforeunload', saveOnUnload);
  }
}

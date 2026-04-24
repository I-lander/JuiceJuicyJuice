import { BASE_CPU_CAPACITY_MHZ, Progression } from '../Progression';
import { Prestige } from '../Prestige';
import { PARTICLE_COLOR_UPGRADES } from '../objects/ShopUpgrades';
import type { MainScene } from '../scenes/MainScene';
import { musicVolume, setMusicVolume, sfxVolume, setSfxVolume } from './utils';
import { getLanguage, setLanguage, type Language } from './i18n';

const SAVE_KEY = 'juice_save_data';
const META_SAVE_KEY = 'juice_meta_save_data';
const SETTINGS_KEY = 'juice_settings';
const AUTO_SAVE_INTERVAL = 30_000;

interface SettingsData {
  sfxVolume: number;
  musicVolume: number;
  language: Language;
}

interface MetaSaveData {
  version: number;
  points: number;
  totalEarned: number;
  upgradeLevels: Record<string, number>;
}

interface SaveData {
  version: number;
  juice: number;
  totalJuice: number;
  upgradeLevels: Record<string, number>;
  spriteFrames: number[];
  particlesPerClick: number;
  autoClickers: number;
  autoClickerCooldown: number;
  spriteJuiceAmount: number;
  bounceJuiceAmount: number;
  movementJuiceAmount: number;
  rotationJuiceAmount: number;
  collisionJuiceAmount: number;
  isBounceEnabled: boolean;
  isSpriteMovementEnabled: boolean;
  isBounceParticlesEnabled: boolean;
  isSpriteCollisionEnabled: boolean;
  isSpriteRotationEnabled: boolean;
  spriteSpeedMultiplier: number;
  spriteRotationSpeedMultiplier: number;
  bounceScaleMultiplier: number;
  collisionForceMultiplier: number;
  sfxMuted?: boolean;
  musicMuted?: boolean;
  language?: Language;
  crashActive?: boolean;
  pointsEarnedAtCrash?: number;
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
    const spriteFrames = mainScene.sprites.map((sprite) => Number(sprite.frame.name));

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
      collisionJuiceAmount: Progression.collisionJuiceAmount,
      isBounceEnabled: Progression.isBounceEnabled,
      isSpriteMovementEnabled: Progression.isSpriteMovementEnabled,
      isBounceParticlesEnabled: Progression.isBounceParticlesEnabled,
      isSpriteCollisionEnabled: Progression.isSpriteCollisionEnabled,
      isSpriteRotationEnabled: Progression.isSpriteRotationEnabled,
      spriteSpeedMultiplier: Progression.spriteSpeedMultiplier,
      spriteRotationSpeedMultiplier: Progression.spriteRotationSpeedMultiplier,
      bounceScaleMultiplier: Progression.bounceScaleMultiplier,
      collisionForceMultiplier: Progression.collisionForceMultiplier,
      crashActive: mainScene.uiScene?.crashActive ?? false,
      pointsEarnedAtCrash: mainScene.uiScene?.pointsEarnedAtCrash ?? 0,
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
    Progression.collisionJuiceAmount = data.collisionJuiceAmount ?? 10;
    Progression.isBounceEnabled = data.isBounceEnabled;
    Progression.isSpriteMovementEnabled = data.isSpriteMovementEnabled;
    Progression.isBounceParticlesEnabled = data.isBounceParticlesEnabled;
    Progression.isSpriteCollisionEnabled = data.isSpriteCollisionEnabled;
    Progression.isSpriteRotationEnabled = data.isSpriteRotationEnabled;
    Progression.spriteSpeedMultiplier = data.spriteSpeedMultiplier ?? 1;
    Progression.spriteRotationSpeedMultiplier = data.spriteRotationSpeedMultiplier ?? 1;
    Progression.bounceScaleMultiplier = data.bounceScaleMultiplier ?? 1;
    Progression.collisionForceMultiplier = data.collisionForceMultiplier ?? 1;

    Progression.unlockedParticleColors = [PARTICLE_COLOR_UPGRADES.whiteParticle];
    for (const key of PARTICLE_COLOR_KEYS) {
      if ((data.upgradeLevels[key] ?? 0) > 0) {
        Progression.unlockedParticleColors.push(PARTICLE_COLOR_UPGRADES[key]);
      }
    }

    Progression.cpuCapacityMhz = BASE_CPU_CAPACITY_MHZ + Prestige.getCpuCapacityBonus();

    Progression.recalculateLevel();

    Progression.sprites = 0;
    for (const frame of data.spriteFrames) {
      mainScene.spawnSprite(frame);
    }

    if (data.crashActive) {
      mainScene.pendingCrashRestore = {
        pointsEarnedAtCrash: data.pointsEarnedAtCrash ?? 0,
      };
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

  static saveMeta(): void {
    const data: MetaSaveData = {
      version: 1,
      points: Prestige.points,
      totalEarned: Prestige.totalEarned,
      upgradeLevels: { ...Prestige.upgradeLevels },
    };
    localStorage.setItem(META_SAVE_KEY, JSON.stringify(data));
  }

  static loadMeta(): void {
    const raw = localStorage.getItem(META_SAVE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as MetaSaveData;
      Prestige.points = data.points ?? 0;
      Prestige.totalEarned = data.totalEarned ?? 0;
      Prestige.upgradeLevels = {
        ...Prestige.upgradeLevels,
        ...(data.upgradeLevels ?? {}),
      };
    } catch {
      return;
    }
  }

  static deleteMetaSave(): void {
    localStorage.removeItem(META_SAVE_KEY);
    Prestige.reset();
  }

  static saveSettings(): void {
    const data: SettingsData = {
      sfxVolume,
      musicVolume,
      language: getLanguage(),
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  }

  static applySettings(): void {
    const settingsRaw = localStorage.getItem(SETTINGS_KEY);
    if (settingsRaw) {
      try {
        const data = JSON.parse(settingsRaw) as Partial<SettingsData> & {
          sfxMuted?: boolean;
          musicMuted?: boolean;
        };
        if (data.sfxVolume !== undefined) {
          setSfxVolume(data.sfxVolume);
        } else if (data.sfxMuted !== undefined) {
          setSfxVolume(data.sfxMuted ? 0 : 1);
        }
        if (data.musicVolume !== undefined) {
          setMusicVolume(data.musicVolume);
        } else if (data.musicMuted !== undefined) {
          setMusicVolume(data.musicMuted ? 0 : 1);
        }
        if (data.language) setLanguage(data.language);
        return;
      } catch {
        /* empty */
      }
    }
    const legacyRaw = localStorage.getItem(SAVE_KEY);
    if (!legacyRaw) return;
    try {
      const legacy = JSON.parse(legacyRaw) as Partial<SaveData>;
      if (legacy.sfxMuted !== undefined) setSfxVolume(legacy.sfxMuted ? 0 : 1);
      if (legacy.musicMuted !== undefined) setMusicVolume(legacy.musicMuted ? 0 : 1);
      if (legacy.language) setLanguage(legacy.language);
      SaveManager.saveSettings();
    } catch {
      return;
    }
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

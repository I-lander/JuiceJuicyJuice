import { CustomScene } from '../customClasses/CustomScene';
import { Progression } from '../Progression';
import { Sprite } from '../objects/Sprite';
import { getRandomInt, initGlitchShader, initShader, removeSplashScreen } from '../utils/utils';
import { UIScene } from './UIScene';
import { spriteElements } from '../elements/SpriteAtlas';
import { EventHandler } from '../utils/EventHandler';
import { Particle } from '../objects/Particle';
import { SaveManager } from '../utils/SaveManager';
const GLITCH_CPU_THRESHOLD = 50;
const GLITCH_CPU_MAX = 100;
const UI_GLITCH_RATIO = 0.15;

export class MainScene extends CustomScene {
  uiScene!: UIScene;
  eventHandler!: EventHandler;

  canvasWidth: number = 0;
  canvasHeight: number = 0;
  tileSize: number = 0;
  isPortrait: boolean = false;

  camera: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  sprites: Sprite[] = [];
  particles: Particle[] = [];
  maxParticlesPerClick: number = 500;
  bgMusic!: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
  private autoClickTimer: number = 0;
  private passiveJuiceTimer: number = 0;

  constructor() {
    super('MainScene');
  }

  create() {
    super.create();
    removeSplashScreen(this);

    this.canvasHeight = this.cameras.main.height;
    this.canvasWidth = this.cameras.main.width;
    this.isPortrait = this.canvasHeight > this.canvasWidth;
    this.tileSize = Math.min(this.canvasWidth, this.canvasHeight) / 14;
    this.pixelUnit = this.tileSize / 16;

    this.add.rectangle(
      this.canvasWidth / 2,
      this.canvasHeight / 2,
      this.canvasWidth,
      this.canvasHeight,
      0x42a72e,
    );
    initShader(this);
    this.uiScene = this.scene.get('UIScene') as UIScene;
    this.eventHandler = new EventHandler(this);
    this.initCamera();

    const saveData = SaveManager.load();
    if (saveData) {
      SaveManager.applyLoad(saveData, this);
    }
    SaveManager.setupVisibilityListener(this);
    initGlitchShader(this);

    // this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.4 }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
    // this.bgMusic.play();
  }

  initCamera() {
    this.camera = {
      x: 0,
      y: 0,
      width: this.canvasWidth,
      height: this.canvasHeight,
    };
    this.cameras.main.setViewport(
      this.camera.x,
      this.camera.y,
      this.camera.width,
      this.camera.height,
    );
  }

  getTotalParticleCount(): number {
    let count = 0;
    for (let i = 0; i < this.sprites.length; i++) {
      count += this.getAliveParticleCount();
    }
    return count;
  }

  getAliveParticleCount(): number {
    return this.particles.length;
  }

  spawnSprite(frame: string) {
    Progression.sprites++;

    const margin = this.tileSize / 2;
    let spawnX = getRandomInt(margin, this.camera.width - margin);
    let spawnY = getRandomInt(margin, this.camera.height - margin);
    let isSpawnValid = false;
    while (!isSpawnValid) {
      if (
        spawnX > this.uiScene.juicePanelBounds.x - margin &&
        spawnX < this.uiScene.juicePanelBounds.x + this.uiScene.juicePanelBounds.width + margin &&
        spawnY > this.uiScene.juicePanelBounds.y - margin &&
        spawnY < this.uiScene.juicePanelBounds.y + this.uiScene.juicePanelBounds.height + margin
      ) {
        spawnX = getRandomInt(margin, this.camera.width - margin);
        spawnY = getRandomInt(margin, this.camera.height - margin);
      } else {
        isSpawnValid = true;
      }
    }
    const newSprite = new Sprite(this, spawnX, spawnY);

    newSprite.init(frame);

    this.sprites.push(newSprite);
  }

  clearEntities() {
    for (const sprite of this.sprites) {
      sprite.destroy();
    }
    this.sprites = [];
    for (const particle of this.particles) {
      particle.destroy();
    }
    this.particles = [];
    this.time.removeAllEvents();
    this.autoClickTimer = 0;
    this.passiveJuiceTimer = 0;
  }

  private autoClick() {
    for (let i = 0; i < Progression.autoClickers; i++) {
      const randomX = getRandomInt(this.camera.x, this.camera.x + this.camera.width);
      const randomY = getRandomInt(this.camera.y, this.camera.y + this.camera.height);
      this.time.delayedCall(i * Math.random() * 200, () => {
        this.eventHandler.spawnParticles(randomX, randomY);
      });
    }
  }

  update(_time: number, delta: number) {
    for (let i = 0; i < this.sprites.length; i++) {
      this.sprites[i].update(delta);
    }

    this.passiveJuiceTimer += delta;
    if (this.passiveJuiceTimer >= 1000) {
      this.passiveJuiceTimer -= 1000;
      const juicePerSecond = Progression.getTotalJuicePerSecond();

      if (juicePerSecond > 0) {
        Progression.addJuice(juicePerSecond);
      }
    }

    if (Progression.autoClickers > 0) {
      this.autoClickTimer += delta;
      if (this.autoClickTimer >= Progression.autoClickerCooldown) {
        this.autoClickTimer -= Progression.autoClickerCooldown;
        this.autoClick();
      }
    }
    this.particles = this.particles.filter((particle) => particle.update(delta));

    const movingSpriteCount = Progression.isSpriteMovementEnabled ? this.sprites.length : 0;
    const rotatingSpriteCount = Progression.isSpriteRotationEnabled ? this.sprites.length : 0;
    const activeTweenCount = this.tweens.getTweens().length;
    Progression.calculateCpuUsage(
      this.sprites.length,
      this.getTotalParticleCount(),
      activeTweenCount,
      movingSpriteCount,
      rotatingSpriteCount,
      delta,
    );

    const glitchIntensity = Math.max(
      0,
      Math.min(
        1,
        (Progression.cpuPercent - GLITCH_CPU_THRESHOLD) /
          (GLITCH_CPU_MAX - GLITCH_CPU_THRESHOLD),
      ),
    );

    if (this.glitchShader) {
      this.glitchShader.glitchIntensity = glitchIntensity;
    }
    if (this.uiScene?.glitchShader) {
      this.uiScene.glitchShader.glitchIntensity = glitchIntensity * UI_GLITCH_RATIO;
    }

    SaveManager.updateAutoSave(delta, this);
  }
}

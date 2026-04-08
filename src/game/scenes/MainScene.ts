import { CustomScene } from '../customClasses/CustomScene';
import { Progression } from '../Progression';
import { Sprite } from '../objects/Sprite';
import { getRandomInt, initShader, removeSplashScreen } from '../utils/utils';
import { UIScene } from './UIScene';
import { spriteElements } from '../elements/SpriteAtlas';
import { EventHandler } from '../utils/EventHandler';
import { Particle } from '../objects/Particle';
export class MainScene extends CustomScene {
  uiScene!: UIScene;
  eventHandler!: EventHandler;

  canvasWidth: number = 0;
  canvasHeight: number = 0;
  tileSize: number = 0;

  camera: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  sprites: Sprite[] = [];
  particles: Particle[] = [];
  maxParticlesPerClick: number = 500;
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
    this.tileSize = this.cameras.main.height / 14;
    this.pixelUnit = this.tileSize / 16;

    this.add.rectangle(
      this.canvasWidth / 2,
      this.canvasHeight / 2,
      this.canvasWidth,
      this.canvasHeight,
      0x42a72e,
    );

    this.uiScene = this.scene.get('UIScene') as UIScene;
    this.eventHandler = new EventHandler(this);
    this.initCamera();
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
    const spawnX = getRandomInt(margin, this.camera.width - margin);
    const spawnY = getRandomInt(margin, this.camera.height - margin);

    const newSprite = new Sprite(this, spawnX, spawnY);

    newSprite.init(frame);

    this.sprites.push(newSprite);
  }

  private autoClick() {
    for (let i = 0; i < Progression.autoClickers; i++) {
      const randomX = getRandomInt(this.camera.x, this.camera.x + this.camera.width);
      const randomY = getRandomInt(this.camera.y, this.camera.y + this.camera.height);
      this.eventHandler.spawnParticles(randomX, randomY);
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
  }
}

import { CustomScene } from '../customClasses/CustomScene';
import { Progression } from '../Progression';
import { Sprite } from '../objects/Sprite';
import { getRandomInt, removeSplashScreen } from '../utils/utils';
import { UIScene } from './UIScene';
export class MainScene extends CustomScene {
  uiScene!: UIScene;

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
  private autoClickTimer: number = 0;

  constructor() {
    super('MainScene');
  }

  create() {
    super.create();
    removeSplashScreen(this);

    this.canvasHeight = this.cameras.main.height;
    this.canvasWidth = this.cameras.main.width;
    this.tileSize = this.cameras.main.height / 18;
    this.pixelUnit = this.tileSize / 16;

    this.uiScene = this.scene.get('UIScene') as UIScene;
    this.initCamera();

    this.spawnSprite('house');
  }

  initCamera() {
    const panelWidth = UIScene.leftPanelWidthInTiles * this.tileSize;

    this.camera = {
      x: panelWidth,
      y: 0,
      width: this.canvasWidth - panelWidth,
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
      count += this.sprites[i].getAliveParticleCount();
    }
    return count;
  }

  spawnSprite(frame: string) {
    console.log(this.sprites);

    const margin = this.tileSize * 2;
    const spawnX = getRandomInt(margin, this.camera.width - margin);
    const spawnY = getRandomInt(margin, this.camera.height - margin);

    let newSprite: Sprite;
    if (this.sprites.length === 0) {
      const centerX = this.camera.width / 2;
      const centerY = this.camera.height / 2;
      newSprite = new Sprite(this, centerX, centerY);
    } else {
      newSprite = new Sprite(this, spawnX, spawnY);
    }

    newSprite.init(frame);
    this.sprites.push(newSprite);
  }

  private autoClick() {
    if (this.sprites.length === 0) return;

    for (let i = 0; i < Progression.autoClickers; i++) {
      const targetIndex = getRandomInt(0, this.sprites.length - 1);
      this.sprites[targetIndex].onClick();
    }
  }

  update(_time: number, delta: number) {
    for (let i = 0; i < this.sprites.length; i++) {
      this.sprites[i].update(delta);
    }

    if (Progression.autoClickers > 0) {
      this.autoClickTimer += delta;
      if (this.autoClickTimer >= Progression.autoClickerCooldown) {
        this.autoClickTimer -= Progression.autoClickerCooldown;
        this.autoClick();
      }
    }
  }
}

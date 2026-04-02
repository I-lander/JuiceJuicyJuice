import { CustomScene } from '../customClasses/CustomScene';
import { Sprite } from '../objects/Sprite';
import { removeSplashScreen } from '../utils/utils';
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

    const firstSprite = new Sprite(this, this.canvasWidth / 2, this.canvasHeight / 2);
    firstSprite.init('house');
    this.sprites.push(firstSprite);
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

  update(_time: number, delta: number) {
    for (let i = 0; i < this.sprites.length; i++) {
      this.sprites[i].update(delta);
    }
  }
}

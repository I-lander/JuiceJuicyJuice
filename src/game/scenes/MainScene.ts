import { CustomScene } from '../customClasses/CustomScene';
import { Sprite } from '../objects/Sprite';
import { removeSplashScreen } from '../utils/utils';
import { UIScene } from './UIScene';
export class MainScene extends CustomScene {
  uiScene!: UIScene;

  canvasWidth: number = 0;
  canvasHeight: number = 0;
  tileSize: number = 0;

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

  }

  update(_time: number, delta: number) {
  }
}

import { CustomScene } from '../customClasses/CustomScene';
import { MainScene } from './MainScene';

export class UIScene extends CustomScene {
  mainScene!: MainScene;

  static leftPanelWidthInTiles = 4;

  constructor() {
    super('UIScene');
  }

  preload() {
    this.mainScene = this.scene.get('MainScene') as MainScene;
  }

  create() {
    this.tileSize = this.mainScene.tileSize;
    this.pixelUnit = this.mainScene.pixelUnit;
  }

  update() {}
}

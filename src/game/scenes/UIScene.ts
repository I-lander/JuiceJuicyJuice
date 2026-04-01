import { CustomScene } from '../customClasses/CustomScene';
import { MainScene } from './MainScene';

export class UIScene extends CustomScene {
  mainScene!: MainScene;

  private phaseText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  preload() {
    this.mainScene = this.scene.get('MainScene') as MainScene;
  }

  create() {
    this.tileSize = this.mainScene.tileSize;
    this.pixelUnit = this.mainScene.pixelUnit;

    const fontSize = Math.round(this.tileSize * 0.6);
    const padding = this.tileSize * 0.5;

    this.dayText = this.add.text(padding, padding, '', {
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setAlpha(0.8);

    this.phaseText = this.add.text(padding, padding + fontSize * 1.2, '', {
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setAlpha(0.8);

    this.timerText = this.add.text(padding, padding + fontSize * 2.4, '', {
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setAlpha(0.6);
  }


  update() {

  }
}

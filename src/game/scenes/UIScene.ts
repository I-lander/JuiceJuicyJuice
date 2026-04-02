import { CustomScene } from '../customClasses/CustomScene';
import { createUIPanel, FRONT_DEPTH } from '../utils/utils';
import { MainScene } from './MainScene';

export class UIScene extends CustomScene {
  mainScene!: MainScene;

  static leftPanelWidthInTiles = 6;

  private panelGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super('UIScene');
  }

  preload() {
    this.mainScene = this.scene.get('MainScene') as MainScene;
  }

  create() {
    this.tileSize = this.mainScene.tileSize;
    this.pixelUnit = this.mainScene.pixelUnit;

    this.drawLeftPanel();
  }

  private drawLeftPanel() {
    const screenHeight = this.cameras.main.height;
    const panelWidth = UIScene.leftPanelWidthInTiles * this.tileSize;
    const pixelUnit = this.pixelUnit;
    const margin = pixelUnit * 3;

    const panelX = margin;
    const panelY = margin;
    const panelW = panelWidth - margin * 2;
    const panelH = screenHeight - margin * 2;

    this.panelGraphics = this.add.graphics();
    this.panelGraphics.setDepth(FRONT_DEPTH);

    this.panelGraphics.fillStyle(0x000033, 0.92);
    this.panelGraphics.fillRect(panelX, panelY, panelW, panelH);

    const borderWidth = pixelUnit;

    createUIPanel(
      this.panelGraphics,
      panelX,
      panelY,
      panelW,
      panelH,
      borderWidth,
      0xffffff,
      1,
    );

    const inset = pixelUnit * 2;
    createUIPanel(
      this.panelGraphics,
      panelX + inset,
      panelY + inset,
      panelW - inset * 2,
      panelH - inset * 2,
      borderWidth,
      0x4444aa,
      0.8,
    );
  }

  update() {}
}

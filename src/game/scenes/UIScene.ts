import { CustomScene } from '../customClasses/CustomScene';
import { Progression } from '../Progression';
import { Shop } from '../objects/Shop';
import { createUIPanel, FRONT_DEPTH } from '../utils/utils';
import { MainScene } from './MainScene';

export class UIScene extends CustomScene {
  mainScene!: MainScene;

  static leftPanelWidthInTiles = 6;

  private panelGraphics!: Phaser.GameObjects.Graphics;
  private shop!: Shop;
  private hudText!: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  preload() {
    this.mainScene = this.scene.get('MainScene') as MainScene;
  }

  create() {
    this.tileSize = this.mainScene.tileSize;
    this.pixelUnit = this.mainScene.pixelUnit;

    const panelLayout = this.drawLeftPanel();
    this.shop = new Shop(
      this,
      panelLayout.innerX,
      panelLayout.innerWidth,
      panelLayout.contentStartY,
    );

    this.createHud();
  }

  private createHud() {
    const fontSize = Math.round(this.pixelUnit * 10);
    const screenWidth = this.cameras.main.width;
    const margin = this.pixelUnit * 5;

    this.hudText = this.add.text(screenWidth - margin, margin, '', {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    this.hudText.setOrigin(1, 0);
    this.hudText.setDepth(FRONT_DEPTH + 10);
  }

  private getCpuColor(simulatedFps: number): string {
    if (simulatedFps >= 45) return '#44ff44';
    if (simulatedFps >= 30) return '#aaff44';
    if (simulatedFps >= 20) return '#ffdd44';
    if (simulatedFps >= 10) return '#ff8844';
    if (simulatedFps >= 5) return '#ff4444';
    return '#ff0000';
  }

  private refreshHud() {
    const fps = Math.round(Progression.simulatedFps);
    const cpu = Math.round(Progression.cpuUsage);
    const cpuColor = this.getCpuColor(Progression.simulatedFps);

    this.hudText.setText(`FPS: ${fps}  CPU: ${cpu}`);
    this.hudText.setColor(cpuColor);
  }

  private drawLeftPanel(): { innerX: number; innerWidth: number; contentStartY: number } {
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

    createUIPanel(this.panelGraphics, panelX, panelY, panelW, panelH, borderWidth, 0xffffff, 1);

    const inset = pixelUnit * 2;

    return {
      innerX: panelX + inset,
      innerWidth: panelW - inset * 2,
      contentStartY: panelY + inset + pixelUnit * 3,
    };
  }

  update() {
    this.shop.update();
    this.refreshHud();
  }
}

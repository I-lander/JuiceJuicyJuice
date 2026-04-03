import { CustomScene } from '../customClasses/CustomScene';
import { Progression } from '../Progression';
import { Shop } from '../objects/Shop';
import { UPGRADES } from '../objects/ShopUpgrades';
import { createUIPanel, FRONT_DEPTH, getColors } from '../utils/utils';
import { MainScene } from './MainScene';

export class UIScene extends CustomScene {
  mainScene!: MainScene;

  static leftPanelWidthInTiles = 6;

  private panelGraphics!: Phaser.GameObjects.Graphics;
  private shop!: Shop;
  private hudText!: Phaser.GameObjects.Text;
  private previouslyUnlocked: Set<string> = new Set();
  private notificationQueue: string[] = [];
  private notificationContainer!: Phaser.GameObjects.Container;
  private notificationText!: Phaser.GameObjects.Text;
  private notificationBackground!: Phaser.GameObjects.Graphics;
  private notificationActive: boolean = false;

  constructor() {
    super('UIScene');
  }

  preload() {
    this.mainScene = this.scene.get('MainScene') as MainScene;
  }

  create() {
    this.tileSize = this.mainScene.tileSize;
    this.pixelUnit = this.mainScene.pixelUnit;

    this.add
      .rectangle(0, 0, this.mainScene.camera.x + 1, this.mainScene.camera.height, 0x42a72e)
      .setOrigin(0, 0);
    const panelLayout = this.drawLeftPanel();
    this.shop = new Shop(
      this,
      panelLayout.innerX,
      panelLayout.innerWidth,
      panelLayout.contentStartY,
      panelLayout.panelBottomY,
    );

    this.createHud();
    this.createNotification();
    this.initUnlockedUpgrades();
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

  private drawLeftPanel(): {
    innerX: number;
    innerWidth: number;
    contentStartY: number;
    panelBottomY: number;
  } {
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

    this.panelGraphics.fillStyle(0x000033, 1);
    this.panelGraphics.fillRect(panelX, panelY, panelW, panelH);

    const borderWidth = pixelUnit;

    createUIPanel(this.panelGraphics, panelX, panelY, panelW, panelH, borderWidth, 0xffffff, 1);

    const inset = pixelUnit * 2;

    return {
      innerX: panelX + inset,
      innerWidth: panelW - inset * 2,
      contentStartY: panelY + inset + pixelUnit * 3,
      panelBottomY: panelY + panelH - inset,
    };
  }

  private initUnlockedUpgrades() {
    for (const key in UPGRADES) {
      if (Progression.isUpgradeUnlocked(key)) {
        this.previouslyUnlocked.add(key);
      }
    }
  }

  private createNotification() {
    const pixelUnit = this.pixelUnit;
    const fontSize = Math.round(pixelUnit * 10);

    this.notificationBackground = this.add.graphics();
    this.notificationText = this.add.text(0, 0, '', {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });

    this.notificationContainer = this.add.container(0, 0, [
      this.notificationBackground,
      this.notificationText,
    ]);
    this.notificationContainer.setDepth(FRONT_DEPTH + 20);
    this.notificationContainer.setVisible(false);
  }

  private checkNewUnlocks() {
    for (const key in UPGRADES) {
      if (Progression.isUpgradeUnlocked(key) && !this.previouslyUnlocked.has(key)) {
        this.previouslyUnlocked.add(key);
        this.notificationQueue.push(UPGRADES[key].name);
      }
    }
  }

  private showNotification(name: string) {
    const pixelUnit = this.pixelUnit;
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const padding = pixelUnit * 4;
    const margin = pixelUnit * 8;

    this.notificationText.setText(`New: ${name}`);
    const textWidth = this.notificationText.width;
    const textHeight = this.notificationText.height;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = textHeight + padding * 2;

    this.notificationBackground.clear();
    createUIPanel(this.notificationBackground, 0, 0, boxWidth, boxHeight, pixelUnit, 0x4444aa, 1, {
      color: getColors('rgb(27, 41, 83)'),
      alpha: 1,
    });
    this.notificationText.setPosition(padding, padding);

    this.notificationContainer.setPosition(
      screenWidth - margin - boxWidth,
      screenHeight - margin - boxHeight,
    );
    this.notificationContainer.setAlpha(1);
    this.notificationContainer.setVisible(true);
    this.notificationActive = true;

    this.tweens.add({
      targets: this.notificationContainer,
      alpha: 0,
      delay: 2000,
      duration: 500,
      ease: 'Power1',
      onComplete: () => {
        this.notificationContainer.setVisible(false);
        this.notificationActive = false;
      },
    });
  }

  private updateNotifications() {
    if (!this.notificationActive && this.notificationQueue.length > 0) {
      const next = this.notificationQueue.shift()!;
      this.showNotification(next);
    }
  }

  update() {
    this.shop.update();
    this.refreshHud();
    this.checkNewUnlocks();
    this.updateNotifications();
  }
}

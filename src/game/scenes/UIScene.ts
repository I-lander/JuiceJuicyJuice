import { CustomScene } from '../customClasses/CustomScene';
import { Progression } from '../Progression';
import { Shop } from '../objects/Shop';
import { UPGRADES } from '../objects/ShopUpgrades';
import { createUIPanel, FRONT_DEPTH, getColors } from '../utils/utils';
import { MainScene } from './MainScene';

export class UIScene extends CustomScene {
  mainScene!: MainScene;

  static leftPanelWidthInTiles = 5;

  private panelGraphics!: Phaser.GameObjects.Graphics;
  shop!: Shop;
  private hudText!: Phaser.GameObjects.Text;
  private previouslyUnlocked: Set<string> = new Set();
  private notificationQueue: string[] = [];
  private notificationContainer!: Phaser.GameObjects.Container;
  private notificationText!: Phaser.GameObjects.Text;
  private notificationBackground!: Phaser.GameObjects.Graphics;
  private notificationActive: boolean = false;

  private collapsed: boolean = false;
  private animating: boolean = false;
  private panelContainer!: Phaser.GameObjects.Container;
  private toggleButton!: Phaser.GameObjects.Graphics;
  private toggleImg!: Phaser.GameObjects.Image;
  private toggleZone!: Phaser.GameObjects.Zone;

  constructor() {
    super('UIScene');
  }

  preload() {
    this.mainScene = this.scene.get('MainScene') as MainScene;
  }

  create() {
    this.tileSize = this.mainScene.tileSize;
    this.pixelUnit = this.mainScene.pixelUnit;

    this.panelContainer = this.add.container(0, 0);
    this.panelContainer.setDepth(FRONT_DEPTH);

    const panelLayout = this.drawLeftPanel();
    this.panelContainer.add(this.panelGraphics);

    this.shop = new Shop(
      this,
      this.panelContainer,
      panelLayout.innerX,
      panelLayout.innerWidth,
      panelLayout.contentStartY,
      panelLayout.panelBottomY,
    );

    this.createToggleButton();
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

    this.panelGraphics = this.add.graphics();
    this.panelGraphics.setDepth(FRONT_DEPTH);

    this.panelGraphics.fillStyle(0x000033, 1);
    this.panelGraphics.fillRect(0, 0, panelWidth, screenHeight);

    this.panelGraphics.fillStyle(0xffffff, 1);
    this.panelGraphics.fillRect(panelWidth - pixelUnit, 0, pixelUnit, screenHeight);

    const inset = pixelUnit * 3;

    return {
      innerX: inset,
      innerWidth: panelWidth - inset * 2,
      contentStartY: inset + pixelUnit * 3,
      panelBottomY: screenHeight - inset,
    };
  }

  private createToggleButton() {
    const pixelUnit = this.pixelUnit;
    const panelWidth = UIScene.leftPanelWidthInTiles * this.tileSize;
    const buttonWidth = pixelUnit * 14;
    const buttonHeight = pixelUnit * 14;
    const buttonX = panelWidth + buttonWidth / 2 + pixelUnit / 2;
    const buttonY = pixelUnit * 3.5 + buttonHeight / 2;

    this.toggleButton = this.add.graphics();
    this.toggleImg = this.add.image(buttonX, buttonY, 'uiAtlas', 'leftArrow');
    this.toggleImg.setDisplaySize(buttonWidth * 0.6, buttonHeight * 0.6);
    this.toggleButton.setDepth(FRONT_DEPTH + 30);
    this.toggleImg.setDepth(FRONT_DEPTH + 30);
    this.drawToggleArrow(buttonX, buttonY, this.tileSize, this.tileSize);

    this.toggleZone = this.add.zone(buttonX, buttonY, buttonWidth, buttonHeight);
    this.toggleZone.setDepth(FRONT_DEPTH + 31);
    this.toggleZone.setInteractive({ useHandCursor: true });
    this.toggleZone.on('pointerup', () => this.togglePanel());
  }

  private drawToggleArrow(centerX: number, centerY: number, width: number, height: number) {
    const pixelUnit = this.pixelUnit;
    this.toggleButton.clear();
    this.toggleButton.fillStyle(0x000033, 0.9);
    this.toggleButton.lineStyle(pixelUnit, 0xffffff, 1);
    this.toggleButton.fillRect(centerX - width / 2, centerY - height / 2, width, height);
    this.toggleButton.strokeRect(centerX - width / 2, centerY - height / 2, width, height);

    this.toggleButton.fillStyle(0xffffff, 1);
  }

  private togglePanel() {
    if (this.animating) return;
    this.animating = true;
    this.collapsed = !this.collapsed;

    const panelWidth = UIScene.leftPanelWidthInTiles * this.tileSize;
    const collapsedWidth = 0;
    const targetX = this.collapsed ? -(panelWidth - collapsedWidth) : 0;

    const delta = targetX - this.panelContainer.x;
    if (this.collapsed) {
      this.toggleImg.setFlipX(true);
    } else {
      this.toggleImg.setFlipX(false);
    }
    this.tweens.add({
      targets: [this.panelContainer, this.toggleButton, this.toggleImg, this.toggleZone],
      x: `+=${delta}`,
      duration: 250,
      ease: 'Power2',
      onComplete: () => {
        this.animating = false;
      },
    });
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
    if (!this.collapsed) {
      this.shop.update();
    }
    this.refreshHud();
    this.checkNewUnlocks();
    this.updateNotifications();
  }
}

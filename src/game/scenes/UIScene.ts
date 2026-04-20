import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { CustomScene } from '../customClasses/CustomScene';
import { Progression } from '../Progression';
import { Prestige, PRESTIGE_UPGRADES } from '../Prestige';
import { OptionsMenu } from '../objects/OptionsMenu';
import { Shop } from '../objects/Shop';
import { UPGRADES } from '../objects/ShopUpgrades';
import { t } from '../utils/i18n';
import {
  createUIPanel,
  formatNumber,
  FRONT_DEPTH,
  getColors,
  initGlitchShader,
  playSfx,
} from '../utils/utils';
import { MainScene } from './MainScene';
import { SaveManager } from '../utils/SaveManager';

const DEMO_MODE = import.meta.env?.VITE_DEMO_MODE === 'true';

export class UIScene extends CustomScene {
  mainScene!: MainScene;

  static leftPanelWidthInTiles = 8;
  static bottomPanelHeightInTiles = 14;

  private panelGraphics!: Phaser.GameObjects.Graphics;
  shop!: Shop;
  private juicePanel!: Phaser.GameObjects.Graphics;
  private juiceText!: Phaser.GameObjects.Text;
  private juicePerSecondText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private previouslyUnlocked: Set<string> = new Set();
  private notificationQueue: string[] = [];
  private notificationContainer!: Phaser.GameObjects.Container;
  private notificationText!: Phaser.GameObjects.Text;
  private notificationBackground!: Phaser.GameObjects.Graphics;
  private notificationActive: boolean = false;

  private isPortrait: boolean = false;
  private collapsed: boolean = false;
  private animating: boolean = false;
  private panelContainer!: Phaser.GameObjects.Container;
  private toggleButton!: Phaser.GameObjects.Graphics;
  private toggleImg!: Phaser.GameObjects.Image;
  private toggleZone!: Phaser.GameObjects.Zone;

  private optionsMenu!: OptionsMenu;
  private menuBtnGraphics!: Phaser.GameObjects.Graphics;
  private menuBtnImg!: Phaser.GameObjects.Image;
  private menuBtnZone!: Phaser.GameObjects.Zone;
  private crashContainer!: Phaser.GameObjects.Container;
  private crashActive: boolean = false;
  private prestigePointsText!: Phaser.GameObjects.Text;
  private prestigeButtons: Array<{
    key: string;
    graphics: Phaser.GameObjects.Graphics;
    nameText: Phaser.GameObjects.Text;
    infoText: Phaser.GameObjects.Text;
    x: number;
    y: number;
    width: number;
    height: number;
  }> = [];

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

    this.isPortrait = this.mainScene.isPortrait;

    const panelLayout = this.isPortrait ? this.drawBottomPanel() : this.drawLeftPanel();
    this.panelContainer.add(this.panelGraphics);

    this.shop = new Shop(
      this,
      this.panelContainer,
      panelLayout.innerX,
      panelLayout.innerWidth,
      panelLayout.contentStartY,
      panelLayout.panelBottomY,
    );
    this.createJuiceCounter();
    this.createMenuButton();
    this.createToggleButton();
    this.optionsMenu = new OptionsMenu(this, {
      onResume: () => this.closeMenu(),
      onReset: () => {
        SaveManager.deleteSave();
        this.mainScene.clearEntities();
        Progression.reset();
        this.mainScene.spawnPrestigeStartingSprites();
        this.previouslyUnlocked.clear();
        this.initUnlockedUpgrades();
        this.closeMenu();
      },
      onDeleteMeta: () => SaveManager.deleteMetaSave(),
      onQuit: () => {
        if (Capacitor.isNativePlatform()) {
          App.exitApp();
        } else if (window.electron) {
          window.electron.quitApp();
        }
      },
    });
    this.createHud();
    this.createNotification();
    this.initUnlockedUpgrades();
    initGlitchShader(this);
  }

  private createJuiceCounter() {
    const pixelUnit = this.pixelUnit;
    const fontSize = Math.round(pixelUnit * 16);

    const screenWidth = this.cameras.main.width;
    const padding = pixelUnit * 4;
    const centerX = screenWidth / 2;
    const topY = pixelUnit * 5;

    this.juiceText = this.add.text(centerX, topY + padding, '0', {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffdd44',
    });
    this.juiceText.setOrigin(0.5, 0);
    this.juiceText.setDepth(FRONT_DEPTH + 11);

    const smallFontSize = Math.round(pixelUnit * 10);
    this.juicePerSecondText = this.add.text(
      centerX,
      topY + padding + fontSize - pixelUnit * 2,
      '',
      {
        fontFamily: 'KenneyPixel',
        fontSize: `${smallFontSize}px`,
        color: '#aaaaaa',
      },
    );
    this.juicePerSecondText.setOrigin(0.5, 0);
    this.juicePerSecondText.setDepth(FRONT_DEPTH + 11);

    this.juicePanel = this.add.graphics();
    this.juicePanel.setDepth(FRONT_DEPTH + 10);
  }

  juicePanelBounds: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  private refreshJuicePanel() {
    const pixelUnit = this.pixelUnit;
    const padding = pixelUnit * 4;
    const textHeight = this.juiceText.height + this.juicePerSecondText.height + pixelUnit * 2;
    const panelWidth = this.tileSize * 4;
    const panelHeight = textHeight + padding * 2;
    const panelX = this.juiceText.x - panelWidth / 2;
    const panelY = this.juiceText.y - padding;

    this.juicePanelBounds = { x: panelX, y: panelY, width: panelWidth, height: panelHeight };

    this.juicePanel.clear();
    this.juicePanel.fillStyle(0x000033, 0.8);
    this.juicePanel.fillRect(panelX, panelY, panelWidth, panelHeight);
    createUIPanel(this.juicePanel, panelX, panelY, panelWidth, panelHeight, pixelUnit, 0xffffff, 1);
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

  private getCpuColor(cpuPercent: number): string {
    if (cpuPercent <= 20) return '#44ff44';
    if (cpuPercent <= 40) return '#aaff44';
    if (cpuPercent <= 60) return '#ffdd44';
    if (cpuPercent <= 80) return '#ff8844';
    if (cpuPercent <= 95) return '#ff4444';
    return '#ff0000';
  }

  private refreshHud() {
    const cpuPercent = Math.round(Progression.cpuPercent);
    const cpuUsed = Math.round(Progression.cpuUsage);
    const cpuCapacity = Math.round(Progression.cpuCapacityMhz);
    const cpuColor = this.getCpuColor(Progression.cpuPercent);

    this.hudText.setText(`CPU: ${cpuPercent}%  ${cpuUsed}/${cpuCapacity} MHz`);
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

    this.panelGraphics.fillStyle(0x000033, 0.8);
    this.panelGraphics.fillRect(0, 0, panelWidth, screenHeight);

    this.panelGraphics.fillStyle(0xffffff, 1);
    this.panelGraphics.fillRect(panelWidth - pixelUnit, 0, pixelUnit, screenHeight);

    const inset = pixelUnit * 3;

    return {
      innerX: inset,
      innerWidth: panelWidth - inset * 2,
      contentStartY: inset,
      panelBottomY: screenHeight - inset,
    };
  }

  private drawBottomPanel(): {
    innerX: number;
    innerWidth: number;
    contentStartY: number;
    panelBottomY: number;
  } {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const panelHeight = UIScene.bottomPanelHeightInTiles * this.tileSize;
    const panelTopY = screenHeight - panelHeight;
    const pixelUnit = this.pixelUnit;

    this.panelGraphics = this.add.graphics();
    this.panelGraphics.setDepth(FRONT_DEPTH);

    this.panelGraphics.fillStyle(0x000033, 0.8);
    this.panelGraphics.fillRect(0, panelTopY, screenWidth, panelHeight);

    this.panelGraphics.fillStyle(0xffffff, 1);
    this.panelGraphics.fillRect(0, panelTopY, screenWidth, pixelUnit);

    const inset = pixelUnit * 3;

    return {
      innerX: inset,
      innerWidth: screenWidth - inset * 2,
      contentStartY: panelTopY + inset + pixelUnit * 3,
      panelBottomY: screenHeight - inset,
    };
  }

  private createToggleButton() {
    const pixelUnit = this.pixelUnit;
    const buttonWidth = pixelUnit * 14;
    const buttonHeight = pixelUnit * 14;

    let buttonX: number;
    let buttonY: number;

    if (this.isPortrait) {
      const screenWidth = this.cameras.main.width;
      const screenHeight = this.cameras.main.height;
      const panelHeight = UIScene.bottomPanelHeightInTiles * this.tileSize;
      const panelTopY = screenHeight - panelHeight;
      buttonX = screenWidth / 2;
      buttonY = panelTopY - this.tileSize / 2;
    } else {
      const panelWidth = UIScene.leftPanelWidthInTiles * this.tileSize;
      buttonX = panelWidth + buttonWidth / 2 + pixelUnit / 2;
      const menuY = pixelUnit * 3.5 + buttonHeight / 2;
      buttonY = menuY + this.tileSize + pixelUnit * 2;
    }

    this.toggleButton = this.add.graphics();
    this.toggleImg = this.add.image(buttonX, buttonY, 'uiAtlas', 'leftArrow');
    this.toggleImg.setDisplaySize(buttonWidth * 0.6, buttonHeight * 0.6);
    if (this.isPortrait) {
      this.toggleImg.setAngle(-90);
    }
    this.toggleButton.setDepth(FRONT_DEPTH + 30);
    this.toggleImg.setDepth(FRONT_DEPTH + 30);
    this.drawToggleArrow(buttonX, buttonY, this.tileSize, this.tileSize);

    this.toggleZone = this.add.zone(buttonX, buttonY, buttonWidth, buttonHeight);
    this.toggleZone.setDepth(FRONT_DEPTH + 31);
    this.toggleZone.setInteractive({ useHandCursor: true });
    this.toggleZone.on('pointerup', () => this.togglePanel());
  }

  private createMenuButton() {
    const pixelUnit = this.pixelUnit;
    const buttonSize = pixelUnit * 14;

    let buttonX: number;
    let buttonY: number;

    if (this.isPortrait) {
      buttonX = pixelUnit * 3.5 + buttonSize / 2;
      buttonY = pixelUnit * 3.5 + buttonSize / 2;
    } else {
      const panelWidth = UIScene.leftPanelWidthInTiles * this.tileSize;
      buttonX = panelWidth + buttonSize / 2 + pixelUnit / 2;
      buttonY = pixelUnit * 3.5 + buttonSize / 2;
    }

    this.menuBtnGraphics = this.add.graphics();
    this.menuBtnGraphics.setDepth(FRONT_DEPTH + 30);
    this.drawMenuButtonBackground(buttonX, buttonY, this.tileSize, this.tileSize);

    this.menuBtnImg = this.add.image(buttonX, buttonY, 'uiAtlas', 'menuBtn');
    this.menuBtnImg.setDisplaySize(buttonSize * 0.8, buttonSize * 0.8);
    this.menuBtnImg.setDepth(FRONT_DEPTH + 30);

    this.menuBtnZone = this.add.zone(buttonX, buttonY, buttonSize, buttonSize);
    this.menuBtnZone.setDepth(FRONT_DEPTH + 31);
    this.menuBtnZone.setInteractive({ useHandCursor: true });
    this.menuBtnZone.on('pointerup', () => this.openMenu());
  }

  private drawMenuButtonBackground(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
  ) {
    const pixelUnit = this.pixelUnit;
    this.menuBtnGraphics.clear();
    this.menuBtnGraphics.fillStyle(0x000033, 0.8);
    this.menuBtnGraphics.lineStyle(pixelUnit, 0xffffff, 1);
    this.menuBtnGraphics.fillRect(centerX - width / 2, centerY - height / 2, width, height);
    this.menuBtnGraphics.strokeRect(centerX - width / 2, centerY - height / 2, width, height);
    this.menuBtnGraphics.fillStyle(0xffffff, 1);
  }

  private drawToggleArrow(centerX: number, centerY: number, width: number, height: number) {
    const pixelUnit = this.pixelUnit;
    this.toggleButton.clear();
    this.toggleButton.fillStyle(0x000033, 0.8);
    this.toggleButton.lineStyle(pixelUnit, 0xffffff, 1);
    this.toggleButton.fillRect(centerX - width / 2, centerY - height / 2, width, height);
    this.toggleButton.strokeRect(centerX - width / 2, centerY - height / 2, width, height);

    this.toggleButton.fillStyle(0xffffff, 1);
  }

  private togglePanel() {
    if (this.animating) return;
    this.animating = true;
    this.collapsed = !this.collapsed;
    playSfx(this, 'buttonClick', 0.3);
    this.shop.scrollOffset = 0;
    this.shop.scrollContainer.y = 0;
    if (this.isPortrait) {
      const panelHeight = UIScene.bottomPanelHeightInTiles * this.tileSize;
      const targetY = this.collapsed ? panelHeight : 0;
      const delta = targetY - this.panelContainer.y;

      this.toggleImg.setAngle(this.collapsed ? 90 : -90);

      this.tweens.add({
        targets: [this.panelContainer, this.toggleButton, this.toggleImg, this.toggleZone],
        y: `+=${delta}`,
        duration: 250,
        ease: 'Power2',
        onComplete: () => {
          this.animating = false;
        },
      });
    } else {
      const panelWidth = UIScene.leftPanelWidthInTiles * this.tileSize;
      const targetX = this.collapsed ? -panelWidth : 0;
      const delta = targetX - this.panelContainer.x;

      this.toggleImg.setFlipX(this.collapsed);

      this.tweens.add({
        targets: [
          this.panelContainer,
          this.toggleButton,
          this.toggleImg,
          this.toggleZone,
          this.menuBtnGraphics,
          this.menuBtnImg,
          this.menuBtnZone,
        ],
        x: `+=${delta}`,
        duration: 250,
        ease: 'Power2',
        onComplete: () => {
          this.animating = false;
        },
      });
    }
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

    if (this.isPortrait) {
      this.panelContainer.add(this.notificationContainer);
    }
  }

  private checkNewUnlocks() {
    for (const key in UPGRADES) {
      if (Progression.isUpgradeUnlocked(key) && !this.previouslyUnlocked.has(key)) {
        this.previouslyUnlocked.add(key);
        this.notificationQueue.push(key);
      }
    }
  }

  private showNotification(upgradeKey: string) {
    const pixelUnit = this.pixelUnit;
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const padding = pixelUnit * 4;
    const margin = pixelUnit * 8;

    this.notificationText.setText(`${t('ui.newUnlock')}${t(`upgrade.${upgradeKey}.name`)}`);
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

    const notifY = this.isPortrait
      ? screenHeight - UIScene.bottomPanelHeightInTiles * this.tileSize - margin - boxHeight
      : screenHeight - margin - boxHeight;

    this.notificationContainer.setPosition(screenWidth - margin - boxWidth, notifY);
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

  openMenu() {
    if (this.optionsMenu.isOpen) return;
    this.optionsMenu.open();
    this.scene.pause('MainScene');
  }

  private closeMenu() {
    this.optionsMenu.close();
    this.scene.resume('MainScene');
  }

  showCrashScreen() {
    if (this.crashActive) return;
    this.crashActive = true;
    this.scene.pause('MainScene');

    if (DEMO_MODE) {
      this.showDemoEndScreen();
      return;
    }

    const pointsEarned = Prestige.computePointsForLevel(Progression.level);
    Prestige.awardPoints(pointsEarned);
    SaveManager.saveMeta();

    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const pixelUnit = this.pixelUnit;

    const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const titleFontSize = Math.round(pixelUnit * 22);
    const subtitleFontSize = Math.round(pixelUnit * 13);
    const messageFontSize = Math.round(pixelUnit * 9);
    const buttonFontSize = Math.round(pixelUnit * 14);
    const earnedFontSize = Math.round(pixelUnit * 12);
    const pointsFontSize = Math.round(pixelUnit * 11);
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    const titleY = centerY - pixelUnit * 75;
    const subtitleY = centerY - pixelUnit * 55;
    const messageY = centerY - pixelUnit * 40;
    const earnedY = centerY - pixelUnit * 22;
    const pointsY = centerY - pixelUnit * 8;
    const firstPrestigeY = centerY + pixelUnit * 10;
    const prestigeButtonHeight = pixelUnit * 18;
    const prestigeButtonGap = pixelUnit * 4;
    const prestigeButtonWidth = pixelUnit * 90;
    const prestigeKeys = Object.keys(PRESTIGE_UPGRADES);
    const rebootButtonY =
      firstPrestigeY +
      (prestigeButtonHeight + prestigeButtonGap) * prestigeKeys.length +
      pixelUnit * 10;

    const titleText = this.add.text(centerX, titleY, t('crash.title'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${titleFontSize}px`,
      color: '#ff0000',
    });
    titleText.setOrigin(0.5, 0.5);
    titleText.setAlpha(0);

    const subtitleText = this.add.text(centerX, subtitleY, t('crash.subtitle'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${subtitleFontSize}px`,
      color: '#ff4444',
    });
    subtitleText.setOrigin(0.5, 0.5);
    subtitleText.setAlpha(0);

    const messageText = this.add.text(centerX, messageY, t('crash.message'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${messageFontSize}px`,
      color: '#aaaaaa',
    });
    messageText.setOrigin(0.5, 0.5);
    messageText.setAlpha(0);

    const earnedText = this.add.text(
      centerX,
      earnedY,
      `+${pointsEarned} ${t('ui.prestigeEarned')}`,
      {
        fontFamily: 'KenneyPixel',
        fontSize: `${earnedFontSize}px`,
        color: '#ffdd44',
      },
    );
    earnedText.setOrigin(0.5, 0.5);
    earnedText.setAlpha(0);

    this.prestigePointsText = this.add.text(centerX, pointsY, '', {
      fontFamily: 'KenneyPixel',
      fontSize: `${pointsFontSize}px`,
      color: '#ffffff',
    });
    this.prestigePointsText.setOrigin(0.5, 0.5);
    this.prestigePointsText.setAlpha(0);

    this.prestigeButtons = [];
    const prestigeContainerChildren: Phaser.GameObjects.GameObject[] = [];
    for (let i = 0; i < prestigeKeys.length; i++) {
      const key = prestigeKeys[i];
      const buttonCenterY =
        firstPrestigeY + i * (prestigeButtonHeight + prestigeButtonGap) + prestigeButtonHeight / 2;
      const created = this.createPrestigeButton(
        key,
        centerX,
        buttonCenterY,
        prestigeButtonWidth,
        prestigeButtonHeight,
      );
      prestigeContainerChildren.push(created.graphics, created.nameText, created.infoText, created.hitZone);
    }

    const buttonWidth = pixelUnit * 60;
    const buttonHeight = pixelUnit * 16;

    const buttonGraphics = this.add.graphics();
    buttonGraphics.fillStyle(0x552222, 0.9);
    buttonGraphics.fillRect(
      centerX - buttonWidth / 2,
      rebootButtonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    );
    createUIPanel(
      buttonGraphics,
      centerX - buttonWidth / 2,
      rebootButtonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      pixelUnit,
      0xaa4444,
      0.9,
    );
    buttonGraphics.setAlpha(0);

    const buttonText = this.add.text(centerX, rebootButtonY, t('crash.restart'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${buttonFontSize}px`,
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5, 0.5);
    buttonText.setAlpha(0);

    const buttonZone = this.add.zone(centerX, rebootButtonY, buttonWidth, buttonHeight);
    buttonZone.setInteractive({ useHandCursor: true });
    buttonZone.on('pointerup', () => {
      playSfx(this, 'buttonClick', 0.3);
      this.crashContainer.destroy();
      this.crashActive = false;
      this.prestigeButtons = [];
      this.mainScene.clearEntities();
      Progression.reset();
      this.mainScene.spawnPrestigeStartingSprites();
      this.previouslyUnlocked.clear();
      this.initUnlockedUpgrades();
      SaveManager.deleteSave();
      this.scene.resume('MainScene');
    });

    this.crashContainer = this.add.container(0, 0, [
      overlay,
      titleText,
      subtitleText,
      messageText,
      earnedText,
      this.prestigePointsText,
      ...prestigeContainerChildren,
      buttonGraphics,
      buttonText,
      buttonZone,
    ]);
    this.crashContainer.setDepth(FRONT_DEPTH + 100);

    this.refreshPrestigeShop();

    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.85,
      duration: 1500,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      delay: 800,
      duration: 600,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: subtitleText,
      alpha: 1,
      delay: 1400,
      duration: 600,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: messageText,
      alpha: 1,
      delay: 2000,
      duration: 600,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: [earnedText, this.prestigePointsText],
      alpha: 1,
      delay: 2400,
      duration: 600,
      ease: 'Power2',
    });

    const prestigeVisuals: Phaser.GameObjects.GameObject[] = [];
    for (const button of this.prestigeButtons) {
      button.graphics.setAlpha(0);
      button.nameText.setAlpha(0);
      button.infoText.setAlpha(0);
      prestigeVisuals.push(button.graphics, button.nameText, button.infoText);
    }

    this.tweens.add({
      targets: prestigeVisuals,
      alpha: 1,
      delay: 2800,
      duration: 600,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: [buttonGraphics, buttonText],
      alpha: 1,
      delay: 3200,
      duration: 600,
      ease: 'Power2',
    });
  }

  private showDemoEndScreen() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const pixelUnit = this.pixelUnit;

    const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const titleFontSize = Math.round(pixelUnit * 22);
    const subtitleFontSize = Math.round(pixelUnit * 13);
    const messageFontSize = Math.round(pixelUnit * 9);
    const buyFontSize = Math.round(pixelUnit * 10);
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    const titleY = centerY - pixelUnit * 40;
    const subtitleY = centerY - pixelUnit * 15;
    const messageY = centerY + pixelUnit * 5;
    const buyY = centerY + pixelUnit * 25;

    const titleText = this.add.text(centerX, titleY, t('demo.title'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${titleFontSize}px`,
      color: '#ffdd44',
      align: 'center',
    });
    titleText.setOrigin(0.5, 0.5);
    titleText.setAlpha(0);

    const subtitleText = this.add.text(centerX, subtitleY, t('demo.subtitle'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${subtitleFontSize}px`,
      color: '#ffffff',
      align: 'center',
    });
    subtitleText.setOrigin(0.5, 0.5);
    subtitleText.setAlpha(0);

    const messageText = this.add.text(centerX, messageY, t('demo.message'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${messageFontSize}px`,
      color: '#aaaaaa',
      align: 'center',
    });
    messageText.setOrigin(0.5, 0.5);
    messageText.setAlpha(0);

    const buyText = this.add.text(centerX, buyY, t('demo.buyFull'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${buyFontSize}px`,
      color: '#44ff88',
      align: 'center',
      wordWrap: { width: screenWidth * 0.8 },
    });
    buyText.setOrigin(0.5, 0.5);
    buyText.setAlpha(0);

    this.crashContainer = this.add.container(0, 0, [
      overlay,
      titleText,
      subtitleText,
      messageText,
      buyText,
    ]);
    this.crashContainer.setDepth(FRONT_DEPTH + 100);

    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.9,
      duration: 1500,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      delay: 800,
      duration: 600,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: subtitleText,
      alpha: 1,
      delay: 1400,
      duration: 600,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: messageText,
      alpha: 1,
      delay: 2000,
      duration: 600,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: buyText,
      alpha: 1,
      delay: 2600,
      duration: 600,
      ease: 'Power2',
    });
  }

  private createPrestigeButton(
    key: string,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
  ): {
    graphics: Phaser.GameObjects.Graphics;
    nameText: Phaser.GameObjects.Text;
    infoText: Phaser.GameObjects.Text;
    hitZone: Phaser.GameObjects.Zone;
  } {
    const pixelUnit = this.pixelUnit;
    const fontSize = Math.round(pixelUnit * 10);
    const smallFontSize = Math.round(pixelUnit * 9);

    const graphics = this.add.graphics();

    const nameText = this.add.text(centerX, centerY - height * 0.22, t(`prestige.${key}.name`), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    nameText.setOrigin(0.5, 0.5);

    const infoText = this.add.text(centerX, centerY + height * 0.22, '', {
      fontFamily: 'KenneyPixel',
      fontSize: `${smallFontSize}px`,
      color: '#ffdd44',
    });
    infoText.setOrigin(0.5, 0.5);

    const hitZone = this.add.zone(centerX, centerY, width, height);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerup', () => {
      if (!Prestige.purchase(key)) return;
      SaveManager.saveMeta();
      playSfx(this, 'purchase', 0.3);
      this.refreshPrestigeShop();
    });

    this.prestigeButtons.push({
      key,
      graphics,
      nameText,
      infoText,
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
    });

    return { graphics, nameText, infoText, hitZone };
  }

  private refreshPrestigeShop() {
    if (this.prestigePointsText) {
      this.prestigePointsText.setText(`${t('ui.prestigePoints')}: ${Prestige.points}`);
    }
    for (const button of this.prestigeButtons) {
      this.refreshPrestigeButton(button);
    }
  }

  private refreshPrestigeButton(button: {
    key: string;
    graphics: Phaser.GameObjects.Graphics;
    nameText: Phaser.GameObjects.Text;
    infoText: Phaser.GameObjects.Text;
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    const pixelUnit = this.pixelUnit;
    const level = Prestige.upgradeLevels[button.key] ?? 0;
    const isMaxed = Prestige.isMaxed(button.key);
    const canAfford = Prestige.canAfford(button.key);
    const cost = Prestige.getUpgradeCost(button.key);

    button.graphics.clear();
    if (isMaxed) {
      button.graphics.fillStyle(0x333355, 0.9);
    } else if (canAfford) {
      button.graphics.fillStyle(0x443366, 0.9);
    } else {
      button.graphics.fillStyle(0x1a1a3a, 0.9);
    }
    button.graphics.fillRect(button.x, button.y, button.width, button.height);
    const borderColor = isMaxed ? 0x555577 : canAfford ? 0xcc66ff : 0x4444aa;
    createUIPanel(
      button.graphics,
      button.x,
      button.y,
      button.width,
      button.height,
      pixelUnit,
      borderColor,
      0.9,
    );

    if (isMaxed) {
      button.infoText.setText(`Lv.${level}  ${t('ui.max')}`);
      button.infoText.setColor('#aaaacc');
    } else {
      button.infoText.setText(`Lv.${level}  ${cost} pts`);
      button.infoText.setColor(canAfford ? '#ffdd44' : '#aaaacc');
    }
  }

  update() {
    if (!this.collapsed && !this.optionsMenu.isOpen) {
      this.shop.update();
    }
    this.juiceText.setText(formatNumber(Progression.juice));
    const isReadOnly = true;
    const juicePerSecond = Progression.getTotalJuicePerSecond(isReadOnly);
    this.juicePerSecondText.setText(juicePerSecond > 0 ? `${formatNumber(juicePerSecond)}/s` : '0/s');
    this.refreshJuicePanel();
    this.refreshHud();
    this.checkNewUnlocks();
    this.updateNotifications();
  }
}

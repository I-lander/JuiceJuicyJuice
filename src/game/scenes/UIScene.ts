import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { CustomScene } from '../customClasses/CustomScene';
import { Progression } from '../Progression';
import { Shop } from '../objects/Shop';
import { UPGRADES } from '../objects/ShopUpgrades';
import { t, getLanguage, setLanguage } from '../utils/i18n';
import {
  createUIPanel,
  formatNumber,
  FRONT_DEPTH,
  getColors,
  initGlitchShader,
  playSfx,
  setSfxMuted,
  sfxMuted,
} from '../utils/utils';
import { MainScene } from './MainScene';
import { SaveManager } from '../utils/SaveManager';

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

  private menuContainer!: Phaser.GameObjects.Container;
  private menuOpen: boolean = false;
  private menuBtnGraphics!: Phaser.GameObjects.Graphics;
  private menuBtnImg!: Phaser.GameObjects.Image;
  private menuBtnZone!: Phaser.GameObjects.Zone;
  private resumeText!: Phaser.GameObjects.Text;
  private quitText!: Phaser.GameObjects.Text;
  private resetText!: Phaser.GameObjects.Text;
  private enFlagImg!: Phaser.GameObjects.Image;
  private frFlagImg!: Phaser.GameObjects.Image;
  private soundToggleImg!: Phaser.GameObjects.Image;
  private musicToggleImg!: Phaser.GameObjects.Image;
  private sfxMuted: boolean = false;
  private confirmContainer!: Phaser.GameObjects.Container;
  private crashContainer!: Phaser.GameObjects.Container;
  private crashActive: boolean = false;

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
    this.createMenu();
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

  private createMenu() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const pixelUnit = this.pixelUnit;
    const fontSize = Math.round(pixelUnit * 14);
    const buttonWidth = pixelUnit * 60;
    const buttonHeight = pixelUnit * 16;
    const gap = pixelUnit * 6;
    const menuWidth = buttonWidth + pixelUnit * 16;
    const tileSize = this.tileSize;
    const flagSize = tileSize;
    const menuHeight =
      buttonHeight * 3 + gap * 2 + pixelUnit * 16 + tileSize * 2 + flagSize + gap + flagSize;
    const menuX = (screenWidth - menuWidth) / 2;
    const menuY = (screenHeight - menuHeight) / 2;

    const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const panelGraphics = this.add.graphics();
    panelGraphics.fillStyle(0x000033, 0.8);
    panelGraphics.fillRect(menuX, menuY, menuWidth, menuHeight);
    createUIPanel(panelGraphics, menuX, menuY, menuWidth, menuHeight, pixelUnit, 0xffffff, 1);

    const centerX = screenWidth / 2;
    const firstButtonY = menuY + pixelUnit * 8 + buttonHeight / 2;

    const resumeGraphics = this.add.graphics();
    resumeGraphics.fillStyle(0x225522, 0.8);
    resumeGraphics.fillRect(
      centerX - buttonWidth / 2,
      firstButtonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    );
    createUIPanel(
      resumeGraphics,
      centerX - buttonWidth / 2,
      firstButtonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      pixelUnit,
      0x44aa44,
      0.9,
    );

    this.resumeText = this.add.text(centerX, firstButtonY, t('ui.resume'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    this.resumeText.setOrigin(0.5, 0.5);

    const resumeZone = this.add.zone(centerX, firstButtonY, buttonWidth, buttonHeight);
    resumeZone.setInteractive({ useHandCursor: true });
    resumeZone.on('pointerup', () => {
      playSfx(this, 'buttonClick', 0.3);
      this.closeMenu();
    });

    const secondButtonY = firstButtonY + buttonHeight + gap;

    const quitGraphics = this.add.graphics();
    quitGraphics.fillStyle(0x552222, 0.9);
    quitGraphics.fillRect(
      centerX - buttonWidth / 2,
      secondButtonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    );
    createUIPanel(
      quitGraphics,
      centerX - buttonWidth / 2,
      secondButtonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      pixelUnit,
      0xaa4444,
      0.9,
    );

    this.quitText = this.add.text(centerX, secondButtonY, t('ui.quit'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    this.quitText.setOrigin(0.5, 0.5);

    const quitZone = this.add.zone(centerX, secondButtonY, buttonWidth, buttonHeight);
    quitZone.setInteractive({ useHandCursor: true });
    quitZone.on('pointerup', () => {
      playSfx(this, 'buttonClick', 0.3);
      if (Capacitor.isNativePlatform()) {
        App.exitApp();
      } else if (window.electron) {
        window.electron.quitApp();
      }
    });

    const thirdButtonY = secondButtonY + buttonHeight + gap;

    const resetGraphics = this.add.graphics();
    resetGraphics.fillStyle(0x443322, 0.9);
    resetGraphics.fillRect(
      centerX - buttonWidth / 2,
      thirdButtonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    );
    createUIPanel(
      resetGraphics,
      centerX - buttonWidth / 2,
      thirdButtonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      pixelUnit,
      0xaa8844,
      0.9,
    );

    this.resetText = this.add.text(centerX, thirdButtonY, t('ui.reset'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    this.resetText.setOrigin(0.5, 0.5);

    const resetZone = this.add.zone(centerX, thirdButtonY, buttonWidth, buttonHeight);
    resetZone.setInteractive({ useHandCursor: true });
    resetZone.on('pointerup', () => {
      playSfx(this, 'buttonClick', 0.3);
      this.showResetConfirm();
    });

    const flagGap = pixelUnit * 6;
    const soundY = menuY + menuHeight - pixelUnit * 8 - flagSize - flagGap - flagSize / 2;

    this.sfxMuted = sfxMuted;
    this.soundToggleImg = this.add.image(
      // centerX - flagGap / 2 - flagSize / 2,
      centerX,
      soundY,
      'uiAtlas',
      this.sfxMuted ? 'soundOff' : 'soundOn',
    );
    this.soundToggleImg.setDisplaySize(flagSize, flagSize);
    this.soundToggleImg.setInteractive({ useHandCursor: true });
    this.soundToggleImg.on('pointerup', () => {
      this.sfxMuted = !this.sfxMuted;
      setSfxMuted(this.sfxMuted);
      this.soundToggleImg.setFrame(this.sfxMuted ? 'soundOff' : 'soundOn');
    });

    // const mainScene = this.scene.get('MainScene') as MainScene;
    // const musicMuted = mainScene.bgMusic?.mute ?? false;
    // this.musicToggleImg = this.add.image(
    //   centerX + flagGap / 2 + flagSize / 2,
    //   soundY,
    //   'uiAtlas',
    //   musicMuted ? 'musicOff' : 'musicOn',
    // );
    // this.musicToggleImg.setDisplaySize(flagSize, flagSize);
    // this.musicToggleImg.setInteractive({ useHandCursor: true });
    // this.musicToggleImg.on('pointerup', () => {
    //   mainScene.bgMusic.mute = !mainScene.bgMusic.mute;

    //   this.musicToggleImg.setFrame(mainScene.bgMusic.mute ? 'musicOn' : 'musicOff');
    // });

    const flagY = menuY + menuHeight - pixelUnit * 8 - flagSize / 2;

    this.enFlagImg = this.add.image(
      centerX - flagGap / 2 - flagSize / 2,
      flagY,
      'uiAtlas',
      'enFlag',
    );
    this.enFlagImg.setDisplaySize(flagSize, flagSize);
    this.enFlagImg.setInteractive({ useHandCursor: true });
    this.enFlagImg.on('pointerup', () => {
      playSfx(this, 'buttonClick', 0.3);
      setLanguage('en');
      this.refreshMenuTexts();
    });

    this.frFlagImg = this.add.image(
      centerX + flagGap / 2 + flagSize / 2,
      flagY,
      'uiAtlas',
      'frFlag',
    );
    this.frFlagImg.setDisplaySize(flagSize, flagSize);
    this.frFlagImg.setInteractive({ useHandCursor: true });
    this.frFlagImg.on('pointerup', () => {
      playSfx(this, 'buttonClick', 0.3);
      setLanguage('fr');
      this.refreshMenuTexts();
    });

    this.refreshFlagAlpha();

    this.menuContainer = this.add.container(0, 0, [
      overlay,
      panelGraphics,
      resumeGraphics,
      this.resumeText,
      resumeZone,
      quitGraphics,
      this.quitText,
      quitZone,
      resetGraphics,
      this.resetText,
      resetZone,
      this.enFlagImg,
      this.frFlagImg,
      this.soundToggleImg,
      // this.musicToggleImg,
    ]);
    this.menuContainer.setDepth(FRONT_DEPTH + 50);
    this.menuContainer.setVisible(false);
  }

  private refreshFlagAlpha() {
    const isEnglish = getLanguage() === 'en';
    this.enFlagImg.setAlpha(isEnglish ? 1 : 0.35);
    this.frFlagImg.setAlpha(isEnglish ? 0.35 : 1);
  }

  private refreshMenuTexts() {
    this.resumeText.setText(t('ui.resume'));
    this.quitText.setText(t('ui.quit'));
    this.resetText.setText(t('ui.reset'));
    this.refreshFlagAlpha();
  }

  private createResetConfirm() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const pixelUnit = this.pixelUnit;
    const fontSize = Math.round(pixelUnit * 14);
    const padding = pixelUnit * 8;
    const gap = pixelUnit * 6;
    const centerX = screenWidth / 2;

    const confirmText = this.add.text(0, 0, t('ui.resetConfirm'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    confirmText.setOrigin(0.5, 0.5);

    const yesText = this.add.text(0, 0, t('ui.yes'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    yesText.setOrigin(0.5, 0.5);

    const noText = this.add.text(0, 0, t('ui.no'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    noText.setOrigin(0.5, 0.5);

    const buttonWidth = Math.max(yesText.width, noText.width) + padding * 2;
    const buttonHeight = yesText.height + padding;
    const buttonsRowWidth = buttonWidth * 2 + gap;
    const panelWidth = Math.max(confirmText.width, buttonsRowWidth) + padding * 2;
    const panelHeight = confirmText.height + buttonHeight + gap + padding * 2;
    const panelX = (screenWidth - panelWidth) / 2;
    const panelY = (screenHeight - panelHeight) / 2;

    const textY = panelY + padding + confirmText.height / 2;
    confirmText.setPosition(centerX, textY);

    const buttonsY = panelY + panelHeight - padding - buttonHeight / 2;

    const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const panelGraphics = this.add.graphics();
    panelGraphics.fillStyle(0x000033, 0.95);
    panelGraphics.fillRect(panelX, panelY, panelWidth, panelHeight);
    createUIPanel(panelGraphics, panelX, panelY, panelWidth, panelHeight, pixelUnit, 0xffffff, 1);

    const yesGraphics = this.add.graphics();
    const yesX = centerX - gap / 2 - buttonWidth / 2;
    yesGraphics.fillStyle(0x552222, 0.9);
    yesGraphics.fillRect(yesX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight);
    createUIPanel(yesGraphics, yesX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight, pixelUnit, 0xaa4444, 0.9);
    yesText.setPosition(yesX, buttonsY);

    const yesZone = this.add.zone(yesX, buttonsY, buttonWidth, buttonHeight);
    yesZone.setInteractive({ useHandCursor: true });
    yesZone.on('pointerup', () => {
      playSfx(this, 'buttonClick', 0.3);
      SaveManager.deleteSave();
      this.mainScene.clearEntities();
      Progression.reset();
      this.previouslyUnlocked.clear();
      this.initUnlockedUpgrades();
      this.closeMenu();
    });

    const noGraphics = this.add.graphics();
    const noX = centerX + gap / 2 + buttonWidth / 2;
    noGraphics.fillStyle(0x225522, 0.9);
    noGraphics.fillRect(noX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight);
    createUIPanel(noGraphics, noX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight, pixelUnit, 0x44aa44, 0.9);
    noText.setPosition(noX, buttonsY);

    const noZone = this.add.zone(noX, buttonsY, buttonWidth, buttonHeight);
    noZone.setInteractive({ useHandCursor: true });
    noZone.on('pointerup', () => {
      playSfx(this, 'buttonClick', 0.3);
      this.hideResetConfirm();
    });

    this.confirmContainer = this.add.container(0, 0, [
      overlay,
      panelGraphics,
      confirmText,
      yesGraphics,
      yesText,
      yesZone,
      noGraphics,
      noText,
      noZone,
    ]);
    this.confirmContainer.setDepth(FRONT_DEPTH + 60);
  }

  private showResetConfirm() {
    if (this.confirmContainer) {
      this.confirmContainer.destroy();
    }
    this.createResetConfirm();
    this.confirmContainer.setVisible(true);
  }

  private hideResetConfirm() {
    if (this.confirmContainer) {
      this.confirmContainer.destroy();
    }
  }

  openMenu() {
    if (this.menuOpen) return;
    this.menuOpen = true;
    playSfx(this, 'buttonClick', 0.3);
    this.menuContainer.setVisible(true);
    this.scene.pause('MainScene');
  }

  private closeMenu() {
    this.menuOpen = false;
    if (this.confirmContainer) {
      this.confirmContainer.destroy();
    }
    this.menuContainer.setVisible(false);
    this.scene.resume('MainScene');
  }

  showCrashScreen() {
    if (this.crashActive) return;
    this.crashActive = true;
    this.scene.pause('MainScene');

    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const pixelUnit = this.pixelUnit;

    const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const titleFontSize = Math.round(pixelUnit * 24);
    const subtitleFontSize = Math.round(pixelUnit * 14);
    const messageFontSize = Math.round(pixelUnit * 10);
    const buttonFontSize = Math.round(pixelUnit * 14);
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    const titleText = this.add.text(centerX, centerY - pixelUnit * 30, t('crash.title'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${titleFontSize}px`,
      color: '#ff0000',
    });
    titleText.setOrigin(0.5, 0.5);
    titleText.setAlpha(0);

    const subtitleText = this.add.text(centerX, centerY - pixelUnit * 12, t('crash.subtitle'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${subtitleFontSize}px`,
      color: '#ff4444',
    });
    subtitleText.setOrigin(0.5, 0.5);
    subtitleText.setAlpha(0);

    const messageText = this.add.text(centerX, centerY + pixelUnit * 6, t('crash.message'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${messageFontSize}px`,
      color: '#aaaaaa',
    });
    messageText.setOrigin(0.5, 0.5);
    messageText.setAlpha(0);

    const buttonWidth = pixelUnit * 60;
    const buttonHeight = pixelUnit * 16;
    const buttonY = centerY + pixelUnit * 30;

    const buttonGraphics = this.add.graphics();
    buttonGraphics.fillStyle(0x552222, 0.9);
    buttonGraphics.fillRect(
      centerX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    );
    createUIPanel(
      buttonGraphics,
      centerX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      pixelUnit,
      0xaa4444,
      0.9,
    );
    buttonGraphics.setAlpha(0);

    const buttonText = this.add.text(centerX, buttonY, t('crash.restart'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${buttonFontSize}px`,
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5, 0.5);
    buttonText.setAlpha(0);

    const buttonZone = this.add.zone(centerX, buttonY, buttonWidth, buttonHeight);
    buttonZone.setInteractive({ useHandCursor: true });
    buttonZone.on('pointerup', () => {
      playSfx(this, 'buttonClick', 0.3);
      this.crashContainer.destroy();
      this.crashActive = false;
      this.mainScene.clearEntities();
      Progression.reset();
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
      buttonGraphics,
      buttonText,
      buttonZone,
    ]);
    this.crashContainer.setDepth(FRONT_DEPTH + 100);

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
      targets: [buttonGraphics, buttonText],
      alpha: 1,
      delay: 2800,
      duration: 600,
      ease: 'Power2',
    });
  }

  update() {
    if (!this.collapsed && !this.menuOpen) {
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

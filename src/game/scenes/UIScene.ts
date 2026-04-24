import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { CustomScene } from '../customClasses/CustomScene';
import { Progression } from '../Progression';
import { Prestige, PRESTIGE_UPGRADES, PRESTIGE_BRANCHES, type PrestigeBranch } from '../Prestige';
import { OptionsMenu } from '../objects/OptionsMenu';
import { Shop } from '../objects/Shop';
import { UPGRADES } from '../objects/ShopUpgrades';
import { t } from '../utils/i18n';
import {
  BG_MUSIC_VOLUME,
  createUIPanel,
  formatCpuFrequency,
  formatNumber,
  FRONT_DEPTH,
  getColors,
  initGlitchShader,
  playSfx,
} from '../utils/utils';
import { MainScene } from './MainScene';
import { SaveManager } from '../utils/SaveManager';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

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
  crashActive: boolean = false;
  pointsEarnedAtCrash: number = 0;
  private prestigePointsText!: Phaser.GameObjects.Text;
  private prestigeConnectorGraphics!: Phaser.GameObjects.Graphics;
  private prestigeNodes: Array<{
    key: string;
    branch: PrestigeBranch;
    graphics: Phaser.GameObjects.Graphics;
    nameText: Phaser.GameObjects.Text;
    descText: Phaser.GameObjects.Text;
    infoText: Phaser.GameObjects.Text;
    centerX: number;
    centerY: number;
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
      onDeleteMeta: () => {
        SaveManager.deleteSave();
        SaveManager.deleteMetaSave();
        this.mainScene.clearEntities();
        Progression.reset();
        this.mainScene.spawnPrestigeStartingSprites();
        this.previouslyUnlocked.clear();
        this.initUnlockedUpgrades();
        this.closeMenu();
      },
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
    const cpuUsedText = formatCpuFrequency(Progression.cpuUsage);
    const cpuCapacityText = formatCpuFrequency(Progression.cpuCapacityMhz);
    const cpuColor = this.getCpuColor(Progression.cpuPercent);

    this.hudText.setText(`CPU: ${cpuPercent}%  ${cpuUsedText} / ${cpuCapacityText}`);
    this.hudText.setColor(cpuColor);

    if (Progression.cpuPercent >= 100) {
      const pulse = 1.6 + Math.sin(this.time.now / 80) * 0.15;
      this.hudText.setScale(pulse);
    } else {
      this.hudText.setScale(1);
    }
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

  showCrashScreen(restore?: { pointsEarnedAtCrash: number }) {
    if (this.crashActive) return;
    this.crashActive = true;
    this.scene.pause('MainScene');

    if (DEMO_MODE) {
      this.showDemoEndScreen();
      return;
    }

    if (!restore) {
      const uiCamera = this.cameras.main;
      uiCamera.shake(500, 0.028);
      uiCamera.flash(160, 255, 255, 255);

      if (this.mainScene.glitchShader) {
        this.mainScene.glitchShader.glitchIntensity = 1;
        this.tweens.add({
          targets: this.mainScene.glitchShader,
          glitchIntensity: 0.18,
          delay: 350,
          duration: 700,
          ease: 'Quad.easeOut',
        });
      }
      if (this.glitchShader) {
        this.glitchShader.glitchIntensity = 1;
        this.tweens.add({
          targets: this.glitchShader,
          glitchIntensity: 0.12,
          delay: 350,
          duration: 700,
          ease: 'Quad.easeOut',
        });
      }

      playSfx(this, 'wallBounce', 0.55);
      this.time.delayedCall(60, () => playSfx(this, 'spriteBounce', 0.5));
      this.time.delayedCall(150, () => playSfx(this, 'wallBounce', 0.45));
      this.time.delayedCall(260, () => playSfx(this, 'buttonClick', 0.55));

      const crashBgMusic = this.mainScene.bgMusic;
      if (crashBgMusic) {
        const detuneState = { value: crashBgMusic.detune };
        this.tweens.add({
          targets: detuneState,
          value: -3000,
          duration: 600,
          ease: 'Cubic.easeOut',
          onUpdate: () => crashBgMusic.setDetune(detuneState.value),
        });
        this.tweens.add({
          targets: crashBgMusic,
          volume: 0,
          delay: 200,
          duration: 700,
          ease: 'Quad.easeOut',
        });
      }
    } else {
      if (this.mainScene.glitchShader) {
        this.mainScene.glitchShader.glitchIntensity = 0.18;
      }
      if (this.glitchShader) {
        this.glitchShader.glitchIntensity = 0.12;
      }
      if (this.mainScene.bgMusic) {
        this.mainScene.bgMusic.setDetune(-3000);
        this.mainScene.bgMusic.setVolume(0);
      }
    }

    let pointsEarned: number;
    if (restore) {
      pointsEarned = restore.pointsEarnedAtCrash;
    } else {
      pointsEarned = Prestige.computePointsForLevel(Progression.level);
      Prestige.awardPoints(pointsEarned);
      SaveManager.saveMeta();
    }
    this.pointsEarnedAtCrash = pointsEarned;

    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const pixelUnit = this.pixelUnit;

    const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const titleFontSize = Math.round(pixelUnit * 18);
    const subtitleFontSize = Math.round(pixelUnit * 9);
    const messageFontSize = Math.round(pixelUnit * 7);
    const buttonFontSize = Math.round(pixelUnit * 13);
    const earnedFontSize = Math.round(pixelUnit * 11);
    const pointsFontSize = Math.round(pixelUnit * 10);
    const centerX = screenWidth / 2;

    const nameFontSize = Math.round(pixelUnit * 8);
    const descFontSize = Math.round(pixelUnit * 7);
    const infoFontSize = Math.round(pixelUnit * 8);

    const topMargin = pixelUnit * 4;
    const textChainGap = pixelUnit * 2;
    const rebootMarginBottom = pixelUnit * 6;
    const buttonHeight = pixelUnit * 13;

    const titleY = topMargin + titleFontSize / 2;
    const subtitleY = titleY + titleFontSize / 2 + textChainGap + subtitleFontSize / 2;
    const messageY = subtitleY + subtitleFontSize / 2 + textChainGap + messageFontSize / 2;
    const earnedY = messageY + messageFontSize / 2 + pixelUnit * 3 + earnedFontSize / 2;
    const pointsY = earnedY + earnedFontSize / 2 + textChainGap + pointsFontSize / 2;

    const rebootButtonY = screenHeight - rebootMarginBottom - buttonHeight / 2;
    const rebootTopY = rebootButtonY - buttonHeight / 2;

    const nodesByBranch: Record<PrestigeBranch, string[]> = {
      bootstrap: [],
      overclock: [],
      hardware: [],
      mastery: [],
    };
    for (const key of Object.keys(PRESTIGE_UPGRADES)) {
      nodesByBranch[PRESTIGE_UPGRADES[key].branch].push(key);
    }
    let maxRowsPerBranch = 0;
    for (const branch of PRESTIGE_BRANCHES) {
      maxRowsPerBranch = Math.max(maxRowsPerBranch, nodesByBranch[branch].length);
    }

    const treeHorizontalMargin = pixelUnit * 6;
    const columnGapX = pixelUnit * 5;
    const nodeGapY = pixelUnit * 3;
    const nodePadding = pixelUnit * 2;
    const nodeTextGap = pixelUnit * 0.5;

    const numBranches = PRESTIGE_BRANCHES.length;
    const availableTreeWidth = screenWidth - treeHorizontalMargin * 2;
    const nodeWidth =
      (availableTreeWidth - (numBranches - 1) * columnGapX) / numBranches;
    const wrapWidth = nodeWidth - 2 * nodePadding;

    interface NodeDraft {
      key: string;
      branch: PrestigeBranch;
      nameText: Phaser.GameObjects.Text;
      descText: Phaser.GameObjects.Text;
      infoText: Phaser.GameObjects.Text;
    }
    const drafts: NodeDraft[] = [];
    for (const key of Object.keys(PRESTIGE_UPGRADES)) {
      const nameText = this.add.text(0, 0, t(`prestige.${key}.name`), {
        fontFamily: 'KenneyPixel',
        fontSize: `${nameFontSize}px`,
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: wrapWidth },
      });
      nameText.setOrigin(0.5, 0);

      const descText = this.add.text(0, 0, t(`prestige.${key}.desc`), {
        fontFamily: 'KenneyPixel',
        fontSize: `${descFontSize}px`,
        color: '#aaaacc',
        align: 'center',
        wordWrap: { width: wrapWidth },
      });
      descText.setOrigin(0.5, 0);

      const infoText = this.add.text(0, 0, '', {
        fontFamily: 'KenneyPixel',
        fontSize: `${infoFontSize}px`,
        color: '#ffdd44',
        align: 'center',
      });
      infoText.setOrigin(0.5, 1);

      drafts.push({
        key,
        branch: PRESTIGE_UPGRADES[key].branch,
        nameText,
        descText,
        infoText,
      });
    }

    let maxNameHeight = 0;
    let maxDescHeight = 0;
    for (const draft of drafts) {
      maxNameHeight = Math.max(maxNameHeight, draft.nameText.height);
      maxDescHeight = Math.max(maxDescHeight, draft.descText.height);
    }
    const infoHeight = infoFontSize;
    const nodeHeight =
      2 * nodePadding +
      maxNameHeight +
      nodeTextGap +
      maxDescHeight +
      nodeTextGap +
      infoHeight;

    const totalTreeWidth =
      numBranches * nodeWidth + (numBranches - 1) * columnGapX;
    const treeStartX = centerX - totalTreeWidth / 2;
    const totalTreeHeight =
      maxRowsPerBranch * nodeHeight + (maxRowsPerBranch - 1) * nodeGapY;

    const treeAreaBottom = rebootTopY - pixelUnit * 10;
    const firstNodeCenterY = treeAreaBottom - totalTreeHeight + nodeHeight / 2;

    const titleText = this.add.text(centerX, titleY, t('crash.title'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${titleFontSize}px`,
      color: '#ff0000',
    });
    titleText.setOrigin(0.5, 0.5);
    titleText.setAlpha(0);
    titleText.setScale(4);

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

    this.prestigeNodes = [];
    this.prestigeConnectorGraphics = this.add.graphics();
    const prestigeContainerChildren: Phaser.GameObjects.GameObject[] = [this.prestigeConnectorGraphics];
    const interactiveZones: Phaser.GameObjects.Zone[] = [];
    const draftByKey = new Map<string, NodeDraft>();
    for (const draft of drafts) {
      draftByKey.set(draft.key, draft);
    }
    for (let col = 0; col < PRESTIGE_BRANCHES.length; col++) {
      const branch = PRESTIGE_BRANCHES[col];
      const columnCenterX = treeStartX + col * (nodeWidth + columnGapX) + nodeWidth / 2;
      const branchKeys = nodesByBranch[branch];
      for (let row = 0; row < branchKeys.length; row++) {
        const key = branchKeys[row];
        const draft = draftByKey.get(key)!;
        const nodeCenterY = firstNodeCenterY + row * (nodeHeight + nodeGapY);
        const nodeTop = nodeCenterY - nodeHeight / 2;
        const nodeBottom = nodeCenterY + nodeHeight / 2;

        draft.nameText.setPosition(columnCenterX, nodeTop + nodePadding);
        draft.descText.setPosition(
          columnCenterX,
          nodeTop + nodePadding + maxNameHeight + nodeTextGap,
        );
        draft.infoText.setPosition(columnCenterX, nodeBottom - nodePadding);

        const graphics = this.add.graphics();
        const hitZone = this.add.zone(columnCenterX, nodeCenterY, nodeWidth, nodeHeight);
        hitZone.on('pointerup', () => {
          if (!Prestige.purchase(key)) return;
          SaveManager.saveMeta();
          playSfx(this, 'purchase', 0.3);
          this.refreshPrestigeTree();
        });
        interactiveZones.push(hitZone);

        this.prestigeNodes.push({
          key,
          branch,
          graphics,
          nameText: draft.nameText,
          descText: draft.descText,
          infoText: draft.infoText,
          centerX: columnCenterX,
          centerY: nodeCenterY,
          width: nodeWidth,
          height: nodeHeight,
        });

        prestigeContainerChildren.push(
          graphics,
          draft.nameText,
          draft.descText,
          draft.infoText,
          hitZone,
        );
      }
    }

    const buttonWidth = pixelUnit * 60;

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
    interactiveZones.push(buttonZone);
    buttonZone.on('pointerup', () => {
      const previousJuice = Progression.juice;
      playSfx(this, 'buttonClick', 0.3);
      this.crashContainer.destroy();
      this.crashActive = false;
      this.pointsEarnedAtCrash = 0;
      this.prestigeNodes = [];
      this.mainScene.clearEntities();
      Progression.reset();
      Progression.carryPersistentJuice(previousJuice);
      this.mainScene.spawnPrestigeStartingSprites();
      this.previouslyUnlocked.clear();
      this.initUnlockedUpgrades();
      SaveManager.deleteSave();
      const rebootBgMusic = this.mainScene.bgMusic;
      if (rebootBgMusic) {
        rebootBgMusic.setDetune(0);
        this.tweens.add({
          targets: rebootBgMusic,
          volume: BG_MUSIC_VOLUME,
          duration: 400,
          ease: 'Quad.easeOut',
        });
      }
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

    this.refreshPrestigeTree();

    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.95,
      delay: 80,
      duration: 90,
      ease: 'Linear',
    });

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      scale: 1,
      delay: 220,
      duration: 260,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: subtitleText,
      alpha: 1,
      delay: 420,
      duration: 80,
      ease: 'Linear',
    });

    this.tweens.add({
      targets: messageText,
      alpha: 1,
      delay: 560,
      duration: 80,
      ease: 'Linear',
    });

    this.tweens.add({
      targets: [earnedText, this.prestigePointsText],
      alpha: 1,
      delay: 720,
      duration: 140,
      ease: 'Linear',
    });

    const prestigeVisuals: Phaser.GameObjects.GameObject[] = [this.prestigeConnectorGraphics];
    this.prestigeConnectorGraphics.setAlpha(0);
    for (const node of this.prestigeNodes) {
      node.graphics.setAlpha(0);
      node.nameText.setAlpha(0);
      node.descText.setAlpha(0);
      node.infoText.setAlpha(0);
      prestigeVisuals.push(node.graphics, node.nameText, node.descText, node.infoText);
    }

    this.tweens.add({
      targets: prestigeVisuals,
      alpha: 1,
      delay: 900,
      duration: 220,
      ease: 'Quad.easeOut',
    });

    this.tweens.add({
      targets: [buttonGraphics, buttonText],
      alpha: 1,
      delay: 1120,
      duration: 180,
      ease: 'Quad.easeOut',
    });

    this.time.delayedCall(1400, () => {
      for (const zone of interactiveZones) {
        zone.setInteractive({ useHandCursor: true });
      }
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
    const buttonFontSize = Math.round(pixelUnit * 10);
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    const titleY = centerY - pixelUnit * 40;
    const subtitleY = centerY - pixelUnit * 15;
    const messageY = centerY + pixelUnit * 5;
    const buyY = centerY + pixelUnit * 25;
    const buttonY = centerY + pixelUnit * 50;
    const buttonWidth = pixelUnit * 70;
    const buttonHeight = pixelUnit * 18;

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

    const buttonText = this.add.text(centerX, buttonY, t('demo.resetRestart'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${buttonFontSize}px`,
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5, 0.5);
    buttonText.setAlpha(0);

    const buttonZone = this.add.zone(centerX, buttonY, buttonWidth, buttonHeight);
    buttonZone.setInteractive();
    buttonZone.on('pointerup', () => {
      playSfx(this, 'buttonClick', 0.3);
      SaveManager.deleteSave();
      SaveManager.deleteMetaSave();
      this.crashContainer.destroy();
      this.crashActive = false;
      this.pointsEarnedAtCrash = 0;
      this.mainScene.clearEntities();
      Progression.reset();
      this.mainScene.spawnPrestigeStartingSprites();
      this.previouslyUnlocked.clear();
      this.initUnlockedUpgrades();
      const demoBgMusic = this.mainScene.bgMusic;
      if (demoBgMusic) {
        demoBgMusic.setDetune(0);
        this.tweens.add({
          targets: demoBgMusic,
          volume: BG_MUSIC_VOLUME,
          duration: 400,
          ease: 'Quad.easeOut',
        });
      }
      this.scene.resume('MainScene');
    });

    this.crashContainer = this.add.container(0, 0, [
      overlay,
      titleText,
      subtitleText,
      messageText,
      buyText,
      buttonGraphics,
      buttonText,
      buttonZone,
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

    this.tweens.add({
      targets: [buttonGraphics, buttonText],
      alpha: 1,
      delay: 3200,
      duration: 600,
      ease: 'Power2',
    });
  }

  private refreshPrestigeTree() {
    if (this.prestigePointsText) {
      this.prestigePointsText.setText(`${t('ui.prestigePoints')}: ${Prestige.points}`);
    }
    for (const node of this.prestigeNodes) {
      this.refreshPrestigeNode(node);
    }
    this.redrawPrestigeConnectors();
  }

  private redrawPrestigeConnectors() {
    const pixelUnit = this.pixelUnit;
    this.prestigeConnectorGraphics.clear();
    const nodeByKey: Record<string, (typeof this.prestigeNodes)[number]> = {};
    for (const node of this.prestigeNodes) {
      nodeByKey[node.key] = node;
    }
    for (const node of this.prestigeNodes) {
      const definition = PRESTIGE_UPGRADES[node.key];
      if (!definition.requires) continue;
      const parent = nodeByKey[definition.requires];
      if (!parent) continue;
      const parentSatisfied = Prestige.getLevel(parent.key) > 0;
      const lineColor = parentSatisfied ? 0xcc66ff : 0x444466;
      this.prestigeConnectorGraphics.lineStyle(Math.max(1, pixelUnit * 0.6), lineColor, 0.9);
      this.prestigeConnectorGraphics.beginPath();
      this.prestigeConnectorGraphics.moveTo(parent.centerX, parent.centerY + parent.height / 2);
      this.prestigeConnectorGraphics.lineTo(node.centerX, node.centerY - node.height / 2);
      this.prestigeConnectorGraphics.strokePath();
    }
  }

  private refreshPrestigeNode(node: (typeof this.prestigeNodes)[number]) {
    const pixelUnit = this.pixelUnit;
    const level = Prestige.getLevel(node.key);
    const maxLevel = Prestige.getMaxLevel(node.key);
    const isMaxed = Prestige.isMaxed(node.key);
    const isUnlocked = Prestige.isUnlocked(node.key);
    const canAfford = isUnlocked && Prestige.canAfford(node.key);
    const cost = Prestige.getUpgradeCost(node.key);

    const nodeX = node.centerX - node.width / 2;
    const nodeY = node.centerY - node.height / 2;

    node.graphics.clear();
    let fillColor: number;
    let borderColor: number;
    if (!isUnlocked) {
      fillColor = 0x111122;
      borderColor = 0x333355;
    } else if (isMaxed) {
      fillColor = 0x333355;
      borderColor = 0x7788bb;
    } else if (canAfford) {
      fillColor = 0x443366;
      borderColor = 0xcc66ff;
    } else {
      fillColor = 0x1a1a3a;
      borderColor = 0x4444aa;
    }
    node.graphics.fillStyle(fillColor, 0.95);
    node.graphics.fillRect(nodeX, nodeY, node.width, node.height);
    createUIPanel(
      node.graphics,
      nodeX,
      nodeY,
      node.width,
      node.height,
      pixelUnit,
      borderColor,
      0.95,
    );

    if (!isUnlocked) {
      node.nameText.setColor('#666688');
      node.descText.setColor('#555577');
      node.infoText.setText(t('ui.locked'));
      node.infoText.setColor('#666688');
    } else if (isMaxed) {
      node.nameText.setColor('#ffffff');
      node.descText.setColor('#aaaacc');
      node.infoText.setText(`${level}/${maxLevel}  ${t('ui.max')}`);
      node.infoText.setColor('#aaaacc');
    } else {
      node.nameText.setColor('#ffffff');
      node.descText.setColor('#aaaacc');
      node.infoText.setText(`${level}/${maxLevel}  ${cost}p`);
      node.infoText.setColor(canAfford ? '#ffdd44' : '#aaaacc');
    }
  }

  update() {
    if (!this.collapsed && !this.optionsMenu.isOpen) {
      this.shop.update();
    }
    this.juiceText.setText(formatNumber(Progression.juice));
    const isReadOnly = true;
    const juicePerSecond =
      Progression.getTotalJuicePerSecond(isReadOnly) * Prestige.getJuiceMultiplier();
    this.juicePerSecondText.setText(juicePerSecond > 0 ? `${formatNumber(juicePerSecond)}/s` : '0/s');
    this.refreshJuicePanel();
    this.refreshHud();
    this.checkNewUnlocks();
    this.updateNotifications();
  }
}

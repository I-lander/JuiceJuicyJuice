import { CustomScene } from '../customClasses/CustomScene';
import { getLanguage, setLanguage, t } from '../utils/i18n';
import {
  createUIPanel,
  FRONT_DEPTH,
  playSfx,
  setSfxMuted,
  sfxMuted,
} from '../utils/utils';

export interface OptionsMenuCallbacks {
  onResume: () => void;
  onReset?: () => void;
  onDeleteMeta: () => void;
  onQuit?: () => void;
}

export class OptionsMenu {
  private scene: CustomScene;
  private callbacks: OptionsMenuCallbacks;
  private tileSize: number;
  private pixelUnit: number;

  private menuContainer!: Phaser.GameObjects.Container;
  private confirmContainer?: Phaser.GameObjects.Container;
  private deleteMetaConfirmContainer?: Phaser.GameObjects.Container;
  private quitConfirmContainer?: Phaser.GameObjects.Container;

  private resumeText!: Phaser.GameObjects.Text;
  private quitText?: Phaser.GameObjects.Text;
  private resetText?: Phaser.GameObjects.Text;
  private deleteMetaText!: Phaser.GameObjects.Text;
  private enFlagImg!: Phaser.GameObjects.Image;
  private frFlagImg!: Phaser.GameObjects.Image;
  private soundToggleImg!: Phaser.GameObjects.Image;
  private localSfxMuted: boolean = false;

  public isOpen: boolean = false;

  constructor(scene: CustomScene, callbacks: OptionsMenuCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.tileSize = scene.tileSize;
    this.pixelUnit = scene.pixelUnit;
    this.createMenu();
  }

  private createMenu() {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const pixelUnit = this.pixelUnit;
    const fontSize = Math.round(pixelUnit * 14);
    const buttonWidth = pixelUnit * 60;
    const buttonHeight = pixelUnit * 16;
    const gap = pixelUnit * 6;
    const menuWidth = buttonWidth + pixelUnit * 16;
    const tileSize = this.tileSize;
    const flagSize = tileSize;

    interface ButtonSpec {
      label: string;
      fillColor: number;
      fillAlpha: number;
      borderColor: number;
      onClick: () => void;
      assignText: (text: Phaser.GameObjects.Text) => void;
    }

    const buttonSpecs: ButtonSpec[] = [];

    buttonSpecs.push({
      label: t('ui.resume'),
      fillColor: 0x225522,
      fillAlpha: 0.8,
      borderColor: 0x44aa44,
      onClick: () => this.callbacks.onResume(),
      assignText: (text) => {
        this.resumeText = text;
      },
    });

    if (this.callbacks.onQuit) {
      buttonSpecs.push({
        label: t('ui.quit'),
        fillColor: 0x552222,
        fillAlpha: 0.9,
        borderColor: 0xaa4444,
        onClick: () => this.showQuitConfirm(),
        assignText: (text) => {
          this.quitText = text;
        },
      });
    }

    if (this.callbacks.onReset) {
      buttonSpecs.push({
        label: t('ui.reset'),
        fillColor: 0x443322,
        fillAlpha: 0.9,
        borderColor: 0xaa8844,
        onClick: () => this.showResetConfirm(),
        assignText: (text) => {
          this.resetText = text;
        },
      });
    }

    buttonSpecs.push({
      label: t('ui.deleteMeta'),
      fillColor: 0x330022,
      fillAlpha: 0.9,
      borderColor: 0xaa2266,
      onClick: () => this.showDeleteMetaConfirm(),
      assignText: (text) => {
        this.deleteMetaText = text;
      },
    });

    const buttonCount = buttonSpecs.length;
    const menuHeight =
      buttonHeight * buttonCount +
      gap * Math.max(0, buttonCount - 1) +
      pixelUnit * 16 +
      tileSize * 2 +
      flagSize +
      gap +
      flagSize;
    const menuX = (screenWidth - menuWidth) / 2;
    const menuY = (screenHeight - menuHeight) / 2;

    const overlay = this.scene.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const panelGraphics = this.scene.add.graphics();
    panelGraphics.fillStyle(0x000033, 0.8);
    panelGraphics.fillRect(menuX, menuY, menuWidth, menuHeight);
    createUIPanel(panelGraphics, menuX, menuY, menuWidth, menuHeight, pixelUnit, 0xffffff, 1);

    const centerX = screenWidth / 2;
    const firstButtonY = menuY + pixelUnit * 8 + buttonHeight / 2;

    const containerChildren: Phaser.GameObjects.GameObject[] = [overlay, panelGraphics];

    for (let buttonIndex = 0; buttonIndex < buttonSpecs.length; buttonIndex++) {
      const spec = buttonSpecs[buttonIndex];
      const buttonY = firstButtonY + buttonIndex * (buttonHeight + gap);

      const graphics = this.scene.add.graphics();
      graphics.fillStyle(spec.fillColor, spec.fillAlpha);
      graphics.fillRect(
        centerX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
      );
      createUIPanel(
        graphics,
        centerX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        pixelUnit,
        spec.borderColor,
        0.9,
      );

      const textObject = this.scene.add.text(centerX, buttonY, spec.label, {
        fontFamily: 'KenneyPixel',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
      });
      textObject.setOrigin(0.5, 0.5);
      spec.assignText(textObject);

      const zone = this.scene.add.zone(centerX, buttonY, buttonWidth, buttonHeight);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        playSfx(this.scene, 'buttonClick', 0.3);
        spec.onClick();
      });

      containerChildren.push(graphics, textObject, zone);
    }

    const flagGap = pixelUnit * 6;
    const soundY = menuY + menuHeight - pixelUnit * 8 - flagSize - flagGap - flagSize / 2;

    this.localSfxMuted = sfxMuted;
    this.soundToggleImg = this.scene.add.image(
      centerX,
      soundY,
      'uiAtlas',
      this.localSfxMuted ? 'soundOff' : 'soundOn',
    );
    this.soundToggleImg.setDisplaySize(flagSize, flagSize);
    this.soundToggleImg.setInteractive({ useHandCursor: true });
    this.soundToggleImg.on('pointerup', () => {
      this.localSfxMuted = !this.localSfxMuted;
      setSfxMuted(this.localSfxMuted);
      this.soundToggleImg.setFrame(this.localSfxMuted ? 'soundOff' : 'soundOn');
    });

    const flagY = menuY + menuHeight - pixelUnit * 8 - flagSize / 2;

    this.enFlagImg = this.scene.add.image(
      centerX - flagGap / 2 - flagSize / 2,
      flagY,
      'uiAtlas',
      'enFlag',
    );
    this.enFlagImg.setDisplaySize(flagSize, flagSize);
    this.enFlagImg.setInteractive({ useHandCursor: true });
    this.enFlagImg.on('pointerup', () => {
      playSfx(this.scene, 'buttonClick', 0.3);
      setLanguage('en');
      this.refreshTexts();
    });

    this.frFlagImg = this.scene.add.image(
      centerX + flagGap / 2 + flagSize / 2,
      flagY,
      'uiAtlas',
      'frFlag',
    );
    this.frFlagImg.setDisplaySize(flagSize, flagSize);
    this.frFlagImg.setInteractive({ useHandCursor: true });
    this.frFlagImg.on('pointerup', () => {
      playSfx(this.scene, 'buttonClick', 0.3);
      setLanguage('fr');
      this.refreshTexts();
    });

    this.refreshFlagAlpha();

    containerChildren.push(this.enFlagImg, this.frFlagImg, this.soundToggleImg);

    this.menuContainer = this.scene.add.container(0, 0, containerChildren);
    this.menuContainer.setDepth(FRONT_DEPTH + 50);
    this.menuContainer.setVisible(false);
  }

  private refreshFlagAlpha() {
    const isEnglish = getLanguage() === 'en';
    this.enFlagImg.setAlpha(isEnglish ? 1 : 0.35);
    this.frFlagImg.setAlpha(isEnglish ? 0.35 : 1);
  }

  refreshTexts() {
    this.resumeText.setText(t('ui.resume'));
    this.quitText?.setText(t('ui.quit'));
    this.resetText?.setText(t('ui.reset'));
    this.deleteMetaText.setText(t('ui.deleteMeta'));
    this.refreshFlagAlpha();
  }

  private createResetConfirm() {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const pixelUnit = this.pixelUnit;
    const fontSize = Math.round(pixelUnit * 14);
    const padding = pixelUnit * 8;
    const gap = pixelUnit * 6;
    const centerX = screenWidth / 2;

    const confirmText = this.scene.add.text(0, 0, t('ui.resetConfirm'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    confirmText.setOrigin(0.5, 0.5);

    const yesText = this.scene.add.text(0, 0, t('ui.yes'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    yesText.setOrigin(0.5, 0.5);

    const noText = this.scene.add.text(0, 0, t('ui.no'), {
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

    const overlay = this.scene.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const panelGraphics = this.scene.add.graphics();
    panelGraphics.fillStyle(0x000033, 0.95);
    panelGraphics.fillRect(panelX, panelY, panelWidth, panelHeight);
    createUIPanel(panelGraphics, panelX, panelY, panelWidth, panelHeight, pixelUnit, 0xffffff, 1);

    const yesGraphics = this.scene.add.graphics();
    const yesX = centerX - gap / 2 - buttonWidth / 2;
    yesGraphics.fillStyle(0x552222, 0.9);
    yesGraphics.fillRect(yesX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight);
    createUIPanel(yesGraphics, yesX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight, pixelUnit, 0xaa4444, 0.9);
    yesText.setPosition(yesX, buttonsY);

    const yesZone = this.scene.add.zone(yesX, buttonsY, buttonWidth, buttonHeight);
    yesZone.setInteractive({ useHandCursor: true });
    yesZone.on('pointerup', () => {
      playSfx(this.scene, 'buttonClick', 0.3);
      this.hideResetConfirm();
      this.callbacks.onReset?.();
    });

    const noGraphics = this.scene.add.graphics();
    const noX = centerX + gap / 2 + buttonWidth / 2;
    noGraphics.fillStyle(0x225522, 0.9);
    noGraphics.fillRect(noX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight);
    createUIPanel(noGraphics, noX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight, pixelUnit, 0x44aa44, 0.9);
    noText.setPosition(noX, buttonsY);

    const noZone = this.scene.add.zone(noX, buttonsY, buttonWidth, buttonHeight);
    noZone.setInteractive({ useHandCursor: true });
    noZone.on('pointerup', () => {
      playSfx(this.scene, 'buttonClick', 0.3);
      this.hideResetConfirm();
    });

    this.confirmContainer = this.scene.add.container(0, 0, [
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
    this.confirmContainer!.setVisible(true);
  }

  private hideResetConfirm() {
    if (this.confirmContainer) {
      this.confirmContainer.destroy();
      this.confirmContainer = undefined;
    }
  }

  private createDeleteMetaConfirm() {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const pixelUnit = this.pixelUnit;
    const fontSize = Math.round(pixelUnit * 12);
    const padding = pixelUnit * 8;
    const gap = pixelUnit * 6;
    const centerX = screenWidth / 2;

    const confirmText = this.scene.add.text(0, 0, t('ui.deleteMetaConfirm'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      wordWrap: { width: screenWidth * 0.75 },
      align: 'center',
    });
    confirmText.setOrigin(0.5, 0.5);

    const yesText = this.scene.add.text(0, 0, t('ui.yes'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    yesText.setOrigin(0.5, 0.5);

    const noText = this.scene.add.text(0, 0, t('ui.no'), {
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

    const overlay = this.scene.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const panelGraphics = this.scene.add.graphics();
    panelGraphics.fillStyle(0x000033, 0.95);
    panelGraphics.fillRect(panelX, panelY, panelWidth, panelHeight);
    createUIPanel(panelGraphics, panelX, panelY, panelWidth, panelHeight, pixelUnit, 0xffffff, 1);

    const yesGraphics = this.scene.add.graphics();
    const yesX = centerX - gap / 2 - buttonWidth / 2;
    yesGraphics.fillStyle(0x552222, 0.9);
    yesGraphics.fillRect(yesX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight);
    createUIPanel(yesGraphics, yesX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight, pixelUnit, 0xaa4444, 0.9);
    yesText.setPosition(yesX, buttonsY);

    const yesZone = this.scene.add.zone(yesX, buttonsY, buttonWidth, buttonHeight);
    yesZone.setInteractive({ useHandCursor: true });
    yesZone.on('pointerup', () => {
      playSfx(this.scene, 'buttonClick', 0.3);
      this.hideDeleteMetaConfirm();
      this.callbacks.onDeleteMeta();
    });

    const noGraphics = this.scene.add.graphics();
    const noX = centerX + gap / 2 + buttonWidth / 2;
    noGraphics.fillStyle(0x225522, 0.9);
    noGraphics.fillRect(noX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight);
    createUIPanel(noGraphics, noX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight, pixelUnit, 0x44aa44, 0.9);
    noText.setPosition(noX, buttonsY);

    const noZone = this.scene.add.zone(noX, buttonsY, buttonWidth, buttonHeight);
    noZone.setInteractive({ useHandCursor: true });
    noZone.on('pointerup', () => {
      playSfx(this.scene, 'buttonClick', 0.3);
      this.hideDeleteMetaConfirm();
    });

    this.deleteMetaConfirmContainer = this.scene.add.container(0, 0, [
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
    this.deleteMetaConfirmContainer.setDepth(FRONT_DEPTH + 60);
  }

  private showDeleteMetaConfirm() {
    if (this.deleteMetaConfirmContainer) {
      this.deleteMetaConfirmContainer.destroy();
    }
    this.createDeleteMetaConfirm();
    this.deleteMetaConfirmContainer!.setVisible(true);
  }

  private hideDeleteMetaConfirm() {
    if (this.deleteMetaConfirmContainer) {
      this.deleteMetaConfirmContainer.destroy();
      this.deleteMetaConfirmContainer = undefined;
    }
  }

  private createQuitConfirm() {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const pixelUnit = this.pixelUnit;
    const fontSize = Math.round(pixelUnit * 14);
    const padding = pixelUnit * 8;
    const gap = pixelUnit * 6;
    const centerX = screenWidth / 2;

    const confirmText = this.scene.add.text(0, 0, t('ui.quitConfirm'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    confirmText.setOrigin(0.5, 0.5);

    const yesText = this.scene.add.text(0, 0, t('ui.yes'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    yesText.setOrigin(0.5, 0.5);

    const noText = this.scene.add.text(0, 0, t('ui.no'), {
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

    const overlay = this.scene.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const panelGraphics = this.scene.add.graphics();
    panelGraphics.fillStyle(0x000033, 0.95);
    panelGraphics.fillRect(panelX, panelY, panelWidth, panelHeight);
    createUIPanel(panelGraphics, panelX, panelY, panelWidth, panelHeight, pixelUnit, 0xffffff, 1);

    const yesGraphics = this.scene.add.graphics();
    const yesX = centerX - gap / 2 - buttonWidth / 2;
    yesGraphics.fillStyle(0x552222, 0.9);
    yesGraphics.fillRect(yesX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight);
    createUIPanel(yesGraphics, yesX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight, pixelUnit, 0xaa4444, 0.9);
    yesText.setPosition(yesX, buttonsY);

    const yesZone = this.scene.add.zone(yesX, buttonsY, buttonWidth, buttonHeight);
    yesZone.setInteractive({ useHandCursor: true });
    yesZone.on('pointerup', () => {
      playSfx(this.scene, 'buttonClick', 0.3);
      this.hideQuitConfirm();
      this.callbacks.onQuit?.();
    });

    const noGraphics = this.scene.add.graphics();
    const noX = centerX + gap / 2 + buttonWidth / 2;
    noGraphics.fillStyle(0x225522, 0.9);
    noGraphics.fillRect(noX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight);
    createUIPanel(noGraphics, noX - buttonWidth / 2, buttonsY - buttonHeight / 2, buttonWidth, buttonHeight, pixelUnit, 0x44aa44, 0.9);
    noText.setPosition(noX, buttonsY);

    const noZone = this.scene.add.zone(noX, buttonsY, buttonWidth, buttonHeight);
    noZone.setInteractive({ useHandCursor: true });
    noZone.on('pointerup', () => {
      playSfx(this.scene, 'buttonClick', 0.3);
      this.hideQuitConfirm();
    });

    this.quitConfirmContainer = this.scene.add.container(0, 0, [
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
    this.quitConfirmContainer.setDepth(FRONT_DEPTH + 60);
  }

  private showQuitConfirm() {
    if (this.quitConfirmContainer) {
      this.quitConfirmContainer.destroy();
    }
    this.createQuitConfirm();
    this.quitConfirmContainer!.setVisible(true);
  }

  private hideQuitConfirm() {
    if (this.quitConfirmContainer) {
      this.quitConfirmContainer.destroy();
      this.quitConfirmContainer = undefined;
    }
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    playSfx(this.scene, 'buttonClick', 0.3);
    this.menuContainer.setVisible(true);
  }

  close() {
    this.isOpen = false;
    if (this.confirmContainer) {
      this.confirmContainer.destroy();
      this.confirmContainer = undefined;
    }
    if (this.deleteMetaConfirmContainer) {
      this.deleteMetaConfirmContainer.destroy();
      this.deleteMetaConfirmContainer = undefined;
    }
    if (this.quitConfirmContainer) {
      this.quitConfirmContainer.destroy();
      this.quitConfirmContainer = undefined;
    }
    this.menuContainer.setVisible(false);
  }
}

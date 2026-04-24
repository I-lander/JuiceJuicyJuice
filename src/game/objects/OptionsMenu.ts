import { CustomScene } from '../customClasses/CustomScene';
import { getLanguage, setLanguage, t } from '../utils/i18n';
import { SaveManager } from '../utils/SaveManager';
import {
  createUIPanel,
  FRONT_DEPTH,
  musicVolume,
  playSfx,
  setMusicVolume,
  setSfxVolume,
  sfxVolume,
} from '../utils/utils';
import { Button } from './Button';

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
  private sfxSliderIcon!: Phaser.GameObjects.Image;
  private sfxSliderGraphics!: Phaser.GameObjects.Graphics;
  private sfxSliderBounds!: { x: number; y: number; width: number; height: number };
  private musicSliderIcon!: Phaser.GameObjects.Image;
  private musicSliderGraphics!: Phaser.GameObjects.Graphics;
  private musicSliderBounds!: { x: number; y: number; width: number; height: number };
  private sfxDragging: boolean = false;
  private musicDragging: boolean = false;
  private pointerMoveHandler?: (pointer: Phaser.Input.Pointer) => void;
  private pointerUpHandler?: () => void;

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
    const paddingX = pixelUnit * 10;
    const paddingY = pixelUnit * 4;
    const gap = pixelUnit * 6;
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

    const maxTextWidth = Button.measureMaxTextWidth(
      this.scene,
      buttonSpecs.map((spec) => spec.label),
      fontSize,
    );
    const buttonWidth = maxTextWidth + paddingX * 2;
    const menuWidth = buttonWidth + pixelUnit * 16;

    const buttonCount = buttonSpecs.length;
    const buttons: Button[] = [];
    const centerX = screenWidth / 2;

    for (const spec of buttonSpecs) {
      const button = new Button({
        scene: this.scene,
        x: centerX,
        y: 0,
        label: spec.label,
        fontSize,
        fillColor: spec.fillColor,
        fillAlpha: spec.fillAlpha,
        borderColor: spec.borderColor,
        borderAlpha: 0.9,
        pixelUnit,
        onClick: spec.onClick,
        width: buttonWidth,
        paddingX,
        paddingY,
      });
      buttons.push(button);
      spec.assignText(button.text);
    }

    const buttonHeight = buttons[0].height;
    const menuHeight =
      buttonHeight * buttonCount +
      gap * Math.max(0, buttonCount - 1) +
      pixelUnit * 16 +
      tileSize * 2 +
      flagSize +
      gap +
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

    const firstButtonY = menuY + pixelUnit * 8 + buttonHeight / 2;

    const containerChildren: Phaser.GameObjects.GameObject[] = [overlay, panelGraphics];

    buttons.forEach((button, buttonIndex) => {
      const buttonY = firstButtonY + buttonIndex * (buttonHeight + gap);
      button.setPosition(centerX, buttonY);
      containerChildren.push(button.container);
    });

    const flagGap = pixelUnit * 6;
    const sliderPadding = pixelUnit * 8;
    const sliderIconGap = pixelUnit * 4;
    const musicSliderY = menuY + menuHeight - pixelUnit * 8 - flagSize - flagGap - flagSize / 2;
    const sfxSliderY = musicSliderY - flagSize - flagGap;
    const sliderLeftX = menuX + sliderPadding;
    const trackX = sliderLeftX + flagSize + sliderIconGap;
    const trackWidth = menuX + menuWidth - sliderPadding - trackX;
    const trackHeight = pixelUnit * 3;

    this.sfxSliderBounds = {
      x: trackX,
      y: sfxSliderY - trackHeight / 2,
      width: trackWidth,
      height: trackHeight,
    };
    this.musicSliderBounds = {
      x: trackX,
      y: musicSliderY - trackHeight / 2,
      width: trackWidth,
      height: trackHeight,
    };

    this.sfxSliderIcon = this.scene.add.image(
      sliderLeftX + flagSize / 2,
      sfxSliderY,
      'uiAtlas',
      sfxVolume > 0 ? 'soundOn' : 'soundOff',
    );
    this.sfxSliderIcon.setDisplaySize(flagSize, flagSize);

    this.musicSliderIcon = this.scene.add.image(
      sliderLeftX + flagSize / 2,
      musicSliderY,
      'uiAtlas',
      musicVolume > 0 ? 'musicOn' : 'musicOff',
    );
    this.musicSliderIcon.setDisplaySize(flagSize, flagSize);

    this.sfxSliderGraphics = this.scene.add.graphics();
    this.musicSliderGraphics = this.scene.add.graphics();
    this.drawSlider(this.sfxSliderGraphics, this.sfxSliderBounds, sfxVolume);
    this.drawSlider(this.musicSliderGraphics, this.musicSliderBounds, musicVolume);

    const sfxZone = this.scene.add.zone(
      trackX + trackWidth / 2,
      sfxSliderY,
      trackWidth,
      flagSize,
    );
    sfxZone.setInteractive({ useHandCursor: true });
    sfxZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.sfxDragging = true;
      this.updateSfxVolumeFromPointer(pointer.x);
    });

    const musicZone = this.scene.add.zone(
      trackX + trackWidth / 2,
      musicSliderY,
      trackWidth,
      flagSize,
    );
    musicZone.setInteractive({ useHandCursor: true });
    musicZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.musicDragging = true;
      this.updateMusicVolumeFromPointer(pointer.x);
    });

    this.pointerMoveHandler = (pointer: Phaser.Input.Pointer) => {
      if (this.sfxDragging) this.updateSfxVolumeFromPointer(pointer.x);
      if (this.musicDragging) this.updateMusicVolumeFromPointer(pointer.x);
    };
    this.pointerUpHandler = () => {
      if (this.sfxDragging || this.musicDragging) {
        this.sfxDragging = false;
        this.musicDragging = false;
        SaveManager.saveSettings();
      }
    };
    this.scene.input.on('pointermove', this.pointerMoveHandler);
    this.scene.input.on('pointerup', this.pointerUpHandler);
    this.scene.input.on('pointerupoutside', this.pointerUpHandler);

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
      SaveManager.saveSettings();
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
      SaveManager.saveSettings();
    });

    this.refreshFlagAlpha();

    containerChildren.push(
      this.enFlagImg,
      this.frFlagImg,
      this.sfxSliderIcon,
      this.sfxSliderGraphics,
      sfxZone,
      this.musicSliderIcon,
      this.musicSliderGraphics,
      musicZone,
    );

    this.menuContainer = this.scene.add.container(0, 0, containerChildren);
    this.menuContainer.setDepth(FRONT_DEPTH + 50);
    this.menuContainer.setVisible(false);
  }

  private refreshFlagAlpha() {
    const isEnglish = getLanguage() === 'en';
    this.enFlagImg.setAlpha(isEnglish ? 1 : 0.35);
    this.frFlagImg.setAlpha(isEnglish ? 0.35 : 1);
  }

  private drawSlider(
    graphics: Phaser.GameObjects.Graphics,
    bounds: { x: number; y: number; width: number; height: number },
    value: number,
  ) {
    graphics.clear();
    const pixelUnit = this.pixelUnit;
    graphics.fillStyle(0x222244, 0.9);
    graphics.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    const fillWidth = bounds.width * value;
    if (fillWidth > 0) {
      graphics.fillStyle(0x44aa88, 1);
      graphics.fillRect(bounds.x, bounds.y, fillWidth, bounds.height);
    }
    const handleWidth = pixelUnit * 3;
    const handleHeight = bounds.height + pixelUnit * 4;
    const handleX = bounds.x + fillWidth - handleWidth / 2;
    const handleY = bounds.y + bounds.height / 2 - handleHeight / 2;
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(handleX, handleY, handleWidth, handleHeight);
  }

  private updateSfxVolumeFromPointer(pointerX: number) {
    const bounds = this.sfxSliderBounds;
    const ratio = Math.max(0, Math.min(1, (pointerX - bounds.x) / bounds.width));
    setSfxVolume(ratio);
    this.drawSlider(this.sfxSliderGraphics, bounds, ratio);
    this.sfxSliderIcon.setFrame(ratio > 0 ? 'soundOn' : 'soundOff');
  }

  private updateMusicVolumeFromPointer(pointerX: number) {
    const bounds = this.musicSliderBounds;
    const ratio = Math.max(0, Math.min(1, (pointerX - bounds.x) / bounds.width));
    setMusicVolume(ratio);
    this.drawSlider(this.musicSliderGraphics, bounds, ratio);
    this.musicSliderIcon.setFrame(ratio > 0 ? 'musicOn' : 'musicOff');
  }

  refreshTexts() {
    this.resumeText.setText(t('ui.resume'));
    this.quitText?.setText(t('ui.quit'));
    this.resetText?.setText(t('ui.reset'));
    this.deleteMetaText.setText(t('ui.deleteMeta'));
    this.refreshFlagAlpha();
  }

  private createConfirmDialog(options: {
    fontSize: number;
    confirmLabel: string;
    confirmWordWrap?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }): Phaser.GameObjects.Container {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const pixelUnit = this.pixelUnit;
    const { fontSize } = options;
    const padding = pixelUnit * 8;
    const gap = pixelUnit * 6;
    const centerX = screenWidth / 2;

    const confirmTextStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    };
    if (options.confirmWordWrap) {
      confirmTextStyle.wordWrap = { width: screenWidth * 0.75 };
      confirmTextStyle.align = 'center';
    }
    const confirmText = this.scene.add.text(0, 0, options.confirmLabel, confirmTextStyle);
    confirmText.setOrigin(0.5, 0.5);

    const yesNoMaxTextWidth = Button.measureMaxTextWidth(
      this.scene,
      [t('ui.yes'), t('ui.no')],
      fontSize,
    );
    const buttonWidth = yesNoMaxTextWidth + padding * 2;
    const buttonsRowWidth = buttonWidth * 2 + gap;
    const panelWidth = Math.max(confirmText.width, buttonsRowWidth) + padding * 2;

    const yesButton = new Button({
      scene: this.scene,
      x: 0,
      y: 0,
      label: t('ui.yes'),
      fontSize,
      fillColor: 0x552222,
      fillAlpha: 0.9,
      borderColor: 0xaa4444,
      borderAlpha: 0.9,
      pixelUnit,
      onClick: options.onConfirm,
      width: buttonWidth,
      paddingX: padding,
      paddingY: padding / 2,
    });
    const noButton = new Button({
      scene: this.scene,
      x: 0,
      y: 0,
      label: t('ui.no'),
      fontSize,
      fillColor: 0x225522,
      fillAlpha: 0.9,
      borderColor: 0x44aa44,
      borderAlpha: 0.9,
      pixelUnit,
      onClick: options.onCancel,
      width: buttonWidth,
      paddingX: padding,
      paddingY: padding / 2,
    });

    const buttonHeight = yesButton.height;
    const panelHeight = confirmText.height + buttonHeight + gap + padding * 2;
    const panelX = (screenWidth - panelWidth) / 2;
    const panelY = (screenHeight - panelHeight) / 2;

    confirmText.setPosition(centerX, panelY + padding + confirmText.height / 2);

    const buttonsY = panelY + panelHeight - padding - buttonHeight / 2;
    yesButton.setPosition(centerX - gap / 2 - buttonWidth / 2, buttonsY);
    noButton.setPosition(centerX + gap / 2 + buttonWidth / 2, buttonsY);

    const overlay = this.scene.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setInteractive();

    const panelGraphics = this.scene.add.graphics();
    panelGraphics.fillStyle(0x000033, 0.95);
    panelGraphics.fillRect(panelX, panelY, panelWidth, panelHeight);
    createUIPanel(panelGraphics, panelX, panelY, panelWidth, panelHeight, pixelUnit, 0xffffff, 1);

    const container = this.scene.add.container(0, 0, [
      overlay,
      panelGraphics,
      confirmText,
      yesButton.container,
      noButton.container,
    ]);
    container.setDepth(FRONT_DEPTH + 60);
    return container;
  }

  private createResetConfirm() {
    const fontSize = Math.round(this.pixelUnit * 14);
    this.confirmContainer = this.createConfirmDialog({
      fontSize,
      confirmLabel: t('ui.resetConfirm'),
      onConfirm: () => {
        this.hideResetConfirm();
        this.callbacks.onReset?.();
      },
      onCancel: () => this.hideResetConfirm(),
    });
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
    const fontSize = Math.round(this.pixelUnit * 12);
    this.deleteMetaConfirmContainer = this.createConfirmDialog({
      fontSize,
      confirmLabel: t('ui.deleteMetaConfirm'),
      confirmWordWrap: true,
      onConfirm: () => {
        this.hideDeleteMetaConfirm();
        this.callbacks.onDeleteMeta();
      },
      onCancel: () => this.hideDeleteMetaConfirm(),
    });
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
    const fontSize = Math.round(this.pixelUnit * 14);
    this.quitConfirmContainer = this.createConfirmDialog({
      fontSize,
      confirmLabel: t('ui.quitConfirm'),
      onConfirm: () => {
        this.hideQuitConfirm();
        this.callbacks.onQuit?.();
      },
      onCancel: () => this.hideQuitConfirm(),
    });
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

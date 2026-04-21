import { CustomScene } from '../customClasses/CustomScene';
import { SaveManager } from '../utils/SaveManager';
import { setLanguage, t } from '../utils/i18n';
import { createUIPanel, playSfx, removeSplashScreen } from '../utils/utils';

export const WARNING_DISMISSED_KEY = 'juice_epilepsy_warning_dismissed';

export class EpilepsyWarningScene extends CustomScene {
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private transitioning: boolean = false;

  constructor() {
    super('EpilepsyWarningScene');
  }

  create() {
    super.create();
    removeSplashScreen(this);

    this.canvasWidth = this.cameras.main.width;
    this.canvasHeight = this.cameras.main.height;
    this.tileSize = Math.min(this.canvasWidth, this.canvasHeight) / 14;
    this.pixelUnit = this.tileSize / 16;
    this.transitioning = false;

    const saveData = SaveManager.load();
    if (saveData?.language) setLanguage(saveData.language);

    this.add.rectangle(
      this.canvasWidth / 2,
      this.canvasHeight / 2,
      this.canvasWidth,
      this.canvasHeight,
      0x000000,
    );

    this.createWarningTexts();
    this.createActionButtons();

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private createWarningTexts() {
    const pixelUnit = this.pixelUnit;
    const centerX = this.canvasWidth / 2;
    const titleFontSize = Math.round(pixelUnit * 32);
    const bodyFontSize = Math.round(pixelUnit * 14);

    const titleText = this.add.text(centerX, this.canvasHeight * 0.25, t('warning.title'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${titleFontSize}px`,
      color: '#ffcc33',
      stroke: '#000000',
      strokeThickness: Math.round(pixelUnit * 6),
      align: 'center',
    });
    titleText.setOrigin(0.5, 0.5);

    const bodyWrapWidth = this.canvasWidth * 0.75;
    const bodyText = this.add.text(centerX, this.canvasHeight * 0.45, t('warning.body'), {
      fontFamily: 'KenneyPixel',
      fontSize: `${bodyFontSize}px`,
      color: '#ffffff',
      stroke: '#000033',
      strokeThickness: Math.round(pixelUnit * 3),
      align: 'center',
      wordWrap: { width: bodyWrapWidth, useAdvancedWrap: true },
    });
    bodyText.setOrigin(0.5, 0.5);
  }

  private createActionButtons() {
    const pixelUnit = this.pixelUnit;
    const isPortrait = this.canvasHeight > this.canvasWidth;
    const centerX = this.canvasWidth / 2;
    const buttonWidth = pixelUnit * (isPortrait ? 80 : 60);
    const buttonHeight = pixelUnit * 16;
    const gap = pixelUnit * 6;
    const firstButtonY = this.canvasHeight * 0.7;

    this.createButton(
      centerX,
      firstButtonY,
      buttonWidth,
      buttonHeight,
      t('warning.continue'),
      0x8a5a00,
      0xffcc33,
      () => this.continueToTitle(),
    );
    this.createButton(
      centerX,
      firstButtonY + buttonHeight + gap,
      buttonWidth,
      buttonHeight,
      t('warning.dontShowAgain'),
      0x222255,
      0x4444aa,
      () => {
        localStorage.setItem(WARNING_DISMISSED_KEY, 'true');
        this.continueToTitle();
      },
    );
  }

  private createButton(
    centerX: number,
    centerY: number,
    buttonWidth: number,
    buttonHeight: number,
    label: string,
    fillColor: number,
    borderColor: number,
    onClick: () => void,
  ) {
    const pixelUnit = this.pixelUnit;
    const fontSize = Math.round(pixelUnit * 14);

    const graphics = this.add.graphics();
    graphics.fillStyle(fillColor, 1);
    graphics.fillRect(
      centerX - buttonWidth / 2,
      centerY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    );
    createUIPanel(
      graphics,
      centerX - buttonWidth / 2,
      centerY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      pixelUnit,
      borderColor,
      1,
    );
    graphics.setDepth(100);

    const buttonText = this.add.text(centerX, centerY, label, {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5, 0.5);
    buttonText.setDepth(101);

    const buttonZone = this.add.zone(centerX, centerY, buttonWidth, buttonHeight);
    buttonZone.setInteractive({ useHandCursor: true });
    buttonZone.setDepth(102);
    buttonZone.on('pointerup', () => {
      playSfx(this, 'buttonClick', 0.3);
      onClick();
    });
  }

  private continueToTitle() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('TitleScene');
    });
  }
}

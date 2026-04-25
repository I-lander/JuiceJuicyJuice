import { CustomScene } from '../customClasses/CustomScene';
import { Button } from '../objects/Button';
import { SaveManager } from '../utils/SaveManager';
import { setLanguage, t } from '../utils/i18n';
import { removeSplashScreen } from '../utils/utils';

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
    const titleFontSize = Math.round(pixelUnit * 26);
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

    let currentFontSize = titleFontSize;
    while (titleText.width > this.canvasWidth * 0.9) {
      currentFontSize -= 2;
      titleText.setFontSize(currentFontSize);
    }

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
    const centerX = this.canvasWidth / 2;
    const fontSize = Math.round(pixelUnit * 14);
    const paddingX = pixelUnit * 10;
    const paddingY = pixelUnit * 4;
    const gap = pixelUnit * 6;
    const firstButtonY = this.canvasHeight * 0.7;

    const specs: Array<{ label: string; fillColor: number; borderColor: number; onClick: () => void }> = [
      {
        label: t('warning.continue'),
        fillColor: 0x8a5a00,
        borderColor: 0xffcc33,
        onClick: () => this.continueToTitle(),
      },
      {
        label: t('warning.dontShowAgain'),
        fillColor: 0x222255,
        borderColor: 0x4444aa,
        onClick: () => {
          localStorage.setItem(WARNING_DISMISSED_KEY, 'true');
          this.continueToTitle();
        },
      },
    ];

    const maxTextWidth = Button.measureMaxTextWidth(
      this,
      specs.map((spec) => spec.label),
      fontSize,
    );
    const buttonWidth = maxTextWidth + paddingX * 2;

    const buttons = specs.map(
      (spec) =>
        new Button({
          scene: this,
          x: centerX,
          y: firstButtonY,
          label: spec.label,
          fontSize,
          fillColor: spec.fillColor,
          borderColor: spec.borderColor,
          pixelUnit,
          onClick: spec.onClick,
          width: buttonWidth,
          paddingX,
          paddingY,
        }),
    );

    const buttonHeight = buttons[0].height;
    buttons.forEach((button, index) => {
      button.setPosition(centerX, firstButtonY + index * (buttonHeight + gap));
      button.setDepth(100);
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

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { CustomScene } from '../customClasses/CustomScene';
import { spriteElements } from '../elements/SpriteAtlas';
import { OptionsMenu } from '../objects/OptionsMenu';
import { SaveManager } from '../utils/SaveManager';
import { t } from '../utils/i18n';
import {
  createUIPanel,
  getRandomInt,
  initShader,
  playSfx,
  removeSplashScreen,
  setSfxMuted,
  SPRITE_BASE_UNIT,
} from '../utils/utils';
import { APP_VERSION } from '../utils/versionTag';

const TITLE_SPRITE_COUNT = 100;

class TitleSprite extends Phaser.GameObjects.Sprite {
  velocityX: number;
  velocityY: number;
  speed: number;
  rotationSpeed: number;
  baseScale: number;

  constructor(scene: Phaser.Scene, x: number, y: number, frame: string, spriteScale: number) {
    super(scene, x, y, 'spriteAtlas', frame);
    this.baseScale = spriteScale;
    this.setScale(spriteScale);
    this.speed = 80 + Math.random() * 80;
    this.rotationSpeed = (0.4 + Math.random() * 1.2) * (Math.random() < 0.5 ? -1 : 1);
    const angle = Math.random() * Math.PI * 2;
    this.velocityX = Math.cos(angle);
    this.velocityY = Math.sin(angle);
    scene.add.existing(this);
  }
}

export class TitleScene extends CustomScene {
  private titleSprites: TitleSprite[] = [];
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private transitioning: boolean = false;
  private optionsMenu!: OptionsMenu;
  private sfxMuted: boolean = false;

  constructor() {
    super('TitleScene');
  }

  create() {
    super.create();
    removeSplashScreen(this);

    this.canvasWidth = this.cameras.main.width;
    this.canvasHeight = this.cameras.main.height;
    this.tileSize = Math.min(this.canvasWidth, this.canvasHeight) / 14;
    this.pixelUnit = this.tileSize / 16;
    this.transitioning = false;
    this.titleSprites = [];

    this.add.rectangle(
      this.canvasWidth / 2,
      this.canvasHeight / 2,
      this.canvasWidth,
      this.canvasHeight,
      0x42a72e,
    );

    this.spawnBackgroundSprites();
    this.createTitleTexts();
    this.createMenuButtons();
    this.createVersionTag();
    this.optionsMenu = new OptionsMenu(this, {
      onResume: () => this.optionsMenu.close(),
      onDeleteMeta: () => SaveManager.deleteMetaSave(),
    });
    SaveManager.loadMeta();
    const saveData = SaveManager.load();
    if (saveData) {
      this.sfxMuted = saveData.sfxMuted;
      setSfxMuted(saveData.sfxMuted ?? false);
    }

    initShader(this);

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private spawnBackgroundSprites() {
    const spriteScale = this.tileSize / SPRITE_BASE_UNIT;
    const margin = this.tileSize / 2;
    const frames = spriteElements.map((element) => element.id);

    for (let i = 0; i < TITLE_SPRITE_COUNT; i++) {
      const spawnX = getRandomInt(margin, this.canvasWidth - margin);
      const spawnY = getRandomInt(margin, this.canvasHeight - margin);
      const frame = frames[getRandomInt(0, frames.length - 1)];
      const titleSprite = new TitleSprite(this, spawnX, spawnY, frame, spriteScale);
      titleSprite.setDepth(1);
      this.titleSprites.push(titleSprite);
    }
  }

  private createTitleTexts() {
    const pixelUnit = this.pixelUnit;
    const centerX = this.canvasWidth / 2;
    const bigFontSize = Math.round(pixelUnit * 64);
    const smallFontSize = Math.round(bigFontSize * 0.65);
    const subtitleFontSize = Math.round(pixelUnit * 16);
    const titleY = this.canvasHeight * 0.35;

    const titleStyle = {
      fontFamily: 'KenneyPixel',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: Math.round(pixelUnit * 9),
    };

    const firstJuice = this.add
      .text(0, 0, 'Juice', { ...titleStyle, fontSize: `${smallFontSize}px` })
      .setOrigin(0.5, 0.5);
    const juicy = this.add
      .text(0, 0, 'Juicy', { ...titleStyle, fontSize: `${bigFontSize}px` })
      .setOrigin(0.5, 0.5);
    const lastJuice = this.add
      .text(0, 0, 'Juice', { ...titleStyle, fontSize: `${smallFontSize}px` })
      .setOrigin(0.5, 0.5);

    let titleWidth: number;
    let titleHeight: number;

    firstJuice.setPosition(0, -juicy.y - juicy.height / 2 + this.pixelUnit * 4);
    juicy.setPosition(0, 0);
    lastJuice.setPosition(0, juicy.y + juicy.height / 2 + this.tileSize / 4 - this.pixelUnit);
    titleWidth = juicy.width;
    titleHeight = firstJuice.height + juicy.height + lastJuice.height;

    const titleContainer = this.add.container(centerX, titleY, [firstJuice, juicy, lastJuice]);
    titleContainer.setDepth(100);

    const orangeSize = this.tileSize * 4;
    const titleLeftX = centerX - titleWidth / 2 + this.tileSize;
    const titleTopY = titleY - titleHeight / 2 + this.tileSize * 2;
    const orangeSprite = this.add.image(
      titleLeftX - orangeSize * 0.3,
      titleTopY - orangeSize * 0.4,
      'spriteAtlas',
      'orange',
    );
    orangeSprite.setDisplaySize(orangeSize, orangeSize);
    orangeSprite.setDepth(50);
    orangeSprite.setAngle(-30);
    orangeSprite.setPosition(titleLeftX - orangeSize * 0.4, titleTopY);
    const subtitleText = this.add.text(
      centerX,
      titleY + this.tileSize * 3.5,
      t('title.subtitle'),
      {
        fontFamily: 'KenneyPixel',
        fontSize: `${subtitleFontSize}px`,
        color: '#ffffff',
        stroke: '#000033',
        strokeThickness: Math.round(pixelUnit * 4),
      },
    );
    subtitleText.setOrigin(0.5, 0.5);
    subtitleText.setDepth(100);
  }

  private createMenuButtons() {
    const pixelUnit = this.pixelUnit;
    const isPortrait = this.canvasHeight > this.canvasWidth;
    const centerX = this.canvasWidth / 2;
    const buttonWidth = pixelUnit * (isPortrait ? 80 : 60);
    const buttonHeight = pixelUnit * 16;
    const gap = pixelUnit * 6;
    const firstButtonY = this.canvasHeight * (isPortrait ? 0.62 : 0.7);

    this.createButton(
      centerX,
      firstButtonY,
      buttonWidth,
      buttonHeight,
      'PLAY',
      0x8a5a00,
      0xffcc33,
      () => this.startGame(),
    );
    this.createButton(
      centerX,
      firstButtonY + buttonHeight + gap,
      buttonWidth,
      buttonHeight,
      'OPTIONS',
      0x222255,
      0x4444aa,
      () => this.optionsMenu.open(),
    );
    this.createButton(
      centerX,
      firstButtonY + (buttonHeight + gap) * 2,
      buttonWidth,
      buttonHeight,
      'QUIT',
      0x552222,
      0xaa4444,
      () => this.quitGame(),
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

  private createVersionTag() {
    const pixelUnit = this.pixelUnit;
    const fontSize = Math.round(pixelUnit * 10);
    const margin = pixelUnit * 6;
    const demoSuffix = import.meta.env?.VITE_DEMO_MODE === 'true' ? '-DEMO' : '';
    const versionText = this.add.text(
      margin,
      this.canvasHeight - margin,
      `v${APP_VERSION}${demoSuffix}`,
      {
        fontFamily: 'KenneyPixel',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        stroke: '#000033',
        strokeThickness: Math.round(pixelUnit * 2),
      },
    );
    versionText.setOrigin(0, 1);
    versionText.setDepth(100);
  }

  private quitGame() {
    if (Capacitor.isNativePlatform()) {
      App.exitApp();
    } else if (window.electron) {
      window.electron.quitApp();
    }
  }

  private moveSprite(titleSprite: TitleSprite, delta: number) {
    const radius = (titleSprite.width * titleSprite.baseScale) / 2;
    const deltaSeconds = delta / 1000;
    titleSprite.x += titleSprite.velocityX * titleSprite.speed * deltaSeconds;
    titleSprite.y += titleSprite.velocityY * titleSprite.speed * deltaSeconds;

    if (titleSprite.x < radius) {
      titleSprite.x = radius;
      titleSprite.velocityX *= -1;
    } else if (titleSprite.x > this.canvasWidth - radius) {
      titleSprite.x = this.canvasWidth - radius;
      titleSprite.velocityX *= -1;
    }
    if (titleSprite.y < radius) {
      titleSprite.y = radius;
      titleSprite.velocityY *= -1;
    } else if (titleSprite.y > this.canvasHeight - radius) {
      titleSprite.y = this.canvasHeight - radius;
      titleSprite.velocityY *= -1;
    }

    titleSprite.rotation += titleSprite.rotationSpeed * deltaSeconds;
  }

  private handleCollisions() {
    for (let i = 0; i < this.titleSprites.length; i++) {
      const spriteA = this.titleSprites[i];
      const radiusA = (spriteA.width * spriteA.baseScale) / 2;
      for (let j = i + 1; j < this.titleSprites.length; j++) {
        const spriteB = this.titleSprites[j];
        const radiusB = (spriteB.width * spriteB.baseScale) / 2;
        const dx = spriteB.x - spriteA.x;
        const dy = spriteB.y - spriteA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = radiusA + radiusB;

        if (distance < minDistance && distance > 0) {
          const normalX = dx / distance;
          const normalY = dy / distance;
          const overlap = (minDistance - distance) / 2;
          spriteA.x -= normalX * overlap;
          spriteA.y -= normalY * overlap;
          spriteB.x += normalX * overlap;
          spriteB.y += normalY * overlap;

          const relativeVelocity =
            (spriteA.velocityX * spriteA.speed - spriteB.velocityX * spriteB.speed) * normalX +
            (spriteA.velocityY * spriteA.speed - spriteB.velocityY * spriteB.speed) * normalY;

          if (relativeVelocity > 0) {
            spriteA.velocityX -= (relativeVelocity * normalX) / spriteA.speed;
            spriteA.velocityY -= (relativeVelocity * normalY) / spriteA.speed;
            spriteB.velocityX += (relativeVelocity * normalX) / spriteB.speed;
            spriteB.velocityY += (relativeVelocity * normalY) / spriteB.speed;
          }
        }
      }
    }
  }

  private startGame() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MainScene');
      this.scene.start('UIScene');
      this.scene.bringToTop('UIScene');
    });
  }

  update(_time: number, delta: number) {
    for (const titleSprite of this.titleSprites) {
      this.moveSprite(titleSprite, delta);
    }
    this.handleCollisions();
  }
}

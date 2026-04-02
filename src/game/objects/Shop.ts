import { spriteElements } from '../elements/SpriteAtlas';
import { Progression } from '../Progression';
import { UIScene } from '../scenes/UIScene';
import { createUIPanel, FRONT_DEPTH } from '../utils/utils';
import { UPGRADES } from './ShopUpgrades';

interface UpgradeButton {
  upgradeKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  graphics: Phaser.GameObjects.Graphics;
  nameText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  hitZone: Phaser.GameObjects.Zone;
}

export class Shop {
  private scene: UIScene;
  private fragmentsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private xpBarBackground!: Phaser.GameObjects.Graphics;
  private xpBarFill!: Phaser.GameObjects.Graphics;
  private xpBarX: number = 0;
  private xpBarY: number = 0;
  private xpBarWidth: number = 0;
  private xpBarHeight: number = 0;
  private buttons: UpgradeButton[] = [];
  private buttonsStartY: number = 0;

  private panelX: number;
  private panelInnerWidth: number;
  private contentStartY: number;

  constructor(scene: UIScene, panelX: number, panelInnerWidth: number, contentStartY: number) {
    this.scene = scene;
    this.panelX = panelX;
    this.panelInnerWidth = panelInnerWidth;
    this.contentStartY = contentStartY;

    this.createFragmentsCounter();
    this.createXpBar();
    for (const key in UPGRADES) {
      this.createUpgradeButton(key);
    }
  }

  private createFragmentsCounter() {
    const pixelUnit = this.scene.pixelUnit;
    const fontSize = Math.round(pixelUnit * 16);

    this.fragmentsText = this.scene.add.text(this.panelX + pixelUnit * 3, this.contentStartY, '0', {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffdd44',
    });
    this.fragmentsText.setDepth(FRONT_DEPTH + 1);
  }

  private createXpBar() {
    const pixelUnit = this.scene.pixelUnit;
    const tileSize = this.scene.tileSize;
    const smallFontSize = Math.round(pixelUnit * 9);

    const levelTextY = this.contentStartY + tileSize * 0.7;

    this.levelText = this.scene.add.text(this.panelX + pixelUnit * 3, levelTextY, '', {
      fontFamily: 'KenneyPixel',
      fontSize: `${smallFontSize}px`,
      color: '#aaaacc',
    });
    this.levelText.setDepth(FRONT_DEPTH + 1);

    this.xpBarX = this.panelX + pixelUnit * 3;
    this.xpBarY = levelTextY + smallFontSize + pixelUnit * 2;
    this.xpBarWidth = this.panelInnerWidth - pixelUnit * 6;
    this.xpBarHeight = pixelUnit * 4;

    this.xpBarBackground = this.scene.add.graphics();
    this.xpBarBackground.setDepth(FRONT_DEPTH + 1);
    this.xpBarBackground.fillStyle(0x111133, 0.8);
    this.xpBarBackground.fillRect(this.xpBarX, this.xpBarY, this.xpBarWidth, this.xpBarHeight);
    this.xpBarBackground.lineStyle(pixelUnit, 0x4444aa, 0.6);
    this.xpBarBackground.strokeRect(this.xpBarX, this.xpBarY, this.xpBarWidth, this.xpBarHeight);

    this.xpBarFill = this.scene.add.graphics();
    this.xpBarFill.setDepth(FRONT_DEPTH + 1);

    this.buttonsStartY = this.xpBarY + this.xpBarHeight + pixelUnit * 6;
  }

  private refreshXpBar() {
    const progress = Progression.getExperienceProgress();
    const requiredXp = Progression.getExperienceForLevel(Progression.level);

    this.levelText.setText(`Lv.${Progression.level}  ${Progression.experience}/${requiredXp}`);

    this.xpBarFill.clear();
    this.xpBarFill.fillStyle(0x44ddff, 1);
    this.xpBarFill.fillRect(this.xpBarX, this.xpBarY, this.xpBarWidth * progress, this.xpBarHeight);
  }

  private createUpgradeButton(upgradeKey: string) {
    const pixelUnit = this.scene.pixelUnit;
    const tileSize = this.scene.tileSize;
    const definition = UPGRADES[upgradeKey];

    const buttonX = this.panelX + pixelUnit * 2;
    const buttonWidth = this.panelInnerWidth - pixelUnit * 4;
    const buttonHeight = tileSize * 1.8;
    const buttonGap = pixelUnit * 3;
    const buttonIndex = this.buttons.length;
    const buttonY = this.buttonsStartY + buttonIndex * (buttonHeight + buttonGap);

    const graphics = this.scene.add.graphics();
    graphics.setDepth(FRONT_DEPTH + 1);

    const fontSize = Math.round(pixelUnit * 12);
    const smallFontSize = Math.round(pixelUnit * 10);
    const centerX = buttonX + buttonWidth / 2;

    const nameText = this.scene.add.text(centerX, buttonY + buttonHeight * 0.15, definition.name, {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
    });
    nameText.setOrigin(0.5, 0);
    nameText.setDepth(FRONT_DEPTH + 2);

    const costText = this.scene.add.text(centerX, buttonY + buttonHeight * 0.85, '', {
      fontFamily: 'KenneyPixel',
      fontSize: `${smallFontSize}px`,
      color: '#ffdd44',
    });
    costText.setOrigin(0.5, 1);
    costText.setDepth(FRONT_DEPTH + 2);

    const levelText = this.scene.add.text(
      centerX,
      nameText.y + nameText.height + pixelUnit * 2,
      '',
      {
        fontFamily: 'KenneyPixel',
        fontSize: `${Math.round(smallFontSize * 0.75)}px`,
        color: '#aaaacc',
      },
    );
    levelText.setOrigin(0.5, 0.5);
    levelText.setDepth(FRONT_DEPTH + 2);

    const hitZone = this.scene.add.zone(
      buttonX + buttonWidth / 2,
      buttonY + buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    );
    hitZone.setDepth(FRONT_DEPTH + 3);
    hitZone.setInteractive({ useHandCursor: true });

    const button: UpgradeButton = {
      upgradeKey,
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      graphics,
      nameText,
      costText,
      levelText,
      hitZone,
    };

    hitZone.on('pointerdown', () => {
      this.purchaseUpgrade(button);
    });

    this.buttons.push(button);
    this.refreshButton(button);
  }

  private purchaseUpgrade(button: UpgradeButton) {
    if (!Progression.isUpgradeUnlocked(button.upgradeKey)) return;
    const cost = Progression.getUpgradeCost(button.upgradeKey);
    if (!Progression.purchaseUpgrade(button.upgradeKey)) return;
    Progression.addExperience(cost);

    switch (button.upgradeKey) {
      case 'particlesPerClick':
        Progression.particlesPerClick += 1;
        break;
      case 'maxParticles':
        Progression.maxParticles += 5;
        break;
      case 'autoClicker':
        Progression.autoClickers++;
        break;
      case 'cooldownReduction':
        Progression.autoClickerCooldown = Math.max(200, Progression.autoClickerCooldown * 0.9);
        break;
      case 'basicSprite':
        const randomFrame = spriteElements[Math.floor(Math.random() * spriteElements.length)].id;
        this.scene.mainScene.spawnSprite(randomFrame);
        Progression.sprites++;
        break;
    }

    this.refreshButton(button);
  }

  private setButtonVisible(button: UpgradeButton, visible: boolean) {
    button.graphics.setVisible(visible);
    button.nameText.setVisible(visible);
    button.costText.setVisible(visible);
    button.levelText.setVisible(visible);
    button.hitZone.input!.enabled = visible;
  }

  private repositionButton(button: UpgradeButton, visibleIndex: number) {
    const tileSize = this.scene.tileSize;
    const pixelUnit = this.scene.pixelUnit;
    const buttonHeight = tileSize * 1.8;
    const buttonGap = pixelUnit * 3;
    const newY = this.buttonsStartY + visibleIndex * (buttonHeight + buttonGap);

    const deltaY = newY - button.y;
    if (deltaY === 0) return;

    button.y = newY;
    button.nameText.y += deltaY;
    button.costText.y += deltaY;
    button.levelText.y += deltaY;
    button.hitZone.y += deltaY;
  }

  private refreshButton(button: UpgradeButton) {
    const pixelUnit = this.scene.pixelUnit;
    const definition = UPGRADES[button.upgradeKey];
    const level = Progression.upgradeLevels[button.upgradeKey] ?? 0;
    const isMaxed = level >= definition.maxLevel;
    const canAfford = Progression.canAffordUpgrade(button.upgradeKey);

    button.graphics.clear();

    if (isMaxed) {
      button.graphics.fillStyle(0x333355, 0.8);
    } else if (canAfford) {
      button.graphics.fillStyle(0x225522, 0.9);
    } else {
      button.graphics.fillStyle(0x1a1a3a, 0.9);
    }
    button.graphics.fillRect(button.x, button.y, button.width, button.height);

    const borderColor = isMaxed ? 0x555577 : canAfford ? 0x44aa44 : 0x4444aa;
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

    const currentValue = Progression.getUpgradeValue(button.upgradeKey);
    button.levelText.setText(`${currentValue}  (${level}/${definition.maxLevel})`);

    if (isMaxed) {
      button.costText.setText('MAX');
      button.costText.setColor('#aaaacc');
    } else {
      const cost = Progression.getUpgradeCost(button.upgradeKey);
      button.costText.setText(`${cost} fragments`);
      button.costText.setColor('#ffdd44');
    }
  }

  update() {
    this.fragmentsText.setText(`${Progression.fragments}`);
    this.refreshXpBar();

    let visibleIndex = 0;
    for (const button of this.buttons) {
      const isUnlocked = Progression.isUpgradeUnlocked(button.upgradeKey);
      this.setButtonVisible(button, isUnlocked);
      if (isUnlocked) {
        this.repositionButton(button, visibleIndex);
        this.refreshButton(button);
        visibleIndex++;
      }
    }
  }
}

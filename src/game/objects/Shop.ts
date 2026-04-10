import { spriteElements } from '../elements/SpriteAtlas';
import { Progression } from '../Progression';
import { UIScene } from '../scenes/UIScene';
import { t } from '../utils/i18n';
import { createUIPanel, formatNumber, FRONT_DEPTH, playSfx } from '../utils/utils';
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
  private container: Phaser.GameObjects.Container;

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
  private panelBottomY: number;

  public scrollContainer!: Phaser.GameObjects.Container;
  public scrollOffset: number = 0;
  private maxScrollOffset: number = 0;
  private visibleHeight: number = 0;

  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartOffset: number = 0;
  private dragMoved: boolean = false;

  private scrollbarThumb!: Phaser.GameObjects.Graphics;

  private activeTab: 'upgrades' | 'unlocks' = 'upgrades';
  private tabUpgradesGraphics!: Phaser.GameObjects.Graphics;
  private tabUnlocksGraphics!: Phaser.GameObjects.Graphics;
  private tabUpgradesText!: Phaser.GameObjects.Text;
  private tabUnlocksText!: Phaser.GameObjects.Text;
  private tabUpgradesZone!: Phaser.GameObjects.Zone;
  private tabUnlocksZone!: Phaser.GameObjects.Zone;
  private tabHeight: number = 0;

  private tooltipGraphics!: Phaser.GameObjects.Graphics;
  private tooltipText!: Phaser.GameObjects.Text;
  private longPressTimer: Phaser.Time.TimerEvent | null = null;
  private tooltipVisible: boolean = false;

  constructor(
    scene: UIScene,
    container: Phaser.GameObjects.Container,
    panelX: number,
    panelInnerWidth: number,
    contentStartY: number,
    panelBottomY: number,
  ) {
    this.scene = scene;
    this.container = container;
    this.panelX = panelX;
    this.panelInnerWidth = panelInnerWidth;
    this.contentStartY = contentStartY;
    this.panelBottomY = panelBottomY;

    this.createXpBar();
    this.createTabs();
    this.createScrollContainer();
    this.createScrollbar();
    for (const key in UPGRADES) {
      this.createUpgradeButton(key);
    }
    this.setupScrollInput();
    this.createTooltip();
    this.container.bringToTop(this.tabUpgradesZone);
    this.container.bringToTop(this.tabUnlocksZone);
  }

  private createXpBar() {
    const pixelUnit = this.scene.pixelUnit;
    const tileSize = this.scene.tileSize;
    const smallFontSize = Math.round(pixelUnit * 9);

    const levelTextY = this.contentStartY + tileSize * 0.25;

    this.levelText = this.scene.add.text(this.panelX + pixelUnit * 3, levelTextY, '', {
      fontFamily: 'KenneyPixel',
      fontSize: `${smallFontSize}px`,
      color: '#aaaacc',
    });
    this.levelText.setDepth(FRONT_DEPTH + 1);
    this.container.add(this.levelText);

    this.xpBarX = this.panelX + pixelUnit * 3;
    this.xpBarY = levelTextY + smallFontSize + pixelUnit * 2;
    this.xpBarWidth = this.panelInnerWidth - pixelUnit * 6;
    this.xpBarHeight = pixelUnit * 4;

    this.xpBarBackground = this.scene.add.graphics();
    this.xpBarBackground.setDepth(FRONT_DEPTH + 1);
    this.xpBarBackground.lineStyle(pixelUnit, 0x4444aa, 1);
    this.xpBarBackground.strokeRect(this.xpBarX, this.xpBarY, this.xpBarWidth, this.xpBarHeight);

    this.xpBarFill = this.scene.add.graphics();
    this.xpBarFill.setDepth(FRONT_DEPTH + 1);
    this.container.add([this.xpBarFill, this.xpBarBackground]);

    this.buttonsStartY = this.xpBarY + this.xpBarHeight + pixelUnit * 6;
    this.visibleHeight = this.panelBottomY - this.buttonsStartY;
  }

  private createTabs() {
    const pixelUnit = this.scene.pixelUnit;
    this.tabHeight = pixelUnit * 14;
    const tabY = this.buttonsStartY;
    const tabWidth = (this.panelInnerWidth - pixelUnit * 4) / 2;
    const tabLeftX = this.panelX + pixelUnit * 2;
    const tabRightX = tabLeftX + tabWidth;
    const fontSize = Math.round(pixelUnit * 10);

    this.tabUpgradesGraphics = this.scene.add.graphics();
    this.tabUpgradesGraphics.setDepth(3);
    this.tabUnlocksGraphics = this.scene.add.graphics();
    this.tabUnlocksGraphics.setDepth(2);
    this.container.add([this.tabUnlocksGraphics, this.tabUpgradesGraphics]);

    this.tabUpgradesText = this.scene.add.text(
      tabLeftX + tabWidth / 2,
      tabY + this.tabHeight / 2,
      t('ui.upgrades'),
      {
        fontFamily: 'KenneyPixel',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
      },
    );
    this.tabUpgradesText.setOrigin(0.5, 0.5);
    this.tabUpgradesText.setDepth(FRONT_DEPTH + 3);

    this.tabUnlocksText = this.scene.add.text(
      tabRightX + tabWidth / 2,
      tabY + this.tabHeight / 2,
      t('ui.unlocks'),
      {
        fontFamily: 'KenneyPixel',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
      },
    );
    this.tabUnlocksText.setOrigin(0.5, 0.5);
    this.tabUnlocksText.setDepth(FRONT_DEPTH + 3);
    this.container.add([this.tabUpgradesText, this.tabUnlocksText]);

    this.tabUpgradesZone = this.scene.add.zone(
      tabLeftX + tabWidth / 2,
      tabY + this.tabHeight / 2,
      tabWidth,
      this.tabHeight,
    );
    this.tabUpgradesZone.setDepth(FRONT_DEPTH + 4);
    this.tabUpgradesZone.setInteractive({ useHandCursor: true });
    this.tabUpgradesZone.on('pointerup', () => this.switchTab('upgrades'));

    this.tabUnlocksZone = this.scene.add.zone(
      tabRightX + tabWidth / 2,
      tabY + this.tabHeight / 2,
      tabWidth,
      this.tabHeight,
    );
    this.tabUnlocksZone.setDepth(FRONT_DEPTH + 4);
    this.tabUnlocksZone.setInteractive({ useHandCursor: true });
    this.tabUnlocksZone.on('pointerup', () => this.switchTab('unlocks'));
    this.container.add([this.tabUpgradesZone, this.tabUnlocksZone]);

    this.buttonsStartY += this.tabHeight + pixelUnit * 3;
    this.visibleHeight = this.panelBottomY - this.buttonsStartY;
  }

  private switchTab(tab: 'upgrades' | 'unlocks') {
    if (this.activeTab === tab) return;
    if (tab === 'upgrades') {
      this.container.bringToTop(this.tabUpgradesGraphics);
      this.container.bringToTop(this.tabUpgradesText);
    } else {
      this.container.bringToTop(this.tabUnlocksGraphics);
      this.container.bringToTop(this.tabUnlocksText);
    }
    this.activeTab = tab;
    this.scrollOffset = 0;
    this.scrollContainer.y = 0;
  }

  private refreshTabs() {
    const pixelUnit = this.scene.pixelUnit;
    const tabY = this.xpBarY + this.xpBarHeight + pixelUnit * 6;
    const tabWidth = (this.panelInnerWidth - pixelUnit * 4) / 2;
    const tabLeftX = this.panelX + pixelUnit * 2;
    const tabRightX = tabLeftX + tabWidth;

    this.tabUpgradesGraphics.clear();
    this.tabUnlocksGraphics.clear();

    const activeColor = 0x334477;
    const inactiveColor = 0x1a1a3a;

    this.tabUpgradesGraphics.fillStyle(
      this.activeTab === 'upgrades' ? activeColor : inactiveColor,
      0.9,
    );
    this.tabUpgradesGraphics.fillRect(tabLeftX, tabY, tabWidth, this.tabHeight);
    this.tabUpgradesGraphics.lineStyle(
      pixelUnit,
      this.activeTab === 'upgrades' ? 0x4488cc : 0x333366,
      0.9,
    );
    this.tabUpgradesGraphics.strokeRect(tabLeftX, tabY, tabWidth, this.tabHeight);

    this.tabUnlocksGraphics.fillStyle(
      this.activeTab === 'unlocks' ? activeColor : inactiveColor,
      0.9,
    );
    this.tabUnlocksGraphics.fillRect(tabRightX, tabY, tabWidth, this.tabHeight);
    this.tabUnlocksGraphics.lineStyle(
      pixelUnit,
      this.activeTab === 'unlocks' ? 0x4488cc : 0x333366,
      0.9,
    );
    this.tabUnlocksGraphics.strokeRect(tabRightX, tabY, tabWidth, this.tabHeight);

    this.tabUpgradesText.setText(t('ui.upgrades'));
    this.tabUpgradesText.setColor(this.activeTab === 'upgrades' ? '#ffffff' : '#666688');
    this.tabUnlocksText.setText(t('ui.unlocks'));
    this.tabUnlocksText.setColor(this.activeTab === 'unlocks' ? '#ffffff' : '#666688');
  }

  private isMultiLevelUpgrade(upgradeKey: string): boolean {
    return UPGRADES[upgradeKey].maxLevel > 1;
  }

  private createScrollContainer() {
    this.scrollContainer = this.scene.add.container(0, 0);
    this.scrollContainer.setDepth(FRONT_DEPTH + 1);

    const maskShape = this.scene.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(this.panelX, this.buttonsStartY, this.panelInnerWidth, this.visibleHeight);
    this.scrollContainer.setMask(maskShape.createGeometryMask());
    this.container.add(this.scrollContainer);
  }

  private createScrollbar() {
    const pixelUnit = this.scene.pixelUnit;

    this.scrollbarThumb = this.scene.add.graphics();
    this.scrollbarThumb.setDepth(FRONT_DEPTH + 3);
    this.container.add(this.scrollbarThumb);
  }

  private refreshScrollbar() {
    this.scrollbarThumb.clear();
    if (this.maxScrollOffset <= 0) {
      return;
    }

    const pixelUnit = this.scene.pixelUnit;
    const scrollbarWidth = pixelUnit * 2;
    const scrollbarX = this.panelX + this.panelInnerWidth - scrollbarWidth + pixelUnit;
    const totalContentHeight = this.maxScrollOffset + this.visibleHeight;
    const thumbHeight = Math.max(
      pixelUnit * 6,
      (this.visibleHeight / totalContentHeight) * this.visibleHeight,
    );
    const scrollableTrack = this.visibleHeight - thumbHeight;
    const thumbY =
      this.buttonsStartY + (this.scrollOffset / this.maxScrollOffset) * scrollableTrack;

    this.scrollbarThumb.fillStyle(0x4444aa, 1);
    this.scrollbarThumb.fillRect(scrollbarX, thumbY, scrollbarWidth, thumbHeight);
  }

  private applyScroll(delta: number) {
    this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + delta, 0, this.maxScrollOffset);
    this.scrollContainer.y = -this.scrollOffset;
  }

  private isPointerInScrollArea(pointer: Phaser.Input.Pointer): boolean {
    return (
      pointer.x >= this.panelX &&
      pointer.x <= this.panelX + this.panelInnerWidth &&
      pointer.y >= this.buttonsStartY &&
      pointer.y <= this.buttonsStartY + this.visibleHeight
    );
  }

  private setupScrollInput() {
    const dragThreshold = this.scene.pixelUnit * 5;

    this.scene.input.on(
      'wheel',
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number,
      ) => {
        const scrollSpeed = this.scene.pixelUnit * 20;
        this.applyScroll(deltaY > 0 ? scrollSpeed : -scrollSpeed);
      },
    );

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPointerInScrollArea(pointer)) return;
      this.isDragging = true;
      this.dragMoved = false;
      this.dragStartY = pointer.y;
      this.dragStartOffset = this.scrollOffset;
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const deltaY = this.dragStartY - pointer.y;
      if (!this.dragMoved && Math.abs(deltaY) > dragThreshold) {
        this.dragMoved = true;
      }
      if (this.dragMoved) {
        this.cancelLongPress();
        this.hideTooltip();
        this.scrollOffset = Phaser.Math.Clamp(
          this.dragStartOffset + deltaY,
          0,
          this.maxScrollOffset,
        );
        this.scrollContainer.y = -this.scrollOffset;
      }
    });

    this.scene.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.scene.game.canvas.addEventListener('pointerleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.dragMoved = false;
      }
      this.cancelLongPress();
      this.hideTooltip();
    });
  }

  private createTooltip() {
    const pixelUnit = this.scene.pixelUnit;
    const fontSize = Math.round(pixelUnit * 10);

    this.tooltipGraphics = this.scene.add.graphics();
    this.tooltipGraphics.setDepth(FRONT_DEPTH + 20);
    this.tooltipGraphics.setVisible(false);

    this.tooltipText = this.scene.add.text(0, 0, '', {
      fontFamily: 'KenneyPixel',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      wordWrap: { width: this.panelInnerWidth - pixelUnit * 16 },
      align: 'center',
    });
    this.tooltipText.setOrigin(0.5, 0.5);
    this.tooltipText.setDepth(FRONT_DEPTH + 21);
    this.tooltipText.setVisible(false);

    this.container.add([this.tooltipGraphics, this.tooltipText]);
  }

  private showTooltip(upgradeKey: string, pointerX: number, pointerY: number) {
    const pixelUnit = this.scene.pixelUnit;
    const padding = pixelUnit * 6;
    const fingerOffset = pixelUnit * 20;

    this.tooltipText.setText(t(`upgrade.${upgradeKey}.desc`));

    const bgWidth = this.tooltipText.width + padding * 2;
    const bgHeight = this.tooltipText.height + padding * 2;

    const screenHeight = this.scene.cameras.main.height;

    let bgX = pointerX - bgWidth / 2;
    let bgY = pointerY - bgHeight - fingerOffset;

    if (bgY < 0) {
      bgY = pointerY + fingerOffset;
    }

    bgX = Phaser.Math.Clamp(bgX, this.panelX, this.panelX + this.panelInnerWidth - bgWidth);
    bgY = Phaser.Math.Clamp(bgY, 0, screenHeight - bgHeight);

    this.tooltipText.setPosition(bgX + bgWidth / 2, bgY + bgHeight / 2);

    this.tooltipGraphics.clear();
    this.tooltipGraphics.fillStyle(0x111133, 0.95);
    this.tooltipGraphics.fillRect(bgX, bgY, bgWidth, bgHeight);
    createUIPanel(this.tooltipGraphics, bgX, bgY, bgWidth, bgHeight, pixelUnit, 0x8888cc, 1);

    this.tooltipGraphics.setVisible(true);
    this.tooltipText.setVisible(true);
    this.tooltipVisible = true;
  }

  private hideTooltip() {
    if (!this.tooltipVisible) return;
    this.tooltipGraphics.setVisible(false);
    this.tooltipText.setVisible(false);
    this.tooltipVisible = false;
  }

  private cancelLongPress() {
    if (this.longPressTimer) {
      this.longPressTimer.remove();
      this.longPressTimer = null;
    }
  }

  private refreshXpBar() {
    const progress = Progression.getLevelProgress();
    const currentJuice = Progression.getJuiceInCurrentLevel();
    const requiredJuice = Progression.getJuiceForLevel(Progression.level);

    this.levelText.setText(
      `Lv.${Progression.level}  ${formatNumber(currentJuice)}/${formatNumber(requiredJuice)}`,
    );
    const effectWidth =
      this.xpBarWidth * progress > this.xpBarWidth ? this.xpBarWidth : this.xpBarWidth * progress;
    this.xpBarFill.clear();
    this.xpBarFill.fillStyle(0x44ddff, 1);
    this.xpBarFill.setDepth(FRONT_DEPTH);
    this.xpBarFill.fillRect(this.xpBarX, this.xpBarY, effectWidth, this.xpBarHeight);
  }

  private createUpgradeButton(upgradeKey: string) {
    const pixelUnit = this.scene.pixelUnit;
    const tileSize = this.scene.tileSize;

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

    const nameText = this.scene.add.text(
      centerX,
      buttonY + buttonHeight * 0.15,
      t(`upgrade.${upgradeKey}.name`),
      {
        fontFamily: 'KenneyPixel',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
      },
    );
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

    this.scrollContainer.add([graphics, nameText, costText, levelText, hitZone]);

    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.cancelLongPress();
      this.hideTooltip();
      const pointerX = pointer.x;
      const pointerY = pointer.y;
      this.longPressTimer = this.scene.time.delayedCall(500, () => {
        this.showTooltip(upgradeKey, pointerX, pointerY);
        this.longPressTimer = null;
      });
    });

    hitZone.on('pointerup', () => {
      if (this.tooltipVisible) {
        this.hideTooltip();
        this.cancelLongPress();
        return;
      }
      this.cancelLongPress();
      if (!this.dragMoved) {
        this.purchaseUpgrade(button);
      }
    });

    this.buttons.push(button);
    this.refreshButton(button);
  }

  private purchaseUpgrade(button: UpgradeButton) {
    if (!Progression.isUpgradeUnlocked(button.upgradeKey)) return;
    if (!Progression.purchaseUpgrade(button.upgradeKey)) return;

    UPGRADES[button.upgradeKey].onPurchase(this.scene.mainScene);

    this.flashButton(button);
    this.refreshButton(button);
    playSfx(this.scene, 'purchase', 0.3);
  }

  private flashButton(button: UpgradeButton) {
    const flash = this.scene.add.graphics();
    flash.setDepth(FRONT_DEPTH);
    flash.fillStyle(0xffffff, 0.6);
    flash.fillRect(button.x, button.y, button.width, button.height);
    this.scrollContainer.add(flash);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });
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

    button.nameText.setText(t(`upgrade.${button.upgradeKey}.name`));

    const currentValue = Progression.getUpgradeValue(button.upgradeKey);
    button.levelText.setText(`${currentValue}  (${level}/${definition.maxLevel})`);

    if (isMaxed) {
      button.costText.setText(t('ui.max'));
      button.costText.setColor('#aaaacc');
    } else {
      const cost = Progression.getUpgradeCost(button.upgradeKey);
      button.costText.setText(`${formatNumber(cost)}`);
      button.costText.setColor('#ffdd44');
    }
  }

  update() {
    this.refreshXpBar();
    this.refreshTabs();

    const pixelUnit = this.scene.pixelUnit;
    const tileSize = this.scene.tileSize;
    const buttonHeight = tileSize * 1.8;
    const buttonGap = pixelUnit * 3;

    let visibleIndex = 0;
    for (const button of this.buttons) {
      const definition = UPGRADES[button.upgradeKey];
      const level = Progression.upgradeLevels[button.upgradeKey] ?? 0;
      const isMaxedSinglePurchase = definition.maxLevel === 1 && level >= 1;
      const isUnlocked = Progression.isUpgradeUnlocked(button.upgradeKey);
      const belongsToTab =
        this.activeTab === 'upgrades'
          ? this.isMultiLevelUpgrade(button.upgradeKey)
          : !this.isMultiLevelUpgrade(button.upgradeKey);
      const isVisible = isUnlocked && !isMaxedSinglePurchase && belongsToTab;
      this.setButtonVisible(button, isVisible);
      if (isVisible) {
        this.repositionButton(button, visibleIndex);
        this.refreshButton(button);
        const buttonScreenY = button.y - this.scrollOffset;
        const isInView =
          buttonScreenY + buttonHeight > this.buttonsStartY &&
          buttonScreenY < this.buttonsStartY + this.visibleHeight;
        button.hitZone.input!.enabled = isInView;
        visibleIndex++;
      }
    }

    const totalContentHeight = visibleIndex * (buttonHeight + buttonGap) - buttonGap;
    this.maxScrollOffset = Math.max(0, totalContentHeight - this.visibleHeight);
    this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, this.maxScrollOffset);
    this.scrollContainer.y = -this.scrollOffset;
    this.refreshScrollbar();
  }
}

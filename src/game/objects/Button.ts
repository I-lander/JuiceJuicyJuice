import { createUIPanel, playSfx } from '../utils/utils';

export interface ButtonOptions {
  scene: Phaser.Scene;
  x: number;
  y: number;
  label: string;
  fontSize: number;
  fillColor: number;
  borderColor: number;
  pixelUnit: number;
  onClick: () => void;
  fillAlpha?: number;
  borderAlpha?: number;
  paddingX?: number;
  paddingY?: number;
  width?: number;
  height?: number;
  fontFamily?: string;
  textColor?: string;
}

export class Button {
  public readonly container: Phaser.GameObjects.Container;
  public readonly graphics: Phaser.GameObjects.Graphics;
  public readonly text: Phaser.GameObjects.Text;
  public readonly zone: Phaser.GameObjects.Zone;
  public readonly width: number;
  public readonly height: number;

  private readonly scene: Phaser.Scene;
  private readonly pixelUnit: number;
  private readonly fillColor: number;
  private readonly fillAlpha: number;
  private readonly borderColor: number;
  private readonly borderAlpha: number;

  constructor(options: ButtonOptions) {
    const {
      scene,
      x,
      y,
      label,
      fontSize,
      fillColor,
      borderColor,
      pixelUnit,
      onClick,
      fillAlpha = 1,
      borderAlpha = 1,
      fontFamily = 'KenneyPixel',
      textColor = '#ffffff',
    } = options;

    this.scene = scene;
    this.pixelUnit = pixelUnit;
    this.fillColor = fillColor;
    this.fillAlpha = fillAlpha;
    this.borderColor = borderColor;
    this.borderAlpha = borderAlpha;

    this.text = scene.add.text(0, 0, label, {
      fontFamily,
      fontSize: `${fontSize}px`,
      color: textColor,
    });
    this.text.setOrigin(0.5, 0.5);

    const paddingX = options.paddingX ?? pixelUnit * 6;
    const paddingY = options.paddingY ?? pixelUnit * 4;

    this.width = options.width ?? this.text.width + paddingX * 2;
    this.height = options.height ?? this.text.height + paddingY * 2;

    this.graphics = scene.add.graphics();
    this.drawBackground();

    this.zone = scene.add.zone(0, 0, this.width, this.height);
    this.zone.setInteractive({ useHandCursor: true });
    this.zone.on('pointerup', () => {
      playSfx(scene, 'buttonClick', 0.3);
      onClick();
    });

    this.container = scene.add.container(x, y, [this.graphics, this.text, this.zone]);
  }

  private drawBackground(): void {
    this.graphics.clear();
    this.graphics.fillStyle(this.fillColor, this.fillAlpha);
    this.graphics.fillRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
    );
    createUIPanel(
      this.graphics,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
      this.pixelUnit,
      this.borderColor,
      this.borderAlpha,
    );
  }

  setDepth(depth: number): this {
    this.container.setDepth(depth);
    return this;
  }

  setAlpha(alpha: number): this {
    this.graphics.setAlpha(alpha);
    this.text.setAlpha(alpha);
    return this;
  }

  setVisible(visible: boolean): this {
    this.container.setVisible(visible);
    if (this.zone.input) this.zone.input.enabled = visible;
    return this;
  }

  setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }

  setLabel(label: string): this {
    this.text.setText(label);
    return this;
  }

  destroy(): void {
    this.container.destroy();
  }

  static measureMaxTextWidth(
    scene: Phaser.Scene,
    labels: string[],
    fontSize: number,
    fontFamily: string = 'KenneyPixel',
  ): number {
    let maxWidth = 0;
    for (const label of labels) {
      const temp = scene.add.text(0, 0, label, {
        fontFamily,
        fontSize: `${fontSize}px`,
      });
      maxWidth = Math.max(maxWidth, temp.width);
      temp.destroy();
    }
    return maxWidth;
  }
}

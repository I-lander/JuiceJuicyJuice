import { MainScene } from '../scenes/MainScene';
import { SPRITE_BASE_UNIT } from '../utils/utils';

export class Sprite extends Phaser.GameObjects.Sprite {
  constructor(scene: MainScene, x: number, y: number) {
    super(scene, x, y, 'spriteAtlas', '');

    this.x = x;
    this.y = y;
    this.setScale(scene.tileSize / SPRITE_BASE_UNIT);
    scene.add.existing(this);
  }

		update(){}
}

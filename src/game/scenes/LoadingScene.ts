export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  preload() {
    // Load your assets here
    // Example:
    // this.load.image('myImage', './assets/images/myImage.png');
    // this.load.atlas('myAtlas', './assets/images/atlas.png', atlasData);
  }

  async create() {
    this.scene.start('MainScene');
    this.scene.start('UIScene');
    this.scene.bringToTop('UIScene');
  }
}

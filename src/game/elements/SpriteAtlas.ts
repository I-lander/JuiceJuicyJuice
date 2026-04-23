export const SPRITE_ATLAS_KEY = 'spriteAtlas';
export const SPRITE_ATLAS_CELL_SIZE = 16;
export const TITLE_ORANGE_FRAME = 2 * 16 + 1;

let discoveredFrames: number[] = [];

export function discoverSpriteFrames(scene: Phaser.Scene): void {
  const texture = scene.textures.get(SPRITE_ATLAS_KEY);
  const sourceImage = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const columns = Math.floor(sourceImage.width / SPRITE_ATLAS_CELL_SIZE);
  const rows = Math.floor(sourceImage.height / SPRITE_ATLAS_CELL_SIZE);

  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_ATLAS_CELL_SIZE;
  canvas.height = SPRITE_ATLAS_CELL_SIZE;
  const context = canvas.getContext('2d');
  if (!context) return;

  const frames: number[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      context.clearRect(0, 0, SPRITE_ATLAS_CELL_SIZE, SPRITE_ATLAS_CELL_SIZE);
      context.drawImage(
        sourceImage,
        col * SPRITE_ATLAS_CELL_SIZE,
        row * SPRITE_ATLAS_CELL_SIZE,
        SPRITE_ATLAS_CELL_SIZE,
        SPRITE_ATLAS_CELL_SIZE,
        0,
        0,
        SPRITE_ATLAS_CELL_SIZE,
        SPRITE_ATLAS_CELL_SIZE,
      );
      const { data } = context.getImageData(
        0,
        0,
        SPRITE_ATLAS_CELL_SIZE,
        SPRITE_ATLAS_CELL_SIZE,
      );
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
          frames.push(row * columns + col);
          break;
        }
      }
    }
  }
  discoveredFrames = frames;
}

export function getSpriteFrames(): number[] {
  return discoveredFrames;
}

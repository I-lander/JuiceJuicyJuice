export const PARTICLE_ATLAS_KEY = 'particleAtlas';
export const PARTICLE_ATLAS_CELL_SIZE = 16;

let discoveredFrames: number[] = [];

export function discoverParticleFrames(scene: Phaser.Scene): void {
  const texture = scene.textures.get(PARTICLE_ATLAS_KEY);
  const sourceImage = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const columns = Math.floor(sourceImage.width / PARTICLE_ATLAS_CELL_SIZE);
  const rows = Math.floor(sourceImage.height / PARTICLE_ATLAS_CELL_SIZE);

  const canvas = document.createElement('canvas');
  canvas.width = PARTICLE_ATLAS_CELL_SIZE;
  canvas.height = PARTICLE_ATLAS_CELL_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  const frames: number[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      context.clearRect(0, 0, PARTICLE_ATLAS_CELL_SIZE, PARTICLE_ATLAS_CELL_SIZE);
      context.drawImage(
        sourceImage,
        col * PARTICLE_ATLAS_CELL_SIZE,
        row * PARTICLE_ATLAS_CELL_SIZE,
        PARTICLE_ATLAS_CELL_SIZE,
        PARTICLE_ATLAS_CELL_SIZE,
        0,
        0,
        PARTICLE_ATLAS_CELL_SIZE,
        PARTICLE_ATLAS_CELL_SIZE,
      );
      const { data } = context.getImageData(
        0,
        0,
        PARTICLE_ATLAS_CELL_SIZE,
        PARTICLE_ATLAS_CELL_SIZE,
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

export function getParticleFrames(): number[] {
  return discoveredFrames;
}

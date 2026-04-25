export const PARTICLE_ATLAS_KEY = 'particleAtlas';
export const PARTICLE_ATLAS_CELL_SIZE = 16;

let particleFrames: number[] = [];

export function setParticleFrames(frames: number[]): void {
  particleFrames = frames;
}

export function getParticleFrames(): number[] {
  return particleFrames;
}

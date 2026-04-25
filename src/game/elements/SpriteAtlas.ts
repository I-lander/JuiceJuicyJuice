export const SPRITE_ATLAS_KEY = 'spriteAtlas';
export const SPRITE_ATLAS_CELL_SIZE = 16;
export const TITLE_ORANGE_FRAME = 2 * 16 + 1;

let spriteFrames: number[] = [];

export function setSpriteFrames(frames: number[]): void {
  spriteFrames = frames;
}

export function getSpriteFrames(): number[] {
  return spriteFrames;
}

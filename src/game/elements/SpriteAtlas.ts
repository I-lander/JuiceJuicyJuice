import { createAtlasFromArray } from '../utils/utils';

export const spriteElements = [
  {
    id: 'tree',
    atlasObj: { x: 1, y: 0, w: 1, h: 1 },
  },
];

export const spriteAtlas = createAtlasFromArray(spriteElements);

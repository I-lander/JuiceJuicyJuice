import { createAtlasFromArray } from '../utils/utils';

export const spriteElements = [
  {
    id: 'smile',
    atlasObj: { x: 0, y: 0, w: 1, h: 1 },
  },
    {
    id: 'shit',
    atlasObj: { x: 1, y: 0, w: 1, h: 1 },
  },
    {
    id: 'fuck',
    atlasObj: { x: 2, y: 0, w: 1, h: 1 },
  },
    {
    id: 'flower',
    atlasObj: { x: 3, y: 0, w: 1, h: 1 },
  },
    {
    id: 'whale',
    atlasObj: { x: 4, y: 0, w: 1, h: 1 },
  },
    {
    id: 'pig',
    atlasObj: { x: 5, y: 0, w: 1, h: 1 },
  },
];

export const spriteAtlas = createAtlasFromArray(spriteElements);

import { createAtlasFromArray } from '../utils/utils';

export const uiAtlasElements = [
  {
    id: 'rightArrow',
    atlasObj: { x: 0, y: 0, w: 1, h: 1 },
  },
  {
    id: 'leftArrow',
    atlasObj: { x: 1, y: 0, w: 1, h: 1 },
  },
  {
    id: 'menuBtn',
    atlasObj: { x: 2, y: 0, w: 1, h: 1 },
  },
];

export const uiAtlas = createAtlasFromArray(uiAtlasElements);

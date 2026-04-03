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
  {
    id: 'ant',
    atlasObj: { x: 6, y: 0, w: 1, h: 1 },
  },
  {
    id: 'banana',
    atlasObj: { x: 7, y: 0, w: 1, h: 1 },
  },
  {
    id: 'ghost',
    atlasObj: { x: 8, y: 0, w: 1, h: 1 },
  },
  {
    id: 'tree',
    atlasObj: { x: 9, y: 0, w: 1, h: 1 },
  },
  {
    id: 'house',
    atlasObj: { x: 10, y: 0, w: 1, h: 1 },
  },
  {
    id: 'kiss',
    atlasObj: { x: 11, y: 0, w: 1, h: 1 },
  },
  {
    id: 'balloon',
    atlasObj: { x: 12, y: 0, w: 1, h: 1 },
  },
];

export const spriteAtlas = createAtlasFromArray(spriteElements);

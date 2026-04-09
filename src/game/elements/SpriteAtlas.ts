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
  {
    id: 'skull',
    atlasObj: { x: 13, y: 0, w: 1, h: 1 },
  },
  {
    id: 'diamond',
    atlasObj: { x: 14, y: 0, w: 1, h: 1 },
  },
  {
    id: 'bomb',
    atlasObj: { x: 15, y: 0, w: 1, h: 1 },
  },
  {
    id: 'crab',
    atlasObj: { x: 0, y: 1, w: 1, h: 1 },
  },
  {
    id: 'frog',
    atlasObj: { x: 1, y: 1, w: 1, h: 1 },
  },
  {
    id: 'pizza',
    atlasObj: { x: 2, y: 1, w: 1, h: 1 },
  },
  {
    id: 'apple',
    atlasObj: { x: 3, y: 1, w: 1, h: 1 },
  },
  {
    id: 'pineapple',
    atlasObj: { x: 4, y: 1, w: 1, h: 1 },
  },
  {
    id: 'bulblight',
    atlasObj: { x: 5, y: 1, w: 1, h: 1 },
  },
  {
    id: 'smartphone',
    atlasObj: { x: 6, y: 1, w: 1, h: 1 },
  },
  {
    id: 'snail',
    atlasObj: { x: 7, y: 1, w: 1, h: 1 },
  },
  {
    id: 'alien',
    atlasObj: { x: 8, y: 1, w: 1, h: 1 },
  },
  {
    id: 'monitor',
    atlasObj: { x: 9, y: 1, w: 1, h: 1 },
  },
  {
    id: 'clock',
    atlasObj: { x: 10, y: 1, w: 1, h: 1 },
  },
  {
    id: 'cherry',
    atlasObj: { x: 11, y: 1, w: 1, h: 1 },
  },
  {
    id: 'eye',
    atlasObj: { x: 12, y: 1, w: 1, h: 1 },
  },
  {
    id: 'bottle',
    atlasObj: { x: 13, y: 1, w: 1, h: 1 },
  },
  {
    id: 'devil',
    atlasObj: { x: 14, y: 1, w: 1, h: 1 },
  },
  {
    id: 'snowflake',
    atlasObj: { x: 15, y: 1, w: 1, h: 1 },
  },
  {
    id: 'star',
    atlasObj: { x: 0, y: 2, w: 1, h: 1 },
  },
  {
    id: 'orange',
    atlasObj: { x: 1, y: 2, w: 1, h: 1 },
  },
  {
    id: 'coin',
    atlasObj: { x: 2, y: 2, w: 1, h: 1 },
  },
  {
    id: 'sword',
    atlasObj: { x: 3, y: 2, w: 1, h: 1 },
  },
  {
    id: 'gun ',
    atlasObj: { x: 4, y: 2, w: 1, h: 1 },
  },
  {
    id: 'cat',
    atlasObj: { x: 5, y: 2, w: 1, h: 1 },
  },
  {
    id: 'heart',
    atlasObj: { x: 6, y: 2, w: 1, h: 1 },
  },
  {
    id: 'key',
    atlasObj: { x: 7, y: 2, w: 1, h: 1 },
  },
  {
    id: 'crown',
    atlasObj: { x: 8, y: 2, w: 1, h: 1 },
  },
  {
    id: 'potion',
    atlasObj: { x: 9, y: 2, w: 1, h: 1 },
  },
  {
    id: 'candle',
    atlasObj: { x: 10, y: 2, w: 1, h: 1 },
  },
  {
    id: 'bell',
    atlasObj: { x: 11, y: 2, w: 1, h: 1 },
  },
  {
    id: 'umbrella',
    atlasObj: { x: 12, y: 2, w: 1, h: 1 },
  },
  {
    id: 'rocket',
    atlasObj: { x: 13, y: 2, w: 1, h: 1 },
  },
  {
    id: 'camera',
    atlasObj: { x: 14, y: 2, w: 1, h: 1 },
  },
  {
    id: 'fire',
    atlasObj: { x: 15, y: 2, w: 1, h: 1 },
  },
  {
    id: 'note',
    atlasObj: { x: 0, y: 3, w: 1, h: 1 },
  },
  {
    id: 'lock',
    atlasObj: { x: 1, y: 3, w: 1, h: 1 },
  },
  {
    id: 'dice',
    atlasObj: { x: 2, y: 3, w: 1, h: 1 },
  },
  {
    id: 'hourglass',
    atlasObj: { x: 3, y: 3, w: 1, h: 1 },
  },
  {
    id: 'pencil',
    atlasObj: { x: 4, y: 3, w: 1, h: 1 },
  },
  {
    id: 'book',
    atlasObj: { x: 5, y: 3, w: 1, h: 1 },
  },
  {
    id: 'envelope',
    atlasObj: { x: 6, y: 3, w: 1, h: 1 },
  },
  {
    id: 'trophy',
    atlasObj: { x: 7, y: 3, w: 1, h: 1 },
  },
  {
    id: 'present',
    atlasObj: { x: 8, y: 3, w: 1, h: 1 },
  },
  {
    id: 'magicHat',
    atlasObj: { x: 9, y: 3, w: 1, h: 1 },
  },
  {
    id: 'anchor',
    atlasObj: { x: 10, y: 3, w: 1, h: 1 },
  },
  {
    id: 'chest',
    atlasObj: { x: 11, y: 3, w: 1, h: 1 },
  },
  {
    id: 'scissors',
    atlasObj: { x: 12, y: 3, w: 1, h: 1 },
  },
  {
    id: 'hammer',
    atlasObj: { x: 13, y: 3, w: 1, h: 1 },
  },
];

export const spriteAtlas = createAtlasFromArray(spriteElements);

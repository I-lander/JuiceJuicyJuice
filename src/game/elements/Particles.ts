import { Progression } from '../Progression';
import { createAtlasFromArray } from '../utils/utils';

export const particleElements = [
  {
    id: 'simple',
    atlasObj: { x: 0, y: 0, w: 1, h: 1 },
  },
  {
    id: 'star',
    atlasObj: { x: 1, y: 0, w: 1, h: 1 },
  },
  {
    id: 'big',
    atlasObj: { x: 2, y: 0, w: 1, h: 1 },
  },
];

export const particleAtlas = createAtlasFromArray(particleElements);

export const PARTICLE_FRAMES = particleElements.map((element) => element.id);

export const PARTICLE_CONFIG: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
  speed: { min: 0, max: 300 },
  angle: { min: 0, max: 360 },
  alpha: { start: 1, end: 0 },
  lifespan: Progression.particleLifetime,
  emitting: false,
  frame: PARTICLE_FRAMES,
};

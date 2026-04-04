import { spriteElements } from '../elements/SpriteAtlas';
import { Particle } from '../objects/Particle';
import { Progression } from '../Progression';
import { MainScene } from '../scenes/MainScene';
import { UIScene } from '../scenes/UIScene';
import { SPRITE_BASE_UNIT, toggleDebugGrid } from './utils';

export class EventHandler {
  mainScene: MainScene;
  uiScene: UIScene;
  mouseX: number;
  mouseY: number;
  isDraggingWorld: boolean = false;
  keyPressed: string[] = [];

  isPinching: boolean = false;
  pinchPrevDist: number = 0;
  pinchCenterX: number = 0;
  pinchCenterY: number = 0;

  minZoom: number = 0.5;
  maxZoom: number = 2.5;

  constructor(scene: MainScene) {
    this.mainScene = scene;
    this.uiScene = this.mainScene.scene.get('UIScene') as UIScene;
    this.mouseX = 0;
    this.mouseY = 0;

    this.init();
  }

  init() {
    this.mainScene.input.addPointer(2);

    this.mainScene.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      this.spawnParticles(pointer.worldX, pointer.worldY);
    });

    this.mainScene.input.on(Phaser.Input.Events.POINTER_UP, () => {});

    this.mainScene.input.keyboard?.on('keydown', (key: KeyboardEvent) => {
      if (import.meta.env.VITE_IS_DEV_SPLASH === 'true') {
        if (key.code === 'KeyG') {
          Progression.fragments = Infinity;
        }
        if (key.code === 'KeyH') {
          this.mainScene.spawnSprite(
            spriteElements[Math.floor(Math.random() * spriteElements.length)].id,
          );
        }
      }
    });

    this.mainScene.input.keyboard?.on('keyup', (key: KeyboardEvent) => {});
  }

  spawnParticles(x: number, y: number) {
    const aliveParticles = this.mainScene.getAliveParticleCount();
    const fragmentsToAdd = Math.min(
      Progression.upgradeLevels['particlesPerClick'] ?? 0,
      this.mainScene.maxParticlesPerClick - aliveParticles,
    );

    if (fragmentsToAdd <= 0) return;

    const particleScale = this.mainScene.tileSize / SPRITE_BASE_UNIT;
    let totalFragments = 0;
    for (let i = 0; i < fragmentsToAdd; i++) {
      const particle = new Particle(this.mainScene, x, y, particleScale);
      totalFragments += particle.fragmentsPerParticle;
      this.mainScene.particles.push(particle);
    }
    Progression.addFragments(totalFragments);
  }

  getTwoActivePointers(): Phaser.Input.Pointer[] | null {
    const pointers = [
      this.mainScene.input.pointer1,
      this.mainScene.input.pointer2,
      this.mainScene.input.pointer3,
    ];

    const down = pointers.filter((p) => p && p.isDown);
    return down.length >= 2 ? [down[0], down[1]] : null;
  }

  handlePinch(twoPointers: Phaser.Input.Pointer[]) {
    const cam = this.mainScene.cameras.main;
    const [p1, p2] = twoPointers;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);

    const centerX = (p1.x + p2.x) * 0.5;
    const centerY = (p1.y + p2.y) * 0.5;

    if (!this.isPinching) {
      this.isPinching = true;
      this.pinchPrevDist = dist;
      this.pinchCenterX = centerX;
      this.pinchCenterY = centerY;
      this.isDraggingWorld = false;
      return;
    }

    const scale = dist / this.pinchPrevDist;
    const oldZoom = cam.zoom;

    let newZoom = oldZoom * scale;
    newZoom = Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom);
    if (newZoom === oldZoom) return;

    const sx = centerX - cam.width * 0.5;
    const sy = centerY - cam.height * 0.5;

    cam.zoom = newZoom;

    cam.scrollX += sx / oldZoom - sx / newZoom;
    cam.scrollY += sy / oldZoom - sy / newZoom;

    this.pinchPrevDist = dist;
    this.pinchCenterX = centerX;
    this.pinchCenterY = centerY;
  }

  countActivePointers(): number {
    const pointers = [
      this.mainScene.input.pointer1,
      this.mainScene.input.pointer2,
      this.mainScene.input.pointer3,
    ];
    return pointers.filter((p) => p && p.isDown).length;
  }

  update() {
    const twoPointers = this.getTwoActivePointers();
    if (twoPointers) {
      this.handlePinch(twoPointers);
    } else if (this.isPinching && this.countActivePointers() === 0) {
      this.isPinching = false;
    }

    if (this.keyPressed.includes('up')) this.mainScene.cameras.main.scrollY -= 10;
    if (this.keyPressed.includes('down')) this.mainScene.cameras.main.scrollY += 10;
    if (this.keyPressed.includes('left')) this.mainScene.cameras.main.scrollX -= 10;
    if (this.keyPressed.includes('right')) this.mainScene.cameras.main.scrollX += 10;
  }
}

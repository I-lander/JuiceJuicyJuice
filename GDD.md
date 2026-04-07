# Please Dont Break Me — Game Design Document

> **Version**: 2.0
> **Date**: 2026-04-04
> **Status**: In development (Phase 1-2)

---

## 1. Vision & Pitch

**Genre**: Idle / Incremental clicker
**Platform**: Web (browser) + Android (Capacitor) — landscape 16:9
**Engine**: Phaser 3 (WebGL)
**Art style**: Retro pixel art (32x32)
**Tone**: Sarcastic / 4th wall breaking — the game comments on the player's actions as if it's suffering

> _"A game that BEGS you not to break it. You're going to break it anyway."_

The player must literally "break" the game by making a simulated FPS counter drop below progressive thresholds. The visual chaos on screen IS the progression. Under the hood, the game **always runs at real 60 FPS**.

---

## 2. Core Loop

```
Click on screen
    -> Spawns particles (number = Particles/Click level)
        -> Each particle = Juice (currency, amount depends on particle color)
            -> Level up (XP bar based on total Juice earned)
                -> New upgrades unlock at each level
                    -> Sprites, movement, bounce, collisions, rotation...
                        -> Passive Juice generation (rates per sprite)
                            -> More CPU usage on the "system"
                                -> Simulated FPS drops
                                    -> EVEN more chaos
                                        -> CRASH -> Prestige -> Restart with permanent talents
```

The loop is infinite: each prestige strengthens the player through a talent tree, allowing faster and deeper chaos.

---

## 3. Economy

### 3.1 Main currency: Juice

- **Click-based income**: clicking spawns particles, each particle grants Juice based on its color tier
- **Passive income via rates**: each sprite generates Juice/s through multiple rate channels:
  - **Sprite rate**: base passive generation per sprite
  - **Bounce rate**: earned when bounce is unlocked, per sprite
  - **Movement rate**: earned when movement is unlocked, per sprite
  - **Rotation rate**: earned when rotation is unlocked, per sprite
- Rates are upgradeable (+0.1/s per level)
- The visual chaos on screen directly corresponds to revenue: the more it explodes, the more you earn

### 3.2 Level system

- Total Juice earned determines the player's level
- Juice required per level follows an exponential curve:
  ```
  juiceForLevel(level) = floor(10 * 1.4 ^ (level - 1))
  ```
- Each level unlocks new upgrades in the shop (via `levelToUnlock`)
- The level and XP bar are displayed in the shop panel

### 3.3 Prestige currency: Glitch Points (planned)

- Earned when prestiging, based on total accumulated CPU usage
- Invested in the permanent talent tree (persists between runs)
- Formula:
  ```
  glitchPoints = floor(sqrt(totalCpuAtCrash / 100))
  ```

---

## 4. CPU System & Simulated FPS

CPU usage is the game's central metric. It represents the "load" the player imposes on the fake system.

### 4.1 CPU sources

CPU usage is recalculated every frame based on all active elements on screen.

| Source             | CPU per unit      |
| ------------------ | ----------------- |
| Sprite on screen   | +1.0              |
| Alive particle     | +0.3              |
| Active tween/anim  | +0.5              |
| Moving sprite      | +0.5 (additional) |
| Rotating sprite    | +0.7 (additional) |
| Active autoclicker | +0.2              |
| Collision event    | +0.8 (decaying)   |
| Active shader      | +2.0              |
| Active UI parasite | +1.5              |
| CPU multiplier     | x factor          |

Collision CPU is additive and decays over time (exponential decay at rate 1/s).

### 4.2 Simulated FPS formula

```
simulatedFPS = 60 / (1 + totalCpu * cpuCoefficient)
```

Calibration with `cpuCoefficient` ~ 0.002:

| Total CPU | Simulated FPS |
| --------- | ------------- |
| 0         | 60            |
| ~500      | 30            |
| ~2,000    | 15            |
| ~6,000    | 5             |
| ~12,000   | 1             |

> Exact values will be adjusted through playtesting.

### 4.3 Progressive fake lag layers

The game simulates performance degradation through successive layers. Order matters: each layer stacks on top of the previous ones.

| Simulated FPS | Visual layer                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------- |
| 60 - 45       | Nothing. Everything is smooth.                                                                      |
| 45 - 30       | Slight sprite slowdown. Occasional micro-stutters (~50ms pauses)                                    |
| 30 - 20       | Choppy animations. Visible frame skipping. FPS counter turns **yellow**                             |
| 20 - 10       | Visual glitches (chromatic aberration, unstable scanlines). Sprites "teleporting" between positions |
| 10 - 5        | Simulated screen tearing. Freeze frames (200-500ms). Counter turns **red**                          |
| 5 - 1         | Near-total freeze. Massive artifacts. Screen "shaking"                                              |
| < 1           | **CRASH**: black screen, fake error message, prestige available                                     |

---

## 5. Progression & Unlocks

Upgrades are unlocked by player level (based on total Juice earned). The shop uses two tabs: **Upgrades** (multi-level) and **Unlocks** (single-purchase). Single-purchase unlocks disappear from the shop once bought.

### 5.1 Upgrades tab (multi-level)

| Upgrade          | Effect                            | Max Level | Base Cost | Growth | Unlock Level |
| ---------------- | --------------------------------- | --------- | --------- | ------ | ------------ |
| Particles/Click  | +1 particle per click             | 100       | 10        | x1.25  | 0            |
| Autoclicker      | +1 autoclicker                    | 100       | 50        | x1.5   | 5            |
| Cooldown -       | -100ms autoclicker cooldown       | 25        | 75        | x1.45  | 7            |
| Add Sprite       | +1 random sprite on screen        | 100       | 100       | x1.3   | 10           |
| Sprite Rate +    | +0.1 Juice/s per sprite           | 25        | 150       | x1.4   | 11           |
| Bounce Rate +    | +0.1 Juice/s per sprite (bounce)  | 25        | 1,200     | x1.4   | 16           |
| Movement Rate +  | +0.1 Juice/s per sprite (move)    | 25        | 6,000     | x1.4   | 21           |
| Rotation Rate +  | +0.1 Juice/s per sprite (rotate)  | 25        | 180,000   | x1.4   | 31           |

### 5.2 Unlocks tab (single-purchase)

| Upgrade           | Effect                                    | Cost        | Unlock Level |
| ----------------- | ----------------------------------------- | ----------- | ------------ |
| Bounce            | Sprites bounce (scale tween on edges)     | 800         | 15           |
| Movement          | Sprites move and bounce off edges         | 4,000       | 20           |
| Bounce Particles  | Particles spawn on wall/sprite collisions | 10,000      | 23           |
| Collision         | Sprites collide with each other           | 25,000      | 25           |
| Rotation          | Sprites rotate on themselves              | 120,000     | 30           |

### 5.3 Particle colors (single-purchase unlocks)

Each color unlocked adds to the random color pool. Higher-tier colors grant more Juice per particle.

| Color  | Juice/particle | Cost            | Unlock Level |
| ------ | -------------- | --------------- | ------------ |
| White  | x1             | (default)       | 0            |
| Yellow | x2             | 300             | 12           |
| Red    | x3             | 20,000          | 22           |
| Blue   | x5             | 3,500,000       | 38           |
| Green  | x8             | 1,500,000,000   | 52           |
| Purple | x13            | 800,000,000,000 | 65           |

### 5.4 Cost formula

```
cost(level) = floor(baseCost * growthFactor ^ level)
```

---

## 6. Sprite behaviors

Sprites are pixel art from a shared sprite atlas. Each sprite has:

- **Position**: random spawn within the game area
- **Speed**: 100-150 px/s (random at creation)
- **Velocity**: random direction normalized
- **Rotation speed**: 0.5-2.0 rad/s (random direction)
- **Scale**: tileSize / SPRITE_BASE_UNIT

Behaviors are layered (each requires its unlock):

1. **Base**: static sprite on screen, generates passive Juice at sprite rate
2. **Bounce**: scale tween animation (+20% bounce), generates Juice at bounce rate
3. **Movement**: sprites move with velocity, bounce off screen edges, generates Juice at movement rate, edge bounces grant +1 Juice
4. **Bounce Particles**: 3-5 small particles spawn on wall collisions and sprite collisions
5. **Collision**: sprites physically collide with elastic collision physics, each collision adds +0.8 decaying CPU
6. **Rotation**: sprites spin, generates Juice at rotation rate

---

## 7. Particle system

Particles are custom GameObjects (not Phaser emitters):

- **Lifespan**: 500ms
- **Velocity**: random angle, 100-400 px/s
- **Visual**: random frame from particle atlas, tinted by color
- **Scale**: eased fade-out (cubic ease-out over lifespan)
- **Juice**: granted on spawn, not on death
- **Color**: randomly picked from unlocked color pool
- **Max particles**: 500 alive at once (click spawn capped)

---

## 8. Prestige system (planned)

### 8.1 Trigger

- Available when simulated FPS drops below 1 (the "crash")
- The player **chooses** to prestige (not automatic)
- **Reset**: all upgrades, sprites, Juice set to zero
- **Kept**: earned Glitch Points + talent tree progress + prestige counter

### 8.2 Talent tree — 3 branches

The talent tree is permanent and persists between runs. Each node costs an increasing number of Glitch Points. The player can't max everything quickly and must choose their strategy.

#### Chaos branch (red) — sprites & raw CPU

| Node             | Effect                            |
| ---------------- | --------------------------------- |
| Starting sprites | Begin the run with X free sprites |
| Base CPU +       | +10% CPU per sprite per node      |
| Premium sprites  | Unlock animated sprites           |
| Sprite cap +     | Increases max sprite count        |
| Giant sprites    | x2 sprite size, x3 CPU            |

#### Automation branch (blue) — autoclickers & speed

| Node             | Effect                                       |
| ---------------- | -------------------------------------------- |
| Free autoclicker | 1 autoclicker available from run start       |
| Base cooldown -  | -10% autoclicker cooldown per node           |
| Double clicks    | Each click (manual or auto) counts as double |
| Multi-target +   | Autoclickers target +1 sprite per node       |
| Juice bonus      | +20% Juice per particle per node             |

#### Corruption branch (green) — visual effects & shaders

| Node               | Effect                            |
| ------------------ | --------------------------------- |
| Free shader        | 1 shader active from run start    |
| Effect intensity + | +15% visual intensity per node    |
| Shader CPU x       | x1.5 CPU from shaders per node    |
| Early UI parasites | UI parasites available earlier    |
| Secret effect      | Unique new visual effect per node |

---

## 9. User interface

### 9.1 Main layout (landscape 16:9)

```
+----------------------------------------------------------+
|                                      [FPS: 47  CPU: 523] |  <- Top-right HUD
|                                                           |
|                                                           |
|                 MAIN GAME AREA                            |
|            (sprites + particles + chaos)                   |
|                                                           |
|                                                           |
+----------------------------------------------------------+
```

The left panel is always visible (not collapsible).

### 9.2 Left panel (shop)

```
+----------------+------------------------------------------+
| 1,234          |                                          |
| Lv.12  450/630 |                                          |
| [====----]     |                                          |
|                |                                          |
| [Upgrades][Unlocks]        GAME AREA                     |
|                |        (camera viewport)                 |
| Particles/Click|                                          |
|   1  (1/100)  |                                          |
|   Cost: 13    |                                          |
|                |                                          |
| Add Sprite     |                                          |
|   3  (3/100)  |                                          |
|   Cost: 220   |                                          |
|                |                                          |
|  [scrollbar]  |                                          |
+----------------+------------------------------------------+
```

### 9.3 UI elements

| Element              | Behavior                                                       |
| -------------------- | -------------------------------------------------------------- |
| FPS + CPU counter    | Top-right HUD. Dynamic color: green > yellow > orange > red    |
| Juice counter        | In shop panel, large yellow text                               |
| Level + XP bar       | In shop panel, shows current level and progress to next        |
| Tabs                 | Upgrades / Unlocks toggle, active tab highlighted              |
| Upgrade buttons      | Show name, current value, level/max, cost. Green if affordable |
| Scrollbar            | Visible when content exceeds panel height                      |
| Unlock notifications | Bottom-right toast: "New: [upgrade name]", fades after 2s      |

---

## 10. 4th wall narrative (planned)

The game has a "personality": it suffers from what the player does. Messages appear at key moments.

### Milestone messages

| Trigger             | Message                                                       |
| ------------------- | ------------------------------------------------------------- |
| First sprite bought | _"Just one sprite? That's cute."_                             |
| 10 sprites          | _"Okay, it's getting crowded in here."_                       |
| First movement      | _"Oh no, they're moving now..."_                              |
| First particles     | _"Seriously? You know each particle costs me energy, right?"_ |
| FPS < 30            | _"Is it... is it lagging? Is that normal?"_                   |
| FPS < 10            | _"I'M BEGGING YOU, STOP"_                                     |
| FPS < 5             | _"i... can't... anymore..."_                                  |
| Crash (< 1 FPS)     | _"..."_                                                       |
| Prestige            | _"Oh, starting over? You have no mercy."_                     |
| 2nd prestige        | _"Again?! What did I ever do to you?"_                        |
| 5th prestige        | _"You know what? Make yourself at home."_                     |
| 10th prestige       | _"... I don't feel anything anymore."_                        |

### Random in-game messages

Pool of sarcastic messages that appear from time to time during gameplay:

- _"You could go play a NORMAL game, you know?"_
- _"My GPU is making weird noises..."_
- _"Is that smoke I see?"_
- _"Reminder: no sprites were harmed during this session. Probably."_
- _"Someone told me games are supposed to be fun. For the PLAYER."_

---

## 11. Save system (planned)

- **Auto-save** every 30 seconds to `localStorage`
- Saved data:
  - Current Juice
  - All upgrade levels
  - Player level + total Juice earned
  - Total Glitch Points
  - Talent tree (unlocked nodes)
  - Prestige count
  - Statistics (total Juice earned, total sprites bought, etc.)
- Corrupt save detection with sarcastic message:
  - _"Your save file is corrupted. Just like your soul."_
  - Fallback: clean reset

---

## 12. Endgame

There is **no true ending**. The game is an infinite loop:

- Each prestige makes the player stronger
- CPU required to reach each milestone scales with each prestige
- New cosmetic content and messages unlock over successive prestiges
- Player goal: optimize talent tree strategy to reach crash as fast as possible
- Potential leaderboard: "fastest crash time" per prestige number

---

## 13. Technical stack

### Active files

| File                                | Role                                                  |
| ----------------------------------- | ----------------------------------------------------- |
| `src/game/Progression.ts`          | Game state: Juice, CPU, levels, upgrades, all stats   |
| `src/game/objects/ShopUpgrades.ts` | Upgrade definitions, costs, particle color definitions |
| `src/game/objects/Shop.ts`         | Shop UI: tabs, scrolling, buttons, XP bar             |
| `src/game/objects/Sprite.ts`       | Sprite behavior: movement, bounce, collision, rotation, passive Juice generation |
| `src/game/objects/Particle.ts`     | Custom particle: lifespan, velocity, color, scale fade |
| `src/game/scenes/MainScene.ts`     | Game area: sprites, particles, autoclickers, CPU calc  |
| `src/game/scenes/UIScene.ts`       | HUD + left panel + notifications                      |
| `src/game/scenes/LoadingScene.ts`  | Asset loading                                         |
| `src/game/utils/EventHandler.ts`   | Click handling, particle spawning, debug keys          |
| `src/game/utils/utils.ts`          | Graphics utilities, UI panel drawing                  |
| `src/game/shaders/CrtShader.ts`    | CRT shader (scanlines, aberration)                    |
| `src/game/elements/SpriteAtlas.ts` | Sprite atlas frame definitions                        |
| `src/game/elements/Particles.ts`   | Particle atlas frame list                             |

### Files to create (future)

| File                               | Role                                             |
| ---------------------------------- | ------------------------------------------------ |
| `src/game/PrestigeTree.ts`         | Talent tree, Glitch Points, nodes                |
| `src/game/shaders/GlitchShader.ts` | Screen tearing / glitch shader                   |

---

## 14. Implementation phases

### Phase 1 — Playable MVP [DONE]

1. Progression system (Juice, levels, CPU)
2. Clickable screen + particles + Juice
3. Shop panel with tabs (Upgrades / Unlocks)
4. Sprites + movement + bounce + collision + rotation
5. Simulated FPS counter + HUD

### Phase 2 — Economy depth [IN PROGRESS]

6. Passive Juice rates (sprite/bounce/movement/rotation)
7. Particle color tiers (white -> yellow -> red -> blue -> green -> purple)
8. Autoclickers + cooldown reduction
9. Unlock notifications
10. CRT shader

### Phase 3 — Visual chaos

11. Dynamic shaders (aberration, distortion, bloom)
12. CPU multipliers
13. UI parasites
14. 4th wall messages
15. Fake lag visual layers

### Phase 4 — Meta-progression

16. Prestige system (crash -> reset -> Glitch Points)
17. Talent tree (3 branches)
18. Inter-prestige scaling
19. Save/Load localStorage

### Phase 5 — Polish

20. Sound & feedback
21. Mobile polish (touch, performance)
22. Balancing through playtesting
23. Additional messages and content

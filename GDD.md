# Please Dont Break Me — Game Design Document

> **Version**: 1.0
> **Date**: 2026-04-01
> **Status**: Pre-production

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
Click on sprites
    -> Generates particles
        -> Each particle = Fragments (currency)
            -> Buy upgrades (+ sprites, movement, particles, autoclickers...)
                -> More CPU usage on the "system"
                    -> Simulated FPS drops
                        -> New milestones unlocked
                            -> New upgrade categories
                                -> EVEN more chaos
                                    -> CRASH -> Prestige -> Restart with permanent talents
```

The loop is infinite: each prestige strengthens the player through a talent tree, allowing faster and deeper chaos.

---

## 3. Economy

### 3.1 Main currency: Fragments

- Each **generated particle** grants X Fragments
- Gain per particle can be improved through upgrades
- No passive income by default: you must click (or have autoclickers)
- The visual chaos on screen directly corresponds to revenue: the more it explodes, the more you earn

### 3.2 Prestige currency: Glitch Points

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

| Source               | CPU per unit      |
| -------------------- | ----------------- |
| Sprite on screen     | +1.0              |
| Alive particle       | +0.3              |
| Active tween/anim    | +0.5              |
| Moving sprite        | +0.5 (additional) |
| Active autoclicker   | +0.2              |
| Active shader/effect | +2.0              |
| Active UI parasite   | +1.5              |
| CPU multiplier       | x factor          |

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

## 5. Progression milestones

Each FPS milestone unlocks a **new upgrade category** in the shop. This is the core progression gate.

| #   | FPS threshold | Unlocked category           | 4th wall comment                                                                    |
| --- | ------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| 1   | Start (60)    | **Sprites**                 | _"Welcome! You wouldn't hurt a fly, would you?"_                                    |
| 2   | < 50 FPS      | **Movement**                | _"Oh no, they're moving now..."_                                                    |
| 3   | < 30 FPS      | **Particles**               | _"Particles?! You know those are expensive on the GPU, right?"_                     |
| 4   | < 20 FPS      | **Autoclickers**            | _"You don't even need to click anymore. Beautiful, the automation of destruction."_ |
| 5   | < 10 FPS      | **Shaders & effects**       | _"Please... not the shaders..."_                                                    |
| 6   | < 5 FPS       | **CPU multipliers**         | _"I... I'm not feeling so good."_                                                   |
| 7   | < 1 FPS       | **UI parasites** + Prestige | _"FATAL ERROR -- Fine, you win. Try again if you dare."_                            |

---

## 6. Upgrade categories

Each upgrade has **25 levels** with increasing cost (except binary unlocks). Cost follows an exponential curve:

```
cost(level) = baseCost * growthFactor ^ level
```

### 6.1 Sprites (available from start)

Pixel art sprites that appear on screen. Each type has increasing cost.

| Upgrade                       | Effect               | Type   | Base cost | CPU/unit |
| ----------------------------- | -------------------- | ------ | --------- | -------- |
| Basic sprite (8x8 square)     | +1 sprite on screen  | 25 lvl | 10        | 1.0      |
| Medium sprite (16x16 circle)  | +1 sprite, CPU x1.5  | 25 lvl | 50        | 1.5      |
| Complex sprite (16x16 star)   | +1 sprite, CPU x2    | 25 lvl | 200       | 2.0      |
| Rare sprite (32x32 pixel art) | +1 sprite, CPU x3    | 25 lvl | 1,000     | 3.0      |

### 6.2 Movement (unlocked < 50 FPS)

| Upgrade         | Effect                                       | Type      |
| --------------- | -------------------------------------------- | --------- |
| Random movement | Sprites move in a random walk                | Unlock x1 |
| Speed           | +10% movement speed per level                | 25 lvl    |
| Edge bounce     | Sprites bounce off edges instead of wrapping | Unlock x1 |
| Rotation        | Sprites spin on themselves (+speed/lvl)      | 25 lvl    |

### 6.3 Particles (unlocked < 30 FPS)

| Upgrade         | Effect                            | Type      |
| --------------- | --------------------------------- | --------- |
| Basic particles | Enables particles on sprite click | Unlock x1 |
| Particle count  | +2 particles per click per level  | 25 lvl    |
| Lifespan        | Particles live longer (+CPU)      | 25 lvl    |
| Particle size   | Bigger particles (+visual)        | 25 lvl    |
| Colors          | Random multicolored particles     | Unlock x1 |

### 6.4 Autoclickers (unlocked < 20 FPS)

| Upgrade            | Effect                                 | Type      |
| ------------------ | -------------------------------------- | --------- |
| Basic autoclicker  | Auto-clicks 1 random sprite every 2s   | Unlock x1 |
| Extra autoclickers | +1 autoclicker                         | 25 lvl    |
| Cooldown reduction | -5% cooldown per level                 | 25 lvl    |
| Multi-click        | Each autoclicker targets +1 sprite/lvl | 25 lvl    |

### 6.5 Shaders & visual effects (unlocked < 10 FPS)

| Upgrade              | Effect                              | Type   |
| -------------------- | ----------------------------------- | ------ |
| Chromatic aberration | RGB offset across the entire screen | 25 lvl |
| Thick scanlines      | More intense CRT scan lines         | 25 lvl |
| Bloom / Glow         | Light halo around sprites           | 25 lvl |
| Distortion           | Screen wave/ripple effect           | 25 lvl |

### 6.6 CPU multipliers (unlocked < 5 FPS)

| Upgrade      | Effect                      | Type   |
| ------------ | --------------------------- | ------ |
| Sprite CPU   | x1.1 sprite CPU per level   | 25 lvl |
| Particle CPU | x1.1 particle CPU per level | 25 lvl |
| Global CPU   | +5% total CPU per level     | 25 lvl |

### 6.7 UI parasites (unlocked < 1 FPS / post-crash)

| Upgrade              | Effect                                | Type          |
| -------------------- | ------------------------------------- | ------------- |
| Fake error popups    | Random "Error" popups on screen       | 25 lvl (freq) |
| Fake notifications   | _"Your GPU is on fire!"_ and variants | 25 lvl        |
| Debug console        | Fake scrolling console text           | Unlock x1     |
| Infinite loading bar | Permanent fake loading bar            | Unlock x1     |

---

## 7. Prestige system

### 7.1 Trigger

- Available when simulated FPS drops below 1 (the "crash")
- The player **chooses** to prestige (not automatic)
- **Reset**: all upgrades, sprites, fragments set to zero
- **Kept**: earned Glitch Points + talent tree progress + prestige counter

### 7.2 Talent tree — 3 branches

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
| Fragment bonus   | +20% fragments per particle per node         |

#### Corruption branch (green) — visual effects & shaders

| Node               | Effect                            |
| ------------------ | --------------------------------- |
| Free shader        | 1 shader active from run start    |
| Effect intensity + | +15% visual intensity per node    |
| Shader CPU x       | x1.5 CPU from shaders per node    |
| Early UI parasites | UI parasites available earlier    |
| Secret effect      | Unique new visual effect per node |

---

## 8. User interface

### 8.1 Main layout (landscape 16:9)

```
+----------------------------------------------------------+
|  [FPS: 47]     [Fragments: 1,234]     [CPU: 523]        |  <- Top HUD
|                                                           |
|                                                           |
|                 MAIN GAME AREA                            |
|            (sprites + particles + chaos)                   |
|                                                           |
|                                                           |
|                                                   [SHOP>] |  <- Toggle
+----------------------------------------------------------+
```

### 8.2 Shop panel expanded

```
+--------------------------------------+--------------------+
|  [FPS: 47]  [Frag: 1,234]           |      SHOP          |
|                                      |                    |
|                                      |  > Sprites         |
|                                      |    - Basic    x3   |
|        GAME AREA                     |    - Medium   x1   |
|        (shrunk ~70%)                 |                    |
|                                      |  > Movement        |
|                                      |    - Speed  Lv.5   |
|                                      |                    |
|                                      |  > Particles       |
|                                      |    [LOCKED < 30fps]|
|                                      |                    |
|                                  [<] |  [PRESTIGE]        |
+--------------------------------------+--------------------+
```

### 8.3 UI elements

| Element           | Behavior                                                       |
| ----------------- | -------------------------------------------------------------- |
| FPS counter       | Large, prominent. Dynamic color: green > yellow > orange > red |
| Fragments         | Counter with gain animation (numbers floating up)              |
| CPU               | Gauge or raw number                                            |
| Shop button       | Toggles the side panel (collapsible)                           |
| Locked categories | Greyed out with required FPS threshold displayed, padlock icon |
| Prestige button   | Only appears when crash is reached                             |
| 4th wall messages | Text zone at bottom or overlay, temporary appearance           |

---

## 9. 4th wall narrative

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

## 10. Save system

- **Auto-save** every 30 seconds to `localStorage`
- Saved data:
  - Current fragments
  - All upgrade levels (per category)
  - Unlocked FPS milestones
  - Total Glitch Points
  - Talent tree (unlocked nodes)
  - Prestige count
  - Statistics (total fragments earned, total sprites bought, etc.)
- Corrupt save detection with sarcastic message:
  - _"Your save file is corrupted. Just like your soul."_
  - Fallback: clean reset

---

## 11. Endgame

There is **no true ending**. The game is an infinite loop:

- Each prestige makes the player stronger
- CPU required to reach each milestone scales with each prestige
- New cosmetic content and messages unlock over successive prestiges
- Player goal: optimize talent tree strategy to reach crash as fast as possible
- Potential leaderboard: "fastest crash time" per prestige number

---

## 12. Technical stack

### Files to create

| File                               | Role                                                     |
| ---------------------------------- | -------------------------------------------------------- |
| `src/game/GameState.ts`            | Singleton game state (fragments, CPU, upgrades, save)    |
| `src/game/ShopData.ts`             | Definitions for 7 categories, costs, effects, text       |
| `src/game/FpsSimulator.ts`         | Simulated FPS calculation, fake lag layer management     |
| `src/game/PrestigeTree.ts`         | Talent tree, Glitch Points, nodes                        |
| `src/game/shaders/GlitchShader.ts` | Screen tearing / glitch shader                           |

### Files to rewrite

| File                              | Changes                                             |
| --------------------------------- | --------------------------------------------------- |
| `src/game/scenes/MainScene.ts`    | Game area: sprites, particles, clicks, autoclickers |
| `src/game/scenes/UIScene.ts`      | HUD + collapsible shop + 4th wall messages          |
| `src/game/scenes/LoadingScene.ts` | Procedural pixel art texture generation             |
| `src/game/shaders/CrtShader.ts`   | Dynamic parameters (aberration, distortion)         |

### Files to delete

| File                             | Reason                                |
| -------------------------------- | ------------------------------------- |
| `src/game/GameManager.ts`        | Replaced by GameState                 |
| `src/game/utils/EventHandler.ts` | No longer needed (no camera pan/zoom) |

### Files kept as-is

- `src/main.ts` — Capacitor entry point
- `src/game/main.ts` — Phaser config
- `src/game/customClasses/CustomScene.ts` — Base scene class
- `src/game/utils/utils.ts` — Graphics utilities

---

## 13. Implementation phases

### Phase 1 — Playable MVP

1. GameState + FpsSimulator
2. Clickable sprites + basic particles + Fragments
3. Collapsible shop with Sprites + Movement + Particles
4. Simulated FPS counter + milestone unlocks
5. Fake lag visual layers (at least first 3)

### Phase 2 — Full gameplay

6. Autoclickers
7. Dynamic shaders (aberration, distortion, bloom)
8. CPU multipliers
9. UI parasites
10. 4th wall messages

### Phase 3 — Meta-progression

11. Prestige system (crash -> reset -> Glitch Points)
12. Talent tree (3 branches)
13. Inter-prestige scaling
14. Save/Load localStorage

### Phase 4 — Polish

15. Sound & feedback (optional)
16. Mobile polish (touch, performance)
17. Balancing through playtesting
18. Additional messages and content

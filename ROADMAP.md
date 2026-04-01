# Roadmap — Please Don't Break Me

> **Derniere mise a jour** : 2026-04-01
> **Basee sur** : GDD v1.0

---

## Etat actuel du projet

Le projet dispose d'un squelette Phaser 3 fonctionnel (Capacitor, Vite, WebGL) issu d'un ancien concept (cycle jour/nuit, camera pan/zoom). Le GDD demande une refonte complete de la logique de jeu.

### Fichiers existants a conserver

- `src/main.ts` — Point d'entree Capacitor
- `src/game/main.ts` — Config Phaser
- `src/game/customClasses/CustomScene.ts` — Classe de base des scenes
- `src/game/utils/utils.ts` — Utilitaires graphiques
- `src/game/shaders/CrtShader.ts` — Shader CRT (a rendre dynamique)

### Fichiers a supprimer

- `src/game/GameManager.ts` — Remplace par GameState
- `src/game/utils/EventHandler.ts` — Pan/zoom inutile (vue fixe)

### Fichiers a creer

- `src/game/GameState.ts` — Singleton etat du jeu
- `src/game/ShopData.ts` — Definitions des 7 categories d'upgrades
- `src/game/FpsSimulator.ts` — Calcul FPS simule + layers de fake lag
- `src/game/PrestigeTree.ts` — Arbre de talents + Glitch Points
- `src/game/shaders/GlitchShader.ts` — Shader screen tearing / glitch

---

## Phase 0 — Nettoyage & fondations

- [x] **0.1** Supprimer `GameManager.ts` et `EventHandler.ts`
- [x] **0.2** Creer `GameState.ts` — singleton : fragments, stress, upgrades, prestige count, save/load
- [x] **0.3** Creer `ShopData.ts` — 7 categories, couts (`baseCost * growthFactor^level`), effets, textes 4th wall
- [x] **0.4** Creer `FpsSimulator.ts` — formule `simulatedFPS = 60 / (1 + stress * 0.002)` + gestion layers

---

## Phase 1 — MVP jouable

- [x] **1.1** `LoadingScene.ts` — Chargement atlas sprites + generation texture particule
- [x] **1.2** `MainScene.ts` — Sprites cliquables qui apparaissent sur le game area
- [x] **1.3** `MainScene.ts` — Systeme de particules au clic → gain de Fragments
- [x] **1.4** `UIScene.ts` — HUD : compteur FPS (colore dynamiquement), Fragments, Stress
- [x] **1.5** `UIScene.ts` — Shop collapsible (panneau lateral droit) avec 7 categories
- [x] **1.6** `GameState.ts` + `UIScene.ts` — Milestones FPS → deblocage progressif des categories
- [x] **1.7** `FpsSimulator.ts` + `MainScene.ts` — Fake lag layers (freeze frames, screen shake, speed factor)

**Objectif** : une boucle jouable click → particles → fragments → buy sprites → stress monte → FPS baisse → nouvelles categories.

---

## Phase 2 — Gameplay complet

- [ ] **2.1** Autoclickers (clic auto sur sprite aleatoire, cooldown, multi-target)
- [ ] **2.2** Shaders dynamiques — aberration chromatique parametrique, distortion, bloom (`CrtShader.ts` + nouveau `GlitchShader.ts`)
- [ ] **2.3** Stress multipliers (categorie shop)
- [ ] **2.4** UI parasites — faux popups d'erreur, fausse console, barre de chargement infinie
- [ ] **2.5** Messages 4th wall — triggers sur milestones + pool aleatoire en jeu
- [ ] **2.6** Fake lag layers avances — screen tearing, freeze frames (200-500ms), screen shake, artefacts massifs

**Objectif** : toutes les 7 categories d'upgrades fonctionnelles, chaos visuel complet jusqu'au crash.

---

## Phase 3 — Meta-progression

- [ ] **3.1** Crash screen — ecran noir + faux message d'erreur quand FPS < 1
- [ ] **3.2** Prestige system — reset → Glitch Points via `floor(sqrt(totalStress / 100))`
- [ ] **3.3** `PrestigeTree.ts` — Arbre de talents 3 branches (Chaos / Automation / Corruption)
- [ ] **3.4** `UIScene.ts` — UI de l'arbre de talents (selection de noeuds, cout en Glitch Points)
- [ ] **3.5** Scaling inter-prestige — stress requis pour chaque milestone augmente a chaque prestige
- [ ] **3.6** Save/Load `localStorage` — auto-save 30s, detection de corruption avec message sarcastique

**Objectif** : boucle infinie prestige → talents → chaos plus rapide → prestige.

---

## Phase 4 — Polish

- [ ] **4.1** Sons & feedbacks (optionnel — clicks, particules, milestones, crash)
- [ ] **4.2** Polish mobile (touch zones, performance Capacitor, orientation forcee)
- [ ] **4.3** Balancing par playtesting (ajuster `stressCoefficient`, couts, growth factors)
- [ ] **4.4** Contenu additionnel (messages sarcastiques, sprites cosmetiques, dialogues multi-prestige)

---

## Ordre de dev recommande

```
Phase 0 :  0.2 → 0.3 → 0.4  (moteur du jeu)
           0.1               (nettoyage, en parallele)

Phase 1 :  1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7

Phase 2 :  2.1 → 2.5 → 2.2 → 2.6 → 2.3 → 2.4

Phase 3 :  3.1 → 3.2 → 3.6 → 3.3 → 3.4 → 3.5

Phase 4 :  4.3 → 4.1 → 4.2 → 4.4
```

La priorite est d'avoir la boucle de jeu jouable (Phase 0 + Phase 1) le plus vite possible pour iterer sur le balancing.

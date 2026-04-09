# Guide : Creer une boucle musicale 16-bit pour un jeu fun

## 1. Structure d'une bonne boucle 16-bit

### Anatomy

- **Intro courte** (optionnelle, jouee une seule fois)
- **Corps principal** qui boucle, organise en 2 a 4 sections contrastees (A/B ou A/B/A/C)
- **Pas de conclusion** : le morceau revient au debut de maniere imperceptible

### Duree recommandee

| Contexte | Duree ideale |
|----------|-------------|
| Minimum absolu | 20 secondes |
| Combat standard | 40-60 secondes |
| Exploration / ville | 1-3 minutes |
| Boss | Prevoir ~2 boucles avant fin du combat |
| Cible generale | 40-90 secondes |

### Canaux et instruments typiques

**Style SNES** (SPC700) : 8 canaux, sons bases sur des echantillons, son "chaud".
**Style Genesis** (YM2612) : 6 canaux FM + ondes carrees + bruit, son "croustillant".

Repartition classique :
- 1-2 canaux : melodie + contre-melodie
- 1 canal : basse (active et melodique)
- 1-2 canaux : harmonies / arpeges
- 2-3 canaux : percussion (kick, snare, hi-hat)

---

## 2. Principes fondamentaux

### La melodie est reine

Avec une palette d'instruments limitee, **une grande melodie fait tout le travail**. Les meilleures melodies chiptune sont simples, sifflables, instantanement reconnaissables. Les gammes pentatoniques sont particulierement efficaces.

### BPM selon le contexte

| Contexte | BPM |
|----------|-----|
| Menu / titre | 90-110 |
| Exploration / ville | 100-120 |
| Platformer / action | 120-140 |
| Combat | 130-160 |
| Boss | 140-170 |
| Moment emotionnel | 60-90 |

### Loopabilite

- Commencer et finir sur la meme note ou accord
- Eviter les fills de batterie dramatiques en fin de boucle
- Aligner les boucles sur des frontieres de mesures (2, 4 ou 8 mesures)

---

## 3. Outils recommandes

### Trackers (approche authentique)

| Outil | Specialite | Prix |
|-------|------------|------|
| **DefleMask** | Multi-systeme (Genesis, SNES, NES...) — le plus authentique | Gratuit / payant |
| **FamiTracker** | NES/Famicom (8-bit) | Gratuit |
| **OpenMPT** | Tracker generaliste (MOD/XM/IT) | Gratuit |

### DAW + Plugins VST

| Plugin | Type | Prix |
|--------|------|------|
| **ChipSynth SFC** (Plogue) | Emulation SNES fidele | ~45 USD |
| **Genny VST** | Emulation Genesis YM2612 | Gratuit |
| **RYM2612** (Inphonik) | Emulation Genesis | ~29 USD |
| **Super Audio Cart** | Samples SNES/Genesis/12+ consoles | ~99 USD |

### Outils web gratuits

- **BeepBox** (beepbox.co) : editeur web ideal pour prototyper rapidement
- **FamiStudio** : version simplifiee et moderne de FamiTracker
- **PxTone Collage** : cree par le createur de Cave Story, gratuit

---

## 4. Formats et specs techniques

### Export final pour le jeu

| Format | Usage | Loop seamless ? |
|--------|-------|----------------|
| **OGG Vorbis** | Format principal | Oui (pas de gap) |
| **MP3** | Fallback web | Non (gap encode en debut) |
| **WAV** | Desktop / archivage | Oui mais tres lourd |

**OGG est le format a privilegier** : pas de gap au debut du fichier, ce qui permet un looping parfaitement seamless.

### Specs recommandees

- Sample rate : 44 100 Hz
- Bit depth : 16-bit
- Qualite OGG : q6 a q8 (~192-256 kbps)
- Fallback MP3 : 192 kbps minimum

---

## 5. Techniques pour un loop seamless

### Technique

1. **Zero-crossing** : placer les points de debut/fin la ou l'onde croise l'amplitude zero (pas de clic)
2. **Micro-fades** : fondu de 5-20 ms au debut et a la fin (elimine les pops)
3. **Crossfade** : superposer la fin sur le debut et les fondre ensemble
4. **Alignement tempo** : boucle = nombre exact de mesures
5. **Test etendu** : ecouter au moins 20-30 repetitions pour verifier

### Contre la fatigue auditive

1. **2-4 sections contrastees** dans la boucle (changement de lead, registre, intensite)
2. **Contre-melodies** qui s'entrelacent avec la melodie principale
3. **Basses actives** : sauts d'octave, fills, mouvements scalaires
4. **Groove stimulant mais subtil** : agreable en soi, pas mecanique

---

## 6. Erreurs courantes a eviter

### Composition

- Melodies trop complexes (la force du chiptune = simplicite)
- Trop de canaux/instruments (tue le charme retro)
- Accords pleins au lieu d'arpeges rapides
- Basse statique/ennuyeuse
- Boucles < 20 secondes

### Technique

- Utiliser MP3 pour les boucles (gap = impossible de boucler proprement)
- Ne pas verifier les zero-crossings (clics a chaque repetition)
- Oublier le delay/echo (sauce secrete du son SNES)
- Trop de reverb (sonne moderne, pas retro)
- Ne pas tester dans le jeu reel

---

## 7. Exemples de reference

### SNES

- **Chrono Trigger** (Yasunori Mitsuda) — gamme emotionnelle immense
- **Final Fantasy VI** (Nobuo Uematsu) — atmosphere operatique, leitmotivs
- **Donkey Kong Country 2** (David Wise) — ambiances atmospheriques uniques
- **EarthBound** (Suzuki/Tanaka) — influence majeure sur Undertale et le lo-fi
- **Super Mario World** (Koji Kondo) — energie fun par excellence

### Genesis / Mega Drive

- **Streets of Rage 2** (Yuzo Koshiro) — exploitation maximale de la synthese FM
- **Sonic 1/2/3** — energie pure, melodies accrocheuses
- **Comix Zone** — fusion rock/chiptune unique

### Indie modernes inspires du 16-bit

- **Undertale** (Toby Fox) — melodies simples mais devastatrices
- **Shovel Knight** (Jake Kaufman) — hommage fidele NES/SNES
- **Celeste** (Lena Raine) — melange chiptune + instruments modernes
- **Stardew Valley** (ConcernedApe) — ambiance SNES RPG

---

## 8. Pipeline pour JuiceJuicyJuice (Phaser)

1. Composer avec **BeepBox** (prototypage rapide) ou **DefleMask** (resultat authentique)
2. Exporter en WAV
3. Convertir en **OGG** avec Audacity en verifiant les zero-crossings
4. Fournir un fallback **MP3**
5. Charger dans Phaser :
   ```typescript
   this.load.audio('theme', ['music/theme.ogg', 'music/theme.mp3']);
   ```
6. Jouer en boucle :
   ```typescript
   this.sound.play('theme', { loop: true });
   ```

---

## Sources

- Sonic Atlas — How to Make 16-Bit Music / Best Chiptune Software
- Baby Audio — Chiptune Producer's Guide
- LANDR — How to Make Chiptune Music
- Creator Sounds Pro — Looping Audio Seamlessly
- MakeUseOf — Video Game Music: How to Create a Seamless Loop
- GameDev.net — Composing Music For Video Games: Tempo
- Jeff Penny Music — A Game Dev's Guide To Audio Files

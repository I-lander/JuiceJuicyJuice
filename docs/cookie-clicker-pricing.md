# Cookie Clicker - Systeme de prix

Documentation du systeme de pricing de Cookie Clicker, basee sur le code source (v2.031).

---

## 1. Prix des batiments (Buildings)

### Formule de base

```
prix = basePrice * 1.15 ^ max(0, owned - free)
```

- `basePrice` : cout initial du batiment (fixe par type)
- `1.15` : multiplicateur exponentiel par achat (`Game.priceIncrease`)
- `owned` : nombre de ce batiment possede
- `free` : batiments gratuits (Starter Kit, etc.)
- Le resultat est arrondi au superieur (`Math.ceil`)

Chaque achat supplementaire coute **+15%** du precedent. Le prix double environ tous les **5 achats** et est multiplie par ~1000 tous les **50 achats**.

### Cout de base par batiment

| Batiment            | Base Price           | CpS de base   |
| ------------------- | -------------------- | ------------- |
| Cursor              | 15                   | 0.1           |
| Grandma             | 100                  | 1             |
| Farm                | 1,100                | 8             |
| Mine                | 12,000               | 47            |
| Factory             | 130,000              | 260           |
| Bank                | 1,400,000            | 1,400         |
| Temple              | 20,000,000           | 7,800         |
| Wizard Tower        | 330,000,000          | 44,000        |
| Shipment            | 5,100,000,000        | 260,000       |
| Alchemy Lab         | 75,000,000,000       | 1,600,000     |
| Portal              | 1,000,000,000,000    | 10,000,000    |
| Time Machine        | 14,000,000,000,000   | 65,000,000    |
| Antimatter Condenser| 170,000,000,000,000  | 430,000,000   |
| Prism               | 2.1 quadrillion      | 2,900,000,000 |
| Chancemaker         | 26 quadrillion       | 21,000,000,000|
| Fractal Engine      | 310 quadrillion      | 150,000,000,000|
| Javascript Console  | 71 quintillion       | 1,100,000,000,000|
| Idleverse           | 12 sextillion        | 8,300,000,000,000|
| Cortex Baker        | 1.9 septillion       | 64,000,000,000,000|
| You                 | 540 septillion       | 510,000,000,000,000|

Le ratio entre bases prices successifs est d'environ **~10x a ~15x** d'un batiment au suivant.

### Achat en masse (Bulk Buy)

Le cout total pour acheter N batiments est la somme geometrique :

```
totalPrice = sum(i = owned to owned+N-1) basePrice * 1.15^(i - free)
```

Multiplicateurs approximatifs :
- Acheter 10 d'un coup : **x20.3** le prix d'un seul
- Acheter 100 d'un coup : **x7,828,750** le prix d'un seul

### Reductions de prix (batiments)

Les reductions sont **multiplicatives** entre elles :

| Source                    | Reduction |
| ------------------------- | --------- |
| Season savings            | x0.99     |
| Santa's dominion          | x0.99     |
| Faberge egg               | x0.99     |
| Divine discount            | x0.99     |
| Fortune #100              | x0.99     |
| Fierce Hoarder (aura)     | x0.98     |
| Everything must go (buff)  | x0.95     |
| Crafty pixies (buff)       | x0.98     |
| Nasty goblins (buff)       | x1.02 (malus) |
| Fortune building           | x0.93     |
| Creation (Pantheon slot 1) | x0.93     |
| Creation (Pantheon slot 2) | x0.95     |
| Creation (Pantheon slot 3) | x0.98     |

Reduction maximale atteignable : environ **~35%** (multiplicateur ~0.65).

### Revente

- Remboursement standard : **25%** du prix actuel
- Avec Earth Shatterer (aura) : **50%**

---

## 2. Prix des upgrades

### Upgrades "Tiered" (par paliers)

C'est le systeme principal. Chaque batiment a des upgrades par tiers. La formule est :

```
upgradePrice = building.basePrice * tier.price
```

Les tiers et leurs multiplicateurs (extraits du code source) :

| Tier | Nom            | Multiplicateur (price) | Deblocage (nb batiments) |
| ---- | -------------- | ---------------------- | ------------------------ |
| 1    | Plain          | 10                     | 1                        |
| 2    | Berrylium      | 50                     | 5                        |
| 3    | Blueberrylium  | 500                    | 25                       |
| 4    | Chalcedhoney   | 50,000                 | 50                       |
| 5    | Buttergold     | 5,000,000              | 100                      |
| 6    | Sugarmuck      | 500,000,000            | 150                      |
| 7    | Jetmint        | 500,000,000,000        | 200                      |
| 8    | Cherrysilver   | 500,000,000,000,000    | 250                      |
| 9    | Hazelrald      | 5 * 10^17              | 300                      |
| 10   | Mooncandy      | 5 * 10^20              | 350                      |
| 11   | Astrofudge     | 5 * 10^24              | 400                      |
| 12   | Alabascream    | 5 * 10^28              | 450                      |
| 13   | Iridyum        | 5 * 10^32              | 500                      |

**Pattern du multiplicateur** : Les premiers tiers progressent par ~x5 a x100, puis a partir du tier 4, le pattern se stabilise en puissances de 10 croissantes (~x1000 entre chaque tier a partir du tier 6).

**Exemple concret** :
- Grandma (basePrice = 100) : Tier 1 = 100 * 10 = **1,000** | Tier 2 = 100 * 50 = **5,000** | Tier 3 = 100 * 500 = **50,000**
- Farm (basePrice = 1,100) : Tier 1 = 1,100 * 10 = **11,000** | Tier 2 = 1,100 * 50 = **55,000** | Tier 3 = 1,100 * 500 = **550,000**

**Effet** : Chaque upgrade tiered **double** la production (CpS) du batiment associe.

### Upgrades "Synergy"

Les synergies lient deux batiments entre eux.

```
synergyPrice = (cheaperBuilding.basePrice * 10 + expensiveBuilding.basePrice * 1) * tier.price
```

| Tier      | Nom          | Multiplicateur | Deblocage          | Requis                |
| --------- | ------------ | -------------- | ------------------ | -------------------- |
| synergy1  | Synergy I    | 200,000        | 15 de chaque       | Synergies Vol. I     |
| synergy2  | Synergy II   | 200,000,000,000| 75 de chaque       | Synergies Vol. II    |

**Effet** :
- Le batiment le moins cher gagne **+5% CpS** par unite du batiment le plus cher
- Le batiment le plus cher gagne **+0.1% CpS** par unite du batiment le moins cher

Avec l'upgrade "Chimera", le prix des synergies est reduit de **2%** (`* 0.98`).

### Upgrades "Fortune"

```
fortunePrice = 77,777,777,777,777,777,777,777,777,777 * multiplicateur_contextuel
```

Le tier Fortune a un prix de base de ~7.78 * 10^28, multiplie par des facteurs selon le contexte (x100,000 pour les batiments, x100,000,000 pour les CpS, etc.).

**Effet** : +7% CpS pour le batiment associe.

### Reductions de prix (upgrades)

Separees des reductions de batiments :

| Source                        | Reduction |
| ----------------------------- | --------- |
| Toy workshop                  | x0.95     |
| Five-finger discount          | x0.99^(cursors/100) |
| Santa's dominion              | x0.98     |
| Faberge egg                   | x0.99     |
| Divine sales                  | x0.99     |
| Fortune #100                  | x0.99     |
| Kitten wages (si kitten)      | x0.90     |
| Haggler's luck (buff)         | x0.98     |
| Haggler's misery (buff)       | x1.02 (malus) |
| Master of the Armory (aura)   | x0.98     |
| Divine bakeries (pool cookie) | /5        |

---

## 3. Resume des mecaniques cles

### Scaling exponentiel des batiments
- Le multiplicateur **1.15** par achat est le coeur du systeme
- Rend chaque batiment suivant significativement plus cher
- Force le joueur a diversifier ses achats

### Upgrades comme multiplicateurs de production
- Chaque tier **double** la production → pouvoir exponentiel
- Le prix des upgrades scale avec le basePrice du batiment → naturellement equilibre
- Les tiers superieurs ont des multiplicateurs de prix enormes, mais sont debloques par le nombre de batiments possedes

### Equilibre prix/benefice
- Un batiment a un CpS fixe par unite, multiplie par les upgrades
- Le cout augmente exponentiellement, mais les upgrades doublent la production
- Resultat : le joueur est toujours pousse a acheter le "next tier" d'upgrade plutot qu'un nouveau batiment

### Synergies comme late-game
- Encouragent a avoir beaucoup de batiments de types differents
- Le bonus est lineaire par rapport au nombre de l'autre batiment → incentive a diversifier

---

## Sources

- [Cookie Clicker Wiki - Buildings](https://cookieclicker.wiki.gg/wiki/Building)
- [Cookie Clicker Wiki - Upgrades](https://cookieclicker.wiki.gg/wiki/Upgrades)
- [Code source Cookie Clicker v2.031](https://github.com/Sushi8756/Cookie-Clicker-2.031) (main.js)

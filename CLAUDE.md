# JuiceJuicyJuice

## Code rules

### General rules

- **Never comment code**
- **Never use single-letter variable names.** Always use explicit, descriptive names:
  - `g` -> `graphics`
  - `ts` -> `tileSize`
  - `rt` -> `renderTexture`
  - `px` -> `pixelUnit`
  - `x`, `y` acceptable for coordinates
  - `i`, `j` acceptable for loop indices
  - `t` -> `interpolation` or a descriptive name
  - `dx`, `dy` acceptable for deltas/offsets

### TypeScript

- Explicit types when it improves readability
- Avoid `any` unless absolutely necessary, and flag it
- Use Phaser types when relevant
- Clearly declare class properties
- Initialize or guard potentially null properties
- Watch for `strictNullChecks`, uninitialized properties, callbacks losing context, confusion between Phaser GameObjects and Physics Objects types
- Never write comments in code. No inline comments, no block comments, no JSDoc, no TODO comments. The code must speak for itself.

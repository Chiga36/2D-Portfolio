# Chirag's Portfolio

An interactive developer portfolio built as a playable 2D top-down game instead of a static site. Walk around a room with WASD and bump into objects (PC, CS degree, sofa, TV, bed, desk, bookshelf) to read about the person behind it.

Built with [Kaboom.js](https://kaboomjs.com/) + [Vite](https://vitejs.dev/), inspired by [JSLegendDev's 2d-portfolio-kaboom](https://github.com/JSLegendDev/2d-portfolio-kaboom).

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes with Node.js)

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open the URL it prints (usually **http://localhost:5173**) in your browser.

## Controls

- **W / A / S / D** or **Arrow Keys** — move the character
- **Click / Press any key** on the welcome screen to start
- Walk into an object to open its dialogue box, click **Close** (or it auto-advances) to resume moving

## Other commands

```bash
npm run build    # Production build, output goes to dist/
npm run preview  # Preview the production build locally
```

## Project Structure

```
index.html            Page shell: canvas, welcome screen, dialogue UI (all HTML/CSS)
vite.config.js        Vite config (uses terser for minification — esbuild breaks Kaboom's output)
src/
  kaboomCtx.js         Creates the single Kaboom context, bound to the canvas
  constants.js         scaleFactor + dialogueData (the text shown for each object — edit this to update content)
  utils.js             Dialogue typewriter effect, responsive camera zoom
  main.js              Entry point: loads assets, builds the map, player, movement, collisions
public/
  map.json / map.png   The room layout, exported from Tiled (https://www.mapeditor.org/)
  spritesheet.png      Character sprite sheet
  monogram.ttf         Pixel font used for all UI text
```

## Customizing

- **Content/text**: edit `dialogueData` in `src/constants.js` — one entry per interactive object (`pc`, `cs-degree`, `sofa-table`, `tv`, `bed`, `resume`, `projects`, `library`, `exit`). HTML (e.g. `<a>` links) is allowed.
- **Room layout**: open `public/map.json` in [Tiled](https://www.mapeditor.org/), edit tiles/objects, re-export, and overwrite `map.json` + `map.png` (the `boundaries` object layer defines collision + which dialogue key each object triggers; `spawnpoints` defines where the player starts).
- **Camera zoom**: `setCamScale` in `src/utils.js`.

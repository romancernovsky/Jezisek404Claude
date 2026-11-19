#!/usr/bin/env node
// Renders 1920×1080 PNG start frames in the show's exact art style, to use as the
// image input for image-to-video generation (e.g. Higgsfield · Seedance). Keeps the
// cinematic clips visually consistent with the rest of the show.
//   node scripts/export-keyframes.mjs   → public/video/keyframes/*.png
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'video', 'keyframes');
fs.mkdirSync(OUT, { recursive: true });
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(`${execSync('npm root -g').toString().trim()}/playwright`); }
const art = await import(pathToFileURL(path.join(ROOT, 'public/js/art.js')).href);

const FRAMES = {
  opening: { bg: 'village', cast: [] },
  endingA: { bg: 'town', cast: [['elves', 330, 'happy'], ['jolly', 700, 'love'], ['jezisek', 960, 'proud'], ['bara', 1230, 'happy'], ['pepik', 1480, 'happy']] },
  endingB: { bg: 'town', cast: [['jezisek', 760, 'worried'], ['jolly', 1150, 'happy'], ['bara', 1450, 'happy']], props: [['teddy7', 300, 640]] },
  endingC: { bg: 'error', cast: [['jezisek', 700, 'sad'], ['jolly', 1150, 'happy'], ['krampus', 1550, 'happy']] },
};
const css = fs.readFileSync(path.join(ROOT, 'public/css/screen.css'), 'utf8');
const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
for (const [name, f] of Object.entries(FRAMES)) {
  const actors = f.cast.map(([who, x, expr]) => {
    const h = art.CHAR_SIZE[who]; const w = art.CHAR_WIDTH[who] ? h * art.CHAR_WIDTH[who] / 440 : h * 300 / 440;
    return `<div class="actor" style="left:${x}px;width:${w}px;height:${h}px"><div class="inner">${art.character(who, expr)}</div></div>`;
  }).join('');
  const props = (f.props || []).map(([p, x, y]) => `<div class="prop on" style="left:${x}px;top:${y}px;width:${art.PROPS[p].w}px">${art.PROPS[p].svg}</div>`).join('');
  await page.setContent(`<style>${css} html,body{cursor:default} #stage{transform:none;left:0;top:0} .window{fill:#ffd27a} *{animation:none!important}</style>
    <div id="stage"><div id="world"><div id="bg" class="layer">${art.background(f.bg, { gifts: 100 })}</div><div id="actors" class="layer">${actors}</div><div class="layer">${props}</div></div></div>`);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`✓ ${path.relative(ROOT, path.join(OUT, `${name}.png`))}`);
}
await browser.close();

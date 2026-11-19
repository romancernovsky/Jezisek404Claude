#!/usr/bin/env node
// Registers the optional cinematic clips. Put MP4 files in public/video/ named after their slot
// (opening.mp4, endingA.mp4, endingB.mp4, endingC.mp4) and run: npm run videos
// Any missing clip simply falls back to the animated version. Total budget: 30 seconds.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'video');
const SLOTS = { opening: 10, endingA: 10, endingB: 5, endingC: 5 };
const slots = {}; let total = 0;
for (const [slot, budget] of Object.entries(SLOTS)) {
  const file = ['mp4', 'webm'].map((e) => path.join(DIR, `${slot}.${e}`)).find((f) => fs.existsSync(f));
  if (!file) { console.log(`· ${slot}: none (animated fallback)`); continue; }
  let d = 0; try { d = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim(); } catch {}
  total += d; slots[slot] = `/video/${path.basename(file)}`;
  console.log(`✓ ${slot}: ${path.basename(file)} ${d ? d.toFixed(1) + ' s' : ''}${d > budget + 0.5 ? `  ⚠ planned ${budget} s` : ''}`);
}
fs.writeFileSync(path.join(DIR, 'manifest.json'), JSON.stringify({ slots }, null, 1));
console.log(`Total video: ${total.toFixed(1)} s of 30 s budget.${total > 30.5 ? ' ⚠ over budget' : ''}`);

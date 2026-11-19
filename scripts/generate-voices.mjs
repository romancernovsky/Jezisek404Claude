#!/usr/bin/env node
// Generates every spoken line of the show with xAI text-to-speech.
//   XAI_API_KEY=... npm run voices            # only missing/changed lines
//   XAI_API_KEY=... npm run voices -- --force # regenerate everything
//   npm run voices -- --prune                 # also delete audio no longer used by the script
// Files are named by a hash of (voice + text), so editing a line regenerates only that line.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { allLines, CAST } from '../shared/story.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'audio', 'voices');
const MANIFEST = path.join(OUT, 'manifest.json');
const API = process.env.XAI_TTS_URL || 'https://api.x.ai/v1/tts';
const KEY = process.env.XAI_API_KEY || '';
const FORCE = process.argv.includes('--force');
const PRUNE = process.argv.includes('--prune');
const CONCURRENCY = 4;

fs.mkdirSync(OUT, { recursive: true });
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { durations: {} };
manifest.durations ||= {};

const lines = allLines();
const unique = [...new Map(lines.map((l) => [l.key, l])).values()];
const todo = unique.filter((l) => FORCE || !fs.existsSync(path.join(OUT, `${l.key}.mp3`)));
console.log(`${unique.length} unique lines, ${todo.length} to generate.`);
if (todo.length && !KEY) { console.error('Set XAI_API_KEY (your xAI API key) to generate voices.'); process.exit(1); }

function duration(file) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim();
    if (+out > 0) return Math.round(+out * 100) / 100;
  } catch { /* ffprobe not installed */ }
  return Math.round((fs.statSync(file).size * 8 / 128000) * 100) / 100; // xAI returns 128 kbps MP3
}

// Small pronunciation helpers for the TTS engine (subtitles keep the original spelling).
const speakable = (t) => t
  .replace(/Ježíšek/g, 'Yeh-zhee-shek')
  .replace(/Pepík/g, 'Peh-peek')
  .replace(/Bára/g, 'Bah-rah')
  .replace(/Nováková/g, 'No-vah-ko-vah')
  .replace(/Brno/g, 'Bur-no')
  .replace(/JOLLY/g, 'Jolly')
  .replace(/…/g, '...');

async function tts(line) {
  const voice = CAST[line.who]?.voice || 'leo';
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ text: speakable(line.text), voice_id: voice, language: 'en' }),
      });
      if (!r.ok) throw new Error(`${r.status} ${await r.text().catch(() => '')}`.slice(0, 200));
      const buf = Buffer.from(await r.arrayBuffer());
      const file = path.join(OUT, `${line.key}.mp3`);
      fs.writeFileSync(file, buf);
      manifest.durations[line.key] = duration(file);
      console.log(`✓ ${line.who.padEnd(8)} ${manifest.durations[line.key].toFixed(1)}s  ${line.text.slice(0, 70)}`);
      return;
    } catch (e) {
      console.warn(`  retry ${attempt} for ${line.key}: ${e.message}`);
      await new Promise((res) => setTimeout(res, 1500 * attempt));
    }
  }
  console.error(`✗ failed: ${line.key} ${line.text}`);
}

const queue = [...todo];
await Promise.all([...Array(CONCURRENCY)].map(async () => { while (queue.length) await tts(queue.shift()); }));

// make sure every existing file has a duration
for (const l of unique) { const f = path.join(OUT, `${l.key}.mp3`); if (fs.existsSync(f) && !manifest.durations[l.key]) manifest.durations[l.key] = duration(f); }
if (PRUNE) {
  const keep = new Set(unique.map((l) => l.key));
  for (const f of fs.readdirSync(OUT)) if (f.endsWith('.mp3') && !keep.has(f.slice(0, -4))) { fs.unlinkSync(path.join(OUT, f)); delete manifest.durations[f.slice(0, -4)]; console.log(`pruned ${f}`); }
}
manifest.generatedAt = new Date().toISOString();
manifest.voices = Object.fromEntries(Object.entries(CAST).map(([k, v]) => [k, v.voice]));
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
const total = unique.reduce((a, l) => a + (manifest.durations[l.key] || 0), 0);
console.log(`Done. ${Object.keys(manifest.durations).length} voice files, ${Math.round(total)} s of dialogue in total.`);

#!/usr/bin/env node
// End-to-end rehearsal: starts the server, opens the big screen and N simulated phones in Chromium,
// plays a full path at high speed with real phone votes, and fails on any console error.
//   node scripts/e2e.mjs alarm,ai,book,sleigh [--shots dir] [--speed 8]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createServer } from '../server/index.js';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(`${execSync('npm root -g').toString().trim()}/playwright`); }
const args = process.argv.slice(2);
const path = (args.find((a) => !a.startsWith('--') && a.includes(',')) || 'alarm,ai,book,sleigh').split(',');
const shotDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const speed = args.includes('--speed') ? args[args.indexOf('--speed') + 1] : '8';
const PHONES = 6;
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

const server = createServer({ persist: false, pin: '' });
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const host = (cmd, arg = {}) => fetch(`${base}/api/host/${cmd}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(arg) }).then((r) => r.json());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await playwright.chromium.launch();
const errors = [];
const screen = await browser.newPage({ viewport: { width: 1280, height: 720 } });
screen.on('pageerror', (e) => errors.push(`screen: ${e.message}`));
screen.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(`screen console: ${m.text()}`); });
await screen.goto(`${base}/screen?autoplay&speed=${speed}`);
const phones = [];
for (let i = 0; i < PHONES; i++) {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => errors.push(`phone ${i}: ${e.message}`));
  await p.goto(`${base}/`);
  phones.push(p);
}
await sleep(800);
let n = 0;
const shot = async (name) => { if (shotDir) await screen.screenshot({ path: `${shotDir}/${String(++n).padStart(2, '0')}-${name}.png` }); };
await shot('lobby');
await host('start');
const seen = [];
let di = 0;
const t0 = Date.now();
while (Date.now() - t0 < 240000) {
  const s = server.getShow();
  if (s.phase === 'playing' && seen.at(-1) !== s.sceneId) { seen.push(s.sceneId); await sleep(1800); await shot(s.sceneId); }
  if (s.phase === 'decision') {
    await host('openVote'); await sleep(500);
    // phones vote: majority for the scripted path option
    const keys = Object.keys(s.decision ? (await (await fetch(`${base}/api/state`)).json()).decision.options : {});
    const want = path[di]; const other = keys.find((k) => k !== want);
    for (let i = 0; i < PHONES; i++) await phones[i].click(`.opt[data-k="${i < 4 ? want : other}"]`);
    await sleep(700);
    if (di === 0 && shotDir) await phones[0].screenshot({ path: `${shotDir}/phone-voting.png` });
    await shot(`vote-${s.decision.id}`);
    const r = await host('closeVote');
    if (r.decision.winner !== want) throw new Error(`expected ${want} to win ${s.decision.id}, got ${r.decision.winner}`);
    await sleep(2600); await shot(`reveal-${s.decision.id}`);
    await host('continue'); di++;
  }
  if (s.phase === 'ended') break;
  await sleep(150);
}
const final = server.getShow();
await sleep(1500); await shot('end');
if (shotDir) await phones[1].screenshot({ path: `${shotDir}/phone-end.png` });
await browser.close(); server.close();
console.log(`path ${path.join(' → ')}`);
console.log(`scenes: ${seen.join(' → ')}`);
console.log(`phase: ${final.phase}, ending scene: ${seen.find((x) => x.startsWith('s6_'))}, ${((Date.now() - t0) / 1000).toFixed(0)} s at speed ${speed}`);
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
if (final.phase !== 'ended') { console.error('Show did not reach the end'); process.exit(1); }
console.log('E2E OK');

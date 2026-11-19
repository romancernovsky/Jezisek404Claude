#!/usr/bin/env node
// End-to-end rehearsal: starts the server (or uses a running deployment), opens the big screen and
// N simulated phones in Chromium, plays a full path at high speed with real phone votes, and fails on
// any console error.
//   node scripts/e2e.mjs alarm,ai,book,sleigh [--shots dir] [--speed 8]
//   node scripts/e2e.mjs alarm,ai,book,sleigh --url http://localhost:8080 --pin 1234   # test a deployment
//   node scripts/e2e.mjs alarm,ai,book,sleigh --buffering-proxy   # simulate a corporate proxy that swallows the live stream
// NOTE: against a deployment this restarts the show — never run it during the live event.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createServer } from '../server/index.js';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(`${execSync('npm root -g').toString().trim()}/playwright`); }
const args = process.argv.slice(2);
const path = (args.find((a) => !a.startsWith('--') && a.includes(',')) || 'alarm,ai,book,sleigh').split(',');
const shotDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const speed = args.includes('--speed') ? args[args.indexOf('--speed') + 1] : '8';
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const URL_ARG = opt('--url');
const PIN = opt('--pin') || '';
const PHONES = 6;
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

let server = null, base;
if (URL_ARG) base = URL_ARG.replace(/\/$/, '');
else { server = createServer({ persist: false, pin: '' }); await new Promise((r) => server.listen(0, r)); base = `http://127.0.0.1:${server.address().port}`; }
// Optional: put a proxy in front that never forwards the live stream (like a buffering corporate proxy).
let proxy = null;
const directBase = base;
if (args.includes('--buffering-proxy')) {
  const target = new URL(base);
  proxy = http.createServer((req, res) => {
    if (req.url.startsWith('/api/events')) { res.writeHead(200, { 'Content-Type': 'text/event-stream' }); return; } // swallow the stream
    const up = http.request({ host: target.hostname, port: target.port, path: req.url, method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    up.on('error', () => res.destroy());
    req.pipe(up);
  });
  await new Promise((r) => proxy.listen(0, r));
  base = `http://127.0.0.1:${proxy.address().port}`;
  console.log('Simulating a buffering proxy: the live stream is swallowed, pages must fall back to polling.');
}
const host = (cmd, arg = {}) => fetch(`${directBase}/api/host/${cmd}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Host-Pin': PIN }, body: JSON.stringify(arg) }).then((r) => { if (r.status === 401) throw new Error('Wrong or missing --pin'); return r.json(); });
const getShow = async () => (server ? server.getShow() : (await fetch(`${directBase}/api/state`)).json());
await host('restart');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await playwright.chromium.launch();
const errors = [];
const screen = await browser.newPage({ viewport: { width: 1280, height: 720 } });
screen.on('pageerror', (e) => errors.push(`screen: ${e.message}`));
screen.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(`screen console: ${m.text()}`); });
await screen.goto(`${base}/screen?autoplay&speed=${speed}&pin=${encodeURIComponent(PIN)}`);
const phones = [];
for (let i = 0; i < PHONES; i++) {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', (e) => errors.push(`phone ${i}: ${e.message}`));
  await p.goto(`${base}/vote`);
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
  const s = await getShow();
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
const final = await getShow();
await sleep(1500); await shot('end');
if (shotDir) await phones[1].screenshot({ path: `${shotDir}/phone-end.png` });
await browser.close(); server?.close(); proxy?.close();
console.log(`path ${path.join(' → ')}`);
console.log(`scenes: ${seen.join(' → ')}`);
console.log(`phase: ${final.phase}, ending scene: ${seen.find((x) => x.startsWith('s6_'))}, ${((Date.now() - t0) / 1000).toFixed(0)} s at speed ${speed}`);
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
if (final.phase !== 'ended') { console.error('Show did not reach the end'); process.exit(1); }
console.log('E2E OK');

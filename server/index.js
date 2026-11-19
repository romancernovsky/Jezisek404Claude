// Ježíšek 404 — show server. Zero runtime dependencies (Node 20+).
//   /            phone voting page (audience)
//   /screen      big-screen show (projector / broadcast feed)
//   /host        presenter control panel
//   /map         branching story map & rehearsal path table
// Live updates use Server-Sent Events; votes are plain POSTs. State is persisted to disk so a
// crashed/restarted server resumes exactly where the show was.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { newShow, reduce, publicView } from '../shared/show.js';
import { DECISIONS } from '../shared/model.js';

const require = createRequire(import.meta.url);
const QRCode = require('./vendor/qrcode/index.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function createServer(opts = {}) {
  const PIN = opts.pin ?? process.env.HOST_PIN ?? '';
  const STATE_FILE = opts.stateFile ?? process.env.STATE_FILE ?? path.join(ROOT, 'data', 'show-state.json');
  const PUBLIC_URL = opts.publicUrl ?? process.env.PUBLIC_URL ?? '';
  const persist = opts.persist ?? true;

  let show = loadState() || newShow();
  /** deviceId -> option for the currently open decision */
  let votes = new Map();
  let voteDecisionKey = null;
  const clients = new Set(); // { res, role }
  let broadcastTimer = null;

  function loadState() {
    if (!persist) return null;
    try {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (saved && saved.phase) return { ...saved, paused: true }; // resume paused after a restart
    } catch { /* first run */ }
    return null;
  }
  function saveState() {
    if (!persist) return;
    try {
      fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
      fs.writeFileSync(STATE_FILE + '.tmp', JSON.stringify(show));
      fs.renameSync(STATE_FILE + '.tmp', STATE_FILE);
    } catch (e) { console.error('Could not save state', e.message); }
  }

  function tally() {
    if (!show.decision) return;
    const counts = Object.fromEntries(Object.keys(DECISIONS[show.decision.id].options).map((o) => [o, 0]));
    for (const v of votes.values()) if (v in counts) counts[v]++;
    show = { ...show, decision: { ...show.decision, counts } };
  }

  function apply(cmd, arg) {
    const before = show;
    show = reduce(show, cmd, arg);
    if (cmd === 'openVote' && show.phase === 'voting') { votes = new Map(); voteDecisionKey = `${show.decision.id}:${show.decision.openedAt}`; }
    if (show !== before) { saveState(); broadcast(true); }
    return show;
  }

  function viewFor(role) {
    if (role === 'host') return { ...publicView(show, { withCounts: true }), clients: counts(), pinRequired: !!PIN };
    if (role === 'screen') return { ...publicView(show, { withCounts: false }), phones: counts().phone };
    return publicView(show); // phone
  }
  function counts() {
    const c = { phone: 0, screen: 0, host: 0, preview: 0 };
    for (const cl of clients) c[cl.role] = (c[cl.role] || 0) + 1;
    return c;
  }

  // Broadcast immediately for state changes; throttle the frequent vote-count updates.
  function broadcast(immediate) {
    if (immediate) { clearTimeout(broadcastTimer); broadcastTimer = null; send(); return; }
    if (!broadcastTimer) broadcastTimer = setTimeout(() => { broadcastTimer = null; send(); }, 400);
  }
  function send() {
    const cache = {};
    for (const cl of clients) {
      const r = cl.role === 'preview' ? 'screen' : cl.role;
      const data = cache[r] ||= `event: state\ndata: ${JSON.stringify(viewFor(r))}\n\n`;
      cl.res.write(data);
    }
  }
  const heartbeat = setInterval(() => { for (const cl of clients) cl.res.write(': ping\n\n'); }, 20000);

  // ---------------------------------------------------------------- http
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      const p = url.pathname;

      if (p === '/api/events' && req.method === 'GET') {
        const role = ['host', 'screen', 'phone'].includes(url.searchParams.get('role')) ? url.searchParams.get('role') : 'phone';
        if (role !== 'phone' && !pinOk(url.searchParams.get('pin'))) return json(res, 401, { error: 'PIN required' });
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.write('retry: 2000\n\n');
        const cl = { res, role: role === 'screen' && url.searchParams.has('preview') ? 'preview' : role };
        clients.add(cl);
        res.write(`event: state\ndata: ${JSON.stringify(viewFor(role))}\n\n`); // role 'screen' also serves previews
        req.on('close', () => { clients.delete(cl); broadcast(false); });
        broadcast(false);
        return;
      }

      if (p === '/api/state' && req.method === 'GET') return json(res, 200, viewFor('phone'));

      if (p === '/api/vote' && req.method === 'POST') {
        const body = await readJson(req);
        if (show.phase !== 'voting') return json(res, 409, { error: 'Voting is closed' });
        const id = String(body.deviceId || '').slice(0, 64);
        if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return json(res, 400, { error: 'Bad device id' });
        if (!DECISIONS[show.decision.id].options[body.option]) return json(res, 400, { error: 'Bad option' });
        if (body.decision && body.decision !== show.decision.id) return json(res, 409, { error: 'Stale decision' });
        if (votes.size > 5000 && !votes.has(id)) return json(res, 429, { error: 'Too many voters' });
        votes.set(id, body.option);
        tally();
        broadcast(false);
        return json(res, 200, { ok: true, option: body.option, decision: show.decision.id, key: voteDecisionKey });
      }

      if (p.startsWith('/api/host/') && req.method === 'POST') {
        if (!pinOk(req.headers['x-host-pin'])) return json(res, 401, { error: 'Wrong PIN' });
        const cmd = p.slice('/api/host/'.length);
        const arg = await readJson(req);
        if (cmd === 'closeVote') { tally(); }
        apply(cmd, arg);
        return json(res, 200, viewFor('host'));
      }

      // The screen reports playback progress / scene end (PIN-protected like the host).
      if (p === '/api/screen' && req.method === 'POST') {
        if (!pinOk(req.headers['x-host-pin'])) return json(res, 401, { error: 'Wrong PIN' });
        const arg = await readJson(req);
        if (arg.type === 'ended') apply('sceneEnded', { sceneRun: arg.sceneRun });
        else if (arg.type === 'progress') { const b = show; show = reduce(show, 'progress', arg); if (b !== show) { saveState(); broadcastHostOnly(); } }
        return json(res, 200, { ok: true });
      }

      if (p === '/api/qr.svg') {
        const target = url.searchParams.get('u') || PUBLIC_URL || `http://${req.headers.host}/`;
        res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' });
        return res.end(qrSvg(target.slice(0, 300)));
      }

      if (p === '/api/config') return json(res, 200, { publicUrl: PUBLIC_URL, pinRequired: !!PIN });

      return serveStatic(p, res);
    } catch (e) {
      json(res, e.status || 500, { error: e.message });
    }
  });

  function broadcastHostOnly() {
    const data = `event: state\ndata: ${JSON.stringify(viewFor('host'))}\n\n`;
    for (const cl of clients) if (cl.role === 'host') cl.res.write(data);
  }

  function pinOk(given) {
    if (!PIN) return true;
    const a = Buffer.from(String(given || '')); const b = Buffer.from(PIN);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  server.on('close', () => clearInterval(heartbeat));
  server.getShow = () => show;
  return server;
}

// ---------------------------------------------------------------- helpers
function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > 20000) { reject(Object.assign(new Error('Too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(Object.assign(new Error('Bad JSON'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8' };
const ROUTES = { '/': 'public/vote.html', '/vote': 'public/vote.html', '/screen': 'public/screen.html', '/host': 'public/host.html', '/map': 'public/map.html' };

function serveStatic(p, res) {
  let rel = ROUTES[p];
  if (!rel) {
    if (p.startsWith('/shared/')) rel = p.slice(1);
    else rel = 'public' + p;
  }
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || rel.includes('..')) return json(res, 403, { error: 'Forbidden' });
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return json(res, 404, { error: 'Not found' });
    const ext = path.extname(file);
    const longCache = /\/(audio|video|img)\//.test(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': longCache ? 'public, max-age=86400' : 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}

export function qrSvg(text) {
  const qr = new QRCode(-1, 0 /* ErrorCorrectLevel.M */);
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const q = 2; // quiet zone
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * q} ${n + 2 * q}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
}

// ---------------------------------------------------------------- main
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const port = Number(process.env.PORT) || 8080;
  const server = createServer();
  server.listen(port, () => {
    console.log(`\n🎄 Ježíšek 404 is running on port ${port}`);
    console.log(`   Screen : http://localhost:${port}/screen`);
    console.log(`   Host   : http://localhost:${port}/host`);
    console.log(`   Phones : ${process.env.PUBLIC_URL || `http://<this-machine>:${port}/`}`);
    console.log(`   Map    : http://localhost:${port}/map\n`);
  });
}

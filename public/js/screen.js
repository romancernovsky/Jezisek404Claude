// Big-screen player. Follows the server's show state (or runs standalone with ?solo=1).
import { SCENES, CAST, beatsFor, beatDuration, voiceKey, outcome, delivery, DECISIONS } from '/shared/story.js';
import { newShow, reduce, publicView } from '/shared/show.js';
import { character, CHAR_SIZE, CHAR_WIDTH, PROPS, background, SCREEN_POS, OUTDOOR, ICONS } from './art.js';
import * as audio from './audio.js';
import { Effects } from './fx.js';
import { liveState } from './live.js';

const params = new URLSearchParams(location.search);
const SOLO = params.has('solo');
const PREVIEW = params.has('preview');      // embedded in the host panel: silent, never reports progress
const PIN = params.get('pin') || '';
const SPEED = Math.max(0.25, Number(params.get('speed')) || 1); // rehearsal fast-forward, e.g. ?speed=3
const $ = (s) => document.querySelector(s);

const stage = $('#stage'), world = $('#world');
const fx = new Effects($('#fx'), $('#fxcanvas'));
let voices = {};           // key -> duration (seconds)
let videos = {};           // slot -> url
let config = { publicUrl: '' };
let show = null;           // latest public view
let playingRun = null;     // sceneRun currently being played
let cancelToken = 0;
let paused = false;
const actors = {};         // who -> element
const shown = { gifts: 0, quality: 0, spirit: 50, hours: 24 };

// ------------------------------------------------------------------ scaling
function fit() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(-50%, -50%) scale(${s})`;
}
addEventListener('resize', fit); fit();

// ------------------------------------------------------------------ pausable wait
const waiters = new Set();
function wait(ms, token) {
  return new Promise((resolve) => {
    const w = { remaining: ms, start: performance.now(), timer: null, resolve, token };
    const run = () => { w.start = performance.now(); w.timer = setTimeout(() => { waiters.delete(w); resolve(); }, w.remaining); };
    w.pause = () => { clearTimeout(w.timer); w.remaining -= performance.now() - w.start; };
    w.resume = run;
    w.cancel = () => { clearTimeout(w.timer); waiters.delete(w); resolve(); };
    waiters.add(w);
    if (!paused) run();
  });
}
function setPaused(p) {
  if (p === paused) return;
  paused = p;
  stage.classList.toggle('paused', p);
  waiters.forEach((w) => (p ? w.pause() : w.resume()));
  audio.pauseVoice(p);
  const v = $('#video'); if (v.classList.contains('on')) p ? v.pause() : v.play().catch(() => {});
  audio.suspend(p);
}
function cancelAll() { cancelToken++; waiters.forEach((w) => w.cancel()); audio.stopVoice(); }

// ------------------------------------------------------------------ actors
function actorSize(who) { const h = CHAR_SIZE[who] || 300; return { h, w: CHAR_WIDTH[who] ? h * CHAR_WIDTH[who] / 440 : h * 300 / 440 }; }
function makeActor(who, { x = 960, expr, pose, from, callframe } = {}) {
  removeActor(who);
  const el = document.createElement('div');
  el.className = 'actor';
  el.dataset.who = who;
  const { h, w } = actorSize(who);
  el.style.width = `${w}px`; el.style.height = `${h}px`;
  el.innerHTML = `<div class="inner"></div>`;
  el._expr = expr || (who === 'jolly' ? 'happy' : 'neutral');
  el._pose = pose || 'stand';
  if (callframe) el.classList.add('callframe');
  renderActor(el);
  const off = { left: -300, right: 2220 }[from];
  el.style.left = `${off ?? x}px`;
  if (from === 'top') { el.style.bottom = '1200px'; }
  if (from === 'bottom') { el.style.bottom = '-500px'; }
  $('#actors').appendChild(el);
  actors[who] = el;
  if (from) requestAnimationFrame(() => requestAnimationFrame(() => { el.style.left = `${x}px`; el.style.bottom = ''; }));
  return el;
}
function renderActor(el) {
  el.querySelector('.inner').innerHTML = character(el.dataset.who, el._expr, el._pose);
  el.classList.toggle('sit', el._pose === 'sit');
}
function setExpr(who, expr) { const el = actors[who]; if (el && el._expr !== expr) { el._expr = expr; renderActor(el); } }
function removeActor(who) { actors[who]?.remove(); delete actors[who]; }
function exitActor(who, to = 'right') {
  const el = actors[who]; if (!el) return;
  el.style.left = to === 'left' ? '-400px' : '2320px';
  setTimeout(() => { if (actors[who] === el) removeActor(who); }, 1200);
}
function animate(who, type) {
  const el = actors[who]; if (!el) return;
  const cls = `a-${type}`;
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  if (type !== 'faint') setTimeout(() => el.classList.remove(cls), 1600);
}

// ------------------------------------------------------------------ props
function showProp(name, { who, show: on = true } = {}) {
  const def = PROPS[name]; if (!def) return;
  let el = $(`#props [data-prop="${name}"]`);
  if (!on) { el?.classList.remove('on'); return; }
  if (!el) {
    el = document.createElement('div'); el.className = 'prop'; el.dataset.prop = name;
    el.style.width = `${def.w}px`; el.innerHTML = def.svg;
    $('#props').appendChild(el);
  }
  if (who && actors[who]) {
    const x = parseFloat(actors[who].style.left) || 960;
    el.style.left = `${x + 40}px`; el.style.top = '600px';
  } else { el.style.left = `${def.x ?? 860}px`; el.style.top = `${def.y ?? 600}px`; }
  requestAnimationFrame(() => el.classList.add('on'));
}

// ------------------------------------------------------------------ HUD
function clockText(hours) {
  const h = Math.max(0, hours);
  const t = new Date(Date.UTC(2026, 11, 24, 18, 0) - h * 3600e3);
  const day = t.getUTCDate();
  return { t: `${day} DEC · ${String(t.getUTCHours()).padStart(2, '0')}:00`, l: h <= 0 ? 'Christmas Eve is HERE' : `${h} hour${h === 1 ? '' : 's'} to Christmas Eve` };
}
function meterColor(v) { return v >= 75 ? '#5fd38a' : v >= 45 ? '#f6c445' : '#ff6b6b'; }
function renderHud(endingVerified = false) {
  const c = clockText(shown.hours);
  $('#hud .hud-clock .t').textContent = c.t;
  $('#hud .hud-clock .l').textContent = c.l;
  $('#hud .hud-clock').classList.toggle('urgent', shown.hours < 10);
  for (const k of ['gifts', 'quality', 'spirit']) {
    const m = $(`#hud .meter[data-k="${k}"]`);
    const v = Math.max(0, Math.min(100, Math.round(shown[k])));
    m.querySelector('.v').textContent = k === 'quality' && shown.gifts === 0 ? '—' : `${Math.round(shown[k])}%`;
    m.querySelector('.fill').style.width = `${k === 'quality' && shown.gifts === 0 ? 0 : v}%`;
    m.querySelector('.fill').style.background = meterColor(v);
  }
  $('#hud .kpi .k2').textContent = endingVerified ? '100% ✔✔' : '100% ✅';
}
function bumpMeter(k) { const m = $(`#hud .meter[data-k="${k}"]`); if (m) { m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); } }
function syncHud(story, skip = []) {
  shown.hours = story.hours;
  for (const k of ['gifts', 'quality', 'spirit']) if (!skip.includes(k)) { if (Math.round(shown[k]) !== Math.round(story[k])) bumpMeter(k); shown[k] = story[k]; }
  renderHud();
}

// ------------------------------------------------------------------ screen text (JOLLY dashboards)
function setScreenText(bg, text) {
  const el = $('#wallscreen');
  if (!text) { el.style.display = 'none'; return; }
  const pos = SCREEN_POS[bg];
  el.className = '';
  if (pos) Object.assign(el.style, { left: `${pos.x}px`, top: `${pos.y}px`, width: `${pos.w}px`, height: `${pos.h}px`, display: 'grid' });
  else {
    el.classList.add('holo');
    const jx = actors.jolly ? parseFloat(actors.jolly.style.left) : 960;
    Object.assign(el.style, { left: `${Math.max(20, Math.min(1380, jx - 260))}px`, top: '300px', width: '520px', height: '150px', display: 'grid' });
  }
  if (/AUDIT|INCIDENT|−80|SORRY|BRNO/.test(text)) el.classList.add('red');
  el.textContent = text;
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
}

// ------------------------------------------------------------------ subtitles & cards
function subtitle(beat) {
  const box = $('#subs .box');
  if (!beat || !beat.text) { box.classList.remove('on'); return; }
  const cast = CAST[beat.who] || {};
  const name = beat.alsoSpeaking ? 'Everyone' : cast.name;
  box.className = `box on ${beat.who === 'narrator' ? 'narrator' : ''}`;
  box.innerHTML = `${beat.who === 'narrator' ? '' : `<span class="who" style="color:${cast.color}">${name}</span>`}${escapeHtml(beat.text)}`;
}
function card(c) {
  const el = $('#card');
  if (!c) { el.className = ''; return; }
  el.className = `on ${c.small ? 'small' : 'full'} ${c.big ? 'big' : ''}`;
  el.innerHTML = `<div><div class="t">${escapeHtml(c.title)}</div>${c.sub ? `<div class="s">${escapeHtml(c.sub)}</div>` : ''}</div>`;
}
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ------------------------------------------------------------------ scene setup
let currentBg = null;
function setupScene(sceneId, story) {
  const sc = SCENES[sceneId];
  $('#bg').innerHTML = background(sc.bg, story);
  currentBg = sc.bg;
  Object.keys(actors).forEach(removeActor);
  $('#props').innerHTML = '';
  $('#fx').innerHTML = '';
  fx.clear();
  if (OUTDOOR.has(sc.bg)) fx.snow(true); else fx.snow(false);
  for (const [who, c] of Object.entries(sc.cast || {})) makeActor(who, c);
  setScreenText(sc.bg, null);
  $('#hud').classList.toggle('hidden', !sc.hud);
  const animated = sc.beats.filter((b) => b.progress).map((b) => b.progress.stat);
  syncHud(story, animated);
  world.style.transform = '';
  $('#review').className = ''; $('#credits').className = '';
  card(null); subtitle(null);
  audio.setMood(sc.music);
}

// ------------------------------------------------------------------ beats
async function runBeat(beat, story, token) {
  const sc = SCENES[show.sceneId];
  // camera
  if (beat.camera?.zoom && actors[beat.camera.zoom]) {
    const x = parseFloat(actors[beat.camera.zoom].style.left);
    world.style.transformOrigin = `${x}px 75%`; world.style.transform = 'scale(1.2)';
  } else world.style.transform = '';
  if (beat.camera?.shake) { world.classList.remove('shake'); void world.offsetWidth; world.classList.add('shake'); }

  // actions
  for (const a of beat.do || []) {
    if (a.enter) makeActor(a.enter, { x: a.at, from: a.from, expr: beat.expr?.[a.enter], callframe: a.screenCall });
    if (a.exit) exitActor(a.exit, a.to);
    if (a.move && actors[a.move]) actors[a.move].style.left = `${a.to}px`;
    if (a.pose && actors[a.pose]) { actors[a.pose]._pose = a.value; renderActor(actors[a.pose]); }
    if (a.prop) showProp(a.prop, a);
    if (a.clock) { syncHud(story, sc.beats.filter((b) => b.progress).map((b) => b.progress.stat)); const c = $('#hud .hud-clock'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); audio.sfx('tick'); }
  }
  for (const [who, e] of Object.entries(beat.expr || {})) setExpr(who, e);
  for (const [who, t] of Object.entries(beat.anim || {})) animate(who, t);
  if (beat.screen) setScreenText(currentBg, beat.screen);
  if (beat.fx) runFx(beat.fx);
  if (beat.sfx) audio.sfx(beat.sfx);
  if (beat.card) card(beat.card); else if (!beat.text) card(null);
  if (beat.card && beat.text) card(beat.card);
  if (beat.progress) runProgress(beat.progress, story);
  if (beat.review) showReview(beat.review);
  if (beat.credits) showCredits();

  // speech
  const speakers = beat.text ? [beat.who, ...(beat.alsoSpeaking || [])] : [];
  Object.entries(actors).forEach(([w, el]) => el.classList.toggle('talking', speakers.includes(w)));
  subtitle(beat);
  const dur = beatDuration(beat, voices) * 1000;
  if (beat.text && voices[voiceKey(beat)] && !PREVIEW && SPEED === 1 && audio.audioState.armed) audio.playVoice(`/audio/voices/${voiceKey(beat)}.mp3`);
  await wait(dur / SPEED, token);
  Object.values(actors).forEach((el) => el.classList.remove('talking'));
  if (beat.card && !beat.card.big) card(null);
  if (beat.progress) $('#progress').classList.remove('on');
}

function runProgress(p, story) {
  const el = $('#progress');
  const target = p.stat === 'delivered' ? delivery(story).value : Math.min(100, story[p.stat]);
  const from = p.stat === 'delivered' ? 0 : Math.min(100, shown[p.stat]);
  el.querySelector('.name').textContent = p.label;
  el.querySelector('.fill').style.transition = 'none';
  el.querySelector('.fill').style.width = `${from}%`;
  el.querySelector('.pc').textContent = `${Math.round(from)}%`;
  el.classList.add('on');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.querySelector('.fill').style.transition = '';
    el.querySelector('.fill').style.width = `${target}%`;
    countUp(el.querySelector('.pc'), from, p.stat === 'delivered' ? target : story[p.stat], 1800);
  }));
  if (p.stat !== 'delivered') setTimeout(() => { shown[p.stat] = story[p.stat]; bumpMeter(p.stat); renderHud(); }, 1600);
}
function countUp(el, a, b, ms) {
  const t0 = performance.now();
  const tick = (t) => { const k = Math.min(1, (t - t0) / ms); el.textContent = `${Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3)))}%`; if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

function runFx(name) {
  const jx = actors.jolly ? parseFloat(actors.jolly.style.left) : 960;
  switch (name) {
    case 'windows': fx.lightWindows(); break;
    case 'map': fx.map(); break;
    default: fx.play(name, { x: jx });
  }
}

function showReview(r) {
  const el = $('#review');
  const endingName = { A: 'Christmas Saved! 🎄', B: 'Christmas Saved… Sort Of 🤷', C: 'Christmas Not Found 404 ☁️' }[r.ending];
  el.innerHTML = `<h1>${escapeHtml(r.title)}</h1>${r.lines.map((l, i) => `<div class="row" style="transition-delay:${0.6 + i * 1.6}s"><div class="n">${i + 1}. ${escapeHtml(l.label)}</div><div>${escapeHtml(l.text)}</div></div>`).join('')}
    <div class="score" style="transition-delay:${0.6 + r.lines.length * 1.6}s">${endingName}<br>Happy children: <b>${r.value}%</b></div>`;
  el.className = 'on';
  requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.row,.score').forEach((x) => x.classList.add('on'))));
  $('#hud').classList.add('hidden');
}
function showCredits() {
  $('#review').className = '';
  const el = $('#credits');
  const end = show?.story ? outcome(show.story).ending : 'A';
  el.innerHTML = `<div><h1>${end === 'C' ? 'Thank you, IT!' : 'Thank you, IT!'}</h1><p>You made ${Object.keys(show?.story?.choices || {}).length} decisions tonight. Together.</p><p>🎄 Merry Christmas & a bug-free New Year 🎄</p><p class="small">Ježíšek 404: Christmas Not Found · an interactive Christmas comedy</p></div>`;
  el.className = 'on';
  fx.play('fireworks');
}

// ------------------------------------------------------------------ scene playback
async function playScene(view) {
  cancelAll();
  const token = cancelToken;
  playingRun = view.sceneRun;
  const sc = SCENES[view.sceneId];
  setupScene(view.sceneId, view.story);
  const beats = beatsFor(view.sceneId, view.story);
  let start = Math.min(view.beat || 0, beats.length);

  // optional cinematic clip (Seedance) replaces the beats marked videoReplaces
  if (sc.video && videos[sc.video] && start === 0 && !PREVIEW) {
    const ok = await playVideo(videos[sc.video], token);
    if (token !== cancelToken) return;
    if (ok) while (start < beats.length && beats[start].videoReplaces) start++;
  }

  for (let i = start; i < beats.length; i++) {
    if (token !== cancelToken) return;
    report('progress', i);
    await runBeat(beats[i], view.story, token);
  }
  if (token !== cancelToken) return;
  subtitle(null);
  report('ended');
}

function playVideo(url, token) {
  return new Promise((resolve) => {
    const v = $('#video');
    v.src = url; v.classList.add('on'); v.muted = !audio.audioState.armed;
    const done = (ok) => { v.onended = v.onerror = null; v.classList.remove('on'); v.pause(); clearTimeout(guard); audio.duck(false); resolve(ok); };
    v.onended = () => done(true);
    v.onerror = () => done(false);
    const guard = setTimeout(() => done(true), 15000);
    audio.duck(true);
    v.play().catch(() => done(false));
    const watch = setInterval(() => { if (token !== cancelToken) { clearInterval(watch); done(false); } }, 200);
  });
}

function report(type, beat) {
  if (PREVIEW) return;
  if (SOLO) { if (type === 'ended') command('sceneEnded', { sceneRun: playingRun }); return; }
  fetch('/api/screen', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Host-Pin': PIN }, body: JSON.stringify({ type, sceneRun: playingRun, beat }) }).catch(() => {});
}

// ------------------------------------------------------------------ decision overlay
let lastDecisionRender = '';
function renderDecision(view) {
  const el = $('#vote');
  const d = view.decision;
  if (!d || !['decision', 'voting', 'revealed'].includes(view.phase)) { el.className = ''; lastDecisionRender = ''; return; }
  const keys = Object.keys(d.options);
  const sig = `${d.id}|${view.phase}|${view.voting}`;
  if (sig !== lastDecisionRender) {
    lastDecisionRender = sig;
    const hands = view.voting === 'hands';
    const tag = view.phase === 'voting' ? (hands ? 'RAISE YOUR HAND!' : 'VOTE NOW') : view.phase === 'decision' ? 'YOUR DECISION' : 'THE AUDIENCE HAS DECIDED';
    el.innerHTML = `<div class="tag ${view.phase === 'voting' ? 'live' : ''}">${tag}</div><div class="q">${escapeHtml(d.question)}</div>
      <div class="opts">${keys.map((k, i) => `<div class="opt ${'AB'[i]}" data-k="${k}"><div class="letter">${'AB'[i]}</div><div class="ic">${ICONS[d.options[k].icon] || '⭐'}</div><div class="lb">${escapeHtml(d.options[k].label)}</div><div class="sb">${escapeHtml(d.options[k].sub)}</div><div class="res"><div class="bar"><div class="fill"></div></div><div class="pc"></div></div></div>`).join('')}</div>
      <div class="verdict"></div>
      <div class="join">${hands ? `<div class="hands">✋ In the room: raise your hand for <b>A</b> or <b>B</b> · Online: vote in the chat</div>` : `<img alt="" src="/api/qr.svg?u=${encodeURIComponent(joinUrl())}"><div><div class="url">${escapeHtml(joinUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''))}</div><div class="hands">📱 Scan & vote · ✋ or raise your hand</div><div class="count"><b class="n">0</b> votes</div></div>`}</div>`;
    el.className = `on ${view.phase === 'revealed' ? 'revealed' : ''}`;
    if (view.phase === 'voting') { audio.sfx('voteOpen'); }
    if (view.phase === 'revealed') revealResult(view);
    audio.setMood('vote');
  }
  const n = el.querySelector('.count .n'); if (n) n.textContent = d.total;
}
function revealResult(view) {
  const el = $('#vote'); const d = view.decision;
  const total = d.counts ? Object.values(d.counts).reduce((a, b) => a + b, 0) : 0;
  const verdict = el.querySelector('.verdict');
  audio.sfx(d.manual ? 'reveal' : 'drumroll');
  el.querySelectorAll('.opt').forEach((o) => {
    const k = o.dataset.k;
    const pc = !d.manual && total ? Math.round((d.counts[k] / total) * 100) : null;
    if (pc === null) o.querySelector('.res').style.display = 'none';
    else setTimeout(() => { o.querySelector('.fill').style.width = `${pc}%`; countUp(o.querySelector('.pc'), 0, pc, 1600); }, 200);
  });
  setTimeout(() => {
    el.querySelectorAll('.opt').forEach((o) => o.classList.add(o.dataset.k === d.winner ? 'win' : 'lose'));
    if (!d.manual) audio.sfx('reveal');
    verdict.textContent = d.tie && !d.winner ? 'It’s a tie! Ježíšek must decide…' : d.manual ? 'The room has decided!' : `${total} votes · the audience has decided!`;
    if (d.winner) fx.play('confettiSmall');
  }, d.manual ? 100 : 1900);
}
function joinUrl() { return config.joinUrl || `${location.origin}/vote`; }

// ------------------------------------------------------------------ lobby
function renderLobby(view) {
  const el = $('#lobby');
  if (view.phase !== 'lobby') { el.className = ''; return; }
  if (!el.classList.contains('on')) {
    el.innerHTML = `<div class="inner"><h1>JEŽÍŠEK 404</h1><h2>Christmas Not Found</h2>
      <div class="joinbox"><img alt="" src="/api/qr.svg?u=${encodeURIComponent(joinUrl())}"><div class="txt">Help save Christmas!<br>Scan to join the vote:<br><span class="url">${escapeHtml(joinUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''))}</span></div></div>
      <div class="phones"><b class="n">0</b> rescuers connected · no app, no login</div></div>`;
    el.className = 'on';
    $('#bg').innerHTML = background('village', {}); fx.snow(true); $('#hud').classList.add('hidden');
    Object.keys(actors).forEach(removeActor); subtitle(null); card(null);
    audio.setMood('cozy');
  }
  const n = el.querySelector('.n'); if (n) n.textContent = view.phones ?? 0;
}

// ------------------------------------------------------------------ state handling
function onState(view) {
  const prev = show;
  show = view;
  setPaused(!!view.paused);
  renderLobby(view);
  if (view.phase === 'playing') {
    $('#vote').className = ''; lastDecisionRender = '';
    if (view.sceneRun !== playingRun) playScene(view);
  } else if (['decision', 'voting', 'revealed'].includes(view.phase)) {
    if (prev?.phase === 'playing' || playingRun === null) { cancelAll(); playingRun = view.sceneRun; subtitle(null); }
    if (playingRun === null || !$('#bg').innerHTML) setupScene(view.sceneId || 's1_empty', view.story);
    renderDecision(view);
  } else if (view.phase === 'ended') {
    $('#vote').className = '';
    if (prev?.phase !== 'ended' && !$('#credits').classList.contains('on')) { cancelAll(); showCredits(); audio.setMood('credits'); }
  } else if (view.phase === 'lobby') {
    cancelAll(); playingRun = null; $('#vote').className = ''; $('#review').className = ''; $('#credits').className = '';
  }
}

// ------------------------------------------------------------------ commands (keyboard + solo)
let soloShow = null;
function command(cmd, arg = {}) {
  if (SOLO) {
    soloShow = reduce(soloShow, cmd, arg);
    try { localStorage.setItem('jezisek-solo', JSON.stringify(soloShow)); } catch { /* ignore */ }
    onState({ ...publicView(soloShow, { withCounts: true }), phones: 0 });
    return;
  }
  fetch(`/api/host/${cmd}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Host-Pin': PIN }, body: JSON.stringify(arg) }).catch(() => {});
}
function smartNext() {
  if (!show) return;
  switch (show.phase) {
    case 'lobby': case 'ended': return command('start');
    case 'decision': return command('openVote');
    case 'voting': return show.voting === 'hands' ? null : command('closeVote');
    case 'revealed': return show.decision?.winner ? command('continue') : null;
    default: return null;
  }
}
addEventListener('keydown', (e) => {
  if (PREVIEW) return;
  const k = e.key;
  if (k === 'f' || k === 'F') { document.documentElement.requestFullscreen?.(); return; }
  if (k === 'c' || k === 'C') { document.body.classList.toggle('show-cursor'); return; }
  if (!SOLO && !params.has('keys')) return; // keyboard control only in solo mode or with ?keys
  if (k === ' ') { e.preventDefault(); if (show.phase === 'lobby') command('start'); else command(show.paused ? 'resume' : 'pause'); }
  else if (k === 'Enter' || k === 'ArrowRight') smartNext();
  else if (k === '1' || k === 'a' || k === 'A') command('pick', { option: Object.keys(show.decision?.options || {})[0] });
  else if (k === '2' || k === 'b' || k === 'B') command('pick', { option: Object.keys(show.decision?.options || {})[1] });
  else if (k === 's' || k === 'S') command('skipScene');
  else if (k === 'r' || k === 'R') { if (e.shiftKey) command('restart'); }
});

// ------------------------------------------------------------------ boot
async function boot() {
  try { const r = await fetch('/audio/voices/manifest.json'); if (r.ok) voices = (await r.json()).durations || {}; } catch { /* no voices: subtitles only */ }
  try { const r = await fetch('/video/manifest.json'); if (r.ok) videos = (await r.json()).slots || {}; } catch { /* no videos */ }
  if (!SOLO) { try { const r = await fetch('/api/config'); if (r.ok) config = await r.json(); } catch { /* offline */ } }

  const armEl = $('#arm');
  if (PREVIEW || params.has('autoplay')) armEl.remove();
  else armEl.addEventListener('click', () => { audio.arm(); armEl.remove(); if (show) audio.setMood(show.phase === 'lobby' ? 'cozy' : SCENES[show.sceneId]?.music); }, { once: true });

  if (SOLO) {
    try { soloShow = JSON.parse(localStorage.getItem('jezisek-solo')); } catch { soloShow = null; }
    if (!soloShow || !soloShow.phase) soloShow = newShow();
    soloShow.paused = soloShow.phase !== 'lobby';
    command('setVoting', { mode: 'hands' });
    $('#status').textContent = 'SOLO · Space start/pause · Enter next · 1/2 pick · S skip · Shift+R restart';
    return;
  }
  connect();
}

function connect() {
  const st = $('#status');
  liveState({
    role: 'screen', pin: PIN, preview: PREVIEW, onState,
    onStatus: (s) => {
      // Tiny corner hint for the operator only; the audience never sees controls.
      st.textContent = { live: '', polling: '', reconnecting: 'reconnecting…', offline: 'offline — retrying…', unauthorized: 'wrong PIN in the screen URL (?pin=…)' }[s] ?? '';
      st.className = s === 'live' || s === 'polling' ? '' : 'bad';
    },
  });
}

boot();

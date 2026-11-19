import { liveState } from './live.js';
const $ = (s) => document.querySelector(s);
const app = $('#app');
const ICONS = { siren: '🚨', check: '✅', robot: '🤖', hammer: '🔨', form: '📋', bolt: '⚡', drone: '🛸', sleigh: '🛷' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const JOLLY = `<svg class="jolly" viewBox="0 0 300 330"><rect x="118" y="10" width="64" height="40" rx="8" fill="#f6c445"/><circle cx="150" cy="170" r="118" fill="#ff5d73" stroke="#8c1a2f" stroke-width="5"/><rect x="78" y="98" width="144" height="118" rx="38" fill="#141a33"/><path d="M100 152 q15 -20 30 0 M170 152 q15 -20 30 0" stroke="#7ff3ff" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M126 184 q24 18 48 0" stroke="#7ff3ff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;

let deviceId = null;
try { deviceId = localStorage.getItem('jezisek-device'); } catch {}
if (!deviceId) { deviceId = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^A-Za-z0-9_-]/g, ''); try { localStorage.setItem('jezisek-device', deviceId); } catch {} }

let state = null;
let myVotes = {};                 // decisionKey -> option
try { myVotes = JSON.parse(sessionStorage.getItem('jezisek-votes') || '{}'); } catch {}
let revealSeenAt = {};            // decision closedAt -> local time first seen
let lastRenderKey = '';
let sending = false;

const keyOf = (d) => d ? `${d.id}:${d.openedAt || ''}` : '';

function render() {
  const s = state; if (!s) return;
  const d = s.decision;
  let key = `${s.phase}|${d?.id}|${myVotes[keyOf(d)]}|${s.voting}`;
  if (s.phase === 'revealed') {
    const seen = revealSeenAt[d.closedAt] ||= Date.now();
    const show = Date.now() - seen >= (s.phoneDelay || 0) * 1000;
    key += show ? '|show' : '|wait';
    if (!show) setTimeout(render, 500);
  }
  if (key === lastRenderKey) { const c = $('.count .n'); if (c && d) c.textContent = d.total; return; }
  lastRenderKey = key;

  if (s.phase === 'voting') {
    if (s.voting === 'hands') { app.innerHTML = `<div class="panel"><span class="tag live">RAISE YOUR HAND</span><div class="q">${esc(d.question)}</div><p class="muted">This vote happens by show of hands in the room. Watch the screen!</p></div>`; return; }
    const mine = myVotes[keyOf(d)];
    app.innerHTML = `<div class="panel"><span class="tag live">VOTE NOW</span><div class="q">${esc(d.question)}</div>
      ${Object.entries(d.options).map(([k, o], i) => `<button class="opt ${'AB'[i]} ${mine === k ? 'sel' : ''}" data-k="${k}"><span class="l">${'AB'[i]}</span><span class="ic">${ICONS[o.icon] || '⭐'}</span><span><div class="t">${esc(o.label)}</div><div class="s">${esc(o.sub)}</div></span></button>`).join('')}
      <div class="note">${mine ? 'Vote received ✓ You can still change it.' : 'Tap your choice.'}</div><div class="count"><span class="n">${d.total}</span> votes so far</div></div>`;
    app.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => vote(b.dataset.k)));
    return;
  }
  if (s.phase === 'decision') {
    app.innerHTML = `<div class="panel"><span class="tag">GET READY</span><div class="q">${esc(d.question)}</div><div class="wait">⏳</div><p class="muted">Voting opens in a moment. Keep this page open!</p></div>`;
    return;
  }
  if (s.phase === 'revealed') {
    const mine = myVotes[keyOf(d)];
    if (key.endsWith('|wait') || !d.winner) {
      app.innerHTML = `<div class="panel"><span class="tag">VOTING CLOSED</span><div class="wait">👀</div><div class="big">Watch the screen for the result!</div>${mine ? `<p class="muted">You voted: <b>${esc(d.options[mine]?.label)}</b></p>` : ''}</div>`;
      return;
    }
    const total = d.counts ? Object.values(d.counts).reduce((a, b) => a + b, 0) : 0;
    app.innerHTML = `<div class="panel result"><span class="tag">DECIDED</span><div class="q">${esc(d.options[d.winner].label)} ${ICONS[d.options[d.winner].icon] || ''}</div>
      ${!d.manual && total ? Object.entries(d.options).map(([k, o]) => { const pc = Math.round((d.counts[k] / total) * 100); return `<div class="row ${k === d.winner ? 'win' : ''}"><span>${esc(o.label)}</span><span>${pc}%</span></div><div class="bar"><div class="fill" style="width:${pc}%"></div></div>`; }).join('') : '<p class="muted">Decided by the room.</p>'}
      <p class="muted">${mine ? (mine === d.winner ? 'You were with the majority! 🎉' : 'Not your pick this time — the story goes on! 😄') : 'Watch what happens next…'}</p></div>`;
    return;
  }
  if (s.phase === 'ended') {
    app.innerHTML = `<div class="panel">${JOLLY}<div class="big">Thank you for saving Christmas! 🎄</div><p class="muted">Happy holidays from IT. You may now close this page.</p></div>`;
    return;
  }
  // lobby / playing
  app.innerHTML = `<div class="panel">${JOLLY}<div class="big">${s.phase === 'lobby' ? 'You’re in! 🎄' : 'The story is running…'}</div><p class="muted">Watch the big screen. When Ježíšek needs your help, the vote will pop up <b>right here</b>.</p><p class="muted">Remote? The broadcast may lag a little — the vote stays open long enough for everyone.</p></div>`;
}

async function vote(option) {
  const d = state?.decision; if (!d || sending) return;
  const prev = myVotes[keyOf(d)];
  myVotes[keyOf(d)] = option; save(); render();
  navigator.vibrate?.(30);
  sending = true;
  try {
    const r = await fetch('/api/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId, option, decision: d.id }) });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Vote failed'); }
  } catch (e) {
    if (prev) myVotes[keyOf(d)] = prev; else delete myVotes[keyOf(d)];
    save(); lastRenderKey = ''; render();
    const n = $('.note'); if (n) n.textContent = `⚠️ ${e.message}. Try again.`;
  } finally { sending = false; }
}
function save() { try { sessionStorage.setItem('jezisek-votes', JSON.stringify(myVotes)); } catch {} }

function onState(s) {
  if (s.phase === 'voting' && state && state.phase !== 'voting') navigator.vibrate?.([60, 40, 60]);
  state = s; render();
}

// Live connection (stream, with automatic polling fallback behind buffering proxies)
liveState({
  role: 'phone', cid: deviceId, pollMs: 1500, onState,
  onStatus: (s) => { $('#conn').style.display = s === 'live' || s === 'polling' ? 'none' : 'block'; },
});

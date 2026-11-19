import { SCENES, CAST, beatsFor, DECISIONS, outcome } from '/shared/story.js';
import { DECISION_ORDER, allPaths, playPath } from '/shared/model.js';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let PIN = ''; try { PIN = sessionStorage.getItem('jezisek-pin') || new URLSearchParams(location.search).get('pin') || ''; } catch {}
let S = null;

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => (t.style.display = 'none'), 3500); }
async function cmd(name, arg = {}) {
  try {
    const r = await fetch(`/api/host/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Host-Pin': PIN }, body: JSON.stringify(arg) });
    if (r.status === 401) { askPin(); return; }
    const j = await r.json(); if (!r.ok) throw new Error(j.error); render(j);
  } catch (e) { toast(`Command failed: ${e.message}`); }
}
function askPin() { $('#pinbox').style.display = 'grid'; $('#pin').focus(); }
$('#pin-ok').onclick = () => { PIN = $('#pin').value; try { sessionStorage.setItem('jezisek-pin', PIN); } catch {} $('#pinbox').style.display = 'none'; connect(); };
$('#pin').onkeydown = (e) => { if (e.key === 'Enter') $('#pin-ok').click(); };

// ---------------------------------------------------------------- main action
function mainAction() {
  if (!S) return null;
  switch (S.phase) {
    case 'lobby': return { label: '▶ Start show', run: () => cmd('start') };
    case 'playing': return { label: S.paused ? '▶ Resume' : '🎬 Story playing…', run: S.paused ? () => cmd('resume') : null };
    case 'decision': return { label: S.voting === 'hands' ? '✋ Ask the room — then pick A or B' : '🗳 Open voting', run: () => cmd('openVote') };
    case 'voting': return { label: S.voting === 'hands' ? '✋ Pick A or B below' : '🔒 Close voting & reveal', run: S.voting === 'hands' ? null : () => cmd('closeVote'), cls: 'voting' };
    case 'revealed': return S.decision?.winner ? { label: `▶ Continue: ${S.decision.options[S.decision.winner].label}`, run: () => cmd('continue') } : { label: 'Tie! Pick A or B below', run: null };
    case 'ended': return { label: '⟲ Back to lobby', run: () => cmd('restart') };
    default: return null;
  }
}
$('#main-action').onclick = () => mainAction()?.run?.();
$('#pause').onclick = () => cmd(S?.paused ? 'resume' : 'pause');
$('#skip').onclick = () => cmd('skipScene');
$('#reopen').onclick = () => cmd('openVote');
$('#pickA').onclick = () => pick(0);
$('#pickB').onclick = () => pick(1);
function pick(i) { const k = Object.keys(S?.decision?.options || {})[i]; if (k) cmd('pick', { option: k }); }
$('#restart').onclick = () => { if (confirm('Restart the whole show and go back to the lobby?')) cmd('restart'); };
$('#voting').onchange = (e) => cmd('setVoting', { mode: e.target.value });
$('#delay').oninput = (e) => { $('#delay-v').textContent = e.target.value; };
$('#delay').onchange = (e) => cmd('setDelay', { seconds: Number(e.target.value) });

addEventListener('keydown', (e) => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.key === 'Enter') { e.preventDefault(); $('#main-action').click(); }
  else if (e.key === ' ') { e.preventDefault(); $('#pause').click(); }
  else if (e.key === '1') pick(0);
  else if (e.key === '2') pick(1);
  else if (e.key === 's' || e.key === 'S') $('#skip').click();
});

// ---------------------------------------------------------------- render
function render(s) {
  S = s;
  $('#phase').textContent = s.phase;
  $('#paused').style.display = s.paused ? '' : 'none';
  $('#phones').textContent = s.clients?.phone ?? 0;
  $('#screens').textContent = s.clients?.screen ?? 0;
  const a = mainAction(); const b = $('#main-action');
  b.textContent = a?.label || '—'; b.disabled = !a?.run; b.className = a?.cls || '';
  $('#pause').textContent = s.paused ? '▶ Resume' : '⏸ Pause';
  $('#skip').disabled = s.phase !== 'playing';
  const inDecision = ['decision', 'voting', 'revealed'].includes(s.phase);
  $('#pickA').disabled = $('#pickB').disabled = !inDecision;
  $('#reopen').disabled = !(s.phase === 'revealed' && s.voting === 'phones');
  if (inDecision) { const k = Object.keys(s.decision.options); $('#pickA').textContent = `✋ A: ${s.decision.options[k[0]].label}`; $('#pickB').textContent = `✋ B: ${s.decision.options[k[1]].label}`; }
  else { $('#pickA').textContent = '✋ A wins'; $('#pickB').textContent = '✋ B wins'; }
  $('#voting').value = s.voting;
  if (document.activeElement !== $('#delay')) { $('#delay').value = s.phoneDelay; $('#delay-v').textContent = s.phoneDelay; }

  // teleprompter
  if (s.sceneId && s.phase === 'playing') {
    const beats = beatsFor(s.sceneId, s.story);
    const i = Math.min(s.beat, beats.length - 1);
    const line = (bt) => !bt ? '' : bt.text ? `<span class="who" style="color:${CAST[bt.who]?.color}">${esc(bt.alsoSpeaking ? 'Everyone' : CAST[bt.who]?.name)}</span>${esc(bt.text)}` : bt.card ? `<span class="who">Title card</span>${esc(bt.card.title)} — ${esc(bt.card.sub || '')}` : bt.review ? '<span class="who">Post-incident review</span>' : bt.credits ? '<span class="who">Credits</span>' : '<span class="who">Action</span>…';
    $('#scene-title').textContent = `Act ${SCENES[s.sceneId].act} · ${SCENES[s.sceneId].title}`;
    $('#beat-count').textContent = `beat ${i + 1}/${beats.length}`;
    $('#now').innerHTML = line(beats[i]);
    $('#next').innerHTML = beats[i + 1] ? `Next: ${line(beats[i + 1]).replace(/<span class="who"[^>]*>/, '<b>').replace('</span>', ':</b> ')}` : 'Next: end of scene';
    $('#beat-bar').style.width = `${((i + 1) / beats.length) * 100}%`;
  } else if (inDecision) {
    $('#scene-title').textContent = 'Audience decision'; $('#beat-count').textContent = '';
    $('#now').innerHTML = `<span class="who">Say to the room</span>${esc(s.decision.question)}`;
    $('#next').innerHTML = s.phase === 'decision' ? 'Tip: “Grab your phones — or get ready to raise your hand!”' : s.phase === 'voting' ? 'Keep voting open ~30–45 s so remote viewers can catch up.' : 'Let the result sink in, then continue.';
  } else {
    $('#scene-title').textContent = s.phase === 'ended' ? 'The end' : 'Lobby'; $('#beat-count').textContent = '';
    $('#now').textContent = s.phase === 'ended' ? 'Show finished. Thank the audience!' : 'Show the screen with the QR code while people arrive. Press Start when ready.';
    $('#next').textContent = '';
  }

  // votes
  if (inDecision) {
    const d = s.decision; const total = Object.values(d.counts || {}).reduce((x, y) => x + y, 0);
    $('#votes').innerHTML = `<div style="font-weight:700;margin-bottom:6px">${esc(d.question)}</div>
      ${Object.entries(d.options).map(([k, o], i) => { const n = d.counts?.[k] || 0; const pc = total ? Math.round(n / total * 100) : 0; return `<div class="opt ${i ? 'b' : 'a'}"><div class="lbl"><span>${'AB'[i]} · ${esc(o.label)} ${d.winner === k ? '🏆' : ''}</span><span>${n} · ${pc}%</span></div><div class="bar"><div class="fill" style="width:${pc}%"></div></div></div>`; }).join('')}
      <div class="total">${total} <span style="font-size:14px;color:var(--muted)">votes ${s.phase === 'voting' && d.openedAt ? `· open ${Math.round((Date.now() - d.openedAt) / 1000)} s` : ''}</span></div>
      ${d.tie && s.phase === 'revealed' ? '<div class="hint" style="color:var(--gold)">Tie — pick the winner with A/B.</div>' : ''}${d.manual ? '<div class="hint">Decided manually.</div>' : ''}`;
  } else $('#votes').innerHTML = '<div class="hint">No decision on screen right now.</div>';

  // story state
  const st = s.story;
  $('#st-hours').textContent = st.hours; $('#st-gifts').textContent = `${st.gifts}%`; $('#st-quality').textContent = st.gifts ? `${st.quality}%` : '—'; $('#st-spirit').textContent = `${st.spirit}%`;
  $('#choices').innerHTML = DECISION_ORDER.map((d) => `<span class="chip ${st.choices[d] ? 'on' : ''}">${d.toUpperCase()}: ${st.choices[d] ? esc(DECISIONS[d].options[st.choices[d]].label) : '—'}</span>`).join('');
  $('#flags').innerHTML = Object.entries(st.flags).filter(([, v]) => v).map(([k]) => `<span class="chip">${esc(k)}</span>`).join('');
}

// ---------------------------------------------------------------- rehearsal tools
$('#path').innerHTML = DECISION_ORDER.map((d) => `<div><label>${d.toUpperCase()}</label><select data-d="${d}"><option value="">—</option>${Object.entries(DECISIONS[d].options).map(([k, o]) => `<option value="${k}">${esc(o.label)}</option>`).join('')}</select></div>`).join('');
$('#jump-scene').innerHTML = Object.entries(SCENES).map(([id, sc]) => `<option value="${id}">Act ${sc.act} · ${esc(sc.title)} (${id})</option>`).join('') + DECISION_ORDER.map((d) => `<option value="decision:${d}">🗳 Decision ${d.toUpperCase()}: ${esc(DECISIONS[d].question)}</option>`).join('');
$('#jump').onclick = () => {
  const path = [...document.querySelectorAll('#path select')].map((x) => x.value);
  const cut = path.indexOf(''); const p = cut === -1 ? path : path.slice(0, cut);
  const v = $('#jump-scene').value;
  if (v.startsWith('decision:')) { const d = v.slice(9); const idx = DECISION_ORDER.indexOf(d); cmd('jump', { path: p.slice(0, idx), decision: d }); }
  else cmd('jump', { sceneId: v, path: p });
};
const ENDN = { A: 'Saved!', B: 'Sort of', C: 'Not Found' };
$('#paths').innerHTML = '<tr><th>D1</th><th>D2</th><th>D3</th><th>D4</th><th>Ending</th><th></th></tr>' + allPaths().map((p) => { const o = outcome(playPath(p)); return `<tr>${p.map((x, i) => `<td>${esc(DECISIONS[DECISION_ORDER[i]].options[x].label)}</td>`).join('')}<td class="end-${o.ending}">${o.ending} · ${ENDN[o.ending]}</td><td><button data-p="${p.join(',')}">Load</button></td></tr>`; }).join('');
$('#paths').onclick = (e) => { const p = e.target.dataset?.p; if (!p) return; p.split(',').forEach((v, i) => (document.querySelectorAll('#path select')[i].value = v)); toast('Path loaded — choose a scene and press Jump'); };

// ---------------------------------------------------------------- connection
let es;
async function connect() {
  try { const c = await (await fetch('/api/config')).json(); $('#joinurl').textContent = c.joinUrl || `${location.origin}/vote`; if (c.pinRequired && !PIN) return askPin(); } catch {}
  es?.close();
  es = new EventSource(`/api/events?role=host&pin=${encodeURIComponent(PIN)}`);
  es.addEventListener('state', (e) => { $('#conn').textContent = 'live'; $('#conn').className = 'pill ok'; render(JSON.parse(e.data)); });
  es.onerror = () => { $('#conn').textContent = 'reconnecting…'; $('#conn').className = 'pill bad'; };
  if (PIN) { $('#preview').src = `/screen?preview&autoplay&pin=${encodeURIComponent(PIN)}`; }
}
setInterval(() => { if (S?.phase === 'voting') render(S); }, 1000);
connect();

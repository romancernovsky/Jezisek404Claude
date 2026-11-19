// Live show state for every page: Server-Sent Events first, automatic polling fallback.
//
// Some corporate proxies hold back streaming responses, so the live stream "connects" but
// never delivers anything. The server sends a ping event every 10 s; if no event has arrived
// for a while, this module polls /api/state instead (and keeps listening to the stream in case
// it recovers). Every state carries a version number (`rev`), so a late or duplicated update
// can never move a page backwards.

export function liveState({ role, pin = '', preview = false, cid = makeId(), onState, onStatus = () => {}, pollMs = 1000 }) {
  const qs = `role=${role}&pin=${encodeURIComponent(pin)}&cid=${encodeURIComponent(cid)}${preview ? '&preview=1' : ''}`;
  let lastRev = 0;
  let lastEventAt = 0;
  let status = '';
  let pollTimer = null;
  let polling = false;
  const started = Date.now();

  const setStatus = (s) => { if (s !== status) { status = s; onStatus(s); } };

  function deliver(view) {
    if (typeof view.rev === 'number') {
      if (view.rev < lastRev) return;         // stale (e.g. a buffered stream finally flushing)
      if (view.rev === lastRev) return;       // already have it
      lastRev = view.rev;
    }
    onState(view);
  }

  // --- live stream
  let es = null;
  function openStream() {
    try {
      es = new EventSource(`/api/events?${qs}`);
      es.addEventListener('state', (e) => { lastEventAt = Date.now(); if (!polling) setStatus('live'); deliver(JSON.parse(e.data)); });
      es.addEventListener('ping', () => { lastEventAt = Date.now(); if (!polling) setStatus('live'); });
      es.onerror = () => { if (!polling) setStatus('reconnecting'); };
    } catch { /* EventSource unavailable: polling covers it */ }
  }

  // --- polling fallback
  async function poll() {
    try {
      const r = await fetch(`/api/state?${qs}`, { cache: 'no-store' });
      if (r.status === 401) { setStatus('unauthorized'); return; }
      if (!r.ok) throw new Error(r.status);
      deliver(await r.json());
      setStatus('polling');
    } catch { setStatus('offline'); }
  }
  function watchdog() {
    const quietFor = Date.now() - (lastEventAt || started);
    const streamDead = lastEventAt === 0 ? quietFor > 3000 : quietFor > 15000;
    // Once the stream has proven unreliable, keep polling for the rest of the session: proxies that
    // release buffered data in bursts would otherwise make the page flip back and forth and stall.
    if (streamDead && !polling) { polling = true; poll(); pollTimer = setInterval(poll, pollMs); }
  }

  openStream();
  const wd = setInterval(watchdog, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && polling) poll(); });

  return {
    get mode() { return polling ? 'polling' : 'live'; },
    close() { clearInterval(wd); clearInterval(pollTimer); es?.close(); },
  };
}

function makeId() {
  try { return crypto.randomUUID().replace(/-/g, ''); } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
}

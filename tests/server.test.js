import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, qrSvg } from '../server/index.js';

async function start(opts = {}) {
  const server = createServer({ persist: false, pin: '', ...opts });
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (p, body = {}, headers = {}) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { server, base, post, host: (cmd, arg) => post(`/api/host/${cmd}`, arg).then((r) => r.json()) };
}

test('full show flow with phone votes, tie handling and manual override', async () => {
  const { server, post, host } = await start();
  try {
    let s = await host('start');
    assert.equal(s.phase, 'playing');
    // screen reports scene ends until the first decision
    while (s.phase === 'playing') { await post('/api/screen', { type: 'ended', sceneRun: s.sceneRun }); s = server.getShow(); }
    assert.equal(s.phase, 'decision'); assert.equal(s.decision.id, 'd1');
    // voting closed → vote rejected
    assert.equal((await post('/api/vote', { deviceId: 'abcdefgh1', option: 'alarm' })).status, 409);
    await host('openVote');
    for (let i = 0; i < 10; i++) assert.equal((await post('/api/vote', { deviceId: `device-${i}xyz`, option: i < 7 ? 'green' : 'alarm' })).status, 200);
    // changing a vote does not double count
    await post('/api/vote', { deviceId: 'device-0xyz', option: 'alarm' });
    assert.equal((await post('/api/vote', { deviceId: 'bad', option: 'alarm' })).status, 400);
    assert.equal((await post('/api/vote', { deviceId: 'abcdefgh9', option: 'nonsense' })).status, 400);
    const closed = await host('closeVote');
    assert.equal(closed.phase, 'revealed');
    assert.deepEqual(closed.decision.counts, { alarm: 4, green: 6 });
    assert.equal(closed.decision.winner, 'green');
    // presenter overrides with a hand vote
    const picked = await host('pick', { option: 'alarm' });
    assert.equal(picked.decision.winner, 'alarm'); assert.ok(picked.decision.manual);
    const cont = await host('continue');
    assert.equal(cont.sceneId, 's2_alarm');
    assert.equal(cont.story.choices.d1, 'alarm');
    // stale scene-end reports are ignored
    await post('/api/screen', { type: 'ended', sceneRun: cont.sceneRun - 1 });
    assert.equal(server.getShow().sceneId, 's2_alarm');
  } finally { server.close(); }
});

test('tie produces no winner until the presenter picks', async () => {
  const { server, post, host } = await start();
  try {
    await host('jump', { path: [], decision: 'd1' });
    await host('openVote');
    await post('/api/vote', { deviceId: 'tie-device-1', option: 'alarm' });
    await post('/api/vote', { deviceId: 'tie-device-2', option: 'green' });
    const s = await host('closeVote');
    assert.equal(s.decision.winner, null); assert.ok(s.decision.tie);
    const c = await host('continue'); assert.equal(c.phase, 'revealed', 'cannot continue without a winner');
  } finally { server.close(); }
});

test('phones never see live counts before the reveal', async () => {
  const { server, post, host, base } = await start();
  try {
    await host('jump', { path: [], decision: 'd1' });
    await host('openVote');
    await post('/api/vote', { deviceId: 'peek-device-1', option: 'alarm' });
    const pub = await (await fetch(`${base}/api/state`)).json();
    assert.equal(pub.decision.counts, null);
    assert.equal(pub.decision.total, 1);
  } finally { server.close(); }
});

test('PIN protects host and screen endpoints', async () => {
  const { server, post } = await start({ pin: '4242' });
  try {
    assert.equal((await post('/api/host/start')).status, 401);
    assert.equal((await post('/api/host/start', {}, { 'X-Host-Pin': '4242' })).status, 200);
    assert.equal((await post('/api/screen', { type: 'ended', sceneRun: 1 })).status, 401);
  } finally { server.close(); }
});

test('static pages, shared modules and QR are served; path traversal is blocked', async () => {
  const { server, base } = await start();
  try {
    for (const p of ['/', '/screen', '/host', '/map', '/shared/story.js', '/js/screen.js']) assert.equal((await fetch(base + p)).status, 200, p);
    assert.match(await (await fetch(`${base}/api/qr.svg?u=https://example.com/`)).text(), /^<svg/);
    assert.notEqual((await fetch(`${base}/../package.json`)).status, 200);
    assert.notEqual((await fetch(`${base}/%2e%2e/package.json`)).status, 200);
    assert.match(qrSvg('hello'), /<path d="M/);
  } finally { server.close(); }
});

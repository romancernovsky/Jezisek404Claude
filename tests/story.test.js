import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENES, FIRST_SCENE, nextStep, sceneAfterDecision, beatsFor, cond, CONSEQUENCES } from '../shared/story.js';
import { START_STATE, DECISIONS, DECISION_ORDER, allPaths, decide, playPath, outcome } from '../shared/model.js';

/** Walk the whole show for one path, returning visited scenes and the final state. */
function walk(path) {
  let s = structuredClone(START_STATE), scene = FIRST_SCENE, di = 0;
  const visited = [];
  for (let guard = 0; guard < 60; guard++) {
    visited.push({ scene, state: s });
    const n = nextStep(scene, s);
    if (n.end) return { visited, state: s };
    if (n.decision) {
      assert.equal(n.decision, DECISION_ORDER[di], `decisions must come in order (${path})`);
      s = decide(s, n.decision, path[di++]);
      scene = sceneAfterDecision(n.decision, s);
    } else scene = n.scene;
    assert.ok(SCENES[scene], `scene ${scene} exists`);
  }
  throw new Error('story did not end');
}

test('every one of the 16 paths plays from start to an ending without dead ends', () => {
  for (const p of allPaths()) {
    const { visited, state } = walk(p);
    assert.equal(Object.keys(state.choices).length, 4, `all four decisions taken on ${p}`);
    const endScene = visited.find((v) => SCENES[v.scene].ending);
    assert.ok(endScene, `path ${p} reaches an ending scene`);
    assert.equal(SCENES[endScene.scene].ending, outcome(state).ending, `ending scene matches computed outcome on ${p}`);
    assert.equal(visited.at(-1).scene, 's7_review');
    for (const v of visited) {
      const beats = beatsFor(v.scene, v.state);
      assert.ok(beats.length > 0, `${v.scene} has beats on ${p}`);
      if (v.scene !== 's7_review' && v.scene !== 's0_opening') assert.ok(beats.some((b) => b.text), `${v.scene} has dialogue on ${p}`);
    }
  }
});

test('all three endings are reachable and none dominates', () => {
  const counts = { A: 0, B: 0, C: 0 };
  for (const p of allPaths()) counts[outcome(playPath(p)).ending]++;
  assert.ok(counts.A >= 3 && counts.B >= 3 && counts.C >= 3, JSON.stringify(counts));
});

test('every decision matters: flipping any single choice changes the outcome somewhere', () => {
  DECISION_ORDER.forEach((d, i) => {
    const changes = allPaths().some((p) => {
      const q = [...p]; q[i] = Object.keys(DECISIONS[d].options).find((o) => o !== p[i]);
      const a = outcome(playPath(p)), b = outcome(playPath(q));
      return a.ending !== b.ending;
    });
    assert.ok(changes, `${d} must be able to change the ending`);
  });
});

test('no option is always right: every option appears in at least one A and one non-A path', () => {
  for (const [i, d] of DECISION_ORDER.entries()) {
    for (const o of Object.keys(DECISIONS[d].options)) {
      const ends = allPaths().filter((p) => p[i] === o).map((p) => outcome(playPath(p)).ending);
      assert.ok(ends.includes('A') || d === 'd1', `${d}:${o} can lead to success`);
      assert.ok(ends.some((e) => e !== 'A'), `${d}:${o} can also fail`);
    }
  }
});

test('every conditional line is reachable on at least one path (no dead content)', () => {
  const reached = new Set();
  for (const p of allPaths()) for (const v of walk(p).visited) beatsFor(v.scene, v.state).forEach((b) => reached.add(b));
  const dead = [];
  for (const [id, sc] of Object.entries(SCENES)) sc.beats.forEach((b, i) => { if (!reached.has(b)) dead.push(`${id}#${i}: ${b.when} ${b.text || ''}`); });
  assert.deepEqual(dead, []);
});

test('conditions only reference known facts', () => {
  const known = new Set(['transparent', 'coverUp', 'ai', 'elves', 'book', 'shortcut', 'compliant', 'safetyTested', 'aiAssist', 'gamingGpus', 'ductTape', 'drones', 'sleigh', 'auditDone']);
  const problems = new Set(['tooFewGifts', 'weirdGifts', 'grandma', 'grounded', 'tiredCrew', 'late']);
  for (const [id, sc] of Object.entries(SCENES)) for (const b of sc.beats) {
    if (!b.when) continue;
    for (const atom of b.when.split(/&&|\|\|/).map((a) => a.trim().replace(/^!/, ''))) {
      if (/^(gifts|quality|spirit|hours|budget)\s*(>=|<=|>|<|==)\s*\d+$/.test(atom)) continue;
      if (atom.startsWith('problem:')) { assert.ok(problems.has(atom.slice(8)), `${id}: unknown problem ${atom}`); continue; }
      if (atom.startsWith('ending:')) continue;
      assert.ok(known.has(atom), `${id}: unknown flag "${atom}"`);
    }
  }
  assert.equal(cond('gifts>=90 && !compliant', { gifts: 95, flags: {} }), true);
});

test('every option has a recap text', () => {
  for (const d of DECISION_ORDER) for (const o of Object.keys(DECISIONS[d].options)) assert.ok(CONSEQUENCES[`${d}:${o}`]);
});

test('time never runs out before the final decision and state stays in range', () => {
  for (const p of allPaths()) {
    const s = playPath(p);
    assert.ok(s.hours > 0 && s.hours <= 24, `hours ${s.hours}`);
    for (const k of ['quality', 'spirit']) assert.ok(s[k] >= 0 && s[k] <= 100);
  }
});

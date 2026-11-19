// Prints the estimated runtime of every path (uses real voice durations when generated).
import fs from 'node:fs';
import { FIRST_SCENE, nextStep, sceneAfterDecision, beatsFor, beatDuration } from '../shared/story.js';
import { START_STATE, DECISION_ORDER, allPaths, decide, outcome } from '../shared/model.js';
let voices = {};
try { voices = JSON.parse(fs.readFileSync(new URL('../public/audio/voices/manifest.json', import.meta.url))).durations; } catch {}
const VOTE_SECONDS = Number(process.env.VOTE_SECONDS || 75); // decision intro + voting + reveal
export function runtime(path) {
  let s = structuredClone(START_STATE), scene = FIRST_SCENE, t = 0, di = 0; const seq = [];
  while (scene) {
    const d = beatsFor(scene, s).reduce((a, b) => a + beatDuration(b, voices), 0);
    t += d; seq.push([scene, Math.round(d)]);
    const n = nextStep(scene, s);
    if (n.end) break;
    if (n.decision) { t += VOTE_SECONDS; s = decide(s, n.decision, path[di++]); scene = sceneAfterDecision(n.decision, s); }
    else scene = n.scene;
  }
  return { total: t, seq, ending: outcome(s).ending };
}
if (process.argv[1].endsWith('timing.mjs')) {
  let min = 1e9, max = 0;
  for (const p of allPaths()) { const r = runtime(p); min = Math.min(min, r.total); max = Math.max(max, r.total); console.log(p.join(' ').padEnd(30), r.ending, `${(r.total / 60).toFixed(1)} min`); }
  console.log(`range ${(min / 60).toFixed(1)}–${(max / 60).toFixed(1)} min incl. ${VOTE_SECONDS}s per vote; voices: ${Object.keys(voices).length ? 'measured' : 'estimated'}`);
  console.log(runtime(allPaths()[0]).seq.map((x) => x.join(' ')).join('\n'));
}

// Ježíšek 404 — decision & consequence model (pure, shared by server, browser and tests).
// All numbers are percentages except `hours` (hours left until Christmas Eve delivery, 24 Dec 18:00).

export const START_STATE = Object.freeze({
  hours: 24,       // Dec 23, 18:00 → 24 hours to go
  gifts: 0,        // % of the 2 billion gifts produced
  quality: 0,      // % of gifts that are actually what a child wished for
  spirit: 50,      // elves' team spirit
  budget: 100,     // % of original budget
  flags: {},       // narrative facts (transparent, ai, elves, book, shortcut, drones, sleigh …)
  choices: {},     // decisionId -> optionId
});

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

// Time that passes between decisions (the story moves on even while we argue).
export const ELAPSED = { act2: 3, act3: 0, act4: 1 };

export const DECISIONS = {
  d1: {
    id: 'd1', act: 2,
    question: 'The workshop is empty. What does Ježíšek do first?',
    options: {
      alarm: { label: 'Raise the alarm', sub: 'Tell everyone the truth. Major incident!', icon: 'siren' },
      green: { label: 'Keep it green', sub: 'Fix it quietly. No panic, no meetings.', icon: 'check' },
    },
  },
  d2: {
    id: 'd2', act: 3,
    question: 'How do we produce two billion gifts in time?',
    options: {
      ai: { label: 'AI Mega-Factory', sub: 'JOLLY automates everything. Fast!', icon: 'robot' },
      elves: { label: 'Elf Night Shift', sub: 'Handmade by experts. Careful!', icon: 'hammer' },
    },
  },
  d3: {
    id: 'd3', act: 4,
    question: 'Budget cut by 80%. Approvals blocked. What now?',
    options: {
      book: { label: 'By the book', sub: 'Follow the process. Get it approved.', icon: 'form' },
      shortcut: { label: 'Shortcut', sub: 'Ask forgiveness, not permission.', icon: 'bolt' },
    },
  },
  d4: {
    id: 'd4', act: 5,
    question: 'Christmas Eve. How do the gifts reach the children?',
    options: {
      drones: { label: 'JOLLY Drone Swarm', sub: '10 million AI drones. Fast and precise.', icon: 'drone' },
      sleigh: { label: 'The Sleigh Relay', sub: 'Ježíšek and the elves fly it themselves.', icon: 'sleigh' },
    },
  },
};
export const DECISION_ORDER = ['d1', 'd2', 'd3', 'd4'];

function bump(s, d) {
  return {
    ...s,
    hours: Math.max(0, s.hours + (d.hours || 0)),
    gifts: clamp(s.gifts + (d.gifts || 0), 0, 120),
    quality: d.qualitySet !== undefined ? clamp(d.qualitySet) : clamp(s.quality + (d.quality || 0)),
    spirit: clamp(s.spirit + (d.spirit || 0)),
    budget: d.budgetSet !== undefined ? d.budgetSet : s.budget,
    flags: { ...s.flags, ...(d.flags || {}) },
  };
}

/** Apply one audience decision and the story time that follows it. Returns a new state. */
export function applyChoice(state, decisionId, optionId) {
  if (!DECISIONS[decisionId]?.options[optionId]) throw new Error(`Unknown choice ${decisionId}/${optionId}`);
  let s = { ...state, choices: { ...state.choices, [decisionId]: optionId } };
  const f = s.flags;
  switch (`${decisionId}:${optionId}`) {
    case 'd1:alarm':
      // One-hour incident call. The team rallies.
      s = bump(s, { hours: -1, spirit: +25, flags: { transparent: true } });
      s = bump(s, { hours: -ELAPSED.act2 });
      break;
    case 'd1:green':
      // No meeting, no panic... and nobody knows what is real.
      s = bump(s, { spirit: -15, flags: { transparent: false, coverUp: true } });
      s = bump(s, { hours: -ELAPSED.act2 });
      break;
    case 'd2:ai':
      s = bump(s, { hours: -3, gifts: +70, qualitySet: 35, flags: { ai: true } });
      break;
    case 'd2:elves':
      s = bump(s, { hours: -6, gifts: 40 + (f.transparent ? 15 : 0), qualitySet: 90, spirit: -10, flags: { elves: true } });
      break;
    case 'd3:book': {
      // Process costs time (less if Finance already knew about the incident) but unlocks resources and certification.
      const hours = f.transparent ? -2 : -4;
      if (f.ai) s = bump(s, { hours, gifts: +30, quality: +30, budgetSet: 60, flags: { book: true, compliant: true, safetyTested: true } });
      else s = bump(s, { hours, gifts: +20 + (f.transparent ? 15 : 0), budgetSet: 60, flags: { book: true, compliant: true, aiAssist: !!f.transparent } });
      break;
    }
    case 'd3:shortcut':
      if (f.ai) s = bump(s, { gifts: +40, quality: -10, budgetSet: 20, spirit: +5, flags: { shortcut: true, compliant: false, gamingGpus: true } });
      else s = bump(s, { gifts: +35, quality: -10, budgetSet: 20, spirit: +5, flags: { shortcut: true, compliant: false, ductTape: true } });
      break;
    case 'd4:drones':
      s = bump(s, { flags: { drones: true } });
      break;
    case 'd4:sleigh':
      s = bump(s, { flags: { sleigh: true } });
      break;
  }
  return s;
}

/** Story beats between decisions that change state regardless of choice (called when entering an act). */
export function enterAct(state, act) {
  let s = state;
  if (act === 4 && s.flags.coverUp && !s.flags.auditDone) {
    // Finance audit discovers the green dashboard was fiction. Painful, but the truth is finally out.
    s = bump(s, { hours: -2, spirit: +10, flags: { auditDone: true } });
  }
  if (act === 5 && !s.flags.act5) s = bump(s, { hours: -ELAPSED.act4, flags: { act5: true } });
  return s;
}

export const DELIVERY_HOURS = { drones: 4, sleigh: 10 };

/**
 * Delivery effectiveness 0..100 and the reasons behind it.
 */
export function delivery(state) {
  const f = state.flags;
  const reasons = [];
  let d = 100;
  if (f.drones) {
    if (!f.transparent) { d -= 50; reasons.push('kpiBug'); }               // nobody reviewed JOLLY's route plan
    else reasons.push('routeReviewed');
    if (f.gamingGpus) { d -= 10; reasons.push('gpuOverheat'); }
    if (state.hours < DELIVERY_HOURS.drones) { d = Math.round(d * state.hours / DELIVERY_HOURS.drones); reasons.push('lateStart'); }
  } else if (f.sleigh) {
    if (!f.compliant) { d = 0; reasons.push('grounded'); }
    else {
      reasons.push('certified');
      if (state.spirit < 40) { d -= 30; reasons.push('tiredCrew'); } else reasons.push('strongCrew');
      if (state.hours < DELIVERY_HOURS.sleigh) { d = Math.round(d * state.hours / DELIVERY_HOURS.sleigh); reasons.push('lateStart'); }
    }
  }
  return { value: Math.max(0, d), reasons };
}

/**
 * Ending:
 *  A — Christmas Saved: enough gifts, good gifts, delivery works.
 *  B — Saved… sort of: Christmas happens, imperfectly.
 *  C — Christmas Not Found.
 */
export function outcome(state) {
  const del = delivery(state);
  const gifts = Math.min(100, state.gifts);
  const value = Math.round((gifts / 100) * (del.value / 100) * (0.5 + state.quality / 200) * 100); // % of children truly happy
  let ending;
  if (del.value >= 90 && state.gifts >= 90 && state.quality >= 60) ending = 'A';
  else if (del.value === 0 || value < 30) ending = 'C';
  else ending = 'B';
  const problems = [];
  if (state.gifts < 90) problems.push('tooFewGifts');
  if (state.quality < 60) problems.push('weirdGifts');
  if (del.reasons.includes('kpiBug')) problems.push('grandma');
  if (del.reasons.includes('grounded')) problems.push('grounded');
  if (del.reasons.includes('tiredCrew')) problems.push('tiredCrew');
  if (del.reasons.includes('lateStart')) problems.push('late');
  return { ending, value, delivery: del.value, problems };
}

/** Apply a decision plus the act transition that follows it (d1→act 2 … d4→act 5). */
export function decide(state, decisionId, optionId) {
  const idx = DECISION_ORDER.indexOf(decisionId);
  return enterAct(applyChoice(state, decisionId, optionId), idx + 2);
}

/** Replay a list of option ids (in decision order) from the start. */
export function playPath(path) {
  let s = structuredClone(START_STATE);
  path.forEach((opt, i) => { s = decide(s, DECISION_ORDER[i], opt); });
  return s;
}

export function allPaths() {
  const out = [];
  const opts = DECISION_ORDER.map((d) => Object.keys(DECISIONS[d].options));
  for (const a of opts[0]) for (const b of opts[1]) for (const c of opts[2]) for (const e of opts[3]) out.push([a, b, c, e]);
  return out;
}

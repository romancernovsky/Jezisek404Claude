// Show state machine: lobby → scenes → decision → voting → revealed → … → ended.
// Pure and serialisable: used by the server (live voting) and by the screen in solo/offline mode.
import { START_STATE, DECISIONS, DECISION_ORDER, decide, playPath } from './model.js';
import { SCENES, FIRST_SCENE, nextStep, sceneAfterDecision } from './story.js';

export function newShow(prev = {}) {
  return {
    phase: 'lobby',          // lobby | playing | decision | voting | revealed | ended
    paused: false,
    sceneId: null,
    sceneRun: (prev.sceneRun || 0) + 1, // increments on every scene (re)start
    beat: 0,                 // last beat index the screen reported
    story: structuredClone(START_STATE),
    decision: null,          // { id, counts, winner, manual, tie, openedAt, closedAt }
    phoneDelay: prev.phoneDelay ?? 15,
    voting: prev.voting ?? 'phones', // phones | hands
    updatedAt: Date.now(),
  };
}

function startScene(show, sceneId) {
  if (!SCENES[sceneId]) throw new Error(`Unknown scene ${sceneId}`);
  return { ...show, phase: 'playing', sceneId, sceneRun: show.sceneRun + 1, beat: 0, decision: null };
}

function emptyCounts(id) {
  return Object.fromEntries(Object.keys(DECISIONS[id].options).map((o) => [o, 0]));
}

export function winnerOf(counts) {
  const entries = Object.entries(counts);
  const max = Math.max(...entries.map(([, v]) => v));
  const top = entries.filter(([, v]) => v === max);
  if (max === 0 || top.length > 1) return { winner: null, tie: true };
  return { winner: top[0][0], tie: false };
}

/**
 * Apply a command. Returns the new show (never mutates). Throws on invalid commands.
 * Commands: start, pause, resume, sceneEnded{sceneRun}, progress{sceneRun,beat}, skipScene,
 * openVote, closeVote{counts}, pick{option}, continue, restart, jump{sceneId, path}, setDelay{seconds}, setVoting{mode}
 */
export function reduce(show, cmd, arg = {}) {
  const s = { ...show, updatedAt: Date.now() };
  switch (cmd) {
    case 'start':
      if (s.phase !== 'lobby' && s.phase !== 'ended') return s;
      return startScene({ ...newShow(s), phoneDelay: s.phoneDelay, voting: s.voting }, FIRST_SCENE);
    case 'pause': return { ...s, paused: true };
    case 'resume': return { ...s, paused: false };
    case 'progress':
      if (arg.sceneRun !== s.sceneRun) return show;
      return { ...s, beat: Math.max(0, arg.beat | 0) };
    case 'skipScene':
      if (s.phase !== 'playing') return s;
      return reduce(s, 'sceneEnded', { sceneRun: s.sceneRun });
    case 'sceneEnded': {
      if (s.phase !== 'playing' || arg.sceneRun !== s.sceneRun) return show; // stale/duplicate report
      const step = nextStep(s.sceneId, s.story);
      if (step.end) return { ...s, phase: 'ended' };
      if (step.decision) return { ...s, phase: 'decision', decision: { id: step.decision, counts: emptyCounts(step.decision), winner: null, manual: false, tie: false } };
      return startScene(s, step.scene);
    }
    case 'openVote':
      if (s.phase !== 'decision' && s.phase !== 'revealed') return s;
      return { ...s, phase: 'voting', decision: { ...s.decision, counts: emptyCounts(s.decision.id), winner: null, manual: false, tie: false, openedAt: Date.now(), closedAt: null } };
    case 'closeVote': {
      if (s.phase !== 'voting') return s;
      const counts = arg.counts || s.decision.counts;
      const { winner, tie } = winnerOf(counts);
      return { ...s, phase: 'revealed', decision: { ...s.decision, counts, winner, tie, closedAt: Date.now() } };
    }
    case 'pick': {
      if (!['decision', 'voting', 'revealed'].includes(s.phase)) return s;
      if (!DECISIONS[s.decision.id].options[arg.option]) throw new Error('Unknown option');
      return { ...s, phase: 'revealed', decision: { ...s.decision, winner: arg.option, manual: true, tie: false, closedAt: Date.now() } };
    }
    case 'continue': {
      if (s.phase !== 'revealed' || !s.decision?.winner) return s;
      const story = decide(s.story, s.decision.id, s.decision.winner);
      return startScene({ ...s, story }, sceneAfterDecision(s.decision.id, story));
    }
    case 'restart': return { ...newShow(s) };
    case 'jump': {
      // Rehearsal: replay a path of choices, then start at a scene (or at a decision point).
      const path = (arg.path || []).slice(0, DECISION_ORDER.length);
      const story = playPath(path);
      const base = { ...newShow(s), story };
      if (arg.decision) {
        return { ...base, phase: 'decision', sceneId: arg.sceneId || null, decision: { id: arg.decision, counts: emptyCounts(arg.decision), winner: null, manual: false, tie: false } };
      }
      return startScene(base, arg.sceneId || FIRST_SCENE);
    }
    case 'setDelay': return { ...s, phoneDelay: Math.max(0, Math.min(90, Number(arg.seconds) || 0)) };
    case 'setVoting': return { ...s, voting: arg.mode === 'hands' ? 'hands' : 'phones' };
    default: throw new Error(`Unknown command ${cmd}`);
  }
}

/** What the audience (phones) may see. Results are hidden until the reveal. */
export function publicView(show, { withCounts = false } = {}) {
  const d = show.decision;
  const total = d ? Object.values(d.counts).reduce((a, b) => a + b, 0) : 0;
  return {
    phase: show.phase,
    paused: show.paused,
    sceneId: show.sceneId,
    sceneRun: show.sceneRun,
    beat: show.beat,
    story: show.story,
    phoneDelay: show.phoneDelay,
    voting: show.voting,
    decision: d && {
      id: d.id,
      question: DECISIONS[d.id].question,
      options: DECISIONS[d.id].options,
      total,
      counts: withCounts || show.phase === 'revealed' ? d.counts : null,
      winner: show.phase === 'revealed' ? d.winner : null,
      manual: d.manual,
      tie: show.phase === 'revealed' ? d.tie : false,
      openedAt: d.openedAt || null,
      closedAt: d.closedAt || null,
    },
  };
}

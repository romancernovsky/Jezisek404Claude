// Procedural music & sound effects (Web Audio) + voice-line playback.
// All music is generated live from original motifs — no licensing, no files, works offline.

let ctx, master, musicBus, sfxBus, voiceBus, noiseBuf;
let musicTimer = null, currentMood = null, nextNoteTime = 0, step = 0;
let ducked = false;
const listeners = new Set();
export const audioState = { armed: false, musicVolume: 0.32, sfxVolume: 0.7, voiceVolume: 1 };

export function arm() {
  if (ctx) { ctx.resume(); return; }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = audioState.musicVolume; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = audioState.sfxVolume; sfxBus.connect(master);
  voiceBus = ctx.createGain(); voiceBus.gain.value = audioState.voiceVolume; voiceBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  audioState.armed = true;
  listeners.forEach((f) => f());
}
export const onArmed = (f) => listeners.add(f);
export function suspend(on) { if (!ctx) return; on ? ctx.suspend() : ctx.resume(); }

// ------------------------------------------------------------------ instruments
const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
function env(g, t, a, peak, dec, sus = 0.0001) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + dec); }
function osc(type, f, t, dur, peak, bus, { attack = 0.005, detune = 0, filter } = {}) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune;
  const g = ctx.createGain(); env(g, t, attack, peak, dur);
  let node = o;
  if (filter) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filter; o.connect(fl); node = fl; }
  node.connect(g).connect(bus); o.start(t); o.stop(t + attack + dur + 0.05);
  return o;
}
function bell(m, t, v = 0.18, bus = musicBus) {
  const f = freq(m);
  osc('sine', f, t, 1.3, v, bus); osc('sine', f * 2.01, t, 0.6, v * 0.35, bus); osc('sine', f * 3.98, t, 0.25, v * 0.15, bus);
}
const pluck = (m, t, v = 0.12, bus = musicBus) => osc('triangle', freq(m), t, 0.35, v, bus, { filter: 2400 });
const bass = (m, t, v = 0.22, dur = 0.4) => osc('triangle', freq(m), t, dur, v, musicBus, { filter: 700 });
function pad(ms, t, dur, v = 0.035) { ms.forEach((m) => { osc('sawtooth', freq(m), t, dur, v, musicBus, { attack: 0.25, filter: 900, detune: -6 }); osc('sawtooth', freq(m), t, dur, v, musicBus, { attack: 0.25, filter: 900, detune: 7 }); }); }
function noise(t, dur, v, hp = 6000, bus = musicBus, bp) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = bp ? 'bandpass' : 'highpass'; f.frequency.value = bp || hp;
  const g = ctx.createGain(); env(g, t, 0.002, v, dur);
  s.connect(f).connect(g).connect(bus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
function kick(t, v = 0.5) { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); env(g, t, 0.002, v, 0.2); o.connect(g).connect(musicBus); o.start(t); o.stop(t + 0.3); }

// ------------------------------------------------------------------ moods (original motifs)
// Each mood: bpm, root (MIDI), chords (semitone offsets per bar), melody (scale steps per 8th, null = rest),
// and flags for drums/bells. Scales: major or minor.
const MAJ = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16], MIN = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15];
const MOODS = {
  cozy: { bpm: 84, root: 60, scale: MAJ, chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], mel: [4, null, 2, 3, 4, null, 7, null, 5, null, 4, 2, 1, null, null, null], bells: true, sleigh: true },
  tension: { bpm: 96, root: 57, scale: MIN, chords: [[0, 3, 7], [0, 3, 7], [-4, 0, 3], [-2, 2, 5]], mel: [0, null, null, 2, null, null, 1, null, 0, null, null, 4, null, 3, null, null], pulse: true },
  urgent: { bpm: 132, root: 57, scale: MIN, chords: [[0, 3, 7], [-4, 0, 3], [-5, -1, 2], [-2, 2, 5]], mel: [0, 2, 4, 2, 0, 2, 4, 5, 4, 2, 0, null, 6, 5, 4, null], drums: true },
  sneaky: { bpm: 100, root: 55, scale: MIN, chords: [[0, 3, 7], [1, 5, 8], [0, 3, 7], [-1, 2, 7]], mel: [0, null, 2, null, 3, null, 4, null, 3, null, 2, null, 0, null, null, null], stacc: true },
  upbeat: { bpm: 138, root: 62, scale: MAJ, chords: [[0, 4, 7], [5, 9, 12], [9, 12, 16], [7, 11, 14]], mel: [0, 2, 4, 7, 4, 2, 4, null, 5, 4, 2, 0, 2, null, null, null], drums: true, bells: true },
  workshop: { bpm: 112, root: 60, scale: MAJ, chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], mel: [4, 4, 4, null, 4, 4, 4, null, 4, 6, 2, 3, 4, null, null, null], bells: true, sleigh: true },
  finance: { bpm: 88, root: 53, scale: MIN, chords: [[0, 3, 7], [0, 3, 7], [1, 5, 8], [-1, 2, 7]], mel: [0, null, 0, null, 1, null, 0, null, null, null, -1, null, 0, null, null, null], stacc: true },
  bureaucracy: { bpm: 120, root: 58, scale: MAJ, chords: [[0, 4, 7], [0, 4, 7], [5, 9, 12], [7, 11, 14]], mel: [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 0, null], tick: true },
  heist: { bpm: 126, root: 55, scale: MIN, chords: [[0, 3, 7], [0, 3, 7], [3, 7, 10], [1, 5, 8]], mel: [0, null, 3, 4, null, 3, null, 0, null, 6, 5, null, 3, null, null, null], drums: true, stacc: true },
  launch: { bpm: 128, root: 62, scale: MAJ, chords: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], mel: [0, 4, 7, 9, 7, null, 4, null, 5, 7, 9, 11, 9, null, null, null], drums: true, bells: true, sleigh: true },
  triumph: { bpm: 120, root: 60, scale: MAJ, chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], mel: [7, null, 7, 9, 7, 4, 7, null, 9, null, 9, 11, 12, null, null, null], drums: true, bells: true, sleigh: true },
  quirky: { bpm: 116, root: 60, scale: MAJ, chords: [[0, 4, 7], [1, 5, 8], [0, 4, 7], [-1, 2, 7]], mel: [0, 4, null, 3, null, 7, null, 6, 4, null, 2, null, 0, null, null, null], stacc: true, bells: true },
  sad: { bpm: 70, root: 57, scale: MIN, chords: [[0, 3, 7], [-4, 0, 3], [-7, -3, 0], [-5, -1, 2]], mel: [4, null, 3, null, 2, null, 1, null, 0, null, null, null, null, null, null, null], bells: true },
  credits: { bpm: 96, root: 60, scale: MAJ, chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], mel: [4, null, 4, null, 4, null, null, null, 4, null, 4, null, 4, null, null, null, 4, null, 7, null, 0, null, 2, null, 4], bells: true, sleigh: true },
  vote: { bpm: 104, root: 57, scale: MIN, chords: [[0, 3, 7], [0, 3, 7], [-4, 0, 3], [-2, 2, 5]], mel: [], pulse: true, tick: true },
};

export function setMood(mood) {
  if (!ctx || mood === currentMood) return;
  currentMood = mood;
  clearInterval(musicTimer); musicTimer = null;
  if (!mood || !MOODS[mood]) return;
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
  musicBus.gain.linearRampToValueAtTime(ducked ? audioState.musicVolume * 0.35 : audioState.musicVolume, ctx.currentTime + 1.2);
  nextNoteTime = ctx.currentTime + 0.1; step = 0;
  musicTimer = setInterval(schedule, 60);
}
export function stopMusic() { setMood(null); }

function schedule() {
  const m = MOODS[currentMood]; if (!m) return;
  const eighth = 60 / m.bpm / 2;
  while (nextNoteTime < ctx.currentTime + 0.25) {
    const t = nextNoteTime, bar = Math.floor(step / 8) % m.chords.length, s8 = step % 8;
    const chord = m.chords[bar].map((c) => c + m.root);
    if (s8 === 0) { bass(chord[0] - 12, t, 0.2, eighth * 3); pad(chord, t, eighth * 7.5); }
    if (s8 === 4) bass(chord[0] - 12 + (m.stacc ? 0 : 7), t, 0.16, eighth * 2);
    if (m.pulse && s8 % 2 === 0) pluck(chord[s8 / 2 % 3] , t, 0.06);
    if (m.stacc && s8 % 2 === 1) pluck(chord[(s8 >> 1) % 3] + 12, t, 0.05);
    const mi = m.mel.length ? m.mel[step % m.mel.length] : null;
    if (mi !== null && mi !== undefined) {
      const note = m.root + 12 + (mi < 0 ? m.scale[0] - 1 : m.scale[mi % m.scale.length]);
      m.bells ? bell(note, t, 0.12) : pluck(note, t, 0.1);
    }
    if (m.drums) { if (s8 === 0 || s8 === 4) kick(t, 0.35); if (s8 === 2 || s8 === 6) noise(t, 0.12, 0.12, 1800); noise(t, 0.03, 0.04); }
    if (m.sleigh && s8 % 2 === 1) noise(t, 0.06, 0.05, 7000);
    if (m.tick) noise(t, 0.02, s8 % 2 ? 0.03 : 0.06, 5000);
    nextNoteTime += eighth; step++;
  }
}

export function duck(on) {
  if (!ctx || ducked === on) return;
  ducked = on;
  const g = musicBus.gain; const t = ctx.currentTime;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(on ? audioState.musicVolume * 0.35 : audioState.musicVolume, t + 0.3);
}

// ------------------------------------------------------------------ sfx
export function sfx(name) {
  if (!ctx) return;
  const t = ctx.currentTime + 0.01, B = sfxBus;
  const sweep = (type, f1, f2, dur, v) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur); const g = ctx.createGain(); env(g, t, 0.01, v, dur); o.connect(g).connect(B); o.start(t); o.stop(t + dur + 0.05); };
  switch (name) {
    case 'bells': [79, 83, 86, 91, 86, 91].forEach((m, i) => bell(m, t + i * 0.12, 0.2, B)); for (let i = 0; i < 10; i++) noise(t + i * 0.07, 0.07, 0.1, 7000, B); break;
    case 'door': noise(t, 0.4, 0.25, 0, B, 300); sweep('square', 120, 60, 0.25, 0.08); break;
    case 'wind': noise(t, 2.6, 0.18, 0, B, 500); break;
    case 'sting': [57, 60, 63, 66].forEach((m) => osc('sawtooth', freq(m), t, 1.1, 0.07, B, { filter: 1600 })); kick(t, 0.6); break;
    case 'whoosh': noise(t, 0.6, 0.3, 0, B, 1200); break;
    case 'beep': [0, 0.18, 0.36].forEach((d) => osc('square', 880, t + d, 0.08, 0.06, B)); break;
    case 'boing': sweep('sine', 180, 520, 0.35, 0.3); break;
    case 'tick': for (let i = 0; i < 4; i++) noise(t + i * 0.5, 0.04, 0.3, 3000, B); break;
    case 'alarm': for (let i = 0; i < 4; i++) { osc('square', 740, t + i * 0.45, 0.2, 0.08, B); osc('square', 587, t + i * 0.45 + 0.22, 0.2, 0.08, B); } break;
    case 'cheer': for (let i = 0; i < 30; i++) noise(t + Math.random() * 1.2, 0.15, 0.06, 0, B, 800 + Math.random() * 1800); break;
    case 'call': [0, 0.25].forEach((d) => { osc('sine', 1046, t + d, 0.15, 0.12, B); osc('sine', 1318, t + d + 0.08, 0.15, 0.1, B); }); break;
    case 'spray': noise(t, 0.9, 0.2, 4000, B); break;
    case 'thunder': noise(t, 1.6, 0.5, 0, B, 120); kick(t, 0.8); break;
    case 'machines': for (let i = 0; i < 8; i++) { osc('square', 90 + (i % 2) * 30, t + i * 0.18, 0.1, 0.07, B, { filter: 600 }); noise(t + i * 0.18, 0.06, 0.12, 2000, B); } break;
    case 'pop': sweep('sine', 300, 900, 0.12, 0.3); break;
    case 'hammers': for (let i = 0; i < 6; i++) { noise(t + i * 0.32, 0.05, 0.35, 2500, B); osc('triangle', 1600 + (i % 3) * 200, t + i * 0.32, 0.12, 0.06, B); } break;
    case 'snore': sweep('sawtooth', 90, 70, 1.2, 0.08); noise(t, 1.2, 0.08, 0, B, 400); break;
    case 'stamp': kick(t, 0.9); noise(t, 0.15, 0.4, 0, B, 400); break;
    case 'scan': sweep('sine', 400, 1600, 1.0, 0.12); break;
    case 'ding': bell(88, t, 0.3, B); break;
    case 'countdown': [0, 0.9, 1.8].forEach((d) => osc('sine', 660, t + d, 0.2, 0.2, B)); osc('sine', 1320, t + 2.7, 0.6, 0.25, B); break;
    case 'rumble': noise(t, 2.4, 0.45, 0, B, 90); break;
    case 'fizzle': noise(t, 1.2, 0.25, 3000, B); sweep('sawtooth', 600, 80, 1.0, 0.06); break;
    case 'fanfare': [[60, 0], [64, 0.15], [67, 0.3], [72, 0.45], [67, 0.75], [72, 0.9]].forEach(([m, d]) => { osc('sawtooth', freq(m), t + d, d > 0.8 ? 1.4 : 0.25, 0.09, B, { filter: 2600 }); osc('square', freq(m + 12), t + d, 0.2, 0.03, B); }); kick(t + 0.9, 0.7); sfxLater('cheer', 900); sfxLater('bells', 1100); break;
    case 'fanfareSmall': [[60, 0], [64, 0.15], [67, 0.3], [66, 0.6]].forEach(([m, d]) => osc('sawtooth', freq(m), t + d, 0.35, 0.08, B, { filter: 2200 })); break;
    case 'error': osc('square', 220, t, 0.25, 0.12, B); osc('square', 208, t + 0.3, 0.5, 0.12, B); break;
    case 'sadTrombone': [[58, 0], [57, 0.45], [56, 0.9], [55, 1.35]].forEach(([m, d], i) => { const o = osc('sawtooth', freq(m), t + d, i === 3 ? 1.4 : 0.4, 0.09, B, { filter: 1400 }); if (i === 3) { const lfo = ctx.createOscillator(); lfo.frequency.value = 6; const lg = ctx.createGain(); lg.gain.value = 18; lfo.connect(lg).connect(o.detune); lfo.start(t + d); lfo.stop(t + d + 1.5); } }); break;
    case 'voteOpen': [72, 76, 79, 84].forEach((m, i) => bell(m, t + i * 0.08, 0.2, B)); break;
    case 'drumroll': for (let i = 0; i < 40; i++) noise(t + i * 0.045, 0.04, 0.05 + i * 0.006, 1500, B); kick(t + 1.85, 0.8); break;
    case 'reveal': kick(t, 0.8); [72, 76, 79].forEach((m) => bell(m, t, 0.22, B)); break;
    default: break;
  }
}
function sfxLater(n, ms) { setTimeout(() => sfx(n), ms); }

// ------------------------------------------------------------------ voices
let voiceEl = null;
export function playVoice(url, onEnd) {
  stopVoice();
  const a = new Audio(url);
  a.preload = 'auto';
  voiceEl = a;
  if (ctx) { try { const src = ctx.createMediaElementSource(a); src.connect(voiceBus); } catch { /* already connected */ } }
  duck(true);
  a.onended = () => { duck(false); onEnd && onEnd(); };
  a.onerror = () => { duck(false); onEnd && onEnd(new Error('voice failed')); };
  a.play().catch(() => { duck(false); });
  return a;
}
export function stopVoice() { if (voiceEl) { voiceEl.onended = null; voiceEl.pause(); voiceEl = null; duck(false); } }
export function pauseVoice(on) { if (voiceEl) on ? voiceEl.pause() : voiceEl.play().catch(() => {}); }

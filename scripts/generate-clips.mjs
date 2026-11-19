#!/usr/bin/env node
// Generates the optional cinematic clips with Seedance 2.5 via the OpenRouter Video API,
// using the show's own keyframes (npm run keyframes) as first frames so the style matches.
//
//   OPENROUTER_API_KEY=... node scripts/generate-clips.mjs                 # all missing clips
//   OPENROUTER_API_KEY=... node scripts/generate-clips.mjs endingB         # one clip
//   ... --force        regenerate even if the clip exists (keeps the old one as <slot>.prev.mp4)
//   ... --max-usd 9    abort before submitting if the estimated cost is higher (default 9)
//
// Output: public/video/<slot>.mp4 (+ manifest via scripts/video-manifest.mjs).
// Clips are generated silent: the show's own music keeps playing underneath.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEO = path.join(ROOT, 'public', 'video');
const API = 'https://openrouter.ai/api/v1';
const KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = process.env.SEEDANCE_MODEL || 'bytedance/seedance-2.5';
const SIZE = process.env.SEEDANCE_SIZE || '1280x720';
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const MAX_USD = Number(args.includes('--max-usd') ? args[args.indexOf('--max-usd') + 1] : 9);
const STYLE = 'Keep the exact flat 2D vector cartoon style, colours, thick outlines and character designs of the first frame. Smooth, slow, steady camera. No text, no letters, no logos, no new characters, no morphing faces.';

export const CLIPS = {
  opening: {
    duration: 10,
    prompt: 'Slow cinematic push-in over a snowy village at night toward the glowing wooden workshop on the hill; warm golden light flickers in its windows, gentle snowfall drifts down, stars twinkle, smoke curls from a chimney, the little houses glow softly. Cosy, magical Christmas Eve atmosphere.',
  },
  endingA: {
    duration: 10,
    prompt: 'The cast celebrates in the snowy village at night: the little golden-haired gift-bringer in the white robe jumps for joy, the floating red Christmas-bauble robot bounces up and down happily while always facing the camera with its dark screen face and pink heart eyes clearly visible (it never turns around), the elves throw their hats in the air and cheer, house windows light up one by one, colourful fireworks burst in the night sky above, confetti and snow swirl. Warm, triumphant, joyful.',
  },
  endingB: {
    duration: 5,
    prompt: 'The little golden-haired gift-bringer shrugs with a relieved, slightly embarrassed smile; the seven-armed teddy bear waves all of its arms happily; the floating red bauble robot bobs up and down cheerfully; the head elf laughs; light snow falls in the night village. Gentle comedic timing.',
  },
  endingC: {
    duration: 5,
    prompt: 'The huge outlined 404 shape behind the characters flickers like a glitching screen; the little gift-bringer sighs and droops sadly; the floating red bauble robot keeps smiling obliviously and bobs; the horned accountant in round glasses gives a pleased thumbs-up; snow drifts down. Comedic, bittersweet.',
  },
};

// Seedance bills video tokens ≈ width × height × 24 fps × seconds / 1024.
function estimateUsd(duration) {
  const [w, h] = SIZE.split('x').map(Number);
  const perToken = SIZE === '1920x1080' ? 0.0000117 : 0.0000107;
  return (w * h * 24 * duration / 1024) * perToken;
}

function keyframeDataUrl(slot) {
  const src = path.join(VIDEO, 'keyframes', `${slot}.png`);
  if (!fs.existsSync(src)) throw new Error(`Missing ${path.relative(ROOT, src)} — run: npm run keyframes`);
  const [w, h] = SIZE.split('x');
  try {
    // Downscale to the target size as a compact JPEG (smaller request, exact framing)
    const jpg = execFileSync('ffmpeg', ['-v', 'error', '-i', src, '-vf', `scale=${w}:${h}`, '-q:v', '3', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-'], { maxBuffer: 20e6 });
    return `data:image/jpeg;base64,${jpg.toString('base64')}`;
  } catch {
    return `data:image/png;base64,${fs.readFileSync(src).toString('base64')}`;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(p, init = {}) {
  const r = await fetch(API + p, { ...init, headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`${init.method || 'GET'} ${p} → ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r;
}

async function generate(slot) {
  const clip = CLIPS[slot];
  const body = {
    model: MODEL, prompt: `${clip.prompt} ${STYLE}`, duration: clip.duration, size: SIZE,
    generate_audio: false, seed: 2412,
    frame_images: [{ type: 'image_url', image_url: { url: keyframeDataUrl(slot) }, frame_type: 'first_frame' }],
  };
  const job = await (await api('/videos', { method: 'POST', body: JSON.stringify(body) })).json();
  console.log(`⏳ ${slot}: submitted job ${job.id}`);
  const t0 = Date.now();
  for (;;) {
    await sleep(10000);
    const st = await (await api(`/videos/${job.id}`)).json();
    if (st.status === 'completed') {
      const buf = Buffer.from(await (await api(`/videos/${job.id}/content`)).arrayBuffer());
      const out = path.join(VIDEO, `${slot}.mp4`);
      if (fs.existsSync(out)) fs.renameSync(out, path.join(VIDEO, `${slot}.prev.mp4`));
      fs.writeFileSync(out, buf);
      console.log(`✅ ${slot}: ${(buf.length / 1e6).toFixed(1)} MB in ${Math.round((Date.now() - t0) / 1000)} s · cost ${st.usage?.cost != null ? `$${st.usage.cost}` : 'n/a'}`);
      return st.usage?.cost || 0;
    }
    if (['failed', 'cancelled', 'expired'].includes(st.status)) throw new Error(`${slot}: job ${st.status} ${JSON.stringify(st.error || st).slice(0, 300)}`);
    console.log(`   ${slot}: ${st.status} (${Math.round((Date.now() - t0) / 1000)} s)`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (!KEY) { console.error('Set OPENROUTER_API_KEY.'); process.exit(1); }
  const wanted = args.filter((a) => CLIPS[a]);
  const slots = (wanted.length ? wanted : Object.keys(CLIPS)).filter((s) => FORCE || !fs.existsSync(path.join(VIDEO, `${s}.mp4`)));
  if (!slots.length) { console.log('Nothing to generate (use --force to regenerate).'); process.exit(0); }
  const est = slots.reduce((a, s) => a + estimateUsd(CLIPS[s].duration), 0);
  console.log(`Model ${MODEL} · ${SIZE} · silent · clips: ${slots.join(', ')} · estimated ≈ $${est.toFixed(2)} (limit $${MAX_USD})`);
  if (est > MAX_USD) { console.error('Estimated cost exceeds --max-usd. Aborting.'); process.exit(1); }
  const results = await Promise.allSettled(slots.map(generate));
  let cost = 0; let failed = 0;
  results.forEach((r) => { if (r.status === 'fulfilled') cost += r.value; else { failed++; console.error(`❌ ${r.reason.message}`); } });
  console.log(`Total charged: $${cost.toFixed(2)}${failed ? ` · ${failed} failed` : ''}`);
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'video-manifest.mjs')], { stdio: 'inherit' });
  process.exit(failed ? 1 : 0);
}

// Visual effects: canvas particles (snow, confetti, fireworks) + short DOM effects.
const GIFT_COLORS = ['#ff5d73', '#3a7bd5', '#f6c445', '#2f9e5b', '#c792ea', '#ff9f43'];
const rnd = (a, b) => a + Math.random() * (b - a);
const giftSvg = (c) => `<svg viewBox="0 0 80 70"><rect x="4" y="16" width="72" height="50" rx="6" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="3"/><rect x="34" y="16" width="12" height="50" fill="#fff"/><path d="M40 16 q-16 -18 -24 0 q12 6 24 0 q16 -18 24 0 q-12 6 -24 0" fill="#fff"/></svg>`;
const droneSvg = `<svg viewBox="0 0 60 34"><path d="M2 6 h20 M38 6 h20" stroke="#cfd8e6" stroke-width="4" stroke-linecap="round"/><rect x="12" y="6" width="36" height="10" rx="5" fill="#ff5d73"/><rect x="22" y="16" width="16" height="14" fill="#f6c445"/><circle cx="30" cy="11" r="3" fill="#7ff3ff"/></svg>`;

export class Effects {
  constructor(layer, canvas) {
    this.layer = layer; this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = 1920; canvas.height = 1080;
    this.parts = []; this.snowing = false; this.snowflakes = [];
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }
  clear() { this.parts = []; this.layer.innerHTML = ''; }
  snow(on) {
    this.snowing = on;
    if (on && !this.snowflakes.length) this.snowflakes = [...Array(130)].map(() => ({ x: rnd(0, 1920), y: rnd(0, 1080), r: rnd(1.5, 4.5), s: rnd(0.6, 1.8), w: rnd(0, 6) }));
  }
  el(cls, html = '', style = {}, life = 3000) {
    const e = document.createElement('div');
    e.className = `fx-el ${cls}`; e.innerHTML = html; Object.assign(e.style, style);
    this.layer.appendChild(e);
    setTimeout(() => e.remove(), life);
    return e;
  }
  play(name, o = {}) {
    switch (name) {
      case 'sparkle': for (let i = 0; i < 18; i++) setTimeout(() => this.el('sparkle', '', { left: `${rnd(200, 1700)}px`, top: `${rnd(150, 800)}px` }, 1300), i * 70); break;
      case 'tumbleweed': this.el('tumbleweed', `<svg viewBox="0 0 100 100"><g fill="none" stroke="#c9a26b" stroke-width="4">${[...Array(9)].map((_, i) => `<ellipse cx="50" cy="50" rx="${44 - i * 3}" ry="${30 + i * 2}" transform="rotate(${i * 40} 50 50)"/>`).join('')}</g></svg>`, {}, 3000); break;
      case 'alarm': this.el('alarm-overlay', '', {}, 2600); break;
      case 'smoke': for (let i = 0; i < 6; i++) setTimeout(() => this.el('smoke', '', { left: `${(o.x || 960) + rnd(-260, 260)}px`, top: `${rnd(420, 720)}px` }, 2300), i * 120); break;
      case 'greenwash': this.el('greenwash', '', {}, 2100); break;
      case 'conveyor': for (let i = 0; i < 26; i++) setTimeout(() => this.el('conveyor-gift', giftSvg(GIFT_COLORS[i % 6]), { animationDuration: '1.6s' }, 1700), i * 110); break;
      case 'hammering': for (let k = 0; k < 6; k++) setTimeout(() => this.sparks(rnd(400, 1500), rnd(560, 760)), k * 320); break;
      case 'zzz': ['Z', 'z', 'Z'].forEach((z, i) => setTimeout(() => this.el('zzz', z, { left: `${(o.x || 1450) + 40}px`, top: '480px' }, 2300), i * 450)); break;
      case 'paperstorm': for (let i = 0; i < 40; i++) setTimeout(() => this.el('paper', '', { left: `${rnd(0, 1880)}px`, top: '0px' }, 2700), i * 50); break;
      case 'scanner': this.el('scanline', '', {}, 2300); break;
      case 'rgb': this.el('rgbglow', '', {}, 3000); break;
      case 'droneswarm': this.drones(o.target); break;
      case 'avalanche': for (let i = 0; i < 70; i++) setTimeout(() => this.el('giftdrop', giftSvg(GIFT_COLORS[i % 6]), { left: `${rnd(60, 760)}px`, top: '0px', '--dy': `${rnd(780, 900)}px`, '--rot': `${rnd(-200, 200)}deg` }, 3800), i * 30); break;
      case 'sleighflight': {
        const html = `<svg viewBox="0 0 380 240"><path d="M40 200 Q20 200 30 170 L60 90 Q70 60 110 60 L300 60 Q340 60 330 110 L310 170 Q300 200 270 200 Z" fill="#c8243f" stroke="#7a1427" stroke-width="7"/><path d="M10 225 Q60 238 120 222 L320 222 Q370 222 360 190" stroke="#c9a227" stroke-width="10" fill="none"/><g fill="#f6c445"><rect x="120" y="20" width="40" height="44" rx="5"/><rect x="170" y="6" width="40" height="58" rx="5"/><rect x="220" y="24" width="40" height="40" rx="5"/></g><circle cx="300" cy="30" r="26" fill="#f6c445"/><circle cx="292" cy="40" r="16" fill="#ffd9b8"/></svg>`;
        this.el('sleighfx', html, {}, 3500);
        for (let i = 0; i < 40; i++) setTimeout(() => this.el('sparkle', '', { left: `${-200 + i * 55}px`, top: `${560 - i * 11}px` }, 1300), 200 + i * 75);
        break;
      }
      case 'stamp': this.el('stamp', 'NOT APPROVED', {}, 2600); break;
      case 'confetti': this.confetti(260); break;
      case 'confettiSmall': this.confetti(120); break;
      case 'fireworks': for (let i = 0; i < 9; i++) setTimeout(() => this.firework(rnd(250, 1670), rnd(150, 520)), i * 450); this.confetti(160); break;
      case 'snowfall': for (let i = 0; i < 200; i++) this.snowflakes.push({ x: rnd(0, 1920), y: rnd(-1080, 0), r: rnd(2, 6), s: rnd(1.5, 3), w: rnd(0, 6) }); this.snowing = true; break;
      default: break;
    }
  }
  sparks(x, y) {
    for (let i = 0; i < 12; i++) this.el('spark', '', { left: `${x}px`, top: `${y}px`, '--dx': `${rnd(-120, 120)}px`, '--dy': `${rnd(-140, 40)}px` }, 800);
  }
  drones() {
    for (let i = 0; i < 90; i++) {
      const fromX = rnd(1100, 1700), fromY = rnd(700, 860);
      setTimeout(() => this.el('drone', droneSvg, { left: `${fromX}px`, top: `${fromY}px`, '--dx': `${rnd(-1900, 300)}px`, '--dy': `${rnd(-900, -500)}px`, animationDuration: `${rnd(1.8, 3)}s` }, 3200), i * 25);
    }
  }
  map() {
    const pins = [...Array(40)].map(() => `<circle cx="${rnd(60, 840)}" cy="${rnd(60, 460)}" r="5" fill="#7dff9b"/>`).join('');
    const lines = [...Array(40)].map(() => `<path d="M${rnd(60, 840)} ${rnd(60, 460)} L520 190" stroke="#ff5d73" stroke-width="2.5" opacity=".75"/>`).join('');
    this.el('mapfx', `<svg viewBox="0 0 900 520"><rect width="900" height="520" fill="#0d1f3d"/><g fill="#1e3d6b">
      <path d="M90 120 q60 -60 160 -30 q60 40 30 120 q-40 60 -110 40 q-90 -30 -80 -130z"/><path d="M200 300 q60 -20 90 40 q10 90 -50 130 q-40 -60 -40 -170z"/>
      <path d="M420 100 q90 -40 200 -10 q120 10 180 80 q-20 90 -140 90 q-60 60 -130 20 q-60 -40 -40 -90 q-80 -20 -70 -90z"/><path d="M470 290 q50 -10 70 60 q-10 80 -50 90 q-40 -70 -20 -150z"/><path d="M730 360 q60 -10 80 40 q-30 40 -90 10z"/></g>
      ${lines}${pins}<circle cx="520" cy="190" r="16" fill="#ff5d73"/><text x="540" y="182" fill="#fff" font-size="28" font-weight="700" font-family="Fredoka, sans-serif">Brno 👵</text></svg>`, {}, 4200);
  }
  lightWindows() {
    const ws = [...document.querySelectorAll('#bg .window')];
    ws.forEach((w, i) => setTimeout(() => w.classList.add('lit'), 200 + i * 120));
  }
  confetti(n) {
    for (let i = 0; i < n; i++) this.parts.push({ t: 'c', x: rnd(0, 1920), y: rnd(-400, -10), vx: rnd(-2, 2), vy: rnd(3, 7), r: rnd(0, 6.28), vr: rnd(-0.2, 0.2), c: GIFT_COLORS[i % 6], w: rnd(10, 20), h: rnd(6, 12), life: 400 });
  }
  firework(x, y) {
    const c = GIFT_COLORS[(Math.random() * 6) | 0];
    for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2, s = rnd(3, 9); this.parts.push({ t: 'f', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c, life: rnd(50, 80) }); }
  }
  loop() {
    const g = this.ctx;
    g.clearRect(0, 0, 1920, 1080);
    const paused = document.getElementById('stage').classList.contains('paused');
    if (this.snowing || this.snowflakes.length) {
      g.fillStyle = 'rgba(255,255,255,.85)';
      for (const f of this.snowflakes) {
        if (!paused) { f.y += f.s; f.w += 0.02; f.x += Math.sin(f.w) * 0.6; if (f.y > 1090) { if (this.snowing) { f.y = -10; f.x = rnd(0, 1920); } } }
        g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.28); g.fill();
      }
      if (!this.snowing) this.snowflakes = this.snowflakes.filter((f) => f.y < 1090);
      if (this.snowflakes.length > 330) this.snowflakes.splice(0, this.snowflakes.length - 330);
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const p of this.parts) {
      if (!paused) { p.x += p.vx; p.y += p.vy; p.life--; if (p.t === 'f') { p.vy += 0.08; p.vx *= 0.98; } else { p.r += p.vr; } }
      g.save(); g.globalAlpha = p.t === 'f' ? Math.max(0, p.life / 60) : 1; g.fillStyle = p.c;
      if (p.t === 'c') { g.translate(p.x, p.y); g.rotate(p.r); g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      else { g.beginPath(); g.arc(p.x, p.y, 4, 0, 6.28); g.fill(); }
      g.restore();
    }
    requestAnimationFrame(this.loop);
  }
}

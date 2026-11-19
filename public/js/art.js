// Original vector art for Ježíšek 404. Everything is drawn in code (SVG), so characters stay
// perfectly consistent across every scene and branch, scale crisply on any projector, and can be
// re-styled in one place.

// ------------------------------------------------------------------ faces
// Faces are built from eyes / brows / mouth parts so every character shares one expression vocabulary.
function eyes(cx, cy, s, expr, gap = 26, color = '#2b1d14') {
  const L = cx - gap * s, R = cx + gap * s, r = 7 * s;
  const pair = (fn) => `<g class="eyes">${fn(L, -1)}${fn(R, 1)}</g>`;
  switch (expr) {
    case 'happy': case 'proud': case 'love':
      return pair((x) => `<path d="M${x - 9 * s} ${cy + 3 * s} q${9 * s} ${-12 * s} ${18 * s} 0" stroke="${color}" stroke-width="${4.5 * s}" fill="none" stroke-linecap="round"/>`);
    case 'shock':
      return pair((x) => `<circle cx="${x}" cy="${cy}" r="${10.5 * s}" fill="#fff" stroke="${color}" stroke-width="${2.5 * s}"/><circle cx="${x}" cy="${cy}" r="${3.6 * s}" fill="${color}"/>`);
    case 'sleepy':
      return pair((x) => `<path d="M${x - 9 * s} ${cy} q${9 * s} ${7 * s} ${18 * s} 0" stroke="${color}" stroke-width="${4 * s}" fill="none" stroke-linecap="round"/>`);
    case 'smug':
      return pair((x) => `<path d="M${x - 9 * s} ${cy - 1 * s} h${18 * s}" stroke="${color}" stroke-width="${4 * s}" stroke-linecap="round"/><circle cx="${x + 2 * s}" cy="${cy + 3 * s}" r="${3.5 * s}" fill="${color}"/>`);
    case 'sad':
      return pair((x) => `<ellipse cx="${x}" cy="${cy + 2 * s}" rx="${r * 0.85}" ry="${r * 1.1}" fill="${color}"/><circle cx="${x + 2 * s}" cy="${cy - 1 * s}" r="${2 * s}" fill="#fff"/>`);
    default:
      return pair((x) => `<ellipse cx="${x}" cy="${cy}" rx="${r * 0.85}" ry="${r * 1.15}" fill="${color}"/><circle cx="${x + 2.2 * s}" cy="${cy - 2.5 * s}" r="${2.3 * s}" fill="#fff"/>`);
  }
}
function brows(cx, cy, s, expr, gap = 26, color = '#7a4a1e') {
  const L = cx - gap * s, R = cx + gap * s, y = cy - 20 * s, w = 12 * s;
  const line = (x, tilt) => `<path d="M${x - w} ${y + tilt * s} L${x + w} ${y - tilt * s}" stroke="${color}" stroke-width="${4.5 * s}" stroke-linecap="round"/>`;
  switch (expr) {
    case 'angry': return line(L, -6) + line(R, 6);
    case 'worried': case 'sad': return line(L, 5) + line(R, -5);
    case 'shock': return line(L, 0).replace(`${y}`, `${y - 8 * s}`) + line(R, 0).replace(`${y}`, `${y - 8 * s}`);
    case 'smug': return line(L, 0) + line(R, -4);
    default: return line(L, 1) + line(R, -1);
  }
}
function mouth(cx, cy, s, expr) {
  const dark = '#5a1e1e', tongue = '#e86a6a';
  switch (expr) {
    case 'happy': case 'proud': case 'love':
      return `<path class="m" d="M${cx - 18 * s} ${cy} q${18 * s} ${22 * s} ${36 * s} 0 z" fill="${dark}"/><path d="M${cx - 9 * s} ${cy + 8 * s} q${9 * s} ${6 * s} ${18 * s} 0" fill="${tongue}"/>`;
    case 'shock':
      return `<ellipse class="m" cx="${cx}" cy="${cy + 6 * s}" rx="${10 * s}" ry="${14 * s}" fill="${dark}"/>`;
    case 'sad': case 'worried':
      return `<path class="m" d="M${cx - 15 * s} ${cy + 9 * s} q${15 * s} ${-12 * s} ${30 * s} 0" stroke="${dark}" stroke-width="${4.5 * s}" fill="none" stroke-linecap="round"/>`;
    case 'angry':
      return `<path class="m" d="M${cx - 16 * s} ${cy + 6 * s} h${32 * s}" stroke="${dark}" stroke-width="${6 * s}" stroke-linecap="round"/>`;
    case 'sleepy':
      return `<ellipse class="m" cx="${cx}" cy="${cy + 5 * s}" rx="${6 * s}" ry="${4 * s}" fill="${dark}"/>`;
    case 'smug':
      return `<path class="m" d="M${cx - 14 * s} ${cy + 4 * s} q${16 * s} ${10 * s} ${28 * s} ${-6 * s}" stroke="${dark}" stroke-width="${4.5 * s}" fill="none" stroke-linecap="round"/>`;
    default:
      return `<path class="m" d="M${cx - 12 * s} ${cy + 3 * s} q${12 * s} ${9 * s} ${24 * s} 0" stroke="${dark}" stroke-width="${4.5 * s}" fill="none" stroke-linecap="round"/>`;
  }
}
// Talking mouth overlay (animated by CSS while the character speaks).
const talk = (cx, cy, s) => `<ellipse class="talk" cx="${cx}" cy="${cy + 7 * s}" rx="${11 * s}" ry="${10 * s}" fill="#5a1e1e"/>`;
const sweat = (x, y, s, expr) => (expr === 'worried' || expr === 'shock') ? `<path class="sweat" d="M${x} ${y} q${-7 * s} ${12 * s} 0 ${18 * s} q${7 * s} ${-6 * s} 0 ${-18 * s}z" fill="#9fd8ff"/>` : '';
const blush = (cx, cy, s, gap, color = '#ff9d9d') => `<ellipse cx="${cx - gap * s}" cy="${cy}" rx="${13 * s}" ry="${7 * s}" fill="${color}" opacity=".55"/><ellipse cx="${cx + gap * s}" cy="${cy}" rx="${13 * s}" ry="${7 * s}" fill="${color}" opacity=".55"/>`;

function humanFace(cx, cy, s, expr, opts = {}) {
  return `<g class="face">${opts.blush !== false ? blush(cx, cy + 22 * s, s, 40, opts.blushColor) : ''}${brows(cx, cy, s, expr, 26, opts.brow)}${eyes(cx, cy, s, expr, 26, opts.eye)}${mouth(cx, cy + 34 * s, s, expr)}${talk(cx, cy + 34 * s, s)}${sweat(cx + 62 * s, cy - 24 * s, s, expr)}</g>`;
}

// ------------------------------------------------------------------ characters
// Each character returns an SVG with viewBox 0 0 300 440; feet rest on y≈430.
const svg = (inner, cls = '', vb = '0 0 300 440') => `<svg class="char ${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" overflow="visible">${inner}</svg>`;

function jezisek(expr = 'neutral', pose = 'stand') {
  const hair = '#f6c445', hairD = '#d99a1c';
  const curls = [[100, 128, 30], [130, 102, 32], [168, 98, 32], [202, 120, 30], [88, 165, 24], [214, 160, 24], [150, 92, 26], [115, 150, 20], [188, 146, 20]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hair}" stroke="${hairD}" stroke-width="3"/>`).join('');
  const frizz = expr === 'shock' || expr === 'angry' ? `<g stroke="${hairD}" stroke-width="5" stroke-linecap="round"><path d="M110 78 l-14 -22"/><path d="M150 70 l0 -26"/><path d="M190 78 l14 -22"/></g>` : '';
  const seated = pose === 'sit';
  const body = seated
    ? `<path d="M88 300 Q150 262 212 300 L230 392 Q150 410 70 392 Z" fill="#fffaf0" stroke="#e6c76a" stroke-width="5"/><rect x="92" y="384" width="116" height="26" rx="13" fill="#fffaf0" stroke="#e6c76a" stroke-width="4"/>`
    : `<path d="M92 290 Q150 258 208 290 L238 418 Q150 436 62 418 Z" fill="#fffaf0" stroke="#e6c76a" stroke-width="5"/><path d="M80 404 Q150 422 220 404" stroke="#f6c445" stroke-width="10" fill="none"/>
       <ellipse cx="122" cy="428" rx="22" ry="10" fill="#c98b5a"/><ellipse cx="178" cy="428" rx="22" ry="10" fill="#c98b5a"/>`;
  return svg(`
    <g class="wings"><path d="M96 300 C30 250 20 320 52 352 C70 330 84 330 100 336 Z" fill="#fff6d6" stroke="#f0d78a" stroke-width="4"/><path d="M204 300 C270 250 280 320 248 352 C230 330 216 330 200 336 Z" fill="#fff6d6" stroke="#f0d78a" stroke-width="4"/></g>
    <g class="body">${body}
      <path d="M150 268 v120" stroke="#f6c445" stroke-width="7" stroke-dasharray="2 14" stroke-linecap="round"/>
      <g class="arm-l"><path d="M100 300 Q70 340 86 368" stroke="#fffaf0" stroke-width="30" stroke-linecap="round" fill="none"/><circle cx="86" cy="372" r="15" fill="#ffd9b8"/></g>
      <g class="arm-r"><path d="M200 300 Q232 336 218 364" stroke="#fffaf0" stroke-width="30" stroke-linecap="round" fill="none"/><circle cx="218" cy="368" r="15" fill="#ffd9b8"/>
        <g class="bell" transform="translate(214 372)"><path d="M-16 4 Q-16 -22 0 -24 Q16 -22 16 4 Z" fill="#f6c445" stroke="#c48a10" stroke-width="3"/><circle cx="0" cy="8" r="5" fill="#c48a10"/><rect x="-3" y="-32" width="6" height="9" rx="3" fill="#c48a10"/></g></g>
    </g>
    <g class="head">
      <circle cx="150" cy="190" r="88" fill="#ffd9b8" stroke="#e7b48d" stroke-width="4"/>
      ${curls}${frizz}
      <ellipse cx="62" cy="196" rx="12" ry="18" fill="#ffd0aa" stroke="#e7b48d" stroke-width="3"/><ellipse cx="238" cy="196" rx="12" ry="18" fill="#ffd0aa" stroke="#e7b48d" stroke-width="3"/>
      ${humanFace(150, 198, 1, expr, { brow: hairD })}
    </g>`, `jezisek ${pose}`);
}

function jolly(expr = 'happy') {
  const c = '#7ff3ff';
  let face;
  switch (expr) {
    case 'check': face = `<path d="M98 174 l12 12 22 -24 M168 174 l12 12 22 -24" stroke="#7dff9b" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; break;
    case 'love': face = `<path d="M115 186 l-16 -16 a9 9 0 0 1 16 -10 a9 9 0 0 1 16 10z M185 186 l-16 -16 a9 9 0 0 1 16 -10 a9 9 0 0 1 16 10z" fill="#ff7fa8"/>`; break;
    case 'shock': face = `<circle cx="115" cy="172" r="15" fill="none" stroke="${c}" stroke-width="7"/><circle cx="185" cy="172" r="15" fill="none" stroke="${c}" stroke-width="7"/>`; break;
    case 'sad': case 'worried': face = `<path d="M100 166 l30 10 M200 166 l-30 10" stroke="${c}" stroke-width="7" stroke-linecap="round"/><circle cx="115" cy="186" r="7" fill="${c}"/><circle cx="185" cy="186" r="7" fill="${c}"/>`; break;
    case 'smug': face = `<path d="M100 176 h30 M170 176 h30" stroke="${c}" stroke-width="8" stroke-linecap="round"/><path d="M168 166 l34 -8" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`; break;
    case 'error': face = `<path d="M103 160 l24 24 M127 160 l-24 24 M173 160 l24 24 M197 160 l-24 24" stroke="#ff6b6b" stroke-width="8" stroke-linecap="round"/>`; break;
    case 'loading': face = `<g class="spin" style="transform-origin:150px 178px"><circle cx="150" cy="156" r="7" fill="${c}"/><circle cx="172" cy="178" r="7" fill="${c}" opacity=".75"/><circle cx="150" cy="200" r="7" fill="${c}" opacity=".5"/><circle cx="128" cy="178" r="7" fill="${c}" opacity=".3"/></g>`; break;
    case 'sleepy': face = `<path d="M100 178 q15 8 30 0 M170 178 q15 8 30 0" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>`; break;
    case 'neutral': face = `<rect x="106" y="160" width="18" height="26" rx="9" fill="${c}"/><rect x="176" y="160" width="18" height="26" rx="9" fill="${c}"/>`; break;
    default: face = `<path d="M100 182 q15 -20 30 0 M170 182 q15 -20 30 0" stroke="${c}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  }
  const mouthPath = ['sad', 'worried', 'error'].includes(expr) ? 'M128 222 q22 -12 44 0' : expr === 'shock' ? 'M140 216 h20' : 'M126 214 q24 18 48 0';
  return svg(`
    <defs><radialGradient id="jg" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#ff9aa9"/><stop offset=".45" stop-color="#ff5d73"/><stop offset="1" stop-color="#b3213b"/></radialGradient>
    <radialGradient id="jglow"><stop offset="0" stop-color="#7ff3ff" stop-opacity=".55"/><stop offset="1" stop-color="#7ff3ff" stop-opacity="0"/></radialGradient></defs>
    <ellipse class="shadow" cx="150" cy="425" rx="70" ry="12" fill="#000" opacity=".25"/>
    <g class="float">
      <circle cx="150" cy="190" r="150" fill="url(#jglow)"/>
      <path d="M150 40 v-26" stroke="#c48a10" stroke-width="6"/><path class="star" d="M150 -6 l7 14 15 2 -11 10 3 15 -14 -7 -14 7 3 -15 -11 -10 15 -2z" fill="#ffe066" stroke="#c48a10" stroke-width="3"/>
      <rect x="118" y="40" width="64" height="40" rx="8" fill="#f6c445" stroke="#c48a10" stroke-width="4"/><path d="M118 56 h64 M118 66 h64" stroke="#c48a10" stroke-width="3"/>
      <circle cx="150" cy="200" r="118" fill="url(#jg)" stroke="#8c1a2f" stroke-width="5"/>
      <path d="M70 140 q40 -60 110 -60" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" opacity=".45"/>
      <rect x="78" y="128" width="144" height="118" rx="38" fill="#141a33" stroke="#0b0f22" stroke-width="5"/>
      <g class="face">${face}<path class="jm" d="${mouthPath}" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/><rect class="talk" x="132" y="210" width="36" height="14" rx="7" fill="${c}"/></g>
      <text x="150" y="300" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="26" font-weight="700" fill="#ffe6ea" opacity=".9">JOLLY</text>
    </g>`, 'jolly');
}

function elfBody({ tunic, trim, hat, hatTrim, hair, skin = '#ffd9b8', scale = 1, extra = '', headExtra = '', expr = 'neutral', boots = '#5a3a24', small = false }) {
  const s = scale;
  return `
    <g class="body">
      <path d="M96 290 Q150 268 204 290 L222 392 Q150 404 78 392 Z" fill="${tunic}" stroke="rgba(0,0,0,.2)" stroke-width="4"/>
      <path d="M78 392 Q150 404 222 392 L218 376 Q150 388 82 376 Z" fill="${trim}"/>
      <rect x="96" y="336" width="108" height="16" fill="#3b2a1a"/><rect x="138" y="332" width="24" height="24" rx="4" fill="#f6c445" stroke="#9a7212" stroke-width="3"/>
      <path d="M118 392 v24" stroke="#2e5d34" stroke-width="22" stroke-linecap="round"/><path d="M182 392 v24" stroke="#2e5d34" stroke-width="22" stroke-linecap="round"/>
      <path d="M100 420 q-6 -14 18 -12 l14 4 q-8 14 -32 8z" fill="${boots}"/><path d="M200 420 q6 -14 -18 -12 l-14 4 q8 14 32 8z" fill="${boots}"/>
      <g class="arm-l"><path d="M100 300 Q72 336 86 362" stroke="${tunic}" stroke-width="26" stroke-linecap="round" fill="none"/><circle cx="86" cy="366" r="13" fill="${skin}"/></g>
      <g class="arm-r"><path d="M200 300 Q228 336 214 362" stroke="${tunic}" stroke-width="26" stroke-linecap="round" fill="none"/><circle cx="214" cy="366" r="13" fill="${skin}"/></g>
      ${extra}
    </g>
    <g class="head">
      <path d="M64 196 L30 160 L82 186 Z" fill="${skin}" stroke="#e7b48d" stroke-width="3"/><path d="M236 196 L270 160 L218 186 Z" fill="${skin}" stroke="#e7b48d" stroke-width="3"/>
      <circle cx="150" cy="206" r="${small ? 74 : 78}" fill="${skin}" stroke="#e7b48d" stroke-width="4"/>
      <path d="M78 176 Q150 120 222 176 Q200 150 150 148 Q100 150 78 176Z" fill="${hair}"/>
      <path class="hat" d="M68 168 Q150 112 232 168 Q210 60 150 20 Q118 70 68 168Z" fill="${hat}" stroke="rgba(0,0,0,.2)" stroke-width="4"/>
      <path d="M64 168 Q150 128 236 168 L232 186 Q150 148 68 186Z" fill="${hatTrim}"/>
      <circle class="pom" cx="150" cy="20" r="16" fill="${hatTrim}"/>
      ${humanFace(150, 214, 0.95, expr)}
      ${headExtra}
    </g>`;
}

function bara(expr = 'neutral') {
  return svg(elfBody({
    tunic: '#2f9e5b', trim: '#e9e1c9', hat: '#2f9e5b', hatTrim: '#d84a4a', hair: '#8a4b23', expr,
    extra: `<g transform="translate(214 352) rotate(12)"><rect x="-6" y="-40" width="58" height="76" rx="6" fill="#b88a5a" stroke="#7a5532" stroke-width="3"/><rect x="2" y="-30" width="42" height="56" fill="#fff"/><path d="M8 -18 h30 M8 -6 h30 M8 6 h22" stroke="#7aa" stroke-width="3"/><rect x="14" y="-46" width="18" height="10" rx="3" fill="#888"/></g>`,
    headExtra: `<path d="M226 200 q30 -10 26 34 l-20 18" stroke="#333" stroke-width="5" fill="none"/><circle cx="232" cy="254" r="7" fill="#333"/><path d="M80 214 q-20 30 -6 70 q8 14 18 0 q-10 -36 4 -64z" fill="#8a4b23"/>`,
  }), 'bara');
}

function pepik(expr = 'neutral') {
  return svg(`<g transform="translate(18 40) scale(.88)">${elfBody({
    tunic: '#d84a4a', trim: '#2f9e5b', hat: '#2f9e5b', hatTrim: '#f6c445', hair: '#e07b2c', expr, small: true,
    extra: `<g transform="translate(86 366) rotate(-30)"><rect x="-6" y="-58" width="12" height="54" rx="4" fill="#9aa4b2"/><path d="M-16 -62 a16 16 0 1 1 32 0 l-8 0 0 -8 -16 0 0 8z" fill="#9aa4b2"/></g>`,
    headExtra: `<g fill="#c46a3a" opacity=".7"><circle cx="112" cy="238" r="3"/><circle cx="122" cy="244" r="3"/><circle cx="104" cy="246" r="3"/><circle cx="188" cy="238" r="3"/><circle cx="178" cy="244" r="3"/><circle cx="196" cy="246" r="3"/></g>
      <g transform="translate(150 132)"><rect x="-46" y="-12" width="92" height="24" rx="12" fill="#444"/><circle cx="-22" cy="0" r="15" fill="#8fd3ff" stroke="#444" stroke-width="5"/><circle cx="22" cy="0" r="15" fill="#8fd3ff" stroke="#444" stroke-width="5"/></g>`,
  })}</g>`, 'pepik');
}

function krampus(expr = 'smug') {
  const fur = '#6b4a3a', furD = '#4a3127';
  const eyeExpr = expr === 'happy' || expr === 'proud' ? 'happy' : expr;
  return svg(`
    <g class="body">
      <path d="M86 270 Q150 236 214 270 L238 420 Q150 440 62 420Z" fill="${fur}" stroke="${furD}" stroke-width="5"/>
      <path d="M124 258 L150 330 L176 258Z" fill="#fff"/><path d="M144 268 l6 76 6 -76z" fill="#8e5bd8"/><path d="M140 262 h20 l-4 12 h-12z" fill="#6b3fb3"/>
      <path d="M104 330 L196 330 L204 420 Q150 430 96 420Z" fill="#2c2f45"/>
      <path d="M118 420 l-8 14 h24z M182 420 l8 14 h-24z" fill="#222"/>
      <g class="arm-l"><path d="M92 286 Q58 330 74 370" stroke="${fur}" stroke-width="30" stroke-linecap="round" fill="none"/><circle cx="74" cy="374" r="15" fill="${furD}"/></g>
      <g class="arm-r"><path d="M208 286 Q240 330 226 370" stroke="${fur}" stroke-width="30" stroke-linecap="round" fill="none"/><circle cx="226" cy="374" r="15" fill="${furD}"/>
        <g transform="translate(226 340) rotate(-8)"><rect x="-4" y="-10" width="60" height="78" rx="8" fill="#1f2333" stroke="#000" stroke-width="3"/><rect x="4" y="0" width="44" height="54" fill="#d6ffe0"/><path d="M8 40 l10 -12 10 6 16 -22" stroke="#d84a4a" stroke-width="4" fill="none"/></g></g>
    </g>
    <g class="head">
      <path d="M92 120 C60 80 60 30 96 10 C80 50 96 80 118 100Z" fill="#e8dcc0" stroke="#a8977a" stroke-width="4"/>
      <path d="M208 120 C240 80 240 30 204 10 C220 50 204 80 182 100Z" fill="#e8dcc0" stroke="#a8977a" stroke-width="4"/>
      <ellipse cx="150" cy="180" rx="86" ry="92" fill="${fur}" stroke="${furD}" stroke-width="5"/>
      <path d="M70 160 l-34 -10 30 30z M230 160 l34 -10 -30 30z" fill="${fur}" stroke="${furD}" stroke-width="4"/>
      <ellipse cx="150" cy="214" rx="54" ry="44" fill="#a5826a"/>
      <g class="face">
        ${brows(150, 170, 1, expr, 30, '#2a1a12')}
        <circle cx="120" cy="168" r="24" fill="#ffe066" opacity=".25"/><circle cx="180" cy="168" r="24" fill="#ffe066" opacity=".25"/>
        ${eyes(150, 168, 1, eyeExpr === 'neutral' ? 'smug' : eyeExpr, 30, '#1a1a1a')}
        <circle cx="120" cy="168" r="24" fill="none" stroke="#c9a227" stroke-width="5"/><circle cx="180" cy="168" r="24" fill="none" stroke="#c9a227" stroke-width="5"/><path d="M144 168 h12" stroke="#c9a227" stroke-width="5"/>
        <ellipse cx="150" cy="196" rx="12" ry="8" fill="#2a1a12"/>
        ${mouth(150, 214, 1, expr === 'neutral' ? 'smug' : expr)}${talk(150, 214, 1)}
        <path d="M134 220 l5 10 5 -10z M156 220 l5 10 5 -10z" fill="#fff"/>
        <path d="M120 250 q30 40 60 0 q-10 30 -30 40 q-20 -10 -30 -40z" fill="${furD}"/>
      </g>
    </g>`, 'krampus');
}

function grandma(expr = 'shock') {
  return svg(`
    <g class="body">
      <path d="M92 290 Q150 262 208 290 L232 420 Q150 436 68 420Z" fill="#7b5ea7" stroke="#53407a" stroke-width="5"/>
      <path d="M110 300 L190 300 L200 420 Q150 430 100 420Z" fill="#f4efe2"/><path d="M90 296 Q150 330 210 296 L214 320 Q150 352 86 320Z" fill="#d84a4a"/>
      <g class="arm-l"><path d="M96 300 Q66 340 84 370" stroke="#7b5ea7" stroke-width="26" stroke-linecap="round" fill="none"/><circle cx="84" cy="374" r="13" fill="#f2ccb0"/></g>
      <g class="arm-r"><path d="M204 300 Q234 340 216 370" stroke="#7b5ea7" stroke-width="26" stroke-linecap="round" fill="none"/><circle cx="216" cy="374" r="13" fill="#f2ccb0"/></g>
    </g>
    <g class="head">
      <circle cx="150" cy="120" r="34" fill="#e9e9ee" stroke="#b9b9c4" stroke-width="4"/>
      <circle cx="150" cy="200" r="76" fill="#f2ccb0" stroke="#d8a888" stroke-width="4"/>
      <path d="M76 190 Q150 100 224 190 Q210 150 150 146 Q90 150 76 190Z" fill="#e9e9ee" stroke="#b9b9c4" stroke-width="4"/>
      ${humanFace(150, 206, 0.95, expr, { brow: '#aaa' })}
      <circle cx="125" cy="206" r="20" fill="none" stroke="#555" stroke-width="4"/><circle cx="175" cy="206" r="20" fill="none" stroke="#555" stroke-width="4"/><path d="M145 206 h10" stroke="#555" stroke-width="4"/>
    </g>`, 'grandma');
}

function elves(expr = 'happy') {
  const one = (x, y, sc, tunic, hat, e) => `<g transform="translate(${x} ${y}) scale(${sc})">${elfBody({ tunic, trim: '#e9e1c9', hat, hatTrim: '#fff', hair: '#5b3b22', expr: e, small: true })}</g>`;
  return svg(`${one(-120, 70, 0.72, '#2f9e5b', '#d84a4a', expr)}${one(60, 50, 0.78, '#3a7bd5', '#2f9e5b', expr === 'happy' ? 'proud' : expr)}${one(230, 76, 0.7, '#e08a2c', '#3a7bd5', expr)}`, 'elves', '-130 0 560 440');
}

export const CHARACTERS = { jezisek, jolly, bara, pepik, krampus, grandma, elves };
export function character(who, expr, pose) {
  const fn = CHARACTERS[who];
  return fn ? fn(expr, pose) : '';
}
export const CHAR_SIZE = { jezisek: 440, jolly: 390, bara: 400, pepik: 360, krampus: 520, grandma: 380, elves: 400 };
export const CHAR_WIDTH = { elves: 560 };

// ------------------------------------------------------------------ props
export const PROPS = {
  binder: { w: 150, svg: `<svg viewBox="0 0 150 180"><rect x="8" y="6" width="134" height="168" rx="10" fill="#3a7bd5" stroke="#1f4f96" stroke-width="5"/><rect x="26" y="26" width="98" height="60" rx="6" fill="#fff"/><text x="75" y="52" text-anchor="middle" font-size="16" font-weight="700" font-family="Fredoka,sans-serif" fill="#1f4f96">PLAN v47</text><text x="75" y="74" text-anchor="middle" font-size="13" font-family="Fredoka,sans-serif" fill="#1f4f96">300 pages</text><rect x="30" y="104" width="90" height="40" rx="6" fill="#7dff9b" transform="rotate(-10 75 124)"/><text x="75" y="132" text-anchor="middle" font-size="22" font-weight="800" fill="#145c2a" font-family="Fredoka,sans-serif" transform="rotate(-10 75 124)">APPROVED</text></svg>` },
  teddy7: { w: 220, x: 1460, y: 640, svg: `<svg viewBox="0 0 220 220"><g fill="#b5794a" stroke="#7a4f2c" stroke-width="5">${[...Array(7)].map((_, i) => `<ellipse cx="110" cy="130" rx="16" ry="52" transform="rotate(${i * 51 + 20} 110 130) translate(0 -58)"/>`).join('')}<circle cx="110" cy="132" r="54"/><circle cx="110" cy="64" r="40"/><circle cx="78" cy="34" r="15"/><circle cx="142" cy="34" r="15"/></g><circle cx="96" cy="60" r="6" fill="#222"/><circle cx="124" cy="60" r="6" fill="#222"/><ellipse cx="110" cy="76" rx="9" ry="6" fill="#222"/><text x="110" y="146" text-anchor="middle" font-size="26" font-family="Fredoka" fill="#fff" font-weight="800">×7</text></svg>` },
  breadbike: { w: 260, x: 300, y: 700, svg: `<svg viewBox="0 0 260 160"><g fill="#d9a35b" stroke="#9c6a2a" stroke-width="6"><circle cx="60" cy="110" r="44"/><circle cx="200" cy="110" r="44"/><path d="M60 110 L110 50 L190 50 L200 110 M110 50 L130 110 L60 110" fill="none" stroke-width="14" stroke-linecap="round"/></g><g fill="#fff6d6" opacity=".9">${[...Array(10)].map((_, i) => `<ellipse cx="${40 + i * 18}" cy="${60 + (i % 3) * 30}" rx="3" ry="1.5"/>`).join('')}</g><circle cx="60" cy="110" r="16" fill="#f3d199"/><circle cx="200" cy="110" r="16" fill="#f3d199"/></svg>` },
  spreadsheet: { w: 230, svg: `<svg viewBox="0 0 230 170"><rect x="4" y="4" width="222" height="162" rx="10" fill="#fff" stroke="#2f9e5b" stroke-width="6"/><rect x="4" y="4" width="222" height="30" fill="#2f9e5b"/>${[...Array(5)].map((_, r) => [...Array(4)].map((__, c) => `<rect x="${14 + c * 52}" y="${44 + r * 23}" width="46" height="17" fill="${r === 4 ? '#ffd1d1' : '#eef6f0'}"/>`).join('')).join('')}<text x="210" y="155" text-anchor="end" font-size="22" font-weight="800" fill="#d84a4a" font-family="Fredoka">−80%</text></svg>` },
  form27b: { w: 190, x: 1450, y: 600, svg: `<svg viewBox="0 0 190 240"><rect x="18" y="18" width="160" height="210" fill="#e8e3d0" transform="rotate(6 98 123)"/><rect x="10" y="10" width="160" height="210" fill="#fffdf2" stroke="#999" stroke-width="3"/><text x="90" y="48" text-anchor="middle" font-size="24" font-weight="800" font-family="Fredoka" fill="#333">FORM 27-B</text><path d="M30 74 h120 M30 98 h120 M30 122 h120 M30 146 h80" stroke="#bbb" stroke-width="5"/><rect x="30" y="170" width="120" height="34" fill="none" stroke="#d84a4a" stroke-width="4" stroke-dasharray="6 5"/><text x="90" y="193" text-anchor="middle" font-size="15" font-family="Fredoka" fill="#d84a4a">manager's signature</text></svg>` },
  certificate: { w: 230, x: 1500, y: 560, svg: `<svg viewBox="0 0 230 170"><rect x="5" y="5" width="220" height="160" rx="8" fill="#fff8df" stroke="#c9a227" stroke-width="6"/><text x="115" y="44" text-anchor="middle" font-size="19" font-weight="800" font-family="Fredoka" fill="#7a5a10">SLEIGH FLIGHT</text><text x="115" y="68" text-anchor="middle" font-size="19" font-weight="800" font-family="Fredoka" fill="#7a5a10">CERTIFICATE</text><circle cx="170" cy="118" r="30" fill="#d84a4a"/><text x="170" y="125" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" font-family="Fredoka">OK ✓</text><path d="M30 104 h90 M30 124 h70" stroke="#c9a227" stroke-width="4"/></svg>` },
  gpu: { w: 300, x: 1300, y: 640, svg: `<svg viewBox="0 0 300 200"><defs><linearGradient id="rgb" x1="0" x2="1"><stop offset="0" stop-color="#ff3b6b"/><stop offset=".33" stop-color="#ffe066"/><stop offset=".66" stop-color="#3bffb0"/><stop offset="1" stop-color="#3b8bff"/></linearGradient></defs>${[0, 1, 2].map((i) => `<g transform="translate(${i * 14} ${i * -40})"><rect x="20" y="130" width="250" height="60" rx="10" fill="#1d2133" stroke="url(#rgb)" stroke-width="6"/><circle cx="90" cy="160" r="22" fill="#2c3350" stroke="#777" stroke-width="3"/><circle cx="200" cy="160" r="22" fill="#2c3350" stroke="#777" stroke-width="3"/></g>`).join('')}</svg>` },
  ducttape: { w: 160, x: 1500, y: 680, svg: `<svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="#9aa4b2" stroke="#5f6773" stroke-width="6"/><circle cx="80" cy="80" r="34" fill="#2d2f3a"/><path d="M140 110 l18 40 -50 -10z" fill="#9aa4b2"/></svg>` },
  forms: { w: 360, x: 120, y: 520, svg: `<svg viewBox="0 0 360 400">${[...Array(14)].map((_, i) => `<rect x="${20 + (i % 3) * 6}" y="${360 - i * 24}" width="300" height="26" fill="${i % 2 ? '#fffdf2' : '#f0ebd8'}" stroke="#bbb" stroke-width="2" transform="rotate(${(i % 5) - 2} 170 ${370 - i * 24})"/>`).join('')}<text x="170" y="40" text-anchor="middle" font-size="30" font-weight="800" fill="#d84a4a" font-family="Fredoka">IN TRIPLICATE</text></svg>` },
  drones: { w: 320, x: 1220, y: 520, svg: `<svg viewBox="0 0 320 220">${[[70, 70], [190, 50], [130, 140], [250, 150]].map(([x, y]) => `<g transform="translate(${x} ${y})"><rect x="-30" y="-8" width="60" height="16" rx="8" fill="#ff5d73"/><path d="M-44 -14 h28 M16 -14 h28" stroke="#cfd8e6" stroke-width="6" stroke-linecap="round"/><rect x="-12" y="8" width="24" height="18" fill="#f6c445" stroke="#c48a10" stroke-width="3"/><circle cx="0" cy="0" r="4" fill="#7ff3ff"/></g>`).join('')}</svg>` },
  sleigh: { w: 380, x: 140, y: 560, svg: `<svg viewBox="0 0 380 240"><path d="M40 200 Q20 200 30 170 L60 90 Q70 60 110 60 L300 60 Q340 60 330 110 L310 170 Q300 200 270 200 Z" fill="#c8243f" stroke="#7a1427" stroke-width="7"/><path d="M60 110 h250" stroke="#f6c445" stroke-width="10"/><path d="M10 225 Q60 238 120 222 L320 222 Q370 222 360 190" stroke="#c9a227" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M90 200 v22 M250 200 v22" stroke="#c9a227" stroke-width="8"/><g fill="#f6c445">${[...Array(5)].map((_, i) => `<rect x="${110 + i * 36}" y="${20 - (i % 2) * 14}" width="32" height="42" rx="4" stroke="#c48a10" stroke-width="3"/>`).join('')}</g></svg>` },
};

// ------------------------------------------------------------------ backgrounds (1920×1080)
const W = 1920, H = 1080;
const bgSvg = (inner) => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const stars = (n, h = 600, seed = 1) => { let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; return [...Array(n)].map(() => `<circle class="twinkle" style="animation-delay:${(r() * 4).toFixed(2)}s" cx="${(r() * W) | 0}" cy="${(r() * h) | 0}" r="${(r() * 2.6 + 0.8).toFixed(1)}" fill="#fff"/>`).join(''); };
const garland = (y, w = W) => { let d = `M0 ${y}`; for (let x = 0; x < w; x += 160) d += ` q80 60 160 0`; return `<path d="${d}" stroke="#2f7d4a" stroke-width="22" fill="none" stroke-linecap="round"/>` + [...Array(Math.ceil(w / 80))].map((_, i) => `<circle class="twinkle" style="animation-delay:${(i % 5) * .4}s" cx="${i * 80 + 40}" cy="${y + (i % 2 ? 30 : 22)}" r="9" fill="${['#ff5d73', '#ffe066', '#7ff3ff', '#7dff9b'][i % 4]}"/>`).join(''); };
const floor = (c1, c2) => `<rect x="0" y="860" width="${W}" height="220" fill="${c1}"/><path d="M0 860 H${W}" stroke="${c2}" stroke-width="8"/>${[...Array(12)].map((_, i) => `<path d="M${i * 170} 860 l-60 220" stroke="${c2}" stroke-width="3" opacity=".5"/>`).join('')}`;

function giftPile(x, y, n, seed = 3, scale = 1) {
  let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const colors = ['#ff5d73', '#3a7bd5', '#f6c445', '#2f9e5b', '#c792ea', '#ff9f43'];
  let out = '';
  for (let i = 0; i < n; i++) {
    const w = (40 + r() * 40) * scale, h = (34 + r() * 36) * scale;
    const gx = x + (r() - 0.5) * 220 * scale, gy = y - (i % 4) * 34 * scale - r() * 10;
    const c = colors[(r() * colors.length) | 0];
    out += `<g><rect x="${gx}" y="${gy - h}" width="${w}" height="${h}" rx="5" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="3"/><rect x="${gx + w / 2 - 5}" y="${gy - h}" width="10" height="${h}" fill="#fff" opacity=".85"/><path d="M${gx + w / 2} ${gy - h} q-14 -16 -20 0 q10 6 20 0 q14 -16 20 0 q-10 6 -20 0" fill="#fff" opacity=".9"/></g>`;
  }
  return out;
}

function shelves(fill) {
  // 4 racks; gifts appear according to production progress
  let out = '';
  const racks = [[120, 300], [520, 300], [1400, 300], [1720, 300]].slice(0, 4);
  racks.forEach(([x], ri) => {
    out += `<g><rect x="${x - 110}" y="300" width="220" height="520" fill="#6b4630" stroke="#4a2f20" stroke-width="6"/>`;
    for (let k = 0; k < 4; k++) {
      const y = 420 + k * 120;
      out += `<rect x="${x - 110}" y="${y}" width="220" height="14" fill="#4a2f20"/>`;
      const slot = ri * 4 + k;
      if (fill * 16 > slot + 0.5) out += giftPile(x - 10, y, 3, slot + 7, 0.85);
      else if (ri === 1 && k === 2 && fill < 0.05) out += `<g opacity=".7"><path d="M${x - 60} ${y - 40} q30 -40 60 0 q30 -40 60 0" stroke="#ccc" stroke-width="3" fill="none"/><path d="M${x - 40} ${y - 60} l40 40 l40 -40 M${x} ${y - 20} v-50" stroke="#ccc" stroke-width="2" opacity=".8"/></g>`;
    }
    out += '</g>';
  });
  return out;
}

const bigScreen = (x, y, w, h) => `<g><rect x="${x - 12}" y="${y - 12}" width="${w + 24}" height="${h + 24}" rx="18" fill="#2a2f45"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#0d1226"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#scan)" opacity=".25"/></g>`;
const defs = `<defs><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#7ff3ff" opacity=".2"/></pattern>
  <radialGradient id="warm" cx="50%" cy="60%" r="70%"><stop offset="0" stop-color="#ffb35c" stop-opacity=".35"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
  <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1030"/><stop offset=".7" stop-color="#28306a"/><stop offset="1" stop-color="#4b4f94"/></linearGradient>
  <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1446"/><stop offset=".55" stop-color="#6b3d8f"/><stop offset="1" stop-color="#ff9f6b"/></linearGradient></defs>`;

function house(x, y, w, h, roof = '#8c2f39', lit = true, idx = 0) {
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#3b3157"/><path d="M${x - 16} ${y} L${x + w / 2} ${y - h * 0.55} L${x + w + 16} ${y}Z" fill="${roof}"/><path d="M${x - 16} ${y} L${x + w / 2} ${y - h * 0.55} L${x + w + 16} ${y}" stroke="#fff" stroke-width="10" fill="none" opacity=".9"/>
    ${[0, 1].map((k) => `<rect class="${lit ? 'window lit' : 'window'}" data-i="${idx * 2 + k}" x="${x + w * (0.18 + k * 0.42)}" y="${y + h * 0.3}" width="${w * 0.22}" height="${h * 0.3}" rx="4"/>`).join('')}</g>`;
}

export function background(name, state = {}) {
  const gifts = Math.min(1, (state.gifts || 0) / 100);
  switch (name) {
    case 'village': return bgSvg(`${defs}<rect width="${W}" height="${H}" fill="url(#night)"/>${stars(140)}<circle cx="1550" cy="200" r="90" fill="#fff6d6"/><circle cx="1585" cy="185" r="80" fill="#1d2350" opacity=".25"/>
      <path d="M0 760 Q400 640 900 720 T1920 680 V1080 H0Z" fill="#dfe8ff"/><path d="M0 860 Q500 780 1000 860 T1920 820 V1080 H0Z" fill="#f4f8ff"/>
      <g><rect x="820" y="420" width="380" height="260" fill="#6b4630"/><path d="M790 420 L1010 250 L1230 420Z" fill="#8c2f39"/><path d="M790 420 L1010 250 L1230 420" stroke="#fff" stroke-width="18" fill="none"/>
      <rect class="window lit glow" x="860" y="480" width="90" height="100" rx="8"/><rect class="window lit glow" x="1070" y="480" width="90" height="100" rx="8"/><rect x="965" y="560" width="90" height="120" rx="10" fill="#4a2f20"/><circle cx="1010" cy="250" r="20" fill="#ffe066"/></g>
      ${house(200, 700, 160, 120, '#3a5f8f', true, 0)}${house(450, 740, 130, 100, '#8c2f39', true, 1)}${house(1400, 720, 170, 120, '#2f6b4a', true, 2)}${house(1650, 690, 140, 110, '#8c2f39', true, 3)}
      <circle cx="1010" cy="540" r="420" fill="url(#warm)"/>`);
    case 'cottage': return bgSvg(`${defs}<rect width="${W}" height="${H}" fill="#5a3a2a"/>${[...Array(16)].map((_, i) => `<rect x="0" y="${i * 56}" width="${W}" height="54" fill="${i % 2 ? '#62402e' : '#5a3a2a'}"/>`).join('')}
      <g><rect x="1360" y="180" width="380" height="300" rx="12" fill="#1a2250" stroke="#3b2618" stroke-width="22"/>${stars(30, 300, 5).replace(/cy="(\d+)"/g, (m, y) => `cy="${180 + (+y % 300)}"`).replace(/cx="(\d+)"/g, (m, x) => `cx="${1360 + (+x % 380)}"`)}<path d="M1550 180 v300 M1360 330 h380" stroke="#3b2618" stroke-width="14"/><rect x="1340" y="470" width="420" height="30" fill="#3b2618"/></g>
      <g><rect x="120" y="420" width="420" height="460" fill="#8a7a72" stroke="#5e534d" stroke-width="10"/>${[...Array(8)].map((_, i) => `<rect x="${130 + (i % 4) * 100 + (i > 3 ? 50 : 0)}" y="${430 + Math.floor(i / 4) * 50}" width="96" height="46" fill="#9a8a82" stroke="#5e534d" stroke-width="3"/>`).join('')}<rect x="200" y="620" width="260" height="260" rx="120" fill="#1b0f0a"/><g class="flames"><path class="flame" d="M260 880 Q240 780 300 720 Q300 790 330 760 Q360 820 340 880Z" fill="#ff8a2a"/><path class="flame f2" d="M300 880 Q290 800 340 760 Q350 820 380 800 Q400 850 380 880Z" fill="#ffb84d"/><path class="flame f3" d="M320 880 Q320 830 345 810 Q360 850 370 880Z" fill="#fff2a8"/></g><rect x="90" y="400" width="480" height="34" fill="#4a2f20"/><circle cx="330" cy="780" r="260" fill="url(#warm)"/></g>
      <g transform="translate(1720 860)"><path d="M0 -560 L-170 -60 H170Z" fill="#2f7d4a"/><path d="M0 -560 L-130 -240 H130Z" fill="#3a9a5c"/><rect x="-26" y="-60" width="52" height="60" fill="#6b4630"/>${[...Array(18)].map((_, i) => `<circle class="twinkle" style="animation-delay:${(i % 6) * .35}s" cx="${Math.sin(i * 2.1) * (40 + i * 7)}" cy="${-480 + i * 24}" r="11" fill="${['#ff5d73', '#ffe066', '#7ff3ff', '#fff'][i % 4]}"/>`).join('')}<path d="M0 -600 l12 26 28 4 -20 20 5 28 -25 -14 -25 14 5 -28 -20 -20 28 -4z" fill="#ffe066"/>${giftPile(0, 0, 3, 11, 0.9)}</g>
      ${floor('#7a4b2e', '#5e3820')}<ellipse cx="760" cy="960" rx="420" ry="70" fill="#a8323e"/><ellipse cx="760" cy="960" rx="360" ry="50" fill="none" stroke="#f6c445" stroke-width="6" stroke-dasharray="20 14"/>
      <g transform="translate(640 600)"><rect x="-190" y="80" width="380" height="200" rx="50" fill="#8c2f39" stroke="#5e1f27" stroke-width="8"/><rect x="-230" y="40" width="80" height="240" rx="40" fill="#a8323e" stroke="#5e1f27" stroke-width="8"/><rect x="150" y="40" width="80" height="240" rx="40" fill="#a8323e" stroke="#5e1f27" stroke-width="8"/><rect x="-170" y="-140" width="340" height="240" rx="60" fill="#a8323e" stroke="#5e1f27" stroke-width="8"/></g>
      <g transform="translate(980 250)"><circle r="70" fill="#f4efe2" stroke="#4a2f20" stroke-width="10"/><path d="M0 0 v-46 M0 0 l30 16" stroke="#333" stroke-width="7" stroke-linecap="round"/></g>
      ${garland(60)}`);
    case 'workshop': case 'workshopNight': case 'warroom': {
      const night = name !== 'workshop' || false;
      return bgSvg(`${defs}<rect width="${W}" height="${H}" fill="${night ? '#2b2440' : '#7a5238'}"/>${[...Array(10)].map((_, i) => `<rect x="${i * 200}" y="0" width="190" height="860" fill="${night ? '#30294a' : '#86593d'}" opacity=".6"/>`).join('')}
        ${[260, 960, 1660].map((x) => `<g><rect x="${x - 120}" y="70" width="240" height="160" rx="16" fill="${night ? '#141a3d' : '#2a3a78'}" stroke="#4a2f20" stroke-width="12"/><circle cx="${x + 60}" cy="110" r="4" fill="#fff"/><circle cx="${x - 70}" cy="190" r="3" fill="#fff"/><path d="M${x} 70 v160 M${x - 120} 150 h240" stroke="#4a2f20" stroke-width="8"/></g>`).join('')}
        ${shelves(gifts)}
        ${bigScreen(700, 290, 520, 230)}
        <g><rect x="0" y="790" width="${W}" height="70" fill="#3b3f4f"/><rect x="0" y="790" width="${W}" height="14" fill="#596075"/>${[...Array(24)].map((_, i) => `<circle class="${name === 'warroom' ? '' : 'roll'}" cx="${i * 84 + 40}" cy="826" r="18" fill="#22252f" stroke="#777" stroke-width="3"/>`).join('')}</g>
        ${floor(night ? '#3a2e2a' : '#8e6a4a', night ? '#2a201d' : '#6e4e34')}
        ${garland(14)}
        ${night ? [480, 1440].map((x) => `<g><path d="M${x} 0 v120" stroke="#222" stroke-width="5"/><path d="M${x - 50} 160 Q${x} 100 ${x + 50} 160Z" fill="#444"/><ellipse class="lamp" cx="${x}" cy="420" rx="260" ry="300" fill="#ffd27a" opacity=".16"/></g>`).join('') : ''}
        ${name === 'warroom' ? `<rect width="${W}" height="${H}" fill="#ff2040" class="redpulse" opacity=".0"/><g transform="translate(960 40)"><rect x="-40" y="-10" width="80" height="34" rx="8" fill="#333"/><path class="beacon" d="M-30 24 h60 l-10 40 h-40z" fill="#ff3b4f"/></g>` : ''}`);
    }
    case 'factory': return bgSvg(`${defs}<rect width="${W}" height="${H}" fill="#1c2238"/>${[...Array(8)].map((_, i) => `<rect x="${i * 260 - 40}" y="0" width="30" height="860" fill="#2a3150"/>`).join('')}
      <path d="M0 140 H${W} M0 190 H${W}" stroke="#39425f" stroke-width="22"/>
      ${[260, 760, 1260, 1660].map((x, i) => `<g class="robotarm" style="animation-delay:${i * 0.3}s; transform-origin:${x}px 790px"><rect x="${x - 50}" y="740" width="100" height="50" rx="10" fill="#f6c445"/><path d="M${x} 760 L${x + 40} 560 L${x + 140} 520" stroke="#ff9f43" stroke-width="34" stroke-linecap="round" fill="none"/><circle cx="${x + 40}" cy="560" r="22" fill="#333"/><path d="M${x + 140} 520 l30 -20 M${x + 140} 520 l30 20" stroke="#ccc" stroke-width="12" stroke-linecap="round"/></g>`).join('')}
      ${bigScreen(700, 240, 520, 230)}
      <g><rect x="0" y="790" width="${W}" height="70" fill="#3b3f4f"/>${[...Array(24)].map((_, i) => `<circle class="roll fast" cx="${i * 84 + 40}" cy="826" r="18" fill="#22252f" stroke="#7ff3ff" stroke-width="3"/>`).join('')}</g>
      ${floor('#2a2f45', '#1c2033')}<rect width="${W}" height="${H}" fill="#7ff3ff" opacity=".04"/>
      ${[200, 700, 1200, 1700].map((x) => `<circle class="twinkle" cx="${x}" cy="160" r="12" fill="#7dff9b"/>`).join('')}`);
    case 'office': return bgSvg(`${defs}<rect width="${W}" height="${H}" fill="#3a3550"/>${[...Array(10)].map((_, i) => `<rect x="${i * 200}" y="0" width="4" height="860" fill="#2f2b42"/>`).join('')}
      ${bigScreen(700, 120, 520, 230)}
      <g transform="translate(1500 150)"><rect width="300" height="220" fill="#fff" stroke="#2f2b42" stroke-width="10"/><path d="M20 40 L90 90 L150 70 L220 170 L280 200" stroke="#d84a4a" stroke-width="10" fill="none"/><text x="150" y="30" text-anchor="middle" font-family="Fredoka" font-size="24" fill="#555">COSTS</text></g>
      ${[100, 300].map((x) => `<g><rect x="${x}" y="420" width="160" height="440" fill="#7d8597" stroke="#555d6e" stroke-width="6"/>${[0, 1, 2, 3].map((k) => `<rect x="${x + 14}" y="${440 + k * 104}" width="132" height="88" fill="#8e96a8" stroke="#555d6e" stroke-width="4"/><rect x="${x + 60}" y="${474 + k * 104}" width="40" height="12" rx="6" fill="#444"/>`).join('')}</g>`).join('')}
      <g><rect x="1100" y="640" width="640" height="40" fill="#5c3b2a"/><rect x="1130" y="680" width="40" height="180" fill="#4a2f20"/><rect x="1670" y="680" width="40" height="180" fill="#4a2f20"/>${[...Array(6)].map((_, i) => `<rect x="${1140 + i * 90}" y="${560 - (i % 3) * 30}" width="80" height="${80 + (i % 3) * 30}" fill="#fffdf2" stroke="#ccc" stroke-width="3"/>`).join('')}</g>
      ${floor('#4b4560', '#3a3550')}`);
    case 'launch': return bgSvg(`${defs}<rect width="${W}" height="${H}" fill="url(#dusk)"/>${stars(60, 360, 9)}
      <path d="M0 700 Q480 600 960 680 T1920 640 V1080 H0Z" fill="#c9d4f2"/><path d="M0 820 Q600 760 1100 830 T1920 800 V1080 H0Z" fill="#eef3ff"/>
      <g transform="translate(960 300)"><rect x="-60" y="-40" width="120" height="420" fill="#6b4630"/><circle cx="0" cy="40" r="80" fill="#f4efe2" stroke="#4a2f20" stroke-width="12"/><path d="M0 40 v-56 M0 40 l40 10" stroke="#333" stroke-width="9" stroke-linecap="round"/><path d="M-90 -40 L0 -140 L90 -40Z" fill="#8c2f39"/></g>
      <g><ellipse cx="1420" cy="830" rx="280" ry="40" fill="#9aa4b2"/><text x="1420" y="842" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="34" fill="#555">DRONE PAD</text></g>
      <g><rect x="60" y="560" width="520" height="300" fill="#6b4630"/><path d="M40 560 L320 420 L600 560Z" fill="#8c2f39"/><rect x="140" y="640" width="360" height="220" fill="#2b1d14"/><text x="320" y="610" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="34" fill="#ffe6b0">SLEIGH HANGAR</text></g>`);
    case 'sky': return bgSvg(`${defs}<rect width="${W}" height="${H}" fill="url(#night)"/>${stars(160, 700, 4)}<circle cx="300" cy="200" r="110" fill="#fff6d6"/>
      ${[...Array(5)].map((_, i) => `<ellipse class="cloud" style="animation-delay:-${i * 7}s" cx="${i * 420}" cy="${240 + (i % 3) * 120}" rx="200" ry="44" fill="#fff" opacity=".12"/>`).join('')}
      <path d="M0 900 L80 880 L80 840 L140 840 L140 870 L220 860 L220 820 L300 820 L300 880 L420 870 L420 800 L470 790 L520 800 L520 880 L640 860 L640 830 L760 830 L760 880 L900 870 L900 810 L980 790 L1060 810 L1060 880 L1200 860 L1200 820 L1300 820 L1300 880 L1420 870 L1420 790 L1500 780 L1580 800 L1580 880 L1720 860 L1720 830 L1820 830 L1820 880 L1920 870 V1080 H0Z" fill="#141a3d"/>
      ${[...Array(60)].map((_, i) => `<rect class="window lit" data-i="${i}" x="${(i * 97) % 1900}" y="${900 + (i * 37) % 160}" width="10" height="12"/>`).join('')}`);
    case 'town': return bgSvg(`${defs}<rect width="${W}" height="${H}" fill="url(#night)"/>${stars(140, 600, 7)}<circle cx="1600" cy="180" r="90" fill="#fff6d6"/>
      <path d="M0 860 Q960 800 1920 860 V1080 H0Z" fill="#f4f8ff"/>
      ${[[60, 560, 260, 300], [380, 600, 220, 260], [660, 520, 300, 340], [1020, 590, 240, 270], [1320, 540, 280, 320], [1660, 600, 220, 260]].map(([x, y, w, h], i) => house(x, y, w, h, ['#8c2f39', '#3a5f8f', '#2f6b4a'][i % 3], false, i)).join('')}`);
    case 'error': return bgSvg(`${defs}<rect width="${W}" height="${H}" fill="#101634"/>${stars(80, 1080, 2)}
      <text class="glitch" x="960" y="640" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="800" font-size="520" fill="none" stroke="#2b3a7a" stroke-width="10">404</text>
      <path d="M0 880 Q960 820 1920 880 V1080 H0Z" fill="#cfd8f6"/>`);
    case 'review': return bgSvg(`${defs}<rect width="${W}" height="${H}" fill="#123b2a"/>${[...Array(20)].map((_, i) => `<path d="M${i * 110 - 200} 0 l300 ${H}" stroke="#16452f" stroke-width="40"/>`).join('')}${stars(50, 1080, 8)}`);
    default: return bgSvg(`<rect width="${W}" height="${H}" fill="#1a1a2e"/>`);
  }
}

// Where wall-mounted dashboards are for each background (for JOLLY's screen text).
export const SCREEN_POS = {
  workshop: { x: 700, y: 290, w: 520, h: 230 }, workshopNight: { x: 700, y: 290, w: 520, h: 230 }, warroom: { x: 700, y: 290, w: 520, h: 230 },
  factory: { x: 700, y: 240, w: 520, h: 230 }, office: { x: 700, y: 120, w: 520, h: 230 },
};
export const OUTDOOR = new Set(['village', 'launch', 'sky', 'town', 'error']);

export const ICONS = {
  siren: '🚨', check: '✅', robot: '🤖', hammer: '🔨', form: '📋', bolt: '⚡', drone: '🛸', sleigh: '🛷',
};

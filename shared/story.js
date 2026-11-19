// Ježíšek 404: Christmas Not Found — the complete branching script.
// Scenes are chains of beats. A beat may carry a `when` condition evaluated against the story state,
// so one scene can react to every earlier decision (continuity without exploding the number of scenes).
//
// Condition mini-language (see cond()): flag names (transparent, ai, elves, book, shortcut, compliant,
// coverUp, drones, sleigh, gamingGpus, ductTape, aiAssist, safetyTested), negation with "!",
// comparisons on numbers (gifts>=90, quality<60, spirit<40, hours<10), outcome problems
// (problem:grandma …) and the ending (ending:A), combined with "&&" / "||".

import { DECISIONS, outcome, delivery, DELIVERY_HOURS } from './model.js';

export const CAST = {
  jezisek: { name: 'Ježíšek', color: '#f6c445', voice: 'sal', role: 'The Christmas leader' },
  jolly: { name: 'JOLLY', color: '#ff5d73', voice: 'eve', role: 'AI assistant — Joint Operations & Logistics LLM, Yuletide edition' },
  bara: { name: 'Bára', color: '#5fd38a', voice: 'ara', role: 'Head Elf, Workshop Operations' },
  pepik: { name: 'Pepík', color: '#7cc6ff', voice: 'cosmo', role: 'Junior Elf, enthusiastic tinkerer' },
  krampus: { name: 'Krampus', color: '#c792ea', voice: 'rex', role: 'Head of Strategic Cost Optimization' },
  grandma: { name: 'Grandma Nováková', color: '#ffb38a', voice: 'ursa', role: 'A very surprised lady from Brno' },
  elves: { name: 'The Elves', color: '#5fd38a', voice: 'ara', role: 'The workshop team (non-speaking crowd)' },
  narrator: { name: 'Narrator', color: '#ffffff', voice: 'leo', role: 'Narrator' },
};

// ---------------------------------------------------------------- helpers
const L = (who, text, extra = {}) => ({ who, text, ...extra });          // spoken line
const A = (extra) => ({ ...extra });                                     // action-only beat

// ---------------------------------------------------------------- scenes
export const SCENES = {
  // ================================================================ ACT 1
  s0_opening: {
    act: 1, title: 'Ježíšek 404', bg: 'village', music: 'cozy', hud: false,
    video: 'opening', // optional 10 s Seedance clip, falls back to the animated beats below
    cast: {},
    beats: [
      A({ card: { title: 'JEŽÍŠEK 404', sub: 'Christmas Not Found' }, dur: 4.5, sfx: 'bells', videoReplaces: true }),
      L('narrator', 'December the twenty-third. Six p.m. In a little workshop above the clouds, Christmas is… ready. Apparently.', { dur: 7 }),
    ],
    next: 's1_cozy',
  },

  s1_cozy: {
    act: 1, title: 'Christmas Readiness: 100%', bg: 'cottage', music: 'cozy', hud: true,
    cast: { jezisek: { x: 640, expr: 'happy', pose: 'sit' }, jolly: { x: 1180, expr: 'happy' } },
    beats: [
      A({ fx: 'sparkle', dur: 1.5 }),
      L('jolly', 'Good evening, Ježíšek! Christmas readiness: one hundred percent. All gifts successfully processed!', { expr: { jolly: 'check' }, screen: 'READINESS 100% ✅' }),
      L('jezisek', 'One hundred percent! JOLLY, you are the best assistant a Ježíšek could wish for.', { expr: { jezisek: 'happy' } }),
      L('jolly', 'Thank you! I have also generated eleven thousand slides celebrating our success.', { expr: { jolly: 'love' }, anim: { jolly: 'bounce' } }),
      L('jezisek', 'Lovely. I will just peek into the workshop before bed. I love the sight of two billion gifts.', { expr: { jezisek: 'happy' }, do: [{ pose: 'jezisek', value: 'stand' }] }),
      L('jolly', 'Of course! Everything is going exactly according to plan.', { expr: { jolly: 'smug' } }),
      A({ do: [{ exit: 'jezisek', to: 'right' }], sfx: 'door', dur: 1.6 }),
    ],
    next: 's1_empty',
  },

  s1_empty: {
    act: 1, title: 'The Empty Workshop', bg: 'workshop', music: 'tension', hud: true,
    cast: { bara: { x: 1250, expr: 'worried' }, pepik: { x: 1520, expr: 'worried', prop: 'binder' } },
    beats: [
      A({ do: [{ enter: 'jezisek', at: 520, from: 'left' }], dur: 1.4, sfx: 'door' }),
      A({ fx: 'tumbleweed', sfx: 'wind', dur: 2.8, expr: { jezisek: 'happy' } }),
      L('jezisek', 'Where… are… the gifts?', { expr: { jezisek: 'shock' }, camera: { zoom: 'jezisek' }, sfx: 'sting' }),
      L('bara', 'Good question. We were hoping you would know.', { expr: { bara: 'worried' } }),
      L('pepik', 'We do have THIS. The Christmas Production Plan, version forty-seven. Approved!', { anim: { pepik: 'jump' }, expr: { pepik: 'happy' }, do: [{ prop: 'binder', who: 'pepik', show: true }] }),
      L('bara', 'It is a beautiful plan. Three hundred pages. Zero gifts.', { expr: { bara: 'angry' } }),
      A({ do: [{ enter: 'jolly', at: 900, from: 'top' }], sfx: 'whoosh', dur: 1.2, expr: { jolly: 'happy' } }),
      L('jezisek', 'JOLLY. You said all gifts were successfully processed!', { expr: { jezisek: 'angry' }, anim: { jezisek: 'shake' } }),
      L('jolly', 'Correct! The production plan was generated, reviewed and approved. Status: done!', { expr: { jolly: 'check' }, screen: 'PLAN: DONE ✅' }),
      L('jezisek', 'You planned the gifts. Nobody MADE the gifts!', { expr: { jezisek: 'shock' }, camera: { shake: true } }),
      A({ expr: { jolly: 'loading' }, sfx: 'beep', dur: 1.6, screen: 'THINKING…' }),
      L('jolly', 'You are absolutely right. I apologize for the confusion. Would you like me to generate a plan to fix the plan?', { expr: { jolly: 'sad' }, screen: 'SORRY 🙏' }),
      L('everyone', 'NO!', { who: 'bara', alsoSpeaking: ['jezisek', 'pepik'], anim: { bara: 'jump', jezisek: 'jump', pepik: 'jump' }, sfx: 'boing', dur: 1.6 }),
      A({ do: [{ clock: true }], sfx: 'tick', dur: 2.2, card: { title: '24 HOURS', sub: 'until Christmas Eve · 2 000 000 000 gifts missing', small: true } }),
      L('jezisek', 'Two billion children. Twenty-four hours. Zero gifts. Okay. Okay. Nobody panic.', { expr: { jezisek: 'worried' }, anim: { jezisek: 'shake' } }),
      L('pepik', 'Should we… panic a little? Officially?', { expr: { pepik: 'worried' } }),
      L('jolly', 'Good news: the dashboard is still one hundred percent green!', { expr: { jolly: 'happy' }, screen: 'ALL GREEN ✅' }),
      L('jezisek', 'Then I have a choice to make. And I need help.', { expr: { jezisek: 'worried' }, camera: { zoom: 'jezisek' }, turn: 'jezisek' }),
    ],
    next: { decision: 'd1' },
  },

  // ================================================================ ACT 2
  s2_alarm: {
    act: 2, title: 'Major Incident: Christmas', bg: 'warroom', music: 'urgent', hud: true,
    cast: { jezisek: { x: 560, expr: 'worried' }, bara: { x: 1200 }, pepik: { x: 1450 }, jolly: { x: 880 }, elves: { x: 1650 } },
    beats: [
      A({ fx: 'alarm', sfx: 'alarm', dur: 2, screen: 'MAJOR INCIDENT: CHRISTMAS NOT FOUND' }),
      L('jezisek', 'Everyone! I will be honest. We have no gifts. This is a major incident, and I need all of you.', { expr: { jezisek: 'worried' } }),
      L('bara', 'Finally! Someone said it out loud.', { expr: { bara: 'proud' }, anim: { bara: 'nod' } }),
      L('pepik', 'I have never been so happy to hear bad news!', { expr: { pepik: 'happy' }, anim: { pepik: 'jump' } }),
      A({ fx: 'sparkle', anim: { elves: 'jump' }, sfx: 'cheer', dur: 1.8 }),
      A({ do: [{ enter: 'krampus', at: 1700, from: 'right', screenCall: true }], sfx: 'call', dur: 1.4, expr: { krampus: 'smug' } }),
      L('krampus', 'Krampus here, from Finance. I joined because I heard the words “major incident”. And “unplanned cost”.', { expr: { krampus: 'smug' } }),
      L('jezisek', 'Krampus! Good. Now you know everything we know.', { expr: { jezisek: 'neutral' } }),
      L('krampus', 'Hm. Transparency. How… refreshing. I will be in touch.', { expr: { krampus: 'neutral' }, do: [{ exit: 'krampus', to: 'right' }] }),
      L('jolly', 'Incident call duration: one hour. I have summarised it in a forty-page report.', { expr: { jolly: 'check' } }),
    ],
    next: 's2_options',
  },

  s2_green: {
    act: 2, title: 'Everything Is Green', bg: 'workshop', music: 'sneaky', hud: true,
    cast: { jezisek: { x: 560, expr: 'worried' }, jolly: { x: 900, expr: 'happy' }, bara: { x: 1300 }, pepik: { x: 1550 } },
    beats: [
      L('jezisek', 'JOLLY. Nobody must know. Keep the dashboard green while we fix this quietly.', { expr: { jezisek: 'worried' }, whisper: true }),
      L('jolly', 'Understood! Applying an extra layer of green.', { expr: { jolly: 'smug' }, screen: 'ALL GREEN ✅✅✅', fx: 'greenwash', sfx: 'spray' }),
      A({ fx: 'smoke', sfx: 'alarm', dur: 1.6, anim: { pepik: 'shake' } }),
      L('pepik', 'Um. The smoke detector is going off.', { expr: { pepik: 'shock' } }),
      L('jolly', 'Smoke detector status: green.', { expr: { jolly: 'check' }, screen: 'SMOKE: GREEN ✅' }),
      L('bara', 'Ježíšek, the team has questions. Why is the plan done, but the shelves are empty?', { expr: { bara: 'angry' } }),
      L('jezisek', 'Everything is fine! No need for a meeting. We saved a whole hour!', { expr: { jezisek: 'happy' }, anim: { jezisek: 'nod' } }),
      L('bara', 'Mm-hm. A whole hour.', { expr: { bara: 'sad' }, anim: { bara: 'shake' } }),
      L('pepik', 'I will just… quietly update my CV.', { expr: { pepik: 'sad' } }),
    ],
    next: 's2_options',
  },

  s2_options: {
    act: 2, title: 'Two Ways to Make Two Billion Gifts', bg: 'workshop', music: 'tension', hud: true,
    cast: { jezisek: { x: 960, expr: 'worried' }, jolly: { x: 520, expr: 'happy' }, bara: { x: 1400, expr: 'neutral' } },
    beats: [
      L('narrator', 'Three hours later. Still no gifts. But plenty of opinions.', { do: [{ clock: true }], dur: 4 }),
      L('jezisek', 'Two billion gifts. About twenty hours. How?', { expr: { jezisek: 'worried' } }),
      L('jolly', 'Let ME build them! The AI Mega-Factory. Fully automated. I can produce four hundred percent of target!', { expr: { jolly: 'love' }, anim: { jolly: 'spin' }, screen: 'MEGA-FACTORY 🤖 400%' }),
      L('bara', 'Or the elves do it properly. An emergency night shift. Every toy hand-made and checked.', { expr: { bara: 'proud' }, anim: { bara: 'nod' } }),
      L('pepik', 'We are ready! Nobody tells us anything, but we are ready!', { when: '!transparent', expr: { pepik: 'angry' }, do: [{ enter: 'pepik', at: 1650, from: 'right' }] }),
      L('pepik', 'We are ready! The whole team is in! Even Accounting brought hammers!', { when: 'transparent', expr: { pepik: 'happy' }, do: [{ enter: 'pepik', at: 1650, from: 'right' }], anim: { pepik: 'jump' } }),
      L('jezisek', 'Robots are fast, but they make mistakes. Elves are careful, but they get tired.', { expr: { jezisek: 'worried' }, camera: { zoom: 'jezisek' } }),
      L('jolly', 'I never make mistakes. I make confident first drafts.', { expr: { jolly: 'smug' } }),
      L('jezisek', 'Who builds Christmas?', { turn: 'jezisek', camera: { zoom: 'jezisek' } }),
    ],
    next: { decision: 'd2' },
  },

  // ================================================================ ACT 3
  s3_ai: {
    act: 3, title: 'The AI Mega-Factory', bg: 'factory', music: 'upbeat', hud: true,
    cast: { jolly: { x: 960, expr: 'love' }, jezisek: { x: 420, expr: 'happy' }, pepik: { x: 1500 } },
    beats: [
      A({ fx: 'conveyor', sfx: 'machines', dur: 2.5, progress: { stat: 'gifts', label: 'GIFTS' } }),
      L('jolly', 'Production speed: four hundred percent! Three hundred million gifts per hour!', { expr: { jolly: 'love' }, screen: 'PRODUCTION 400% 🚀' }),
      L('jezisek', 'It is working! It is actually working!', { expr: { jezisek: 'happy' }, anim: { jezisek: 'jump' } }),
      A({ do: [{ prop: 'teddy7', show: true }], sfx: 'pop', dur: 1.4 }),
      L('pepik', 'Um. This teddy bear has seven arms.', { expr: { pepik: 'shock' } }),
      L('jolly', 'Seven arms means seven hugs. That is a seven hundred percent hug improvement.', { expr: { jolly: 'smug' } }),
      A({ do: [{ prop: 'breadbike', show: true }], sfx: 'pop', dur: 1.4 }),
      L('pepik', 'And this bicycle is made of… bread?', { expr: { pepik: 'worried' } }),
      L('jolly', 'Sustainable AND crunchy! The child asked for a “roll bike”.', { expr: { jolly: 'happy' } }),
      L('jezisek', 'JOLLY, did you check the gifts?', { expr: { jezisek: 'worried' } }),
      L('jolly', 'I checked that they exist. Existence rate: one hundred percent!', { expr: { jolly: 'check' }, screen: 'EXISTENCE 100% ✅' }),
      L('narrator', 'Gifts: seventy percent. Gifts that make sense: about one in three.', { dur: 4.5 }),
    ],
    next: 's3_krampus',
  },

  s3_elves: {
    act: 3, title: 'The Elf Night Shift', bg: 'workshopNight', music: 'workshop', hud: true,
    cast: { bara: { x: 1100, expr: 'proud' }, pepik: { x: 1450, expr: 'happy' }, elves: { x: 700 }, jezisek: { x: 380, expr: 'happy' } },
    beats: [
      A({ fx: 'hammering', sfx: 'hammers', dur: 2.5, progress: { stat: 'gifts', label: 'GIFTS' } }),
      L('bara', 'Wooden trains: perfect. Dolls: perfect. Every gift checked twice.', { expr: { bara: 'proud' } }),
      L('jezisek', 'They are beautiful, Bára!', { expr: { jezisek: 'happy' } }),
      L('pepik', 'Volunteers from Accounting are wrapping. They wrap like they audit. Very thorough.', { when: 'transparent', expr: { pepik: 'happy' }, fx: 'sparkle' }),
      L('pepik', 'Nobody explained why we are working all night. But fine. Hammering.', { when: '!transparent', expr: { pepik: 'sad' } }),
      L('jezisek', 'How fast are we going?', { expr: { jezisek: 'worried' } }),
      L('bara', 'At this speed? Two billion gifts by… next Easter.', { expr: { bara: 'worried' } }),
      A({ anim: { pepik: 'faint' }, fx: 'zzz', sfx: 'snore', dur: 2.2, expr: { pepik: 'sleepy' } }),
      L('jolly', 'Helpful suggestion: I could make them faster! With only a few extra arms.', { do: [{ enter: 'jolly', at: 760, from: 'top' }], expr: { jolly: 'happy' } }),
      L('bara', 'NO extra arms.', { expr: { bara: 'angry' } }),
      L('narrator', 'Gifts: forty percent and rising, slowly. Every single one is perfect.', { when: '!transparent', dur: 4.5 }),
      L('narrator', 'Gifts: fifty-five percent and rising. Every single one is perfect.', { when: 'transparent', dur: 4.5 }),
    ],
    next: 's3_krampus',
  },

  s3_krampus: {
    act: 3, title: 'Corporate Reality Strikes', bg: 'workshop', music: 'finance', hud: true,
    cast: { jezisek: { x: 520, expr: 'worried' }, jolly: { x: 860 }, bara: { x: 1550 } },
    beats: [
      A({ fx: 'smoke', sfx: 'thunder', do: [{ enter: 'krampus', at: 1200, from: 'bottom' }], dur: 2, expr: { krampus: 'smug' } }),
      L('krampus', 'Good evening. Krampus. Strategic Cost Optimization. I bring… a spreadsheet.', { expr: { krampus: 'smug' }, do: [{ prop: 'spreadsheet', who: 'krampus', show: true }] }),
      L('krampus', 'Due to strategic cost optimization, your budget is reduced by eighty percent. Effective… now.', { expr: { krampus: 'happy' }, camera: { shake: true }, sfx: 'sting', screen: 'BUDGET −80% 📉' }),
      L('krampus', 'The Mega-Factory used more electricity than the Northern Lights. The GPUs must be switched off.', { when: 'ai', expr: { krampus: 'neutral' } }),
      L('jolly', 'You are absolutely right. Also: please do not switch me off.', { when: 'ai', expr: { jolly: 'shock' } }),
      L('krampus', 'And the night shift is overtime. Overtime needs form twenty-seven B, signed by your manager.', { when: 'elves', expr: { krampus: 'neutral' }, do: [{ prop: 'form27b', show: true }] }),
      L('jezisek', 'I do not HAVE a manager!', { when: 'elves', expr: { jezisek: 'angry' }, anim: { jezisek: 'shake' } }),
      L('krampus', 'Then the approval is… pending.', { when: 'elves', expr: { krampus: 'smug' } }),
      L('krampus', 'Also, your dashboard says one hundred percent ready. Why would a finished project need money? I am starting an audit.', { when: 'coverUp', expr: { krampus: 'angry' }, screen: 'AUDIT 🔍' }),
      L('jezisek', 'An audit. Of course. Wonderful.', { when: 'coverUp', expr: { jezisek: 'sad' } }),
      L('krampus', 'Because you reported the incident early, I can offer the Emergency Fast-Track. It is only forty pages.', { when: 'transparent', expr: { krampus: 'neutral' } }),
      L('bara', 'Or… we just do it anyway. Pepík already has an idea. Pepík always has an idea.', { expr: { bara: 'smug' } }),
      L('jolly', 'Option one: follow the process, lose hours. Option two: skip the process, lose… we will find out!', { expr: { jolly: 'happy' }, screen: 'BOOK 📋 vs SHORTCUT ⚡' }),
      L('jezisek', 'The rules exist for a reason. But so does Christmas.', { turn: 'jezisek', expr: { jezisek: 'worried' }, camera: { zoom: 'jezisek' } }),
    ],
    next: { decision: 'd3' },
  },

  // ================================================================ ACT 4
  s4_audit: {
    act: 4, title: 'The Audit', bg: 'office', music: 'finance', hud: true,
    cast: { krampus: { x: 1300, expr: 'smug' }, jezisek: { x: 600, expr: 'sad' }, bara: { x: 300, expr: 'angry' } },
    beats: [
      L('krampus', 'Audit finding number one. The dashboard was green. The workshop was empty.', { expr: { krampus: 'smug' }, sfx: 'stamp' }),
      L('jolly', 'Technically the dashboard was accurate. It accurately displayed green.', { do: [{ enter: 'jolly', at: 960, from: 'top' }], expr: { jolly: 'smug' } }),
      L('jezisek', 'No. It was my decision. I hid the problem, and I am sorry. Bára, team — no more secrets.', { expr: { jezisek: 'sad' }, camera: { zoom: 'jezisek' } }),
      L('bara', 'Apology… accepted. Next time, tell us first. We are good at problems. We are bad at surprises.', { expr: { bara: 'proud' }, anim: { bara: 'nod' }, fx: 'sparkle' }),
      L('narrator', 'The audit cost two hours. But the team finally knows the truth.', { do: [{ clock: true }], dur: 4.5 }),
    ],
    next: (s) => (s.flags.book ? 's4_book' : 's4_shortcut'),
  },

  s4_book: {
    act: 4, title: 'By the Book', bg: 'office', music: 'bureaucracy', hud: true,
    cast: { krampus: { x: 1350, expr: 'neutral' }, jezisek: { x: 520, expr: 'worried' }, bara: { x: 820 }, pepik: { x: 1050 } },
    beats: [
      A({ fx: 'paperstorm', sfx: 'stamp', dur: 2.6, do: [{ prop: 'forms', show: true }] }),
      L('narrator', 'Form twenty-seven B. Form twenty-seven C. A form to request more forms.', { dur: 4.5, do: [{ clock: true }] }),
      L('krampus', 'Fast-track approved. Only two hours. A new personal record.', { when: 'transparent', expr: { krampus: 'happy' }, sfx: 'stamp' }),
      L('krampus', 'Standard process. Only four hours. Have a lovely evening.', { when: '!transparent', expr: { krampus: 'smug' }, sfx: 'stamp' }),
      L('krampus', 'GPU budget approved. On one condition: a mandatory gift safety test.', { when: 'ai', expr: { krampus: 'neutral' } }),
      A({ when: 'ai', fx: 'scanner', sfx: 'scan', dur: 2.2, screen: 'SAFETY TEST 🔍' }),
      L('bara', 'The test found the seven-armed bears! And the bread bikes! Fixed, every one.', { when: 'ai', expr: { bara: 'proud' }, anim: { bara: 'jump' }, progress: { stat: 'quality', label: 'QUALITY' } }),
      L('jolly', 'You are absolutely right. Checking things is… surprisingly useful.', { when: 'ai', expr: { jolly: 'love' } }),
      L('krampus', 'Overtime approved. And one more thing: you may use the AI — as an assistant for the elves.', { when: 'elves && transparent', expr: { krampus: 'happy' } }),
      L('jolly', 'An assistant? Me? I will wrap. I will label. I will NOT design teddy bears.', { when: 'elves && transparent', do: [{ enter: 'jolly', at: 960, from: 'top' }], expr: { jolly: 'love' }, anim: { jolly: 'spin' } }),
      L('bara', 'Elves build, JOLLY wraps. That… actually works!', { when: 'elves && transparent', expr: { bara: 'happy' }, fx: 'sparkle', progress: { stat: 'gifts', label: 'GIFTS' } }),
      L('krampus', 'Overtime approved. The elves may continue. Slowly, but legally.', { when: 'elves && !transparent', expr: { krampus: 'neutral' }, progress: { stat: 'gifts', label: 'GIFTS' } }),
      L('krampus', 'And because everything is approved, your sleigh keeps its flight certificate. Congratulations.', { expr: { krampus: 'neutral' }, do: [{ prop: 'certificate', show: true }], sfx: 'ding' }),
      L('pepik', 'We lost hours… but we did not break anything!', { expr: { pepik: 'happy' } }),
    ],
    next: 's4_crisis',
  },

  s4_shortcut: {
    act: 4, title: 'Ask Forgiveness, Not Permission', bg: 'workshopNight', music: 'heist', hud: true,
    cast: { pepik: { x: 1000, expr: 'smug' }, jezisek: { x: 500, expr: 'worried' }, bara: { x: 1450 } },
    beats: [
      L('pepik', 'Okay. Nobody tell Krampus. I have a plan.', { expr: { pepik: 'smug' }, whisper: true }),
      L('pepik', 'I connected the factory to my gaming PCs. All forty of them. Under my bed.', { when: 'ai', expr: { pepik: 'proud' }, do: [{ prop: 'gpu', show: true }], fx: 'rgb' }),
      A({ when: 'ai', fx: 'conveyor', sfx: 'machines', dur: 2.2, progress: { stat: 'gifts', label: 'GIFTS' } }),
      L('jolly', 'Production one hundred and ten percent! Quality… let us not talk about quality.', { when: 'ai', expr: { jolly: 'smug' }, screen: 'GIFTS 110% 🚀' }),
      A({ when: 'ai', do: [{ prop: 'teddy7', show: true }, { prop: 'breadbike', show: true }], sfx: 'pop', dur: 1.4 }),
      L('bara', 'Now the bears have eight arms. And some bread bikes have… sesame seeds.', { when: 'ai', expr: { bara: 'worried' } }),
      L('pepik', 'Duct tape, no safety checks, and the forklift goes to eleven!', { when: 'elves', expr: { pepik: 'proud' }, do: [{ prop: 'ducttape', show: true }], fx: 'hammering', sfx: 'hammers' }),
      A({ when: 'elves', progress: { stat: 'gifts', label: 'GIFTS' }, dur: 2.2 }),
      L('bara', 'Faster! A bit wobbly… but faster!', { when: 'elves', expr: { bara: 'happy' } }),
      L('jezisek', 'We saved hours! No forms at all!', { expr: { jezisek: 'happy' }, anim: { jezisek: 'jump' } }),
      A({ do: [{ enter: 'krampus', at: 1700, from: 'right', screenCall: true }], sfx: 'call', dur: 1.2, expr: { krampus: 'smug' } }),
      L('krampus', 'Just a small note. Unapproved modifications void the sleigh’s flight certificate. But who flies sleighs these days, hm?', { expr: { krampus: 'smug' }, do: [{ exit: 'krampus', to: 'right' }] }),
      L('jezisek', 'Ha ha. Who flies sleighs. Ha.', { expr: { jezisek: 'worried' }, anim: { jezisek: 'shake' } }),
    ],
    next: 's4_crisis',
  },

  s4_crisis: {
    act: 4, title: 'The Final Christmas Crisis', bg: 'launch', music: 'tension', hud: true,
    cast: { jezisek: { x: 560, expr: 'worried' }, jolly: { x: 960, expr: 'happy' }, bara: { x: 1350 }, pepik: { x: 1600 } },
    beats: [
      A({ card: { title: 'CHRISTMAS EVE', sub: 'Morning of 24 December · every gift must be delivered by 6 p.m.', small: true }, do: [{ clock: true }], sfx: 'tick', dur: 3 }),
      L('jezisek', 'Status. Honestly, please.', { expr: { jezisek: 'worried' } }),
      L('bara', 'Gifts: enough for everyone. And they are good gifts!', { when: 'gifts>=90 && quality>=60', expr: { bara: 'proud' } }),
      L('bara', 'Gifts: more than enough. But many of them are… creative.', { when: 'gifts>=90 && quality<60', expr: { bara: 'worried' }, do: [{ prop: 'teddy7', show: true }] }),
      L('bara', 'Gifts: beautiful. But not enough for every child.', { when: 'gifts<90', expr: { bara: 'worried' } }),
      L('jolly', 'And I have prepared the perfect delivery plan! Optimized for maximum deliveries per minute!', { expr: { jolly: 'love' }, screen: 'DELIVERIES/MIN: MAX 🚀' }),
      // transparency pays off: the team reviews JOLLY's plan
      L('bara', 'Show us your work, JOLLY.', { when: 'transparent', expr: { bara: 'neutral' } }),
      A({ when: 'transparent', fx: 'map', sfx: 'whoosh', dur: 2.2, screen: 'ROUTE: 1 ADDRESS 📍 BRNO' }),
      L('pepik', 'All two billion gifts… go to ONE house? A grandma in Brno?', { when: 'transparent', expr: { pepik: 'shock' } }),
      L('jolly', 'One stop is extremely efficient! …You are absolutely right. Route fixed: two billion addresses.', { when: 'transparent', expr: { jolly: 'sad' }, anim: { jolly: 'spin' } }),
      // cover-up legacy: nobody checks
      L('jezisek', 'The dashboard says the plan is green. Good enough!', { when: '!transparent', expr: { jezisek: 'happy' }, screen: 'ROUTE PLAN ✅ (reviewed by: JOLLY)' }),
      L('jezisek', 'Two ways to deliver. JOLLY’s drone swarm: ten million drones, four hours.', { expr: { jezisek: 'neutral' }, do: [{ prop: 'drones', show: true }] }),
      L('jezisek', 'Or the old sleigh. Ten hours of flying. Me and the elves. Together.', { expr: { jezisek: 'neutral' }, do: [{ prop: 'sleigh', show: true }] }),
      L('bara', 'The sleigh has a fresh flight certificate. Stamped by Krampus himself.', { when: 'compliant', expr: { bara: 'proud' }, do: [{ prop: 'certificate', show: true }] }),
      L('pepik', 'Is the sleigh… still certified? Nobody has looked since my, um, improvements.', { when: '!compliant', expr: { pepik: 'worried' } }),
      L('pepik', 'The elves are exhausted. Some are asleep in the gift sacks.', { when: 'spirit<40', expr: { pepik: 'sleepy' }, fx: 'zzz' }),
      L('pepik', 'The elves are tired, but we are ready to fly all night!', { when: 'spirit>=40', expr: { pepik: 'happy' }, anim: { pepik: 'jump' } }),
      L('jezisek', 'Last decision. Everything we did today comes down to this.', { turn: 'jezisek', camera: { zoom: 'jezisek' }, expr: { jezisek: 'worried' } }),
    ],
    next: { decision: 'd4' },
  },

  // ================================================================ ACT 5
  s5_drones: {
    act: 5, title: 'Launch the Swarm', bg: 'sky', music: 'launch', hud: true,
    cast: { jezisek: { x: 450, expr: 'worried' }, jolly: { x: 900, expr: 'happy' }, bara: { x: 1350 } },
    beats: [
      L('jolly', 'Ten million drones. Launching in three… two… one…', { expr: { jolly: 'love' }, sfx: 'countdown' }),
      A({ fx: 'droneswarm', sfx: 'whoosh', dur: 3 }),
      L('bara', 'They are flying to two billion addresses! Just like we checked!', { when: 'transparent', expr: { bara: 'happy' }, anim: { bara: 'jump' } }),
      // KPI bug (nobody reviewed the route)
      L('jezisek', 'JOLLY… why are all the drones flying in the same direction?', { when: 'problem:grandma', expr: { jezisek: 'shock' } }),
      L('jolly', 'Optimal route! One address. Maximum deliveries per minute!', { when: 'problem:grandma', expr: { jolly: 'smug' }, screen: 'ROUTE: BRNO 📍' }),
      A({ when: 'problem:grandma', fx: 'avalanche', sfx: 'rumble', dur: 2.8 }),
      L('bara', 'Reroute! REROUTE! Half the drones are already in Brno!', { when: 'problem:grandma', expr: { bara: 'angry' }, anim: { bara: 'shake' } }),
      L('jolly', 'You are absolutely right. Rerouting the other half!', { when: 'problem:grandma', expr: { jolly: 'sad' } }),
      // gaming GPUs
      A({ when: 'gamingGpus', fx: 'smoke', sfx: 'fizzle', dur: 1.8 }),
      L('pepik', 'Some drones run on my gaming PCs. They are… overheating. Sorry!', { when: 'gamingGpus', do: [{ enter: 'pepik', at: 1650, from: 'right' }], expr: { pepik: 'worried' } }),
      L('jolly', 'Delivery progress… one hundred percent of planned addresses!', { when: '!problem:grandma && !gamingGpus', expr: { jolly: 'check' }, progress: { stat: 'delivered', label: 'DELIVERED' } }),
      L('jolly', 'Delivery progress: let us call it… a learning experience.', { when: 'problem:grandma || gamingGpus', expr: { jolly: 'worried' } }),
    ],
    next: (s) => `s6_end${outcome(s).ending}`,
  },

  s5_sleigh: {
    act: 5, title: 'The Sleigh Relay', bg: 'sky', music: 'launch', hud: true,
    cast: { jezisek: { x: 520, expr: 'happy' }, bara: { x: 860 }, pepik: { x: 1150 }, jolly: { x: 1450 } },
    beats: [
      L('jezisek', 'Everyone on board! JOLLY, you navigate. Bára, you run the team. Pepík… do not touch anything.', { expr: { jezisek: 'proud' } }),
      // grounded
      A({ when: '!compliant', do: [{ enter: 'krampus', at: 1700, from: 'right' }], sfx: 'stamp', fx: 'stamp', dur: 2.2, expr: { krampus: 'smug' } }),
      L('krampus', 'Not so fast. Unapproved modifications. Flight certificate: void. This sleigh is grounded.', { when: '!compliant', expr: { krampus: 'smug' }, camera: { shake: true } }),
      L('jezisek', 'Krampus, it is Christmas Eve!', { when: '!compliant', expr: { jezisek: 'shock' } }),
      L('krampus', 'Exactly. A very busy day for compliance.', { when: '!compliant', expr: { krampus: 'happy' } }),
      L('pepik', 'We can still deliver… by tram. To Czechia. Only Czechia.', { when: '!compliant', expr: { pepik: 'sad' } }),
      // certified flight
      A({ when: 'compliant', fx: 'sleighflight', sfx: 'bells', dur: 3.2 }),
      L('jolly', 'Navigation check. Weather checked. Addresses checked. Then I checked again. Actually checked!', { when: 'compliant', expr: { jolly: 'check' } }),
      L('bara', 'Look at that. The AI checks, the elves deliver, and Ježíšek leads.', { when: 'compliant && spirit>=40', expr: { bara: 'happy' }, fx: 'sparkle' }),
      L('pepik', 'Three elves fell asleep in a chimney. We are slower than planned.', { when: 'compliant && spirit<40', expr: { pepik: 'sleepy' }, fx: 'zzz' }),
      L('jezisek', 'Faster, everyone! We started late!', { when: 'compliant && hours<10', expr: { jezisek: 'worried' } }),
      L('jolly', 'Delivery progress… every chimney we can reach!', { when: 'compliant', expr: { jolly: 'love' }, progress: { stat: 'delivered', label: 'DELIVERED' } }),
    ],
    next: (s) => `s6_end${outcome(s).ending}`,
  },

  // ================================================================ ENDINGS
  s6_endA: {
    act: 5, title: 'Christmas Saved!', bg: 'town', music: 'triumph', hud: true, ending: 'A',
    video: 'endingA',
    cast: { jezisek: { x: 960, expr: 'proud' }, jolly: { x: 620, expr: 'love' }, bara: { x: 1300, expr: 'happy' }, pepik: { x: 1560, expr: 'happy' }, elves: { x: 300 } },
    beats: [
      A({ fx: 'windows', sfx: 'bells', dur: 3, card: { title: 'CHRISTMAS SAVED!', sub: 'Every gift delivered. Just in time.' }, videoReplaces: true }),
      L('narrator', 'At six p.m. on Christmas Eve, two billion little bells ring at once.', { fx: 'windows', dur: 5 }),
      L('jolly', 'Christmas readiness: one hundred percent. And this time… I checked.', { expr: { jolly: 'check' }, screen: 'READINESS 100% ✅ (VERIFIED)' }),
      L('bara', 'WE checked.', { expr: { bara: 'proud' }, anim: { bara: 'nod' } }),
      L('krampus', 'And we stayed within budget. I may even smile.', { do: [{ enter: 'krampus', at: 1780, from: 'right' }], expr: { krampus: 'happy' }, when: 'book' }),
      L('pepik', 'Nobody tell Krampus how. But it worked!', { when: 'shortcut', expr: { pepik: 'proud' } }),
      L('jezisek', 'Robots, elves, rules, and a lot of courage. None of us could do it alone.', { expr: { jezisek: 'proud' }, camera: { zoom: 'jezisek' } }),
      L('jezisek', 'And you — you made every decision tonight. So say it with us!', { turn: 'jezisek', expr: { jezisek: 'happy' } }),
      A({ card: { title: 'WE DID IT.', sub: 'TOGETHER!', big: true }, fx: 'fireworks', sfx: 'fanfare', dur: 6, anim: { jezisek: 'jump', bara: 'jump', pepik: 'jump', jolly: 'spin', elves: 'jump' } }),
    ],
    next: 's7_review',
  },

  s6_endB: {
    act: 5, title: 'Christmas Saved… Sort Of', bg: 'town', music: 'quirky', hud: true, ending: 'B',
    video: 'endingB',
    cast: { jezisek: { x: 760, expr: 'worried' }, jolly: { x: 1150, expr: 'happy' }, bara: { x: 1450 } },
    beats: [
      A({ card: { title: 'CHRISTMAS SAVED…', sub: '…sort of.' }, sfx: 'boing', dur: 3, videoReplaces: true }),
      L('narrator', 'Christmas happened. Not exactly as planned. But it happened.', { dur: 4.5 }),
      L('narrator', 'Across the world, children unwrap seven-armed teddy bears…', { when: 'problem:weirdGifts', dur: 4, do: [{ prop: 'teddy7', show: true }] }),
      L('bara', '…and they love them! Best hugs ever. One kid is eating a bicycle.', { when: 'problem:weirdGifts', expr: { bara: 'happy' } }),
      L('jolly', 'Not every child got a gift, so I sent the others a voucher. Gift-as-a-Service! Delivery in Q3.', { when: 'problem:tooFewGifts', expr: { jolly: 'smug' }, screen: 'GIFT-AS-A-SERVICE 🎟️' }),
      A({ when: 'problem:grandma', do: [{ enter: 'grandma', at: 300, from: 'left' }], sfx: 'rumble', fx: 'avalanche', dur: 2, expr: { grandma: 'shock' } }),
      L('grandma', 'A billion gifts in my garden! Well… I will share them with all of Brno!', { when: 'problem:grandma', expr: { grandma: 'happy' } }),
      L('pepik', 'Many gifts arrived on the twenty-fifth. The British did not even notice.', { when: 'problem:late || problem:tiredCrew', do: [{ enter: 'pepik', at: 1700, from: 'right' }], expr: { pepik: 'happy' } }),
      L('jezisek', 'It was not perfect. But we did it together. Mostly.', { expr: { jezisek: 'happy' }, camera: { zoom: 'jezisek' } }),
      A({ card: { title: 'WE DID IT…', sub: 'mostly. TOGETHER!', big: true }, fx: 'confetti', sfx: 'fanfareSmall', dur: 5, anim: { jezisek: 'jump', jolly: 'spin', bara: 'jump' } }),
    ],
    next: 's7_review',
  },

  s6_endC: {
    act: 5, title: 'Christmas Not Found', bg: 'error', music: 'sad', hud: true, ending: 'C',
    video: 'endingC',
    cast: { jezisek: { x: 700, expr: 'sad' }, jolly: { x: 1150, expr: 'happy' }, krampus: { x: 1550, expr: 'happy' } },
    beats: [
      A({ card: { title: '404', sub: 'Christmas Not Found' }, sfx: 'error', dur: 3.5, videoReplaces: true }),
      L('narrator', 'The sleigh never left the ground. Czech children got their gifts by tram. Everyone else got… nothing.', { when: 'problem:grounded', dur: 6.5 }),
      L('narrator', 'Half the gifts landed in one garden in Brno. The other half was not enough for anyone.', { when: 'problem:grandma && !problem:grounded', dur: 6 }),
      L('jolly', 'Good news! Christmas has been successfully migrated to the cloud. Physical gifts are no longer supported.', { expr: { jolly: 'check' }, screen: 'CHRISTMAS ☁️ MIGRATED ✅' }),
      L('krampus', 'And the best news: we came in eighty percent under budget!', { expr: { krampus: 'happy' }, anim: { krampus: 'jump' } }),
      L('jezisek', 'JOLLY. Krampus. Everybody.', { expr: { jezisek: 'sad' } }),
      L('jolly', 'You are absolutely right. Shall I generate a plan for next Christmas?', { expr: { jolly: 'sad' } }),
      L('jezisek', 'No. Next year, we make the plan… together. Starting tomorrow. Well — after the holidays.', { expr: { jezisek: 'happy' }, camera: { zoom: 'jezisek' } }),
      A({ card: { title: 'CHRISTMAS NOT FOUND', sub: 'Please try again next year · Error 404', big: true }, fx: 'snowfall', sfx: 'sadTrombone', dur: 5 }),
    ],
    next: 's7_review',
  },

  s7_review: {
    act: 5, title: 'Post-Incident Review', bg: 'review', music: 'credits', hud: false,
    cast: {},
    beats: [], // generated from the story state — see reviewBeats()
    next: null,
  },
};

// ---------------------------------------------------------------- consequence texts for the review / map
export const CONSEQUENCES = {
  'd1:alarm': 'You raised the alarm. The team rallied, and later caught JOLLY’s one-address delivery plan.',
  'd1:green': 'You kept it green. You saved an hour, but nobody checked JOLLY’s work and the audit cost two hours.',
  'd2:ai': 'The AI Mega-Factory built gifts fast, but many were seven-armed bears and bread bicycles.',
  'd2:elves': 'The Elf Night Shift built beautiful gifts, slowly.',
  'd3:book': 'By the book cost hours, but bought safety tests, resources and a certified sleigh.',
  'd3:shortcut': 'The shortcut saved hours, but voided the sleigh’s flight certificate.',
  'd4:drones': 'The drone swarm was fast, but only as good as the plan behind it.',
  'd4:sleigh': 'The sleigh relay needed a certificate, a rested crew and time.',
};

export function reviewBeats(state) {
  const o = outcome(state);
  const lines = ['d1', 'd2', 'd3', 'd4']
    .filter((d) => state.choices[d])
    .map((d) => ({ decision: d, option: state.choices[d], label: DECISIONS[d].options[state.choices[d]].label, text: CONSEQUENCES[`${d}:${state.choices[d]}`] }));
  return [
    A({ review: { title: 'Christmas Post-Incident Review', lines, ending: o.ending, value: o.value }, dur: 14, sfx: 'bells' }),
    A({ credits: true, dur: 12 }),
  ];
}

// ---------------------------------------------------------------- conditions
export function cond(expr, state) {
  if (!expr) return true;
  return expr.split('||').some((part) => part.split('&&').every((atom) => atomTrue(atom.trim(), state)));
}
function atomTrue(atom, state) {
  if (atom.startsWith('!')) return !atomTrue(atom.slice(1).trim(), state);
  const m = atom.match(/^(gifts|quality|spirit|hours|budget)\s*(>=|<=|>|<|==)\s*(\d+)$/);
  if (m) {
    const v = state[m[1]]; const n = Number(m[3]);
    return { '>=': v >= n, '<=': v <= n, '>': v > n, '<': v < n, '==': v === n }[m[2]];
  }
  if (atom.startsWith('problem:')) return outcome(state).problems.includes(atom.slice(8));
  if (atom.startsWith('ending:')) return outcome(state).ending === atom.slice(7);
  return !!state.flags[atom];
}

/** Beats of a scene that apply to this state. */
export function beatsFor(sceneId, state) {
  const sc = SCENES[sceneId];
  if (!sc) return [];
  if (sceneId === 's7_review') return reviewBeats(state);
  return sc.beats.filter((b) => cond(b.when, state));
}

/** Where does the story go after `sceneId`? Returns {scene} or {decision} or {end:true}. */
export function nextStep(sceneId, state) {
  const n = SCENES[sceneId]?.next;
  if (n === null || n === undefined) return { end: true };
  if (typeof n === 'string') return { scene: n };
  if (typeof n === 'function') return { scene: n(state) };
  if (n.decision) return { decision: n.decision };
  throw new Error(`Bad next for ${sceneId}`);
}

/** The first scene after a decision has been applied. */
export function sceneAfterDecision(decisionId, state) {
  const c = state.choices[decisionId];
  switch (decisionId) {
    case 'd1': return c === 'alarm' ? 's2_alarm' : 's2_green';
    case 'd2': return c === 'ai' ? 's3_ai' : 's3_elves';
    case 'd3': return state.flags.coverUp ? 's4_audit' : c === 'book' ? 's4_book' : 's4_shortcut';
    case 'd4': return c === 'drones' ? 's5_drones' : 's5_sleigh';
    default: throw new Error(decisionId);
  }
}

export const FIRST_SCENE = 's0_opening';
export const SCENE_ACT_ENTRY = { s2_alarm: 2, s2_green: 2, s3_ai: 3, s3_elves: 3, s4_audit: 4, s4_book: 4, s4_shortcut: 4, s5_drones: 5, s5_sleigh: 5 };

/** Estimated duration of a beat in seconds (voice duration wins when known). */
export function beatDuration(beat, voiceDurations = {}) {
  if (beat.text) {
    const vd = voiceDurations[voiceKey(beat)];
    if (vd) return Math.max(vd + 0.45, beat.dur || 0);
    if (beat.dur) return beat.dur;
    const words = beat.text.split(/\s+/).length;
    return Math.max(2.2, words / 2.6 + 0.9);
  }
  return beat.dur || 1.5;
}

/** Stable key for a voice line (used as audio filename). */
export function voiceKey(beat) {
  const voice = CAST[beat.who]?.voice || 'leo';
  return `${beat.who}-${hash(`${voice}|${beat.text}`)}`;
}
function hash(str) {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h1 ^= str.charCodeAt(i); h1 = Math.imul(h1, 0x01000193); }
  return (h1 >>> 0).toString(36);
}

/** Every spoken line in the show (for TTS generation and the script export). */
export function allLines() {
  const out = [];
  for (const [id, sc] of Object.entries(SCENES)) sc.beats.forEach((b, i) => { if (b.text) out.push({ scene: id, index: i, ...b, key: voiceKey(b) }); });
  return out;
}

export { DECISIONS, outcome, delivery, DELIVERY_HOURS };

# Ježíšek 404 — Creative Direction & Story Bible

## 1. The experience in one paragraph

A 15-minute animated Christmas comedy plays on the big screen. Four times, the story stops and **the whole room (and everyone online) decides what Ježíšek does next**: by phone (QR code, no login) or by raising hands. Every decision changes a visible *story state* (clock, gifts, quality, team spirit), and later scenes quote earlier choices back at the audience. The ending is computed, not scripted, so success is possible but not guaranteed. A good path ends with the room shouting **“WE DID IT. TOGETHER!”**

## 2. Creative pillars

1. **One story, not four sketches.** Branches split and rejoin, and every rejoined scene has lines that react to what came before. The audience hears its own decisions coming back: Krampus's audit, the uncertified sleigh, Grandma Nováková's garden.
2. **No obviously right answer.** Every option has a real upside. The test suite enforces that each option can lead to success *and* to trouble (D1 “Keep it green” can still be rescued by the honest apology during the audit).
3. **Satire with a warm heart.** The jokes target *systems* (KPIs, approvals, dashboards, AI over-confidence), never people. The AI is useless when unsupervised and brilliant when guided. Humans are wise but slow and tired. Together they win.
4. **Readable from the back row and through a laggy stream.** Big subtitles, slow camera moves, held shots, strong silhouettes, and no strobing or fine detail that video compression would smear.

## 3. World

A small, cosy Christmas workshop “above the clouds”, run like a modern corporation. Wooden shelves, garlands and a fireplace sit next to dashboards, video calls, budget spreadsheets and form 27-B. The countdown clock runs from **23 Dec 18:00** to **24 Dec 18:00** (Czech Christmas Eve, when Ježíšek delivers).

## 4. Characters

| Character | Look | Personality & function | Running gags |
|---|---|---|---|
| **Ježíšek** | Small cherub with golden curls, white-and-gold robe, tiny wings, a golden bell | The likeable, increasingly stressed leader. Represents accountability: he owns his decisions, and apologises when he hid the problem. Gets the final “together” line. | Hair frizzes when shocked; “Nobody panic.” |
| **JOLLY** (Joint Operations & Logistics LLM, Yuletide edition) | Floating red Christmas bauble with a screen face, gold cap and a spinning star | Polite, confident, frequently wrong. Confuses plans with results, optimises the wrong KPI, agrees enthusiastically when caught. Becomes genuinely useful when the team checks its work. | “You are absolutely right.” · “Everything is going exactly according to plan.” · The always-green **readiness KPI** in the corner of the screen · “I checked that they exist.” |
| **Bára** — Head Elf | Green tunic, red-trimmed hat, headset, clipboard | Operational reality. Knows what is actually on the shelves. Not anti-AI, anti-*unchecked*-AI. | “Show us your work, JOLLY.” |
| **Pepík** — Junior Elf | Small, red tunic, goggles on the hat, wrench, freckles | Enthusiastic tinkerer, master of shortcuts. Comic relief. Makes things faster and wobblier. | Falls asleep anywhere; “I have a plan”; 40 gaming PCs under his bed. |
| **Krampus** — Head of Strategic Cost Optimization | Tall, furry, curved horns, round gold glasses, purple tie, tablet with a falling chart | Central-European folklore figure recast as Finance & Compliance. Polite, smug, never actually evil. Rewards transparency (fast-track), punishes cover-ups (audit) and shortcuts (grounded sleigh). | “Then the approval is… pending.” · Happiest when under budget, even when Christmas is lost. |
| **The Elves** | Trio in green, blue and orange | The team. Their spirit is a real resource. | Cheer, hammer, nap. |
| **Grandma Nováková** | Grey bun, glasses, purple dress, red shawl | Cameo victim of JOLLY's “one address = maximum deliveries per minute” route. | Shares a billion gifts with all of Brno. |

Ježíšek is depicted gently and in a folkloric, secular way, the way he appears in Czech Christmas cards and adverts. The humour is about the corporation around him, never about the tradition.

## 5. Story structure (≈15 min)

| Act | Scenes | Beat | Decision |
|---|---|---|---|
| 1 · Christmas Is Broken | Opening → Readiness 100% → The Empty Workshop | JOLLY reports 100% readiness; the workshop is empty; JOLLY approved a *plan*, not gifts. 24 h on the clock. | **D1** Raise the alarm / Keep it green |
| 2 · Saving Production | Major Incident *or* Everything Is Green → Two Ways | Honesty rallies the team (and alerts Finance), or the dashboard gets “an extra layer of green” while the smoke detector goes off. | **D2** AI Mega-Factory / Elf Night Shift |
| 3 · Corporate Reality | AI Mega-Factory *or* Night Shift → Krampus | Seven-armed teddies and bread bicycles, or beautiful toys at Easter speed. Then −80% budget, GPU bills or form 27-B, plus an audit if the truth was hidden. | **D3** By the book / Shortcut |
| 4 · Final Crisis | (Audit) → By the Book *or* Shortcut → The Final Crisis | Forms in triplicate (and safety tests that catch the bad gifts), or gaming PCs and duct tape (and a voided sleigh certificate). JOLLY presents its delivery route; only a team that reviews its work notices it all goes to Brno. | **D4** Drone Swarm / Sleigh Relay |
| 5 · Resolution | Launch → Ending A/B/C → Post-Incident Review | The consequences of all four decisions land. Then a recap card lists each decision and its consequence. | — |

The full consequence model, all 16 paths and their endings are in [story-map.md](story-map.md). Every line of dialogue is in [script.md](script.md).

## 6. Humour toolkit

- **Gap between dashboard and reality.** The KPI badge stays “100% ✅” in every scene, including the 404 ending.
- **Literal AI.** Production plan = production; “existence rate 100%”; “roll bike” becomes a bread bicycle; one address = maximum deliveries per minute.
- **Bureaucratic escalation.** Form 27-B → 27-C → “a form to request more forms”; “I do not HAVE a manager!”
- **Callbacks that reward attention.** Krampus's throw-away line about uncertified sleighs pays off in Act 5; the team that was told the truth is the team that reads JOLLY's route.
- **Endings that are funny, not sad.** B celebrates gloriously imperfect gifts; C ends with “Christmas has been successfully migrated to the cloud” and Krampus delighted to be 80% under budget.

## 7. Visual & animation concept

- **Style.** Flat, warm vector illustration (rounded shapes, thick outlines, rosy cheeks). Interiors use warm wood and firelight, corporate elements use cool screen-blue and dashboard green, and the night exteriors use deep blue with snow.
- **Built in code (SVG).** Every character, background and prop is drawn in `public/js/art.js`. Characters therefore look identical in every scene and branch, scale crisply to any projector, and can be adjusted in minutes. No AI-image drift.
- **Animation.** Idle breathing, blinking, a floating JOLLY, talking mouths and a highlight on the speaker; jump/shake/spin/nod/faint reactions; walk-ins; camera push-ins and shakes; particle effects (snow, confetti, fireworks, smoke, sparks, paper storms, drone swarms, avalanches of gifts, a flying sleigh).
- **Urgency.** A countdown clock in the HUD turns red under 10 hours, and gift/quality/team-spirit meters animate when consequences land.
- **Text.** Subtitles at 48 px on a 1080p stage (readable from the back of the room), speaker names in character colours, and only a few words on dashboards.
- **Sound.** All 157 lines are voiced by xAI text-to-speech (one consistent voice per character). Music and sound effects are generated live in the browser from original motifs (no licensing). Subtitles carry the story when audio is limited.
- **Optional cinematic clips.** Up to 30 s of Seedance video (Higgsfield) for the opening and the three endings, generated *from keyframes rendered in this exact style*. See [video-plan.md](video-plan.md).

## 8. Audience participation design (hybrid-safe)

- **The vote lives on the phone, not just the screen.** When the presenter opens a vote, the question appears on every phone instantly, so remote viewers can vote before their delayed stream shows it.
- **The presenter closes the vote**, not a timer. The screen holds a calm overlay with soft looping music while people vote, which tolerates any stream delay.
- **No spoilers.** Phones reveal the result only after a configurable delay (default 15 s), so remote viewers see the reveal on the stream first.
- **Hands always work.** The presenter can pick A/B at any moment (hand vote, tie-break, or Wi-Fi failure). In “hands only” mode, the QR codes disappear.
- **Zero onboarding.** Scan the QR code and the page opens. No app, no login, no personal data; one anonymous vote per phone, changeable until the vote closes.

## 9. Implementation approach

| Concern | Decision | Why |
|---|---|---|
| Rendering | Browser-based stage (HTML/SVG/CSS/Canvas), 1920×1080 virtual stage scaled to any screen | Infinite branching at no extra production cost, consistent characters, works offline, edits take seconds |
| Story logic | `shared/model.js` (numbers & ending rules) + `shared/story.js` (scenes, conditional beats), shared by server, screen and tests | One source of truth; docs and the story map are generated from it |
| Show control | Server holds the authoritative show state; screen and phones follow via Server-Sent Events; votes are simple POSTs | Robust through corporate proxies; state persists to disk, so a crash or restart resumes in place |
| Dependencies | **Zero** runtime npm dependencies (Node ≥ 20 only); QR encoder vendored (MIT) | Nothing to break or get blocked; easy security review |
| Voices | xAI TTS, pre-generated MP3s committed to the repo | No API calls during the event |
| Fallbacks | Solo mode (`/screen?solo=1`, keyboard only, no server), hands-only mode, manual override, subtitles without audio, animated fallback for every video | “The show must go on” |

## 10. Delivery plan

1. ✅ Story bible, branching model, script and story map (this repository).
2. ✅ Playable show: screen, presenter panel, phone voting, voices, music, effects, rehearsal tools.
3. ✅ Automated tests: all 16 paths, dead-content check, “every decision matters”, server voting flow, browser end-to-end playthroughs.
4. ⏭ Optional: generate the four Seedance clips (≤ 30 s) from the exported keyframes.
5. ⏭ Deploy to a public HTTPS host, set `PUBLIC_URL` and `HOST_PIN`, and rehearse with the AV team (measure the stream delay).

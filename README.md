# 🎄 Ježíšek 404: Christmas Not Found

An interactive, audience-voted animated Christmas comedy for a hybrid IT year-end town hall (~400 people, ~15 minutes, English).

On December 23rd, Ježíšek discovers that his AI assistant **JOLLY** approved a *plan* for two billion gifts but never actually made any. Four times, the audience decides how to save Christmas: by phone (QR code, no login) or by raising hands. Every choice carries forward: the clock, the gifts, their quality, team spirit, Krampus from Finance and the sleigh's flight certificate. The ending (**Saved!**, **Saved… sort of** or **404 Christmas Not Found**) is computed from all four decisions.

## Quick start

```bash
npm start              # Node ≥ 20, no npm install needed (zero dependencies)
```

| URL | What |
|---|---|
| http://localhost:8080/screen | Big screen (click once for sound, **F** for fullscreen) |
| http://localhost:8080/host | Presenter control panel |
| http://localhost:8080/ | Phone voting page (what the QR code opens) |
| http://localhost:8080/map | Branching story map, all 16 paths, full script |
| http://localhost:8080/screen?solo=1 | Offline mode: no server needed for control, keyboard only |

For the event, deploy with the `Dockerfile` to any HTTPS host, run one instance, and set `PUBLIC_URL` and `HOST_PIN` (see `.env.example`).

## Documentation

| Document | Contents |
|---|---|
| [docs/creative-direction.md](docs/creative-direction.md) | Creative direction, **story bible** (world, characters, humour, running gags), visual & animation concept, participation design, implementation approach, delivery plan |
| [docs/story-map.md](docs/story-map.md) | **Branching story map**, **decision & consequence model**, ending rules, table of all 16 paths with outcomes and runtimes *(generated)* |
| [docs/script.md](docs/script.md) | **Complete script & scene storyboards**: setting, cast, every line, actions, effects, conditions *(generated)* |
| [docs/operator-guide.md](docs/operator-guide.md) | **Event operator guide**: hosting, rehearsal, running the show, recovery |
| [docs/video-plan.md](docs/video-plan.md) | Optional Seedance (Higgsfield) clips: 30 s budget, prompts, keyframes |

## How it is built

```
shared/model.js     decision & consequence model (state numbers, ending rules)   ┐ shared by server,
shared/story.js     all scenes, conditional dialogue beats, cast & voices        │ screen, host and tests
shared/show.js      show state machine (lobby → scenes → vote → reveal → …)      ┘
server/index.js     zero-dependency Node server: SSE live state, votes, PIN, QR, persistence
public/screen.html  + js/screen.js, art.js (all SVG art), fx.js (effects), audio.js (music/SFX/voices)
public/host.html    presenter panel (main action button, teleprompter, live votes, rehearsal jump)
public/vote.html    phone page
public/audio/voices 157 pre-generated xAI TTS lines (+ manifest with durations)
```

## Commands

| Command | Does |
|---|---|
| `npm test` | Story integrity (all 16 paths, no dead content, every decision matters) + server voting flow |
| `npm run e2e -- alarm,ai,book,sleigh` | Full browser playthrough with simulated phones (needs Playwright) |
| `npm run timing` | Runtime of every path |
| `XAI_API_KEY=… npm run voices` | (Re)generate changed voice lines with xAI TTS (`--prune` removes unused ones) |
| `npm run export-docs` | Regenerate `docs/script.md` and `docs/story-map.md` from the story data |
| `npm run keyframes` | Render start frames for image-to-video clips |
| `npm run videos` | Register clips placed in `public/video/` |

## Credits & licences

Story, characters, art (code-drawn SVG), music (procedurally generated motifs) and sound effects are original to this project. Voices: xAI text-to-speech. QR encoder: Kazuhiko Arase, MIT (vendored in `server/vendor/qrcode`).

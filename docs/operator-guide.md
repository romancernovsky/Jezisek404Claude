# Event Operator Guide — Ježíšek 404

One page for the presenter and the AV/IT helper. Read it once, rehearse twice.

## What runs where

| Page | Who uses it | Device |
|---|---|---|
| **`/`** or **`/screen`** | The audience (projector + broadcast feed) | Show laptop, fullscreen, HDMI to the projector/AV mixer |
| **`/host`** | The presenter | A tablet or second laptop (also works on a phone) |
| **`/vote`** (QR code) | Everyone, in the room and online | Their own phone |
| `/map` | Rehearsal: the full branching map, all 16 paths, the script | Any browser |

All pages talk to **one server**. Phones of remote participants must reach it, so it needs a **public HTTPS address** (see *Hosting*).

## Hosting (choose one)

1. **Production: Google Cloud Run.** Run `./deploy/cloud-run-deploy.sh` (see [deployment.md](deployment.md)). It deploys exactly one always-on instance with the host PIN in Secret Manager and the QR code pointing to the service URL automatically. 400 phones are a light load.
2. **Testing: local Docker.** `docker compose up --build -d` on any laptop. Phones on the same Wi-Fi can join via `http://<laptop-IP>:8080/`. Remote viewers can't reach a laptop, so don't use this for the real hybrid event.

Check with corporate IT that the URL is reachable from guest Wi-Fi and mobile data, and that a public voting page is acceptable. It collects no personal data, no cookies beyond local storage, and no logins.

## Before the event (T-1 week)

1. Deploy, open `https://<address>/host`, enter the PIN.
2. **Rehearse every ending** with `/screen?speed=3` (fast-forward). In the host panel's *Rehearsal* box, load a path from “All 16 paths”, pick a scene and press **Jump**.
3. **Measure the stream delay** with the AV team: show the screen on the broadcast, clap, and time when remote viewers see it. Set **Phone result delay** in the host panel to that number of seconds (+2 s).
4. Test with ~10 colleagues' phones: scan, vote, change a vote, watch the reveal.
5. Check audio: the show laptop's sound must go to the room PA **and** the broadcast mix.

## On the day (T-30 min)

1. Show laptop: open `https://<address>/screen?pin=<PIN>` in Chrome or Edge, **click once** (enables sound), press **F** (fullscreen). Disable sleep, notifications and screen savers.
2. Presenter device: open `/host`, check the pills: `live`, **1 screen**, phones counting up.
3. Leave the lobby on screen as people arrive: title, QR code, “N rescuers connected”.
4. In the host panel, choose the **Voting mode** (phones + hands, or hands only) and confirm the **Phone result delay**.

## Running the show

The big yellow button always shows the next step. Press it (or **Enter**):

1. **▶ Start show**. Scenes play automatically and the teleprompter shows the current and next line.
2. At a decision the story pauses on the question. Say something like *“Phones out, or hands up! You decide what Ježíšek does.”*
3. **🗳 Open voting**. Phones light up immediately. Keep it open **30–45 s** (remote viewers are behind). Read the room and remind people.
4. **🔒 Close voting & reveal**. A drumroll, the bars, the winner.
5. **▶ Continue**. The story carries on with the consequences.

| Situation | Action |
|---|---|
| Hand vote only / Wi-Fi dead | Press **✋ A** or **✋ B** (keys **1**/**2**). Works at any point of a decision. |
| Tie | The screen says *“It’s a tie! Ježíšek must decide…”*. Press A or B. |
| Need to talk / interruption | **⏸ Pause** (Space). Everything freezes, including the voices. **▶ Resume** continues exactly where it stopped. |
| Scene is dragging / running late | **⏭ Skip scene** jumps to the next scene or decision (the story state stays consistent). |
| Screen laptop crashed / browser reloaded | Reopen `/screen?pin=…` and click once. It rejoins the current scene automatically. |
| Server restarted | The show resumes **paused** at the same point. Press Resume. |
| Server unreachable completely | On the show laptop open `/screen?solo=1` from any copy of the app (even `npm start` locally): Space start/pause, Enter next, 1/2 pick, S skip. |
| Restart from scratch | Danger zone → **Restart show** (asks to confirm). |
| Corporate network: screen stays empty/blue, or the host shows “live (polling)” | Corporate proxies often hold back the live stream. The pages detect this within ~3 s and switch to polling every 1–1.5 s automatically, so nothing needs to be done. “live (polling)” in the host panel is normal on such networks. |

## Presenter tips

- After each reveal, let the room react before pressing Continue: the laughter is part of the show.
- The final ending decides itself from all four votes. Nobody (including you) knows the result in advance, so play along.
- For the **A ending**, lead the room in shouting **“WE DID IT. TOGETHER!”** when it appears.
- The final *Post-Incident Review* recaps all four decisions, which makes a natural moment to thank the teams.

## Optional extras

- **Cinematic clips:** drop `opening.mp4`, `endingA.mp4`, `endingB.mp4`, `endingC.mp4` into `public/video/`, run `npm run videos`, redeploy. See [video-plan.md](video-plan.md).
- **Change a line:** edit `shared/story.js`, run `npm run voices` (only changed lines are re-generated), `npm test`, `npm run export-docs`, redeploy.

## Keyboard reference

| Page | Keys |
|---|---|
| `/host` | **Enter** main action · **Space** pause/resume · **1/2** pick A/B · **S** skip scene |
| `/screen` | **F** fullscreen · **C** show cursor · with `?keys` or in solo mode: Space, Enter, 1/2, S, Shift+R restart |

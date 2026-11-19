# Cinematic Clips — Higgsfield · Seedance (30-second budget)

The show is fully animated without any video. Up to **30 seconds** of Seedance video can be added at the four moments where a cinematic shot has the most impact. Each clip replaces only the title card at the start of its scene. If a file is missing, the animated version plays, so the show never depends on video.

| Slot | File | Length | Plays at | Replaces |
|---|---|---|---|---|
| `opening` | `public/video/opening.mp4` | 10 s | Very start of the show | “JEŽÍŠEK 404” title card |
| `endingA` | `public/video/endingA.mp4` | 10 s | Start of *Christmas Saved!* | “CHRISTMAS SAVED!” card |
| `endingB` | `public/video/endingB.mp4` | 5 s | Start of *Saved… Sort Of* | “CHRISTMAS SAVED…” card |
| `endingC` | `public/video/endingC.mp4` | 5 s | Start of *Christmas Not Found* | “404” card |
| | | **30 s** | Only one ending plays per show, so the audience sees at most **20 s** of video. | |

## Keep the look consistent: start from our keyframes

`npm run keyframes` renders 1920×1080 PNG start frames in the show's exact vector style to `public/video/keyframes/`. Use **image-to-video** with these as the first frame so characters match the rest of the show.

## Prompts (Seedance, image-to-video, 16:9, 1080p)

**opening** (start frame `keyframes/opening.png`, 10 s)
> Slow cinematic push-in over a snowy Czech village at night toward a glowing wooden workshop on a hill, warm golden light in its windows, gentle snowfall, twinkling stars, crescent moon, flat 2D vector illustration style with thick outlines, cosy Christmas atmosphere, smooth steady camera, no text.

**endingA** (start frame `keyframes/endingA.png`, 10 s)
> The cheerful cast celebrates in a snowy village at night: the little golden-haired gift-bringer jumps with joy, a floating red Christmas-bauble robot with heart eyes spins, the elves throw their hats in the air, windows light up one by one, colourful fireworks burst in the sky, flat 2D vector cartoon style, warm and triumphant, steady camera, no text.

**endingB** (start frame `keyframes/endingB.png`, 5 s)
> The little gift-bringer shrugs with a relieved smile while a seven-armed teddy bear waves all its arms, the floating bauble robot bobs happily, light snow, flat 2D vector cartoon style, gentle comedic timing, no text.

**endingC** (start frame `keyframes/endingC.png`, 5 s)
> A giant glowing “404” outline flickers like a glitch behind the sad little gift-bringer, the floating bauble robot keeps smiling obliviously, a horned accountant in round glasses gives a thumbs-up, snow drifts down, flat 2D vector cartoon style, comedic, no text.

Tips: keep camera motion slow (streams compress fast motion badly), avoid generated text, and generate 2–3 takes per slot to pick the best. Clips are muted when sound is not enabled. The show's music keeps playing underneath at a lower volume.

## Install

1. Save the chosen clips as MP4 (H.264) with the slot names above in `public/video/`.
2. `npm run videos` registers them and checks the 30 s budget.
3. Rehearse the opening and each ending (host → Rehearsal → load a path ending in A, B and C).

---
name: telestrator
description: >-
  Translate a plain, non-expert render note ("this looks terrible", "it's a 30/100", "make it more
  dramatic") into a named technical cause and a specific fix — the inverse of /vision, which turns
  intent into evocative prose. Use whenever Eric reacts to a rendered frame, whenever a 3D change is
  about to be made in response to feedback, and before claiming any visual work is done. Carries the
  symptom→cause→fix table, the layer model that stops surface notes being answered with shape
  changes, and the measurement rules that stop a plausible story passing as a verified fix.
---

# Telestrator — circle the frame and name what's wrong

Eric directs by outcome, not technique (`CLAUDE.md`). He can tell you a render is a 30/100; he cannot
name the cause, and cannot tell a good technical suggestion from a bad one. **That is a spec, not a
limitation.** This skill is the adapter: his eyes in, an engineering decision out. When it works, he
never has to learn a shader term, and you never have to guess.

Every rule below was bought with a shipped regression. The citations are load-bearing — they are why
these are rules and not advice.

---

## The five hard rules

### 1. If the note references a prior version, RENDER THE PRIOR VERSION FIRST

Eric said *"compared to the texture on the iris we had before, this looks terrible."* Two things were in
that sentence: a complaint, and **a reference**. The complaint was acted on. The reference — three
commits back and free to render — was never looked at. The fix that shipped addressed the wrong half.

When it was finally rendered, the answer was immediate and would have been available on day one: the old
version had *directional fibre striation*, the new one had *concentric rings*. Real irises have radial
**spokes**; we had shipped **rings**. Ninety degrees wrong, and invisible without the comparison.

> `git log --oneline --follow -- <file>` → `git checkout <sha> -- <file>` → shoot → restore.
> Ten minutes. Do it before writing a line of shader code.

**Corollary:** a note phrased as a comparison is not satisfied by an absolute improvement. He is not
saying "make it good," he is saying "you lost something." Find what was lost.

### 2. Never answer a note about SURFACE with a change to SHAPE

Twice now, a note about colour, texture or feel was answered by moving the silhouette, and both times it
regressed. The worst case: "make it a fiery spherical shape with an iris texture like before" was
implemented as a shape blend, which broke the standing requirement that the Eye read from every angle.

Route every note to a layer before touching anything. **A note only ever authorises a change at its own
layer or below.**

| Layer | What lives there | A note lands here when it says |
|---|---|---|
| **Silhouette** | the outline against the sky, the SDF, the mesh | "wrong shape", "can't tell what it is", "not visible from behind" |
| **Structure** | anatomy, parts, where the pupil/iris/horns are | "that's not an eye", "where's the pupil" |
| **Surface** | colour, texture, grain, roughness, fibre | "looks like plastic", "the texture is wrong", "all one orange" |
| **Light** | key/rim/bounce, bloom, shadow, exposure | "flat", "muddy", "can't see it", "not dramatic" |
| **Motion** | timing, easing, drift, pulse | "robotic", "scanning not looking", "strobes" |
| **Grade** | tone map, contrast, vignette, grain | "washed out", "colours are wrong", "looks cheap" |

If a fix requires going *up* a layer from the note, stop and say so — that is a redesign, not a fix, and
it needs re-ratifying.

### 3. Figure and ground are different jobs — do not let ground overrun figure

Eric's standing brief for the Eye: *"turbulence on the edges to help FRAME the pupil/iris, almond part of
the eye."* The fire is **ground**. The anatomy is **figure**. Every failed attempt filled the middle with
fire and erased the eye.

Before adding any effect, answer: does this frame the subject, or compete with it? The corona spikes were
tuned twice and still competed; they were deleted, not retuned. **When something competes with the hero
silhouette, cut it — don't retune it.**

### 4. Measure the claim. A render claim that isn't measured is a guess wearing a citation

The emissive was hard-clamped at 1.05 while bloom thresholded at 0.92. Removing the clamp is a genuine
defect fix with a compelling story: *of course* that was flattening the bloom. Peak frame luminance
before: **214/255**. After: **213/255**. Zero pixels above 250 either way. The clamp was never the binding
constraint. Every narrative reason to believe the fix worked was intact; only the number disagreed.

For any claim about brightness, contrast, or "more dramatic," report the number:

```sh
ffmpeg -v quiet -i shot.png -vf format=gray -f rawvideo - \
  | python3 -c "import sys;d=sys.stdin.buffer.read();print('peak=%d  frac>250=%.4f%%'%(max(d),100*sum(1 for x in d if x>250)/len(d)))"
```

A scene about blinding fire whose brightest pixel is 84% grey does not have a bright core, whatever the
shader says it does.

### 5. Trust the instrument only after testing the instrument

`window.__towerSeek` carried a comment asserting *"two runs at the same seek time are the same picture, so
a difference is a real change."* It set the clock and then called `scene.render()`, which fired the
observable that advanced the clock and camera right back — **8° of camera drift** during a call whose only
job was to hold still. Every comparison made for weeks was between two different moments at two different
angles, with the difference credited to the code under review.

It got worse than "unreliable": it **inverted a verdict.** A set of correct fixes was judged a regression
because the before-frame came from the broken harness and the after-frame from the fixed one.

> Before trusting a comparison: run the same capture twice and diff it. If two identical inputs don't
> produce (near-)identical outputs, you have no instrument and any conclusion is noise.
> Known residual: the crown smoke is an unseeded `ParticleSystem` — ~55% of the Eye region varies run to
> run. Until it is seeded against `kit/rng.ts`, byte-comparison is not available and a golden-image gate
> is not viable.

---

## The symptom table

Eric's words on the left. Route to the layer, then to the cause. Causes are ranked by likelihood **in
this scene** — check them in order rather than fixing the most interesting one.

| He says | Layer | Actually wrong (ranked) | Do this |
|---|---|---|---|
| "It looks flat" (tower) | Light | Stone has no value separate from the night — black on black. Then broken normal map. Then no rim. | Raise albedo into legal range; put a cold rim on the edge |
| "It looks flat" (Eye) — "a circle, not a ball" | Surface | No limb darkening; rim brightened instead of dimmed. No depth absorption. | Dim and redden toward the rim; make brightness depend on fire crossed |
| "It looks fake" / "looks CG" | Grade | Everything is one hue — sky, fog, forge, Eye all orange. Nothing cold. | Real temperature separation: fire warm, shadows and distance genuinely cold |
| "Looks like plastic" | Surface | One roughness across a whole material; broken normal map giving even sparkle | Break up roughness — worn where things rub, dull where dust settles |
| "Looks like a video game" | Multiple | Hard-edged beam with flat alpha; bloom from the whole object not a core; constant-speed camera | Soften and fade the beam; threshold bloom to the core; give the camera drift |
| "Looks cheap" | Surface | March-step banding (concentric rings). Then inconsistent texture scale. | Jitter each ray's start (IGN, not a hash); unify grain scale |
| "Muddy" / "can't tell what I'm looking at" | Grade | Post contrast crushing an already-dark image; warm fog blurring distance into firelight | Lower post contrast, separate values with light; cool the fog |
| "Grainy in a bad way" (surfaces) | Surface | Not grain — specular flicker from the normal-map defect. Plus octaves that never decay. | Fix the normal map; drop noise persistence below 1 |
| "Stripes in the dark sky" | Grade | 8-bit banding in a smooth dark gradient; grain lives in midtones and never reaches it | Enable dithering in image processing |
| "A sticker pasted on" | Light | Emissive capped, so bloom halos the whole disc evenly and erases its edge | Let emissive run over-bright, let ACES roll it off — **then measure peak** |
| "Floaty — nothing's touching" | Light | No dark contact seams; shadow frustum spread over the whole scene | Contact seams at joints; tighten the shadow frustum to the tower |
| "Colours are wrong — all orange" | Surface | The fire ramp is four brightnesses of one hue; never changes colour with heat | Blackbody heat ramp: deep red at the edge → orange → yellow → white at the throat |
| "Small when it should feel huge" | Light | One object in an empty field; haze has nothing to grade against; toy-shelf camera angle | Two or three ridgelines behind it; drop the camera to look up |
| "Motion is robotic" | Motion | Every animated value is a sum of sines; camera at exactly constant speed | Noise-driven motion; uneven speed, holds; let the beam lag the eye's turn |
| "Scanning, not looking" | Motion | Continuous sweep. Real eyes hold, then snap. It's a lighthouse. | Hold on a spot, then snap. It should read as deciding. |
| "Too clean / too new" | Surface | No mid-scale detail — fine grain and big shapes, nothing between | Medium scale: soot runs below ledges, wear on outward chamfers. **Not more fine noise.** |
| "The shape is too perfect" | Silhouette | Procedural construction is symmetric by default | Break the mirror, uneven spacing, chip one |
| "Busy without being detailed" | — | Something added competes with the hero silhouette instead of framing it | **Cut it, don't retune it** (rule 3) |
| "Worse on my phone" | — | Two different bugs wear this costume: a precision bug real GPUs hit and software rendering never shows, and raw frame cost | Check unbounded time into noise; report frame cost **separately**; say which you fixed |
| "Changed it 4× and it's still there" | — | The wrong thing is being blamed — shader terms add, so an innocent suspect appears to respond to damping | Turn the suspect **off completely** and show the frame. Prove it. |
| "Worse than before" after a sound-sounding change | — | A shape-layer change was used to answer a surface-layer note (rule 2) | Revert the shape change; fix at the noted layer |
| "It's just a ball" / "where's the eye" | Structure | Anatomy absent or not legible from the captured angle | Check the harness first (rule 5), then build anatomy — figure, not ground |

---

## What to hand back — and what not to

**Attach artifacts. Do not attach a verdict.** A model grading its own render is the weakest link in any
loop like this; a self-assigned score reads as calibrated precisely when it isn't. The contract ends at
producing comparable pictures. The verdict is Eric's.

Every visual change hands back:

- Exit codes for `typecheck` / `lint` / `test`
- **Before and after from the same harness state** — never a fixed-harness after against a stale before
- The full `npm run shoot:tower` suite, not a hand-picked subset (`--poses` is for iteration only)
- The measured number for any brightness/contrast claim (rule 4)
- Any variant that was rendered and rejected, and why

Never: a score, a self-assessment, or "the one thing I'd mark myself down for."

## When the note is underspecified

His attention is the constraint, so "just ask him" is expensive — but silence is not free either
(`CLAUDE.md` → interrupt economics). The order of preference:

1. **Render options and let him point.** He can't name a technique; he can always pick an image. A
   contact sheet of 3–4 graded variants costs one round trip and settles a taste fork permanently.
2. **Ask in visual terms he can answer**, never technical ones. "Should the fire spill past the edge or
   stay inside it?" — not "should I raise the density falloff exponent?"
3. **Ask for a reference.** The single most valuable input nobody had requested for the entire life of
   this project. One pinned image collapses most of the guesswork.

Never implement the literal words when the intent is available. "Add electric energy" became corona
spikes that had to be deleted; the intent was menace, not more objects.

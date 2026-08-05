# Art direction — the Eye of Barad-dûr

The reference prompt for Eric's primary bot persona's landmark. Written in the voice of **Pierce Brown**
(Red Rising) because the vernacular forces *specific* detail where a normal brief settles for "fiery
eye" — and specific detail is what a shader can be held to. Read the prose, then the translation table:
the table is the contract, the prose is why the contract has that shape.

> **Provenance:** a stylistic pastiche, not a quotation. Nothing here is lifted from the novels.

## Voice rules (distilled from an excerpt of the real thing)

The first draft of this doc failed in instructive ways — it reached for lyrical grandeur ("a wound in
the dark that will not close") when Brown's actual register is far harder and lower to the ground. The
rules, so the next persona's brief doesn't repeat the mistake:

1. **Short. Then shorter.** Fragments are the default. "Mine flicker faster." "We choose the stink."
   One long run-on is permitted per passage, and it lands *because* everything around it is clipped.
2. **First person, present tense** for what is happening; past for what was done to you.
3. **Similes are bodily and homely, never mythic.** A quilt of hot piss. Burned syrup. A tendril of oil.
   Thick as a thigh. Not "a blade of the gods."
4. **Worker vocabulary, deployed flatly.** clawDrill, frysuit, helium-3, headTalk. Never explained,
   never admired — used the way someone who is tired of using it uses it.
5. **Understatement is the punch.** The horror arrives sideways, in a small domestic observation:
   "They let the loved ones do it."
6. **A person with a stake is always in frame.** He does not describe scenery. He describes a man
   looking at something that can kill him.
7. **Numbers, quotas, arithmetic in the head.** Cost is always concrete.

---

## The prompt

> I have never seen a star. But I have seen the Eye, and I would trade.
>
> You come up the lift at shift-end and it is there, over the ash plain, hung between two black horns
> that hold nothing. That is the first thing you notice, if you are the noticing kind. Nothing holds it.
> No lid. No hood of stone. No shutter to drop when it has seen enough. Whoever built the tower built
> the horns and then quit, because a thing like that does not need housing. It needs an audience.
>
> It is drawn wide. Two curves meeting at points sharp as a razor's tip — a hunting animal's eye, not a
> cow's. And the edges will not hold still. Tongues peel off the rim and gutter out in the cold air,
> dozens a second, and the shape stays the shape. That is the part that turns your stomach. Fire that
> keeps its outline. Fire that has decided something.
>
> It is not gold. Golds are polished. This is the colour of the forge at the hour the smith stops
> singing — blood-orange out at the lip, going down through the red of a scab to something white and
> small at the throat, no wider than a fist. And when you shift your weight, a band of brightness slides
> across it, the way light crawls the belly of a tiger's-eye stone when you turn it in your palm. Never
> where you left it. That is how you know it is not a lamp.
>
> Down the middle, the slit. Straight up and down. Black. Not dark — black, no glow in it anywhere,
> tapering to a point top and bottom like something sheathed. Everything else up there burns. That does
> not. Barlow says it is just a shape. Barlow has not looked at it long.
>
> Out at the tips, where the flame goes thin and ought to simply die, there are threads of blue-white.
> Too straight and too quick to be fire. They crack outward and they are gone before your eye catches
> up, and afterward the air smells the way it does a half-second after a pulseFist fires. The fire is
> what it is. The lightning is what it means.
>
> It swept over our whole clan once, slow, and it did not stop. Two hundred of us. It did not stop.
>
> Eo says that is the insult — not that it watches. That we were not worth the pause.

---

## Translation — prose → mechanics

Each line of art direction maps to one lever in `src/three/pieces/eye-shader.ts`. The lore is a flavour
layer over accurate mechanics: the vocabulary is Brown's, the numbers are the contract.

| The prose says | The mechanism |
|---|---|
| "unhoused… no lid, no brow, no mercy of stone" | **No occluding geometry at all.** The almond is the flame's own silhouette, cut from a sphere by `discard`. Any stone shell is a wrong object. |
| "two curves meeting at points sharp as a razor's tip, drawn wide" | Vesica: two circles offset on Y, intersected, anisotropically scaled wide (`SX`/`SY`) so it reads predator-wide, never round. |
| "the corners lick and gutter… and still the shape holds" | The vesica boundary is perturbed by **animated fbm** — tongues peel off the rim while the underlying shape stays fixed. |
| "the red of a forge at the hour the smith stops singing" | Palette runs rim → core: blood-orange, dried-arterial red, then a white core so small it reads as heat, not as a lamp. |
| "a band of brightness slides as you move… tiger's-eye" | **Chatoyancy**: anisotropic Kajiya-Kay lobe across radial fibres, keyed to view + light. Must *travel*; a static highlight fails the brief. |
| "vertical. Absolute. A blade of pure black with no fire in it" | Slit pupil: hard black, no emissive bleed, tapering top and bottom. The one non-glowing thing. |
| "threads of blue-white… too fast and too straight to be flame" | **Electric affinity**: thin, near-straight filaments at the flame fringe, in the brand's electric teal-white, flashing on a quantised clock so they're gone before they're read. |
| "it does not follow you. It sweeps" | The eye rotates on its own slow, incommensurate schedule. **Never billboarded, never aimed at the camera** — being ignored is the point. |
| "fire… is the body. The lightning is what it means" | Fire is the persona's primary affinity, electric the secondary. Fire carries area and colour; electric carries only the tips. If the lightning reads as much as the flame, the balance is wrong. |

## The bar

The Eye is judged head-on **and** oblique (`npm run shoot:tower` → `tower-eye`, `tower-eye-oblique`).
Off-axis is where the cheap version fails: the pupil must shift with parallax, the chatoyant band must
have moved, and the silhouette must still be an almond of fire with nothing holding its edge.

**Full-angle coverage is mechanical, not a step to remember.** `scripts/shoot-tower.mjs`'s default
suite includes `eye-side`, `eye-behind`, `eye-above`, `eye-below` alongside the front poses — a single
`npm run shoot:tower` run always covers the whole bar. This exists because two separate regressions
reached production before anyone looked from these specific angles (see "the walk-around addendum"
and "the declutter correction" below) — both caught by hand, after the fact, on report. Baking the
angles into the harness's default set means the next piece doesn't get to skip the check by omission.

---

## The corona addendum

Added after a reader compared the shipped Eye against reference art and asked where the corona was —
the mandala of straight rays a distant view of the Eye should throw. Same discipline: prose first,
then the table it's answerable to.

> I have stood the wall three years and I still flinch at the corona.
>
> Not the Eye. The Eye you get used to — the flame, the slit, the band of brightness that finds you
> and slides off again. It's the ring around it. The part that isn't fire exactly, and isn't
> lightning exactly, and won't sit still long enough to be either.
>
> Picture a sun the artificers drew for children, the kind with spikes coming off it in every
> direction, straight as ruled lines. Now set that on fire and put half the spikes in a storm. That's
> the corona. It doesn't gutter like the flame does — the flame licks and curls and eats itself. The
> corona *shoots*. Straight out, past where the eye ends, thin as wire and gone before your eye has
> finished counting them. Some are the same blood-orange as the rest of him. Some are that blue-white
> that smells like a pulseFist going off a half-second after you see it. You start trying to tell
> which is which and you lose count around nine. There is no ninth. There was never a fourth.
>
> Between the flame and that ring of spikes there's a seam — a line of brightness tighter than
> anything else on him, like the rim of a coin held up to a torch. That's the part the old hands call
> the *collar*. Not because it holds anything. Because it's the last honest edge before the fire
> stops being a shape and starts being a weapon.
>
> Look at the iris too long and you'll see it isn't smooth. Threads run out of the black slit like
> grain in bad wood, hundreds of them, all pointed the same way — out.

| The prose says | The mechanism |
|---|---|
| "a sun drawn with spikes… straight as ruled lines… shoots past the eye" | **Corona spikes**: `SPIKE_N` straight radial rays, angle-quantised into slots, each with its own length (`spikeSeed`) and a taper from wide-at-the-collar to a wire at the tip. Kept short (`SPIKE_REACH = 0.22`) — a first pass at `0.40` pushed fragments into the sphere's own grazing-silhouette curvature, which bent straight rays into visible claws. |
| "some are blood-orange… some are that blue-white" | Two spike populations by `spikeSeed`: ~90% reuse the fire ramp, ~10% render electric teal-white — and the electric ones are **0.4× the width and 0.8× the brightness** of a fire spike. A first pass gave them equal weight and one electric spike at a hero angle owned the whole frame — a verified violation of the fire-is-the-body/lightning-is-the-will rule below. |
| "gone before your eye has finished counting… there was never a fourth" | Per-spike flicker on a `hash(slot, timeCell)` gate — each slot's on/off schedule is independent, so the visible pattern never repeats. |
| "a seam tighter than anything else… the last honest edge" | **The collar**: a narrow, near-white ring pinned exactly at the vesica boundary (`edge ≈ 0`), tighter and whiter than the existing lip falloff — the anchor the spikes launch from. |
| "threads run out of the slit like grain… hundreds of them, all pointed out" | Explicit radial-fibre grain folded into the iris heat, independent of the chatoyant sheen — visible texture even when the travelling lit band isn't crossing it. |

---

## The walk-around addendum — the Eye stops being a skin

Written after a reader orbited fully behind the tower and found nothing there — bloom bleeding through
empty air where a landmark should be. Everything above was calibrated for a face-on view; this
addendum is the correction: the Eye as a body you can walk all the way around, not a mask painted on
the front of one.

> I have walked the parapet at every hour and I have never once seen him from the side and thought
> him thin.
>
> That's the part the new recruits get wrong. They think the Eye is a face, and a face has a back of
> the head. It doesn't. Walk the ring — go on, walk it, nobody will stop you — and at every step
> there's the same almond, the same slit, watching you exactly as hard as it watched you at the gate.
> He doesn't turn to find you. He was always finding you. That's worse.
>
> From the side he's narrower — a spindle, blunt in the belly and drawn to a point at both horns,
> like a seed pod about to split. You'd swear it was a different shape than the one at the gate until
> you notice: it's the same eye, just caught edge-on. A coin looks like a line from the rim.
>
> Go up on the scaffold and look down into him and the slit doesn't close, it just tips — a black
> wedge sunk into a disc of fire, and for one dizzy second you understand it the way a bird would,
> looking down into a well that burns.
>
> Go down into the ditch and look up and it's the same disc from underneath, duller, the fire banked
> like coals under a grate. Heat still comes off it. You just have to earn the angle.
>
> Round the back — and I have done this, I have made myself do it, because a man who guards a tower
> should know what's behind him — and he is still burning. Not facing you. Not hunting. But burning,
> the way a coal at the bottom of the fire burns without needing anyone to look at it. Duller than the
> front. Redder. No slit — the slit belongs to the part of him that's looking, and back here nothing
> is looking, there's just the fire that makes the looking possible. Barlow says that's the worst part.
> Barlow's right, for once. A thing that stops being dangerous when your back is turned is a trick.
> A thing that keeps burning anyway is honest, and honest is worse.

**A correction, made before this ever got built** — Eric's own read, checked against a real render:
the whole body should not be the almond. An eye is a ball first. The almond is the part of the ball
that is *doing something* — looking.

> You want to know what he is, not what he's doing, look at the shape when nobody's home. It's round.
> A ball. A coal the size of a man's chest, and it would still be round if you cut it in half and
> looked at the cut.
>
> Then he finds you, and the ball doesn't change — it *opens*. Right where he's looking, the fire
> pulls itself narrow and sharp, points at both ends, a mouth deciding to speak. That's the almond.
> That's the part with the slit in it. It isn't the whole of him. It's the part of him aimed at you.
>
> Walk round to where he isn't looking and the opening closes back into the ball. Still fire. Still
> hot enough to feel from the wall. Just round again, the way a fist is round until it isn't.

### Translation — the geometry itself changes

The prior addenda described a **skin**: a flame silhouette painted on the visible face of a sphere,
the far side thrown away outright (`if(P.z < 0.0){ discard; }` in the shipped shader — an unconditional
local-space cut, not view-dependent culling). That single line is why the earlier screenshot from
directly behind showed only bloom. This addendum replaces the skin with a **raymarched volume**: a
real 3D density field sampled along the view ray through the sphere, so every angle in the passage
above is the same object answering honestly, not a different trick per angle.

| The prose says | The mechanism |
|---|---|
| "it's round… a ball… still round if you cut it in half" | **Superseded below by the eyeball correction** — kept for the record. The first raymarched pass made the solid-of-revolution *itself* the whole body (correct that every angle answers honestly, wrong that the body should be almond-shaped at all — an unforced, uncritiqued carry-over from the flat 2D version, caught on review). |
| "the ball doesn't change — it opens… that's the almond… the part of him aimed at you" | `lensDist` now blends **two** signed distance fields — a plain sphere (the orb, `length(Qs) - BALL_R`) and the old vesica-of-revolution (the almond) — weighted by a smooth, wide function of azimuth centred on the gaze direction. Facing the gaze: full almond. Away from it: pure sphere. No seam, because it's one continuous `mix()`, not a hard join. |
| "walk round to where he isn't looking and the opening closes back into the ball" | The blend weight is azimuthal (`cos(ang)`-based), not a hard front/back split — orbit slowly and the almond visibly narrows and rounds off into the sphere rather than snapping. |
| "from the side… a spindle, blunt in the belly, drawn to a point at both horns" | Superseded by the correction above — the 90°-off read is now most of the way toward the plain orb, not a spindle. Reads as a fireball with the gaze-aperture receding to one side, matching how a real bulging cornea recedes on a round eye viewed from the side. |
| "look down into him… the slit tips, a black wedge sunk into a disc" | True raymarching gives real depth: looking down the Y axis, the pupil is not a 2D cutout but an actual absence of density carved through the volume, so it reads as a socket with depth, not a mark on a surface. |
| "the same disc from underneath, duller, banked like coals" | The palette ramp is unchanged, but the underside receives less of the key-light term, so it renders warmer/duller by the existing heat-ramp math alone — no special-cased "underside" branch. |
| "round the back… still burning, not facing you, no slit… honest" | The pupil carve is gated by `gazeWeight` (the same weight the sphere/almond blend uses), so the back — and the wide transition zone where the boundary has already mostly rounded off — has no slit. The fire density itself is not gated, so the back keeps burning at reduced intensity. Nothing is thrown away; the back is simply the part of the same object that isn't looking. |

### The bar (extended)

The original bar (head-on, oblique) still applies. Add: **behind** (camera at the gaze direction +
180°) must show the same burning solid, duller and slit-less, never empty; **above** and **below**
must show the disc-with-a-wedge described in the passage, not a flat cap or a hole.

---

## The gravity-current addendum — what the lightning is, and how close you're allowed to look

Two more corrections from the same review, folded in together: the electric affinity needed an
in-fiction reason to exist rather than just decorating the fringe, and the surface needed to survive
being looked at close instead of just from across the plain.

> Nobody built the lightning. That's the part the engineers won't say out loud.
>
> A mass like that bends the air around it before it ever bends your eye. Stand close enough, hold a
> compass, and the needle won't point at anything — it'll point at *him*, and it'll shake doing it. The
> arcs aren't decoration. They're what the air does when something that dense has stopped agreeing to
> be still. It doesn't need to want the lightning. It only needs to weigh enough.
>
> And because it's a field, not a wick, it doesn't run in one line — it forks, the way a river forks
> finding the low ground, one white thread splitting into two thinner ones before your eye can hold
> either. Blink and count wrong. That's correct. Nobody counts a fork right the first time.
>
> Get close — closer than the wall allows, closer than sense allows — and the fire isn't flat the way
> it looks from the yard. It has grain, like a burl in bad wood, like the whorl in a man's own thumb,
> one pattern riding on a smaller one riding on a smaller one still. And where the light catches it
> right there's a wet gleam, thin as a film on water, that isn't there a half-second later. Something
> that hot should not look wet. It does anyway. That's the detail that convinces you it's a THING and
> not a light someone hung up there.

| The prose says | The mechanism |
|---|---|
| "a mass like that bends the air… the arcs are what the air does" | In-fiction framing only — no physics is simulated — but it re-motivates the electric layer as a consequence of the orb's own mass/gravity rather than unmotivated decoration, matching the existing doctrine that lore sits over honest mechanics, never replaces them. |
| "it forks… one thread splitting into two before your eye can hold either" | A **second filament layer**, higher frequency and phase-offset from the first, on its own flicker clock — where the two thin ridges happen to cross, it reads as a branch. The cheap real-time fake for a Lichtenberg figure; still two THIN layers losing to the flame on area and colour, so the balance rule holds. |
| "grain… like a burl in bad wood… a pattern riding on a smaller pattern" | A second, much-higher-frequency 2D noise term (`microGrain`) layered on top of the existing radial fibre grain — two texture scales at once, the macro-photo cue of structure-within-structure a flat single-frequency noise never gives. |
| "a wet gleam, thin as a film on water, that isn't there a half-second later" | A second, tighter Fresnel lobe (`pow(1-ndv, 9)`) on top of the existing one, noise-modulated so it breaks into a highlight rather than a uniform ring — the "wet cornea" cue a real close-up of an eye always shows. |

**Scope note, stated plainly:** this is a stylized real-time shader, not a path-traced render — "CGI
realism" here means convincing at the landmark's own register (macro-detail cues, two-scale texture,
a wet highlight), not literal photorealism. If the bar keeps climbing, the next honest step up is
higher raymarch step counts / more turbulence octaves at a real perf cost, not more noise terms
layered on the same 18-step march.

---

## The declutter correction — two regressions, reverted rather than re-tuned

Scored 30/100 against the shipped state above. Two separate mistakes, traced to their actual root
causes rather than papered over with another tuning pass:

**The eyeball correction (above) broke a standing requirement it never should have touched.** The
original ask behind the whole raymarch rebuild was explicit: the Eye visible **in every direction** —
that's what "the Eye stops being a skin" addendum fixed. The eyeball correction then blended the
almond toward a plain sphere away from the gaze direction, on the reasoning that "an eye is a ball
first." That reasoning wasn't wrong — but the *implementation* traded away all-directions visibility
to get it, when the two were never actually in tension: a wide, short lens swept 360° around the
vertical axis is *already* a real 3D volume — raymarched, with genuine depth and self-occlusion. It
did not need a second shape to blend toward to read as round. **Reverted:** `lensDist` is a pure
vesica-of-revolution again, unconditionally, at every azimuth. Only the pupil slit stays gated to the
gaze direction — the eye-shaped fire itself never disappears.

**The corona addendum's spikes were tuned twice and still read as clutter.** Both tuning passes
(reach, width, electric-vs-fire ratio) treated the spikes as a calibration problem. They weren't one —
the spike burst competed with the eye's own silhouette instead of framing it, on every angle tested.
**Removed outright**, not retuned a third time. This is what `docs/art/EYE.md`'s own opening rule
(`## The governing constraint` in the shader's file header: "no lid, no brow, no mercy of stone")
already said: a spike mandala is exactly the kind of *added housing* that rule exists to keep off the
Eye. The collar (a tight rim right at the boundary) and the electric filaments — both original,
pre-corona elements — stay; they were never the regression.

**The instruction that wasn't missing.** Asked directly what instruction had been left unsaid, the
honest answer was: none. "Visible in all directions" was never rescinded; a later note about roundness
was read as *replacing* it instead of *adding to* it, and nothing in that later note actually required
the trade. The lesson isn't "specify more precisely next time" — it's **check whether a new note is
compatible with standing requirements before treating it as a replacement.**

| What regressed | Root cause | The revert |
|---|---|---|
| Eye vanishes into a formless blob away from the gaze direction | `lensDist` blended toward a plain sphere (`BALL_R`) weighted by `gazeWeight`, breaking "visible in all directions" | `lensDist` is the pure vesica-of-revolution again — no orb, no blend. `gazeWeight` is gone from the shape entirely; the pupil's own gate is renamed back to `frontGate`, matching the original (pre-eyeball-correction) naming, since it's a narrower, differently-purposed gate now. |
| Jagged spike mandala competing with the eye's silhouette | The corona addendum's `SPIKE_REACH`/`SPIKE_N` ray system, tuned twice, never stopped reading as noise | The entire spike block deleted. Collar and electric filaments (unrelated to the spikes, present since before the corona addendum) are untouched. |

**Process fix, not just a code fix.** The declutter correction shipped alongside a change to
`scripts/shoot-tower.mjs`: the default suite now includes `eye-side`, `eye-behind`, `eye-above`,
`eye-below` — a single `npm run shoot:tower` run covers the whole bar above, mechanically, instead of
depending on someone remembering to check. Both regressions this addendum documents reached production
because the check that would have caught them wasn't the default one. `piece-wright` and `set-dresser`
are updated to require the full default suite, not a hand-picked subset, before reporting a piece done.

---

## The sphere/iris addendum — separating shape from texture, correctly this time

The eyeball correction (reverted above) was reaching for something real — "an eye is a ball first" —
but implemented it by blending the OUTER BOUNDARY, which is exactly the thing that must never move if
"visible in all directions" is to hold. This addendum resolves the same instinct without that mistake:
the shape becomes a plain, unconditional sphere; the iris, pupil, and a vein of current become a
colour/emission overlay, gated by how directly a point faces the gaze — texture, never geometry.

> He is round the way a coal is round, or a planet is, and there is no argument to have about it —
> walk him, and the curve never breaks, never dents, never opens a seam you could put your hand
> through. That part of him does not know you are there.
>
> The eye is not a hole cut in that curve. It is what the fire is DOING on the side of him that has
> found you — the surface itself deciding to pay attention. Colour gathers, the grain tightens, and
> somewhere in the middle of that gathering a black slit opens, the way a coal glows brighter where the
> draft finds it without ever changing the shape of the coal. Look at the same round curve from where
> he is not looking and the gathering is gone — plain fire, banked, honest — but the ROUNDNESS never
> once wavered. That was never the part in question.
>
> And in among the gathering, if you stand close, threads move that are not fire — quick, thin, white-
> blue, gone if you blink at the wrong second. Not the arcs off the rim, that's a different thing. This
> is inside the eye itself, in the coloured part, like a nerve firing. You would call it decoration if
> it did not look so much like it hurt.

| The prose says | The mechanism |
|---|---|
| "round… the curve never breaks, never dents, never opens a seam" | `lensDist` is `length(Q) - R` — nothing else. No blend term, no azimuth dependence, nothing that CAN make the silhouette directional even by accident. This is the actual fix: not a better-tuned blend, but removing the possibility of one. |
| "not a hole cut in that curve… the surface deciding to pay attention" | `irisWeight = smoothstep(0.15, 0.55, faceCos)`, where `faceCos = dot(normalize(Q), gazeAxis)`. Purely a colour/brightness term — `core`/`d`/`dens`'s BOUNDARY math never reads `irisWeight`. The pupil slit still carves real density (real depth, a genuine socket), but only in the sphere's interior, which cannot affect the outer silhouette no matter how directional it is. |
| "the same curve from where he is not looking… plain fire, banked" | `scleraDim = mix(0.45, 1.0, irisWeight)` — a brightness multiplier only, applied after the full palette computation, so the sclera is the same fire, just quieter. |
| "threads that are not fire… inside the eye itself… like a nerve firing" | A second electric layer, confined to the iris by `irisWeight` (distinct from the collar/filament corona at the outer fringe): high-frequency noise thresholded to a thin ridge, teal-white, its own flicker clock, deliberately dim and rare — the balance rule applies here too. |

### The bar (this addendum)

Everything in "the bar" and "the bar (extended)" still applies, now trivially: the outer silhouette is
a sphere, so "visible in all directions" is true by construction rather than by tuning. What this
addendum adds to check: the iris (palette, pupil, throat glow, vein) must be visibly present facing the
gaze direction and visibly absent — plain ember, no pupil, no vein — on `eye-behind`; the transition
between them (`eye-side`, `eye-oblique`) must be a smooth fade, not a hard edge.

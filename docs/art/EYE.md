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

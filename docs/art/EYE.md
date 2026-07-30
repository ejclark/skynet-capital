# Art direction — the Eye of Barad-dûr

The reference prompt for Eric's primary bot persona's landmark. Written in the voice of **Pierce Brown**
(Red Rising) because the vernacular forces *specific* detail where a normal brief would settle for
"fiery eye" — and specific detail is what a shader can actually be held to. Read the prose first, then
the translation table; the table is the contract, the prose is why the contract has that shape.

> **A note on provenance:** this is a stylistic pastiche of Brown's register, not a quotation of him.
> Nothing here is lifted from the novels.

---

## The prompt

> It does not sit in the sky. It *hangs* there, unhoused, a wound in the dark that will not close.
>
> No lid. No brow. No mercy of stone to shutter it. Whoever built the tower did not build the Eye a
> house — they built it a throne of black horns and left it naked to the world, because a thing like
> this does not want protecting. It wants *witnessing*.
>
> Look at the shape of it. Two curves meeting at points sharp as a razor's tip, drawn wide, the way a
> predator's eye is drawn wide — not the round wet eye of prey. And the shape is not carved. Nothing
> holds that edge. It is made of the fire itself, and so it *moves*: the corners lick and gutter, tongues
> peeling off the outer rim and dying in the cold, a hundred times a second, and still the shape holds.
> That is the trick of it. Fire that keeps its silhouette. Fire with an intention.
>
> The colour is not gold. Golds are polished, and this is not polished — this is the red of a forge at
> the hour the smith stops singing. Blood-orange at the rim, deepening inward to the char of dried
> arterial red, and then, at the throat of it, a heat so white it has forgotten it was ever a colour.
> And through that white a band of brightness slides as you move, the way light travels the belly of
> tiger's-eye when you turn the stone in your hand — never where you left it. That band is how you know
> it is watching. It answers your movement.
>
> Down the centre: the slit. Vertical. Absolute. A blade of pure black with no fire in it at all, no
> glow, no grace, tapering to points top and bottom. Everything else here burns. That does not. It is
> the one honest thing in the whole gorydamn sky — the part that is only appetite.
>
> And at the flame tips, where the fire thins to nothing and should simply die, something else lives.
> Threads of blue-white. Filaments too fast and too straight to be flame, cracking outward and gone
> before your eye finds them, the smell of a pulseFist a half-second after it fires. The fire is what it
> is. The lightning is what it *means*. One is the body. The other is the will behind the body, and the
> will is worse.
>
> It does not follow you. It sweeps — slow, sovereign, indifferent — and when it passes over you it does
> not stop, and that is the insult. You were not worth stopping for.

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

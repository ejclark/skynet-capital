---
name: vision
description: >-
  Write art direction in the forged-epic register (provenance: Pierce Brown, Red Rising) that forces
  specific, buildable detail — then compile it into the contracts builders and generators actually
  consume: a prose→mechanics translation table, and bounded generation prompts. Use when directing a
  new 3D piece, landmark, or persona structure ("make it feel alive", "high fidelity", "add flare"),
  when a brief reads generic ("a fiery eye", "a big tower"), or before any prompt is sent to an
  image/3D generator. The drill behind docs/art/EYE.md; invokable as /vision.
---

# Vision — the register that forces detail, and the compiler that makes it buildable

A normal brief settles for "a fiery eye." A shader cannot be held to that. `docs/art/EYE.md` proved
the fix: write the direction in a **descriptive novelist's register**, because a novelist works under
the exact constraint a builder faces — *no pixels*. The prose must carry the full mental model or the
reader builds nothing. That pressure forces the three details that make an object snap into focus,
and those details become the contract (`eye-shader.ts` cites EYE.md's table as the spec each block
answers to). A checklist captures coverage; the register captures **salience**.

> **Provenance:** the register is a technique abstraction with influence from **Pierce Brown**
> (Red Rising) — a stylistic pastiche, never a quotation; nothing is lifted from the novels. Rules
> below carry the evidence that produced them (`docs/JOURNEYS/voice-profiles.md`: every derived rule
> keeps its utterance). EYE.md is the founding example and stays authoritative for the Eye.

## The register's rules

Distilled from EYE.md's seven plus verified craft research (secondary sources; links in the
provenance block at the bottom):

1. **Short. Then shorter.** 5–12 word declaratives are the baseline. One long, image-rich sentence
   is released every 3–6 beats and lands *because* everything around it is clipped. Staccato carries
   menace; the long line carries awe. Sustained staccato turns jittery — lengthen as the world grows
   familiar.
2. **First person, present tense; a person with a stake is always in frame.** Never scenery — a
   worker looking at something that can kill them. All exposition arrives as perception.
3. **Senses run inside-out, sight last.** Vibration and weight, then breath, then heat, then smell —
   and grant vision as a reward or a threat. An enclosed scene can deny sight entirely.
4. **Similes are bodily and homely, never mythic.** A quilt of hot piss. Burned syrup. Thick as a
   thigh. The simile's register belongs to the narrator's class, not the author's vocabulary.
5. **Three channels, one detail each: motion · material · identity-color.** Max three details per
   beat, each doing a different job; cut any detail that repeats a channel already spent. *(This
   formula is our synthesis across the cited examples, labeled as such.)*
6. **Worker vocabulary, deployed flatly; names carry the world.** Commodity tech is a camelCase
   compound — [function morpheme]+[plain object] (`gravBoots`, `pulseFist`, `clawDrill`). The most
   iconic objects get blunt repurposed English (*razor*, *the Passage*) — familiarity signals the
   culture lives with them. Never explain, never admire.
7. **Color is rank; materials are class.** One hue = one social function, worn on the thing itself
   and usable as a noun. Elite bodies and structures take metallurgy/sculpture verbs (carved,
   forged, gilded); laborers' take geology (callused, rust, dust).
8. **Grandeur = a mythic frame word colliding with an industrial machine noun** in the same breath
   ("Homeric… to the tune of mass drivers"). Neither register achieves the scale alone.
9. **The scale camera is a three-step:** one human-scale kinetic particular → a vertical cut to
   material mass → an impossible-timescale light condition (a weeklong sunset). Menace arrives
   through the lighting verb — light *stains* — never through stated threat.
10. **One somatic anchor per spectacle beat, then externalize.** Breath, heartbeat, the weight of a
    suit — one sentence, then the emotion becomes an action. Understatement is the punch; the horror
    lands sideways in a small domestic observation. Numbers and cost stay concrete.

## The drill

1. **Geometry before prose.** Sketch the piece's blocking first — silhouette, where the viewer
   stands, what occludes what. The passage's camera must follow real sightlines.
2. **Write the passage** (150–350 words) under the rules above. It is the *salience instrument*:
   its job is to discover which 2–3 details make the piece snap into focus, and to make generic
   settling impossible.
3. **Extract the translation table — the contract.** Each load-bearing prose line maps to exactly
   one mechanism: a shader lever, a geometry decision, a `TowerParams`-style dial, or a prompt
   token. The table is what code cites; the prose is why the contract has that shape (EYE.md's
   pattern). Lore stays a flavor layer over accurate mechanics.
4. **Compile generation prompts — never paste the prose.** Long novelistic prompts measurably
   degrade generation (attribute mis-binding, dropped late entities — DetailMaster, arXiv
   2505.16915). Compile the passage's salient details into bounded prompts:
   - **Image (concept/beauty): 40–75 words, subject first.** Order: subject → materials with finish
     and wear-as-evidence ("scratched iron", "chipped paint", not "old") → environment → described
     light geometry ("low warm sun, long directional shadows" beats "golden hour") → camera. No
     backstory: convert lore to its *visible consequences*. Hold a set's look with style/image
     references, not style adjectives.
   - **Lift prompt (for image→3D): deliberately not the beauty shot.** Single centered object, 3/4
     view, even studio lighting, plain background — dramatic shadows get misread as geometry.
   - **Direct text→3D: one object, 3–6 details, one sentence,** purpose keywords load-bearing
     ("low-poly", "game-ready"). Scenes, atmosphere/VFX words, and transparency poison meshes.
5. **Name the bar.** State which screenshots judge the piece and which salient details must survive
   them (EYE.md: head-on *and* oblique — off-axis is where the cheap version fails). The bar is what
   `piece-wright` verifies against.

## Provenance & evidence

Rhythm/fragments: bookrags.com Red Rising style guide; reenchantmentoftheworld.blog 2016 review.
POV: Goodreads author interview. Inside-out senses: wister.substack.com; ursummary.com. Somatic
anchors and their limits: writinginobscurity.com 2020. Naming corpus: red-rising.fandom.com
(Technology, Razor, Color). Color grammar: theobsidianlibrary.com. Mythic+industrial: NPR review of
Dark Age (Jason Sheehan). Scale camera: Iron Gold Luna opening via bookseriesrecaps.com. Tactility
over accuracy: inverse.com interview. Prompt compilation: DetailMaster (arXiv 2505.16915), BFL/
OpenAI/Midjourney/Meshy/Tripo official guidance, 2026. Claims we could not attribute to Brown are
labeled synthesis; one popular "he diagrams fights to scale" claim traces to a generic craft blog,
not Brown, and is kept only as our own geometry-first practice.

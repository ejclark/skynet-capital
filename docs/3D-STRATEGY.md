# 3D strategy — deployable gamification patterns for the hero track

_A living playbook (src: Eric's brief — "guidance on 3D gamification strategies I can deploy";
researched and verified by Claude, Aug 2026). Companions: [`THE-GAME.md`](THE-GAME.md) (the rules),
[`LIVING-UNIVERSE.md`](LIVING-UNIVERSE.md) (the world grammar), [`GAMEBOARD-PLAN.md`](GAMEBOARD-PLAN.md)
(the board architecture)._

**Scope guard, first.** The game *board* is settled 2.5D (`GAMEBOARD-PLAN.md`, convergent verdict);
its revisit triggers are free-orbit as a core interaction, ~2k+ animated structures, or contributed
3D assets. This doc is the playbook for the **3D hero track that already exists** — `src/three/`
renders Barad-dûr through a pure params seam (`resolveTowerParams`), a stage template
(`createStage`/`attachPost`), composable greeble molecules, and a deterministic screenshot contract
(`npm run shoot:tower`). Everything below plugs into those seams; nothing bypasses them.

## The five engines (what the research says a world-as-scoreboard needs)

Across the cases studied (SimCity, Clash of Clans, Animal Crossing, EVE, Deep Rock Galactic,
Township, photo-mode research, Habitica's failures), the durable architecture is five engines. Ours
map cleanly because the repo already committed to their preconditions:

1. **Truth substrate.** Every world element is a faithful aggregation of real state at every zoom —
   trust in the rendering is the asset everything else spends. Ours by construction: `WorldState`
   health/mass/footprint are honest-by-invariant, `tailOf()` makes truncation visible. Every
   rendered element needs a hover/zoom path back to its number (position P/L, the bot's decision
   log). SimCity's real lesson isn't graphics — it's that toggleable, legible state builds the
   player's mental model. That *is* observability→trust.
2. **Identity engine.** The world is a trophy-you-inhabit: cumulative achievement rendered as place
   (a base you arranged feels yours in a way a number never does; visiting it is wordless social
   proof). Never reset the world; seasons are additive overlays (THE-GAME.md already commits to
   this). Cosmetics/lore may never counterfeit earned status — renown buys the earned layer, never
   the truthful one.
3. **Time engine.** Construction-as-anticipation on the market's *real* clock: an open options
   position **is** a construction site — theta, days-to-expiry, and profit target map onto
   scaffolding rising; completion fires when the trade closes. And autonomous bots get a watchable
   body: a bot at work is *visibly* working — lights on, cranes moving while positions are open —
   the building is the bot's résumé.
4. **Social engine.** Visitability multiplies everything: tour mode, guest traces, and a small dense
   hub with gloriously unnecessary interactive detail (DRG's Space Rig, not Destiny's sprawl).
   Photo mode is the distribution loop — capture → share inside the invite gate → return to collect
   more moments.
5. **Fanfare economy.** Ceremony cameras reserved for the behavior we want repeated (Peggle's
   "Extreme Fever" lesson); ceremony inflation destroys the instrument. Wins get ~3× the motion
   budget (already a settled, checkable constant); losses get quiet honest ink, never spectacle —
   EVE's structure-loss churn and Habitica's backfiring punishments are the documented cautionary
   tales.

## Deployable slices, ordered by leverage ÷ cost

Each slice is small, reversible, and rides an existing seam. APIs verified against the pinned
`@babylonjs/core` 9.19.0 (which includes all Babylon 8.0/9.0 features).

| # | Slice | Mechanic | How, concretely |
|---|---|---|---|
| 1 | **Ceremony camera** | Seize the camera to consecrate a win — the single highest-ROI pattern | `Animation.CreateAndStartAnimation` on the existing `ArcRotateCamera` (`window.__towerCamera`) alpha/beta/radius/target with `CubicEase`; `FramingBehavior` is a ready-made "present the winner's tower"; enable the already-built pipeline's `depthOfFieldEnabled` for the close-up (deliberately off at tower scale today). Fire on THE-GAME ceremonies: topping-out, ground-break, founding. |
| 2 | **Landmark leveling, live** | The tower *is* the scoreboard | Wire real standings into the dials that already exist: `resolveTowerParams({prominence, health})`. The open integration point: nothing computes rank yet — `projectWorld` takes a caller-supplied prominence map (`project.ts:137`), so a small observatory-side rank→0..1 function unlocks the whole "landmarks rise and fall" loop. |
| 3 | **Idle orbit + tour mode** | Visitability; the world as a place you show someone | `AutoRotationBehavior` for the idle observatory orbit; `Curve3.CreateCatmullRomSpline` + `Path3D` for an auto-camera tour through an empire's highlights. |
| 4 | **Photo mode / share-a-moment** | Retention + distribution inside the invite gate | `shoot:tower` is already the deterministic capture rig. Add a "bank this moment" that renders a ceremony card (shot + honest caption: ticker, P/L, renown reason) into the group feed. |
| 5 | **Construction sites** | Anticipation on the honest clock | A scaffold variant of the tower piece driven by position age / days-to-expiry from `StructureState`; completion ceremony = slice 1. Needs the history layer for *events* (the known blocker, THE-GAME.md). |
| 6 | **The district → city scale-up** | LOD storytelling | `thinInstanceSetBuffer('matrix', …)` renders thousands of buildings in one draw call per material — with the verified caveat that thin instances cull all-or-nothing, so partition by district-parent. Per-building window-light/weathering via custom instance attributes read in a `NodeMaterial` (NME authors it visually, emits GLSL+WGSL). Babylon 9.0's clustered lighting is the enabler for many window/street lights. |
| 7 | **Mass atmosphere** | The storm, embers, regime weather at city scale | `GPUParticleSystem` (tens of thousands of particles) — guard with `GPUParticleSystem.IsSupported` and fall back to the CPU `ParticleSystem` **manually**; the fallback is not automatic. Current smoke (420 CPU particles, pre-warmed for deterministic shots) stays the pattern for hero pieces. |
| 8 | **Diegetic labels** | The telestrator, in-world | `@babylonjs/gui`: fullscreen ADT + `label.linkWithMesh(tower)` + a `Line` with `connectedControl` *is* the callout mechanic natively; `AdvancedDynamicTexture.CreateForMesh` for true in-world steles/banners (fog and DOF apply — a leaderboard as a monument plaza). |
| 9 | **WebGPU snapshot mode** | Free speed on mostly-static city scenes | `WebGPUEngine.CreateAsync` behind a `navigator.gpu` check (API-compatible; `createStage` branches once); `engine.snapshotRendering` claims up to ~10× on static scenes — exactly a merged/thin-instanced city. Optional at our scale; WebGL2 stays the screenshot baseline. |

**Phones:** the risk is not draw calls (the merged tower is ~6–10) but the post stack
(SSAO2 + god rays + MSAA4 + smoke overdraw). Levers, in order: `setHardwareScalingLevel`,
`SceneOptimizer.OptimizeAsync` toward a target FPS, `freezeActiveMeshes`/`material.freeze` for
static content. No official draw-call budget exists; community practice keeps mobile scenes in the
low hundreds (impression, not measurement).

**Two package gaps** stand between today and slices 6/8 + any generated asset: `@babylonjs/loaders`
(prefer `registerBuiltInLoaders` from `/dynamic` — lazy, tree-shaking-friendly) and
`@babylonjs/gui`, both version-matched exactly to core.

## Generated assets — the stance

Default stays **procedural** (`materials.ts`: no fetched assets; self-contained, deterministic).
When a piece genuinely earns generation (organic/sculptural forms the kit can't reach), the verified
2026 pipeline is **two-step**: prompt a *concept image* first (where all the verbal control lives,
and where taste is approved cheaply), then image→3D (Meshy 6 / Tripo 2.5 / Rodin Gen-2 / Hunyuan3D /
TRELLIS — nearly all current 3D generators are image-conditioned at core; expect retopo/PBR cleanup
regardless). Self-host the resulting GLB per the no-CDN rule; load via `LoadAssetContainerAsync` and
stamp copies with `instantiateModelsToScene`. **All prompts compile through `/vision`** — the
register finds the salience; the compiler emits the bounded lift + beauty prompts (novelistic prose
is never pasted into a generator; it measurably degrades output).

## The forge roster — delegating decomposition of complex pieces

Complex models are built the way this repo already pays down debt: **decomposed into small pieces,
one green rep per athlete invocation**, with the register as the shared prompt engine. Four agents
(`.claude/agents/`), one relay:

1. **`art-director`** — decomposes a scene ask into a **build sheet**: the piece list (each piece a
   bounded module in `src/three/pieces/`), the silhouette hierarchy (what must read at 200m vs 20m),
   the dials each piece exposes (the `params.ts` contract — every piece is a game piece), and a
   `/vision` passage + translation table per piece. It never builds; the gate picks the athlete's
   target, not the athlete.
2. **`render-alchemist`** — the research step, upstream of building: turns "make it look CGI-real" or
   "closer to this reference" into a cited, buildable technique brief (Babylon.js APIs, GLSL patterns,
   performance cost class, what's achievable now vs. what needs new infrastructure). Also the one
   athlete that handles reference media directly — pulls frames from provided video via `ffmpeg`,
   distinguishes a *fidelity-bar* ask (production polish — atmosphere, grain, light falloff, motion)
   from a *content-match* ask before researching either. Research only; never touches shader code.
3. **`piece-wright`** — takes exactly one build-sheet entry (or research brief slice) and builds it
   ground-up from the kit (`profile.ts` data → `greebles.ts` molecules → `materials.ts` atoms, seeded
   `rng.ts`), exposes its dials, and proves it against the bar: screenshots vs the passage's named
   salient details, plus verify-by-exit-status.
4. **`set-dresser`** — the "make it more refined" invitation, made an athlete: one detail layer per
   invocation (weathering, greebles, light behavior) on a shipped piece, never touching its
   contract, before/after screenshots.

Merge policy: forge output is **visual work — it always waits for Eric's taste** (screenshots on the
PR; no auto-merge), per the governor's carve-outs. The athletes report; they do not self-approve.

## The AVOID set (documented pathologies, all off-brand here)

No expiring content (battle-pass FOMO/burnout) · no sellable time (Township's weaponized timers) ·
no synthetic decay on absence (returns are homecomings — the world may have *moved*, never rotted at
you) · no streak-threat (the honest daily pull is that the market genuinely moved overnight) · no
failure spectacle (a drawdown dims and weathers; it never demolishes identity — EVE's churn lesson)
· no pay-or-grind status counterfeits (the earned layer must stay visually distinct from the
truthful layer). Each of these is the shadow side of a pattern above; the line between them is
exactly the positive-reinforcement + honesty discipline already in `BRAND.md`.

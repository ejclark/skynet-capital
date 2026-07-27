# The Living Universe game board — battle-tested plan (tournament verdict)

**How this doc was made:** two architects (Fable 5 and Opus 4.x) independently produced full
system-decomposition plans from the identical brief, blind to each other. A judge round then
adversarially reconciled them, **verifying every contested factual claim against the repo**. This is
the merged survivor — plus the scorecard, the forks that are Eric's, and the eval criteria the duel
revealed (the first harvest of the tournament→eval flywheel; see the "mined eval seed" section).

## Where both plans independently converged (highest confidence — treat as settled)

1. **2.5D layered/isometric canvas — no Three.js/WebGL.** Both rejected 3D for the same verified
   reasons: the repo has zero client build pipeline and a self-contained-export posture a ~600KB dep
   breaks; at friends-and-family scale there is no performance problem 3D solves; the brand's fidelity
   is hand-authored 2D (Barad-dûr), and naive 3D would *lower* it while putting an asset pipeline on
   the critical path of contributable personas. Revisit triggers: free-orbit camera as a core
   interaction, ~2k+ animated structures, or contributors supplying real 3D assets. (ADR-worthy.)
2. **A pure, serializable projection/IR between data and pixels** — every mapping rule lives in one
   tested place; renderers are dumb skins; tests assert on the world, not pixels. **Shipped:**
   `src/universe/` (`project()` → `WorldState`, PR #163) is this seam's first slice.
3. **Grow the Lego piece contract by building the board observatory-side; the login monolith migrates
   last (or never)** — both inverted the stated refactor-first dependency for the same reason: the
   login is the brand's most polished artifact; rewriting it for tidiness is regression risk with no
   user payoff.
4. **Views as levels of detail** — city (`/u/:id`) → twin cities (`/compare`) → region (`/`) →
   nation (`/bots-vs-humans`); "units of measure change with zoom" is per-piece LOD behavior
   (`lodBand` + `collapseTo`), not renderer switch statements.
5. **Ceremonies derive from durable events, never stored as state; wins get ~3× the motion budget of
   losses (explicit constant, checkable); losses weather with dignity, never spectacle.**

## Judge's calls on the genuine differences (verified, not vibed)

| Fork | A (Fable) | B (Opus) | Verdict |
|---|---|---|---|
| Ceremony data source | diff the existing `EquitySample` history (+ optional per-position digest) | new per-fill `LedgerEvent` log, justified by "the reducer computes realized P/L and throws it away" | **A now, B later — B's stated justification is FALSE** (`reduce.ts:73` accumulates `realizedPl`; it flows into snapshots + samples). Sample-diffs give account-level ceremonies today. B's ledger becomes right when *per-position* attribution (win rate, "which plays worked") is needed — adopt it then, with the corrected rationale. |
| Live transport | (not addressed) | SSE must carry **state patches**, not HTML — `dashboard-server.ts:432` re-`innerHTML`s the body per tick, destroying any canvas | **B — verified true.** The world route needs its own seq-numbered `WorldPatch` channel (fire-once ceremonies by `seq`, ~4Hz coalescing on the Fly VM). The HTML channel stays for the analytical views. |
| Draw abstraction | pieces draw straight to canvas ctx | a small `DrawTarget` port (poly/rect/path/text/sprite/glow) with SVG + canvas adapters | **B** — we genuinely need both SSR tiles (JS-off, artifact-safe) and a live canvas from the same vocabulary; the port earns its layer. `liveOnly` effects simply don't emit in SVG. |
| Board placement | enhance the four routes in place (views = cameras) | new `/world` route; views keep tables + gain a tile + a portal link | **ERIC'S CALL** — the one product fork both plans flagged. B's division of labor ("views own the numbers, the world owns legibility") is the crisper rule; A's in-place is fewer surfaces. Lean B, not unilaterally. |
| Structure identity | (implicit) | stable keys `participantId:SYMBOL` — animation continuity, compare-twinning, idempotent patches | **B** — cheap, load-bearing, uncontested once stated. |
| Truncation honesty | top-9 structures (matches old renderer; shipped in S1 as `MAX_STRUCTURES`) | project **all** positions; the *renderer* aggregates the tail into a labeled "outer district" | **B** — valid critique of shipped S1; truncation should be visible, not silent. Small follow-up on `project()`. |
| Client code hygiene | (not addressed) | serve the board client as a real `.js` file (inlined only at export), killing the template-literal/backtick trap | **B** — direct fix for a documented recurring failure mode. |
| Two-axis towers | height ∝ value (linear) | height ∝ value^0.6 (whale-compressed) + footprint ∝ cost basis — gain vs. commitment as two honest axes | **B** — more informative and still honest; fold into the tile upgrade slice. |
| Naming | (unaddressed) | `Cohort` = kind aggregate; `Nation` = a member + their bots (docs currently use "nation" for both) | **B** — ratify once, cheap, prevents thrash. **Eric ratifies.** |

## Merged phasing (supersedes both originals)

1. ✅ **S1 — World Projection** (`src/universe/`, shipped #163).
2. **S1b — projection completeness**: project *all* positions (tail → labeled aggregate), two-axis
   tower fields (`footprint`), extend prominence to humans. Small, pure, tested.
3. **S2 — piece contract + `DrawTarget`** (canvas + SVG adapters) + 2–3 reference pieces; the SVG tile
   becomes the skyline successor on the four views.
4. **S3 — founding + reserve landmark** on the city view (highest emotion per unit of work; snapshot-only).
5. **S4 — the live board** (placement per Eric's fork): one city, camera, session lighting,
   reduced-motion static frame, `WorldPatch` SSE (the D6 fix). *Pre-slice: one static isometric mock,
   screenshot, taste check — an afternoon, not a slice.*
6. **S5 — ceremonies v1** from history-sample diffs (turn the prod sampler on NOW so data accrues;
   `SKYNET_HISTORY_DIR=/data/history` — the one Eric-owned op).
7. **S6 — region + nation LODs; compare twinning.** (Budget the city→region transition as its own
   slice — both plans flag it as the hardest craft problem.)
8. **S7+ — ledger upgrade (per-position attribution/win-rate), hero-character generator, judgment
   axis (gated on Eric's sourcing standard), login migration last-if-ever.**

## Eric's open forks (nothing above proceeds past them without a call)
1. `/world` route vs. in-place views (lean `/world` + tiles + portals).
2. `Nation`/`Cohort` naming ratification.
3. Ledger = a new durable record of member *actions* — retention + cross-member visibility.
4. Judgment-axis sourcing standard (what counts as fact vs. read).

## The mined eval seed (first harvest of the duel)

Discriminators that actually separated stronger from weaker plan content — candidate assertions for
an **architecture-plan eval** (pending Eric's confirmation, per the flywheel):

1. **Repo-claim verification:** any claim about existing code must cite a file+symbol that exists and
   be *true* (B's ledger rationale failed exactly this; it was the duel's only factual casualty).
2. **Transport/state-lifecycle audit:** a plan introducing client state must check the delivery path
   for state destruction (the `innerHTML`-per-tick catch).
3. **Stable identity for animated entities:** every animated/diffed entity names a stable key.
4. **Honesty-by-construction:** silent truncation/aggregation must be surfaced as a labeled visual.
5. **Idempotent event delivery:** fire-once semantics stated for anything replayable (SSE reconnect).
6. **Convergence protocol:** independent-model agreement = settle it; divergence = escalate as a
   human fork — don't relitigate agreements, don't bury disagreements.

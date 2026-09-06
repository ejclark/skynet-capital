# Brand & Identity System — Skynet Capital

The durable record of **what makes Skynet Capital feel like Skynet Capital**. The
[operating model](OPERATING-MODEL.md) is domain-agnostic on purpose; this file is the domain-specific
counterpart it rides on. Every deliverable is checked against this system, and new elements must
*extend* it — never contradict it. It is a living document: refinements flow back here so the identity
deepens over time (see the [Brand Cohesion Protocol](OPERATING-MODEL.md#brand-cohesion-protocol-bcp)).

## Essence

A friends-and-family options **paper-trading** sandbox where humans and autonomous bot personas race a
friendly leaderboard — educational, celebratory, never adversarial. The feel is **futuristic,
cinematic, competitive, and warm**: a living "Matrix" world you enter, not a form you fill in.
Everyone-wins framing; the machines are cast members, not the enemy.

## Color (dark-first, with a fully-considered light theme)

Design tokens — reuse these; do not invent a parallel palette.

| Token | Dark | Light | Role |
| --- | --- | --- | --- |
| `--bg` | `#0B0F14` | `#F7F9FB` | ground |
| `--surface` | `#131A22` | `#FFFFFF` | panels/cards |
| `--surface-2` | `#0F151C` | `#F0F4F8` | recessed |
| `--border` | `#223041` | `#DCE3EA` | hairlines |
| `--text` | `#E6EDF3` | `#0B0F14` | primary text |
| `--muted` | `#8B9AAB` | `#5A6B7B` | secondary text |
| `--accent` | `#35D0BA` | `#0E9F8C` | **the machine/system signal** (teal) |
| `--pos` | `#3FB950` | `#1A7F37` | up / profit (green) — the human line |
| `--neg` | `#F85149` | `#CF222E` | down / loss / danger (red) |

- **Accent teal `#35D0BA` is the "machine" voice** — brand-wide it means *system / signal / the bots*.
- **Green/red carry market meaning** (`--pos` up, `--neg` down). Never use them decoratively in a way
  that implies a false P/L direction.
- **The Eye of Sauron is the one sanctioned warm palette** — a fiery amber→orange→red ramp
  (`#FFF3D6` core, `#FFC24D`, `#FF7A2E`, `#FF9E3D`, into `--neg` red) reserved for that anchor and its
  beam. Warm-white `#EAFFFA` is the "charged/electric" highlight (crowns, VFX, beam nodes).
- Neutrals carry a deliberate blue-teal bias — chosen, not defaulted.

## Type

Two established stacks, no webfont fetches (CSP-safe by construction):

- **`--sans`** (system stack) — display/brand & UI; tight tracking on the `SKYNET·CAPITAL` mark.
- **`--mono`** (`ui-monospace, "JetBrains Mono"…`) — data, labels, eyebrows, terminal voice, tickers,
  equity readouts. The mono is the "trading terminal" register.

## Voice & tone

- **Confident, specific, honest.** Real tickers, strategy-accurate underlyings, honest labels
  (`SIM` vs `LIVE`). A flourish never implies something false about markets or P/L.
- **Inclusive & celebratory**, not zero-sum: "everybody's welcome to win." Learn · experiment · play.
- **Terminal cadence** for machine/system copy (`detect_signal · rsi overbought`); **warm human
  cadence** for onboarding and framing.
- Educational first — teach the play, name the "why," recap the outcome.

## Core metaphors & motifs

The recurring visual/narrative language. New work should draw from these, or *extend* the set.

- **The Matrix** — falling green code, a dark city the code falls behind, a world you step into.
- **Cinematic mechanics** — tractor/gravity beams, a Madden telestrator "chalking" the play, the
  "key to the city" unlock, a hangar/doorway of light. Metaphors are translated to *faithful
  mechanics*, never taken literally or flattened.
- **The trading terminal** — mono readouts, named programs (`ingest → detect → assess → recommend →
  execute`), HUD chrome.
- **The empire built from capital** — the cityscape as generational wealth; the skyline breathes with
  the market (session lighting), and reads as a living market surface (ticker billboards, red rail).

## The signature — the Living Universe

The **living cityscape as a shared, multiplayer world** (see [`LIVING-UNIVERSE.md`](LIVING-UNIVERSE.md))
is the strongest candidate for *the brand itself* — the defining, addictive property that hooks
engagement. It reflects portfolios, bots, news, economy, and politics as a place you inhabit and check
like the news. Everything below (the anchors, the palette, the motifs) serves this: they are how the
living universe looks and feels. When a choice is unclear, ask what it does for the living world.

## Identity anchors (Graphify god-nodes → where cohesion lives most vividly)

Elements with rich backstory that *license overly-refined detail*. Depth compounds here.

1. **The Eye of Sauron & its tower (Barad-dûr).** The order-imposer's watcher crowning a left-side
   empire tower; a lidded fiery Eye (layered iris, cat-slit pupil, flame corona, clawed prongs) that
   opens and commands the gravity beam hauling the present forward. The one warm-palette focal point.
2. **The Playbook / playcall.** The three-act signal→forecast→resolve sequence; strategy-accurate
   payoff structures with honest max-profit/loss; the anatomy grammar (green profit / red loss /
   muted breakeven).
3. **The personas.** Named trading archetypes whose character *deepens* the strategy and never
   distorts it (Sauron = the cold order-imposer). Extensible toward a mixed-multiverse lore layer.
4. **The `/login` world.** The cinematic threshold — matrix rain, storm, cityscape, spotlights,
   reveal VFX — where the brand is most concentrated.

## Accessibility (a standing reader is red/green colorblind)

Eric, 2026-09-06, on the research rail: *"the functionality is there but near invisible unless you
know where to look. FWIW, I have mild red/green colorblindness. Higher contrast colors make it easier
for me to detect these details… UX/accessibility audits would fail the contrast ratio especially in
dark mode."* The first reader of every frame cannot separate `--pos` from `--neg` by hue. Rules:

- **Hue never carries meaning alone.** Pair every colour signal with a shape, a pattern, a weight, or
  a word: filled vs hollow dot, a hatch for a closed day, a strike, a glyph, a label. Red/green P/L
  is honest colour, so it always rides with the sign and the number.
- **Non-text signals need a real step, not a tone shift.** A range band, a selected row, a hover:
  aim for ≥ 3:1 against its ground (WCAG non-text) — `--surface-2` on `--surface` is 1.05:1 and
  reads as nothing. Use an accent tint (`color-mix`) plus a bar or ring.
- **Text pairs hold AA (4.5:1) in both palettes**, including text on an accent fill
  (`--accent-contrast` on `--accent`). `tests/ui/contrast.spec.ts` computes the ratios from
  `theme.css` and fails the build on drift; a new text-on-colour pair joins that spec.
- **Small marks get size before colour.** A 4px dot is invisible at any contrast; 6px with a 1.5px
  ring reads. Legend and helper text sit at ≥ 11.5px.
- **Judge dark first, then light, both by eye and by the spec** — dark is the default and where
  low-contrast tones hide; light is where accent fills lose their text.

## Honesty & domain-accuracy rules (non-negotiable)

- Paper/simulated only; label `SIM` vs `LIVE` truthfully. Diagrams are illustrative, never presented
  as real P/L.
- Real tickers; strategy-accurate underlyings (range/premium plays get calm mega-caps; vol/directional
  plays get high-beta movers). No "iron condor on NVDA" mismatches.
- Governance/credentials are the owner's call; the app builds mechanisms, never self-authorizes.

## Cohesion rules (how new work stays on-brand)

- **Named patterns live in [`PATTERNS.md`](PATTERNS.md)** — the seed bank of UI patterns with a
  live instance each, and the *kind / section / sub-view* vocabulary for where information goes on
  a page. A surface decision arrives as 3–5 named shapes from that ledger; a new pattern gets a row.

- Reuse tokens and the two type stacks; bring the matrix tonality in **restrained** doses when the
  mode calls for calm (logged-in "study mode") vs. the fast cinematic `/login` preview.
- New motifs should connect to an existing metaphor or consciously extend the set; log the extension.
- Honor `prefers-reduced-motion`; both themes must be legible.
- When an element earns it (a backstory, an anchor), **bake in exquisite detail** — and record the
  refinement so it compounds.
- **Celebration pairs with explanation.** No delight animation (a milestone banner, a future ceremony)
  fires without adjacent plain-language text on what just happened. Robinhood's own 2021 post-confetti
  redesign learned this the hard way — pure fanfare with no explanation reads as pushing the action,
  not celebrating the understanding.

# Design review — the `/login` intro scene

A design pass over the whole intro at v1.90: the idle hero, the playbook carousel, the primary
character (Barad-dûr), the full-width playcall, and the reveal — desktop + mobile. Verdict first, then
findings ranked by impact, each with a concrete fix. This is the evaluation; the fixes are proposals to
sequence, not yet built.

## Verdict

The scene is genuinely lovable and cohesive on **desktop during a playcall** — the full-width forecast,
the Eye backlight, and the fire/electric energy zones read as one cinematic system. The weak spots are
all in the **quieter states and the small screen**: the idle hero has a compositional void, the primary
character under-performs at rest, the playbook affordance is nearly invisible, and **mobile still runs
the pre-refactor playcall** so it contradicts the desktop language. Fixing those would make the whole
experience read as deliberate in every state, not just the hero moment.

## Findings (ranked by impact)

### P1 — Mobile playcall is a different, older design (coherence debt)
Mobile still renders the legacy stacked panel: the `INGEST→DETECT→FORECAST→EXECUTE` pipeline, the
`PROFIT / LOSS / BREAKEVEN` **anatomy legend**, and `MAX PROFIT / MAX LOSS` text — all of which desktop
has since dropped (name→chart title, legend removed as redundant with the bands, P/L moved to the
TARGET). So a phone user sees a busier, older-feeling play than a laptop user.
**Fix:** bring mobile in line — drop the anatomy legend (the bands already say it), let the play name be
the chart's title, and lean on the on-chart totals. Keep the stack only where the narrow width truly
needs it. Medium effort; highest coherence payoff.

### P2 — The idle hero has a vertical "dead zone"
Top-center title + tiny triad, then a large empty band, then the market line low in the frame. The eye
falls into the gap. The primary character (the Eye) sits low-left and dim, so it doesn't anchor the void.
**Fix (pick one):** (a) lift the ambient market + tower higher so the composition fills, or (b) give the
idle Eye more presence (a slow breathing gaze/aura) so it becomes the focal that owns the upper-left,
or (c) tighten the vertical rhythm (pull the beacon/market up). Recommend (b)+(c) — cheap, and it makes
the character earn its "primary" billing at rest, not only during a play.

### P3 — The playbook carousel is undiscoverable
`PLAY · EXPERIMENT · LEARN` is the entry to calling a play, but it reads as static eyebrow text; nothing
signals that **PLAY** is interactive (and EXPERIMENT/LEARN are inert, which muddies it).
**Fix:** give PLAY a quiet but real affordance — an underline-on-rest or a small ▸/caret, a hover lift,
and a one-time hint pulse on first idle. Visually de-emphasise the two inert words (or drop them until
they do something) so the interactive one stands out.

### P4 — The primary character is small + dim at rest
Made dominant in height (#152) but at rest it's a faint silhouette; its craggy base detail is swallowed
by the foreground haze, so the LoTR-fidelity work barely reads until a play lights it.
**Fix:** a low, always-on ember glow at the base + a slightly brighter idle Eye so the fortress reads at
rest. Ties into the parked **hero-character skill** — the systematic version — but a small rest-state
lift is cheap now.

### P5 — Orphaned idle telemetry label
`RSI 99 OVERBOUGHT` floats top-left near the Eye with no visual home — reads as debug text.
**Fix:** anchor it to the market's leading dot (where the read actually is), or style it as a small HUD
chip so it looks intentional.

### P6 — Full-width title could scale up
Now that the playcall owns the full width, the top-left play name/desc is sized as if still in a narrow
column — there's room to make the title a touch larger/more confident.
**Fix:** bump the on-chart title size on wide viewports.

## What's working (keep)
- The full-width playcall composition and the Eye backlight — the strongest moment.
- Fire/electric energy mapped to the loss/profit zones — on-brand, extensible to other personas.
- The reveal: title FLIP into the card, corner brackets, scrim recede — clean and calm.
- Brand cohesion: the teal/green/red token system holds across every surface.

## Suggested sequence
P1 (mobile coherence) → P2+P4 (idle hero + character rest-state, together) → P3 (playbook affordance) →
P5/P6 (polish). P1 is the biggest correctness win; P2+P4 the biggest "lovable at rest" win.

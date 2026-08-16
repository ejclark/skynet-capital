# Handoff: Skynet Capital — Season One Trailer + Field Guide

**Status:** draft <!-- only Eric flips draft→ready -->

## Overview
Two deliverables for the Skynet Capital paper-trading league (repo: `ejclark/skynet-capital`, live at https://skynet-capital.fly.dev):

1. **Season One trailer** (`Animate.dc.html` + `skynet-promo.jsx` + `skynet-sfx.js`) — an ~82s animated promo in an ink-brush style with a WebAudio score. Story: family-farm prologue → Sauron rises (shadow pours from his tower) → seven ring-bearers → THE WIZARDS' FORGE melts the rings into $1,000,000 seeds → battle plan (dark war-room, trading charts) → the climb/battle → end credits closing on a Season Two tease. Plays ONCE (no loop, no autoplay) and holds on the end card.
2. **The Field Guide** (`Field Guide.dc.html`) — the league's explainer page: sticky progressive header with step links, GETTING STARTED banner (Join / Trade & climb / Engage), WHAT THIS IS, tiered F.A.Q., Engage CTA row, flame/shadow branding.

## About the Design Files
These files are **design references created in HTML** on an internal design runtime (`support.js`, `animations-v3.jsx`, `tweaks-panel.jsx` are that runtime — do NOT ship or port them; `index.html` is just a redirect stub for publishing). The task is to **recreate the designs inside the skynet-capital codebase's existing environment and patterns**, not to copy these files in.

Recommended split:
- **Trailer**: export the finished trailer as a video (mp4/webm) from the design tool and serve it from a `/trailer` page — poster/fallback = the end card described below. Recreating the full animation in-app is not expected.
- **Field Guide**: recreate as a real route (e.g. `/guide`) in the app's stack, using the measurements and tokens below.

## Fidelity
**High-fidelity.** Colors, type, spacing, copy, and interactions are final. Recreate pixel-perfectly with the codebase's conventions.

## Screens / Views

### 1. The Field Guide (`Field Guide.dc.html`)
Single scrolling page, max content width 960px, side padding 48px, dark warm ground.

**Page ground**: `#14100B` with two washes: ember glow `radial-gradient(ellipse 70% 42% at 82% -12%, rgba(255,122,46,0.08), transparent 65%)` and bottom shadow `radial-gradient(ellipse 95% 55% at 50% 118%, rgba(0,0,0,0.5), transparent 70%)`.

**Sections, top to bottom:**
- **Hero** (pad 56/48/24): eye mark (20px SVG: ember ring `#FF7A2E` @1.5px, slit ellipse rx1.7 ry5.2) + kicker `SKYNET CAPITAL · SEASON ONE — SAURON'S SHADOW` (12px, ls 0.32em, gold-300, w500); H1 "The Field Guide" 44px/1.1 w500.
- **GETTING STARTED banner** (full-bleed, flush under hero): bg `linear-gradient(180deg, rgba(255,122,46,0.05), transparent 40%)` over `#251402`; border-top `rgba(255,122,46,0.18)`, border-bottom `rgba(0,0,0,0.45)`; pad 28/48/30. Kicker 12px ls 0.28em gold-200. 3-col grid (gap 0 40px): titles 28px heading w500 with numeral prefix 14px gold-200 on the SAME BASELINE (flex baseline, gap 9px): "01 Join", "02 Trade & climb", "03 Engage". Divider spans all cols, 1px, margin 8px 0 12px, `linear-gradient(90deg, transparent, #6B4F17 48px, #6B4F17 calc(100% - 48px), transparent)`. Descriptions 13px/1.6 `--neutral-100`:
  - Join: "Sign up with Alpaca and sign in with your Gmail. Your $1,000,000 simulated seed lands on arrival — open invite, the more the merrier. Get started →" (link → https://skynet-capital.fly.dev/add)
  - Trade & climb: "Execute paper trades in stocks and options — zero real dollars at risk. Weekly recaps track the party's ascent against Sauron, the autonomous bot trader."
  - Engage: "Engagement drives the game: questions and detailed feature requests shape what Claude builds next — and can earn your character experience toward better stats."
- **WHAT THIS IS** (pad 32/48/0): kicker + two 15px/1.55 lines (`--neutral-100`, max-w 660): "A paper-trading league — trades in the real U.S. stock market with fake money, so you learn stocks & options with zero real dollars at risk." / "Season One is a campaign: human players make trades in attempt to beat Sauron, an autonomously trading bot."
- **F.A.Q.** (pad 12/48/48): three tiers — "F.A.Q. / First questions first.", "PLAYING / What it asks of you.", "SHAPING IT / Once you're in." Tier label 12px ls 0.24em gold-300 + sub 13px neutral-300, margin-top 30. Rows: grid 300px/1fr, gap 36, pad 17px 0, fading 1px top rule (neutral-700). Q 15px w500; A 15px/1.6 neutral-200. (Q/A copy in the file's data block — use verbatim.)
- **Engage** (pad 24/48/56): H2 24px "Engage" + "The more folks engage, the richer this gets." Outlined buttons: primary "Propose a mechanic →" → /feedback, secondary "Ask a question" → /feedback, ghost "Watch the trailer" → trailer page. Note 13px neutral-300. Footer rule + right-aligned "SEASON ONE — SAURON'S SHADOW: COMING SOON" 12px ls 0.24em gold-200.

**Sticky progressive header**: fixed, translateY(-70→0) 0.35s when hero bottom < 44px; bg `rgba(18,13,8,0.9)` + blur(10px), bottom border `rgba(255,122,46,0.16)`; row pad 13px 48px: eye mark 14px + "SKYNET CAPITAL" (12px ls 0.28em gold-300) + "· THE FIELD GUIDE" (12px neutral-200). When the banner scrolls out (band bottom < 52px), three step LINKS fade/slide in right-aligned (opacity 0→1, translateX 14→0), all 12px ls 0.14em, no underline: "01 JOIN" → /add, "02 TRADE & CLIMB" → /login, "03 ENGAGE" → /feedback (numerals gold-200, labels neutral-100).

### 2. Trailer end card (recreate as the /trailer poster/fallback component)
Top-aligned centered column on ink `#161310` (grid alignContent start, paddingTop 58/1080):
- "SKYNET·CAPITAL" serif 96px `#EDE6D8`, gold middot.
- Gold skewed rule 440×6, skewX(-24°), `#B98A2E`.
- "SEASON ONE — SAURON'S SHADOW" mono 30px ls 0.44em `#E3A83A` + glow; "TAKE DOWN SAURON" mono 18px ls 0.4em `#B98A2E` (margin-top 16).
- Starring block (margin-top 40): "STARRING" 15px ls 0.4em `#6E6455`; names serif 27px `#EDE6D8`: "Bruce · Nathan · Narayan · Joe · Tony · Eric · Rodo"; "OPEN INVITE — THE MORE THE MERRIER" mono 14px ls 0.32em. In the animation this block cross-fades into the Season Two tease occupying the same slot: "In his shadow, others stir…" serif 32px; "SEASON TWO — THE WIZARDS' FORGE" mono 27px ls 0.42em gold + glow (margin-top 36); "THE FATE OF SEASON ONE WRITES THE PROPHECY" mono 15px ls 0.34em `#6E6455` (margin-top 26).
- Divider (margin-top 236): 440×1px fading gold `#B98A2E` gradient.
- **Field Guide link** (margin-top 34): mono 30px BOLD ls 0.32em `#E3A83A`, 3px gold underline (padding-bottom 10), circled-arrow SVG icon (26px: circle r10.5 @2px 55%, chevron 3px), slow breathing glow (drop-shadow 6px@0.25 ↔ 18px@0.6, 2.8s ease-in-out infinite), text "THE FIELD GUIDE → GETTING STARTED" → the guide route.
- Tower skyline (animation only): five pronged silhouettes rise on a gradient-dark horizon (y≈952/1080) with paired blinking ember eyes (5×6px `#FF7A2E`) and soft glows — a brief appearance that fades back into the dark before the hold frame; decorative layer is pointer-events none.

## Interactions & Behavior
- Trailer playback: NO autoplay (loads paused on frame one — the play press is the gesture that unlocks WebAudio); plays ONCE (no loop) and holds on the end card with the link clickable.
- All scene transitions are fades/in-scene morphs — no directional wipes anywhere.
- End-card reveal cadence (authored s): starring yields ~75.3 → "In his shadow" ~75.8 → eyes blink + ticks ~76.4 → lone deep drum 77.2 → S2 title ~78.2 → prophecy ~79.2 → link ~80.9.
- Field Guide header thresholds as above; all external links target="_blank" rel="noopener".
- Link colors: default gold accent-200, hover accent-100; outlined button states from the app's system.
- Score (reference): accelerating taiko heartbeat 2.2s→0.32s, layers stack (ember drone, pipes, chants, anvils, organ, war), dead silence 56–57.6 then eruption, heartbeat out through credits, silence, one deep drum under the tease.

## State Management
- Field Guide: `hdrShow`, `hdrSteps` from scroll; URL config: signupUrl=/add, loginUrl=/login, feedbackUrl=/feedback, trailerUrl.
- No data fetching; all copy static.

## Design Tokens
**Trailer palette**: PAPER `#EDE6D8`, PAPER2 `#DCD2BC`, INK `#161310`, INKSOFT `#2B261F`, INKMUTE `#6E6455`, GOLD `#E3A83A`, GOLDDIM `#B98A2E`, RED `#A93226`, EMBER `#FF7A2E`, EMBER2 `#FFC24D`; grounds: brimstone `#0E0805`, war-room `#12100B`, battle `#080604`; plan chart green `#79B366`, chart red `#D4483A`.
**Field Guide (flame theme over Nocturne)**: bg `#14100B`; section `#251402`; accent ramp — 100 `#F8ECCB`, 200 `#EDCF8F`, 300 `#DFB45E`, base `#E3A83A`, 400 `#C99A3E`, 600 `#9A7526`, 700 `#6B4F17`, 800 `#45320D`, 900 `#2A1D07`. Neutrals/spacing from the app's Nocturne-derived system (Inter, 8px radii, 0.7× compact spacing, fading rules, outlined buttons, no pure black/white).
**Type**: guide = Inter (headings w500 max). Trailer serif = 'Iowan Old Style', Palatino, 'Book Antiqua', Georgia; trailer mono = ui-monospace, 'JetBrains Mono', SF Mono, Menlo.

## Assets
No raster assets — the eye mark, gauge, charts, and skyline are inline SVG/CSS. Phosphor icons if any icons are added in-app. Trailer video to be exported from the design tool (see INTEGRATE.md).

## Files
- `Animate.dc.html` — trailer entry (scene list, playback=times:1, tweak defaults)
- `skynet-promo.jsx` — all trailer scenes/artwork (React on the design runtime)
- `skynet-sfx.js` — WebAudio score (tempo map, one-shots, layers, gesture unlock)
- `Field Guide.dc.html` — the guide page (template + FAQ data + URL props)
- `index.html` — publish redirect stub (not for the app)
- `support.js`, `animations-v3.jsx`, `tweaks-panel.jsx` — design-tool runtime, reference only

---
name: teardown
description: >-
  Decompose a reference design — a competitor's screens, a screen recording, a shipped product —
  into named patterns, the mechanic under each, and a borrow / adapt / skip call sheet mapped
  against the surface of ours it informs, then land it where the plan lives. Use when Eric posts
  screenshots of another app ("Fidelity's mobile app is amazing", "use this for inspiration",
  "reverse engineer this", "how does X do this?"), when a redesign names an outside reference,
  or when a concept should get on the radar before anyone builds. Not for reactions to OUR OWN
  rendered frames (that is /telestrator), not for 3D fidelity references (render-alchemist), and
  never a substitute for the IA decision itself — a teardown feeds a plan issue, it does not
  replace one.
---

# Teardown — read a reference closely enough to name what it does

The precedent is the Fidelity ticket study of 2026-09-05: fifteen phone frames of a brokerage's
stock ticket, options chain, ticket and review became a twenty-row call sheet, a gap table against
`trade-gate.tsx` and `option-gate.tsx`, and two plan issues (#1461, #1481). Eric's ask that made it
a skill: _"reverse engineering would be a good research skill to develop to decompose designs,
identify pieces of the design and the underlying mechanics… getting concepts on our radar to add
tools to our toolbox."_ The practitioner name for the artefact is a **teardown** — the expert-review
form of what NN/g calls a competitive usability evaluation ("compare features, content, or design
elements across sites"; two to four references at most). "Reverse engineering" stays a trigger word
so the routing catches it; the skill never decompiles, scrapes, or copies assets — it reads screens.

## Why the shape (one line each)

- **A name outlives a screenshot.** "Straddle view" gets a whole chain layout across in two words
  next time; a description of it does not. Vocabulary is the deliverable that elevates the
  constraint (`CLAUDE.md` → _Eric directs by outcome_).
- **Grammar over inventory.** Fidelity's ticket has eight order types and five time-in-force
  options because it serves approved real-money traders; its _shapes_ (one column, sheets with a
  learn link, a sticky preview footer) transfer, its _catalogue_ does not. The reference's audience
  is part of the read.
- **Every call carries its falsifier.** Same contract as `docs/process/EVENT-RESEARCH.md` — the
  call · confidence · why · what proves it wrong — so a teardown is a decision sheet, not a mood
  board. "Skip" is a first-class call.
- **"Ours today" cites code, never memory.** The greeks-dropped finding (`OptionChainRow` carries
  delta–rho; the shell's `ChainRow` drops them) came from reading, and it changed the size of the
  work from "new plumbing" to "presentation." A gap table that guesses is worth less than none.
- **It lands, or it rots.** A study that lives only in chat dies with the session (the journey
  lesson). The images go to a private artifact; the decisions go onto the plan issue.

## The drill

1. **Name the surface it maps to before opening a frame.** Which route or component of ours does
   this reference inform (`/trade`'s ticket, the options chain, the milestone strip)? If nothing
   of ours owns the territory yet, this is a radar entry for `docs/IDEAS.md`, not a teardown —
   say so and stop.
2. **Redact before anything else.** Account numbers, balances, names, order ids, positions — a
   brokerage frame carries them in the header, the footer and the review. Run
   `node scripts/teardown/redact.mjs` (a headless-Chromium canvas pass: paints a band, downscales,
   writes JPEG) and **look at every redacted frame** before it goes anywhere. The originals never
   enter the repo, an issue, or a PR. This is not optional and not a judgment call.
3. **Look at every frame before you theorize** (`render-alchemist`'s rule, borrowed verbatim).
   Frames from one flow are often edges of one surface — the calls page and the puts page were
   the two ends of one horizontally-scrolling straddle view, not two tables. A teardown that
   describes a screen it did not look at frame-by-frame is fiction.
4. **Name the patterns — one row each, numbered.** Pattern (a _name_ that survives as vocabulary)
   · the mechanic (what it does for the reader: "moneyness by geometry", "the ×100 taught before
   Preview") · **borrow / adapt / skip** · confidence · the one-line why · what proves it wrong.
   Number the rows; the numbers become pins on the frames.
5. **Interrogate the reference's context.** Who is it for, at what stakes, with what approval?
   A real-money desk for Level-2 traders and a paper desk with a training ladder share grammar
   and not inventory. Write the context line into the study; it is what turns a "borrow" into
   a "skip" honestly.
6. **Map against ours — the gap table.** Element · the reference · ours today (with the file, by
   reading it now) · the gap (add / replace / adapt / keep). This row is where the work gets
   sized; it is the row a build session opens first.
7. **Hand back the vocabulary.** A short list — five words, not fifty — of the named concepts
   the reader can use next time ("straddle view", "stacked view", "sheet, not dropdown",
   "preset, not drive"). If a term is contested or has a decompile connotation, say which one
   we use and why.
8. **Land it.** Frames + call sheet + gap table + vocabulary → a **private artifact** (images
   inline, redacted). Decisions → the owning plan issue as a `thought:` comment with the link,
   or a new `plan` issue via `/issue` if no issue owns the surface. Constraints the teardown
   settled (mobile-first, grammar-over-inventory, a skipped inventory) go into the issue's brief,
   not only the study.
9. **Keep it current when the reference grows.** More frames from the same product update the
   same artifact (same file path, same URL; the version picker keeps the history) and amend the
   same issue — one study per reference, not one per batch.

## Hard rules

- **PII is redacted before any frame is looked at by anyone but the person who posted it.** No
  brokerage, bank, or account screenshot enters git, an issue, or a PR, redacted or not — the
  private artifact is the only home. `docs/PICTURES.md`'s hosting rules are for _our_ screens.
- **Patterns are ideas; pixels are theirs.** Name the mechanic, draw our own. Never copy an
  asset, an icon set, copy text, or a layout wholesale — a teardown is a study, not a template.
- **A frame you have not looked at is not described.** Say "not shown" where the reference
  didn't show it; never infer a mechanic from a menu label.
- **Every row has a call, a confidence, and a falsifier** — the research contract, unchanged.
  A row with no falsifier is an opinion and is cut.
- **"Ours today" is read, not remembered.** Cite the file. If the surface doesn't exist yet,
  write "none" — that is a finding, not a gap in the table.
- **A desktop reference does not license a desktop-first design.** `CLAUDE.md` → _Mobile-first
  on the trading surfaces_: a wide reference is read for what survives 390px first; what it
  shows with more room goes in the "desktop adds" column, never into the base.
- **The teardown never decides the IA.** It informs the plan issue where the decision is
  written (`CLAUDE.md` → _Write the IA decision down before implementing it_). If a study
  makes a call that changes nav, routes, or structure, that call is filed on the issue, not
  shipped from the study.

## What this drill will not do

- **Gate a member's screenshot.** A member posting a competitor's screen through `/feedback` is
  raw signal; the redaction and the study are Claude's work on their behalf.
- **Run unattended.** It needs the operating model in view — our surfaces, the ladder, BRAND,
  what Eric has already decided — which is why it is a skill and not a `/governor` rung (there
  is no gate that can name a reference).
- **Benchmark.** NN/g's competitive _testing_ (users on tasks across two to four products) is a
  different instrument; this is the expert-review form only.

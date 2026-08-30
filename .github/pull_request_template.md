<!--
A PR is a document, not a chore — it becomes the squash commit on `main`. TITLE = Conventional-
Commit subject, lowercase-led. Picture grammar & format guide: docs/PICTURES.md (read once; after
that this template is enough). Structure is machine-checked: `scripts/ship.sh checkbody <file>`.

FAST PATH (typo / chore / pure docs — no behavior change): keep `## The picture` but make its body
the single line `Picture: waived — <reason>`, write 1–2 Summary bullets, delete everything else.
Any other section is deletable when it doesn't apply; The picture is only ever WAIVED, never deleted.
`Closes #N` goes in a Summary bullet — never line 1 (GitHub links it from anywhere).
-->

## The picture

<!-- REQUIRED & FIRST — the fridge rule (Eric, 2026-08-20): judgeable BY EYE in ~10 seconds,
before any prose. Pick by change type (copy-paste examples: docs/PICTURES.md):
UI → before/after screenshots (≤100KB JPEG under docs/shots/pr-<n>/; ship.sh SHA-pins the raw URL —
never hand-write a branch URL, those 404 the moment the branch deletes at merge) ·
dataflow/pipeline → flowchart LR · route/request → sequenceDiagram · lifecycle/gate/mode →
stateDiagram-v2 · schema → erDiagram · config → before/after table.
Mermaid: stable types only, ≤15 nodes, plain words in labels, no init/style blocks.
The picture states WHAT changed — never how good it is. -->

_Caption —_

<!-- The caption is required with any picture: one plain-language line naming what it shows and
where it came from (a route, a shoot script, a diff). It's the line that survives email/mobile. -->

<!-- CARVE-OUT PRs ONLY (workflow files / credentials / spend / outward-facing): add this next,
top-level, never indented or inside <details> — blast radius comes BEFORE accomplishments:
> [!WARNING]
> <what this touches and what could go wrong if it's wrong> -->

## Summary

<!-- 1–3 bullets, ≤120 chars each (ship.sh checks). Plain language, outcome not process.
If a live route changed, add a bullet: "Review live after deploy: /route". -->

-

<!-- DELETE THIS BLOCK when nothing gates merge on a human call — most PRs. Add it, right here
above the fold, only when a decision only Eric can make blocks or should precede merging (a taste
fork, an ask the diff can't settle itself). One numbered line per decision, phrased as a closed
question or a named choice, reason trailing after an em dash — never a paragraph, never buried in
"Design notes" below the fold. If this block is present, open the PR as a draft
(`ship open --draft`) instead of auto-merge.

> [!IMPORTANT]
> **Needs from you**
> 1. The decision, as a closed question or a named choice — the one-clause why, trailing. -->

<details>
<summary><strong>Why, acceptance &amp; the weeds</strong></summary>

### Why

<!-- One or two sentences: the intent / the user value. What's better after this merges? -->

### Acceptance criteria (EARS)

<!-- For behavior changes (always for auth/privacy/tool-execution): one verifiable `shall` per
line, each closing `— verified: <spec or test name>`. Omit for pure docs / refactor / chore. -->

-

### What changed

<!-- File- or module-level walkthrough for a technical reader; group by area; non-obvious choices only. -->

-

### Design notes & trade-offs

<!-- Decisions made, alternatives rejected, and why. Link an ADR (docs/adr/) for hard-to-reverse calls. -->

-

### Verification

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] Screenshot / visual check (UI changes)

<!-- Unchecked boxes with an honest reason beat false checkmarks. -->

### Risk & rollback

<!-- Blast radius, reversible-vs-not, how to back it out. "Additive, no runtime wiring" is a valid answer. -->

-

### Follow-ups

<!-- Deliberately-deferred work, linked issues, the next slice. -->

-

</details>

<details>
<summary><strong>Machine context</strong> (optional — automation audience)</summary>

<!-- Bot-only tier: structured facts a future session or Routine can parse without re-deriving.
     YAML preferred. Omit the whole section when there is nothing structured to say. -->

```yaml
```

</details>

<!--
A PR is a document, not a chore — the durable context cache future sessions and humans mine
(never ship one empty; scripts/ship.sh refuses). Three audiences, layered top-down (Eric,
2026-08-15): the TOP is human-first (analytical but non-technical readers — plain language,
outcome-first); the DETAILS fold is hybrid human/bot (file-level context an engineer or a session
picking up the thread needs); the optional MACHINE CONTEXT fold at the bottom is bot-only
(structured facts automation can parse without re-deriving). Squash-merge uses the PR title +
this description, so they become the commit on `main` and drive the release: the TITLE must be a
Conventional-Commit subject, lowercase-led (e.g. `feat(observatory): equity sparkline on /u/:id`)
— succinct, high-signal (see docs/ENGINEERING.md → Change communication).
Delete these comments and any section that doesn't apply.
-->

## Summary

<!-- The gist, in plain language. 1–3 bullets a non-technical reader can skim to know what ships. -->

-

## Why

<!-- One or two sentences: the intent / the user value. What's better after this merges? -->

## Acceptance criteria (EARS)

<!--
The behavioral contract this PR fulfills, in EARS (docs/ENGINEERING.md → Requirements in EARS): one
verifiable `shall` per line, a named system, the right pattern — each line maps to a spec. Cover the
happy path AND the guards (IF…THEN). Omit for pure docs / refactor / chore PRs with no new behavior.
  WHEN <trigger>, the <system> shall <response>.
  IF <condition>, THEN the <system> shall <response>.
-->

-

<details>
<summary><strong>Details — the how &amp; the weeds</strong></summary>

### What changed

<!-- File- or module-level walkthrough for a technical reader. Group by area; explain non-obvious choices. -->

-

### Design notes & trade-offs

<!-- Decisions made and alternatives rejected, and why. Link an ADR (docs/adr/) for hard-to-reverse calls. -->

-

### Verification

<!-- How you know it works: typecheck / lint / tests (counts), screenshots for visual work, manual steps. -->

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] Screenshot / visual check (for UI changes)

### Risk & rollback

<!-- Blast radius, anything reversible-vs-not, and how to back it out. "Additive, no runtime wiring" is a valid answer. -->

-

### Follow-ups

<!-- Deliberately-deferred work, linked issues, the next slice. -->

-

</details>

<details>
<summary><strong>Machine context</strong> (optional — automation audience)</summary>

<!-- Bot-only tier: structured facts a future session or Routine can parse without re-deriving —
     seams/contracts touched, scanner or schema changes, keys the next automation step needs.
     YAML preferred. Omit the whole section when there is nothing structured to say. -->

```yaml
```

</details>

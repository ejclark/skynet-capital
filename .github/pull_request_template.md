<!--
A PR is a document, not a chore. Most readers are analytical but non-technical — they think like
engineers without the formal background. Write the top for them; put the weeds below the fold.
Squash-merge uses the PR title + this description, so they become the commit on `main` and drive the
release: the TITLE must be a Conventional-Commit subject, lowercase-led (e.g.
`feat(observatory): equity sparkline on /u/:id`), and this description is the durable record — succinct,
high-signal, outcome-first (see docs/ENGINEERING.md → Change communication).
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

# Digest — <YYYY-MM-DD>

**Period:** <last digest date or "start"> → <YYYY-MM-DD> · **Landed:** <n> change(s) · **Trigger:** <threshold | heartbeat | quiet-with-work | requested>

<!-- The secretary's three tiers (.claude/skills/secretary). Filename is the date: YYYY-MM-DD.md.
     Every claim traceable to a diff/log; no surprises — anything Eric should have heard in real
     time is a retro, not a digest line. Shipped digests are never rewritten; corrections go in
     the next one. Delete comments when instantiating. -->

## Needs you

<!-- The blocked queue: ready-flips, Routine armings, carve-out merges, taste forks,
     irreversible-class items. Evidence attached; phrased so "yes" is one word. Ranked.
     Each item = a numbered, PRE-VERIFIED procedure (commands run, links checked) — and only
     items that could not be automated away belong here at all. Step anatomy:
     "N. <the do> — <the why, trailing, optional read>", then a 1-2 line gist closing the
     procedure (what the steps accomplish together).
     The item set is `digest-scan.mjs --needs-you` and nothing else. An ask it does not print is
     never carried as a prose item, yesterday's included (#7939 follow-up e: "land it" on #7487
     rode ten digests that way). Route it first: only he can decide → a Needs-from-you callout
     on its issue (options, prediction, Class:, On silence) + needs-eric, so the Decisions page
     takes it on the next push; a session can do it → needs-session or a feedback issue, and it
     prints on the needs-a-session line. -->

1.

## Headlines

<!-- One line per shipped OUTCOME ("X now does Y", never "worked on X"). Cap ~5, ranked. -->

-
- This week so far (<YYYY-Www>, partial): <the line from `node scripts/newsletter.mjs --week "$(date -u +%G-W%V)"`, in the form .claude/skills/secretary section 1 gives; on a Monday, a link to the edition that closed the week>

## The picture

<!-- `node scripts/digest-scan.mjs --pictures`, pasted as printed: the `## The picture` blocks of
     the PRs merged after the last digest's date, newest first, waived ones skipped, the 5 newest
     at most (table rows a squash body wrapped are re-joined). Advisory: `digest-scan --validate`
     names a digest without it, and prints "ratchet due" once 2 digests carry it — then the slot
     moves into REQUIRED_SECTIONS (#3748 slice 7c). A window with no picture prints one line saying so. -->

## Noise absorbed

<!-- Counts only — the tier that proves the machine eats its own noise.
     e.g. "6 structural PRs auto-merged · 2 gate catches self-corrected · 3 pulse checks, no stance change" -->

-
- <`node scripts/digest-scan.mjs --learning`, verbatim — unlearned incidents are a count here, never a Needs-you item (#4212).>
- <`npm run rank -- --digest` line 1: "Rank since …: N moved up · M retired · K new.">
- <`npm run thrash:scan -- --digest --file` Noise lines, verbatim; its Needs-you lines go above.>

<!-- `npm run rank -- --digest` line 2 goes here, verbatim: the rank snapshot the next digest diffs against. -->
<!-- `npm run thrash:scan -- --digest` marker goes here, verbatim: the thrash scan the next digest's two-scan rule reads. -->

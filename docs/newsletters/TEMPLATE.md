# Weekly newsletter — template

One newsletter per ISO week, archived here as `docs/newsletters/YYYY-Www.md` and posted Sunday at
18:00 CT. The plan is #6872. It sits above the daily digest (`docs/digests/`), which keeps what is
urgent; the newsletter carries what is important but not urgent, and steers the week ahead.

**Who writes what.** `npm run newsletter -- --week YYYY-Www` writes the numbers as one JSON object
(slice N1). A writer turns that JSON into the sections below (slice N2, `/secretary`'s weekly mode,
which also owns this template's lint). The writer never computes a number; a number the JSON reads
as unknown is printed as unknown.

## Sections, in order

1. **Pictures first** — week-over-week trend lines from the series on the `data/newsletter` branch.
2. **Numbers** — the metric set, one line each, every line linking to where it came from.
   **Decisions reaching Eric** (`metrics.decisions`, #6953 slice 4) is a small table of its own:
   each measure with this week's value beside `lastWeek` (read from the series; `null` is "no
   reading", never zero) and its target. The first row, open asks that need him, is the one to
   watch; the rest explain why it moved. `unread` names any read that failed.
3. **Milestones** — closed sub-issues and plan Log lines dated in the week.
4. **Last week's plan, checked** — each commitment from the previous plan block marked done,
   partial or slipped, with the reason, and plan accuracy as a percentage.
5. **Constraints** — the top 3 things binding progress: what each cost this week, and what would
   remove it, asked as named options.
6. **Next week** — 3–7 commitments, each with a done line and its Horizon. Written again,
   machine-readable, in the plan block.
7. **Your part this week** — the human steps due, at most 5 asks, plus how many rolled over,
   and the decisions he holds now: `humanSteps.openAsks` (the count, and the oldest by how long it
   has carried `needs-eric`), from the same selector as the digest's Needs you.
8. **Steering** — up to 3 direction questions with named options.

## The plan block

Every newsletter ends with exactly one plan block: an HTML comment holding one JSON object. GitHub
does not render it, and the next week's run reads it back (`scripts/newsletter/records.mjs` →
`planBlock`). A block that cannot be read is reported as a problem, never as a week with no
commitments.

```html
<!-- newsletter-plan
{
  "week": "2026-W45",
  "commitments": [
    {
      "id": "W45-1",
      "text": "Ship the newsletter's numbers",
      "done": "WHEN 2026-W45's run posts, THEN its numbers match #4153's records for the week",
      "horizon": "Now",
      "issue": 6872
    }
  ],
  "asks": {
    "carried": ["Plan check", "Weekly token split"],
    "rolledOver": [{ "loop": "Brand ideas", "since": "2026-W45" }]
  }
}
-->
```

| Field | Meaning |
|---|---|
| `week` | The week this newsletter covers; its commitments are for the week after. |
| `commitments[].id` | Stable within the week (`W45-1`…), so next week's check can name it. |
| `commitments[].text` | The commitment in plain words. |
| `commitments[].done` | The done line, one EARS sentence: what makes it done. |
| `commitments[].horizon` | Its Horizon on the board (Now · Next · Later), or `null`. |
| `commitments[].issue` | The issue it moves, or `null`. |
| `asks.carried` | The loops whose human step this newsletter asked. |
| `asks.rolledOver` | The asks that did not fit the budget, each with the week it first waited. The next run puts these first. Copy them from the JSON's `humanSteps.rolledOver`. |

Each of `id`, `text` and `done` is required on every commitment. 3–7 commitments is the plan's
range; fewer or more is the writer's call to explain, not a parse failure.

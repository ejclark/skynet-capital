# Discovery write-ups

One file per question a member asked about a sector, market or name no campaign covers
(`<kind>-<subject>[-in-<campaign>].md`), written by the discovery lane
(`.github/workflows/moneypenny-discovery.yml`, orders in `.github/prompts/discovery-research.md`).

A file's existence is what takes its ask off the queue: the dashboard drops an ask whose file is on
`main` (`src/server/discovery-answered.ts`), and the lane skips it. The member's own words are never
written here; the repo is public and the queue keeps them inside the invite gate.

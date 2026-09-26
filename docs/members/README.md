# Members — who uses this app, written down so the design has someone to serve

_The scenarios the redesign's information model is wargamed against (plan: "The Watchtower", slice
0). One file per member; each member's journeys are acceptance tests and a crawl walks them._

## Why "member", not "persona"

"Persona" already means a **trading bot** in this repo (`src/personas/*`, `docs/BOTS.md` — Sauron,
the Day Trader), and "member" is the established plain word for a person who signs in
(`docs/BRAND.md`, `docs/READERS.md`). So the people are **members**, this directory is
`docs/members/`, and nothing here is ever called a persona. No coined names either (CLAUDE.md →
"name what the thing does"): each file is titled by who the member is — the first-timer, the
returning trader, the bot-watcher, the phone-only member, and Eric, the owner.

## The anatomy — seven parts, in this order, in every file

1. **Who** — one paragraph in plain words. For a real member it is drawn ONLY from their own
   recorded words, quoted with the date; every inference is marked
   `_hypothesis — proves it wrong: <a dated, observable event>_`, the way a research call sheet
   carries its falsifier. The file is theirs to edit (below).
2. **What they own** — the fixture participant (or none), rungs earned, accounts, device.
3. **What they are trying to do** — goals, ranked; **needs in their words**.
4. **How they decide** — by outcome or by mechanism; what they read first; what they skip.
5. **What frustrates them** — the dead ends they would hit, each tagged with its number below.
6. **Journeys** — numbered; each step is `goto` · what they see · an **EARS acceptance line**
   (`/ears`: ubiquitous · event · state · unwanted · optional) · the judge line ("can this reader
   tell what to do next in ten seconds?"). The journeys ARE the acceptance tests — see the schema.
7. **Feature seeds** — what this member would want that does not exist, one line each, tagged
   `_(src: <member> · while: <journey step>)_`, routed to `docs/IDEAS.md` or a `feedback` issue.

## The journey file — `e2e/journeys/<member>.journey.json` (schema v1)

The machine-readable twin of `docs/members/<member>.md`. The prose file says what the member sees
and why it matters; the JSON says what a browser can check. They are kept in step by hand: a step
in one is a step in the other, same ids.

```jsonc
{
  "member": "first-timer",                       // matches the docs/members file name
  "source": "docs/members/first-timer.md",
  "fixture": { "kind": "anonymous" },            // or { "kind": "session", "email": "crawl@example.test", "participant": "human-eric" }
                                                 //   a session with no participant = signed in, nothing linked
  "viewports": ["phone", "desktop"],             // phone = 390×844 touch, desktop = 1280×900
  "journeys": [
    { "id": "j1", "name": "the first ten minutes",
      "viewports": ["phone"],                    // optional — a journey may narrow the member's list
      "steps": [
        { "id": "s1", "goto": "/app/leaderboard",
          "only": "desktop",                     // optional — a step that exists at one width only
          "sees": "the league, no cue to onboard",                // plain words, what a human sees
          "ears": "WHEN a signed-in member with no linked account opens /app/leaderboard, the app shall show a visible next step to onboarding.",
          "expect": [ { "role": "link", "name": "Onboarding" } ],   // the EARS outcome, never the defect
          "act": { "click": { "role": "link", "name": "Profile" } },     // optional; performed AFTER expect
          "known_gap": "dead end 1 — lands on the leaderboard with no onboarding cue",  // optional; the step is test.fail() until fixed
          "where": "src/server/auth/oauth-callback.ts:79",             // with known_gap: the ledger's file:line
          "severity": "high", "fix": "S",                               // with known_gap: the ledger's columns (S · M · L)
          "judge": "can this reader tell what to do next in ten seconds?" }
      ] }
  ]
}
```

**`expect` entries** — each one is a Playwright assertion; a step passes only when every entry
holds:

| entry | holds when |
|---|---|
| `{ "url": "/app/trade?symbol=EEM" }` | the path matches exactly and every named query param is present (other params may vary) |
| `{ "text": "Where your money is" }` | visible text contains it (`"exact": true` for a whole match) |
| `{ "role": "link", "name": "Guidance" }` | an accessible element of that role whose name contains it, case-insensitive |
| `{ "testid": "…" }` | `data-testid` |
| `… , "within": "nav.rail"` | scoped to a CSS selector — the desk rail, `main`, never the topbar by accident |
| `… , "href": "/app/accounts"` | (role link) its `href` starts with this — "goes to the right place", not just "exists" |
| `… , "absent": true` | the element is NOT visible — the write control that must not render on someone else's desk |

**`known_gap`** is the ratchet. `e2e/journeys.spec.ts` marks the step `test.fail(true, known_gap)`,
so the suite is green while the gap is real and turns **red the day the gap is fixed** — the fix
then deletes the `known_gap` line and the step guards the fix from then on. The crawl reports the
same event as a `fixed?` row. Never delete a step to make a run green. A known-gap step's expects
assert the OUTCOME its EARS line asks for, never the defect: an expect that requires today's wrong
URL or today's stale copy fails the natural fix too, so the gap reads as open forever and the
ratchet never fires (a promise with no target is `{ "text": "<the promise>", "absent": true }`).

## How the spec and the crawl consume it

- **`e2e/journeys.spec.ts`** reads every journey file at module load: one `describe` per journey ×
  viewport, one `test` per step titled `<id> — <EARS line>`. Only its own config collects it
  (the default `npm run test:e2e` lists it in `testIgnore` — no skipped tests); CI wiring is a
  platter item, because workflow files are protected. The server picks one auth mode per boot, so
  each run collects only the members its boot can serve:
  - session fixtures: `npm run test:e2e:journeys` (OAuth with fake credentials +
    `scripts/crawl/fixtures/owner-links.json`; the spec mints the `skynet_session` cookie with
    `scripts/crawl/mint-session.ts`)
  - anonymous fixtures: `npm run test:e2e:journeys:open` (the OPEN boot)
  Both are `playwright.journeys.config.ts` with `JOURNEYS_MODE` set, both serve a **frozen** copy
  of the offline fixtures (no fill replay — `scripts/crawl/frozen-fixtures.mjs` says why). Run
  them one after the other, never at once, and never with a stale server on 8787 in the other
  mode. A step's `only` and a journey's `viewports` are honoured; everything else the schema says is
  in `scripts/crawl/steps.mjs`, the one executable reading both consumers share.
- **`scripts/crawl/run.mjs`** (`npm run crawl`) walks the same files against the real offline server
  — both boots, sequentially — and per step writes a frame, runs the dead-end probes and the
  contrast pass, and records every expect as pass/fail without stopping. Output:
  `docs/shots/crawl-<date>/<member>/<journey>-<step>-<viewport>.jpg`,
  [`friction-ledger.md`](friction-ledger.md) and [`maps.md`](maps.md). Its README:
  `scripts/crawl/README.md`. The judge line is graded afterwards by a session running
  `docs/grind/journey-judge.instructions.md` over the frames — never by a model call inside the crawl.

## The eight dead ends run 0 must find

Found by reading the code before the crawl existed (the plan, 2026-09-26). Each is pinned as a
`known_gap` on a journey step with its `file:line`; if a run misses one, **the crawl is wrong, not
the app** — fix the probe or the step, never the ledger.

| # | the dead end | where |
|---|---|---|
| 1 | first sign-in lands on `/leaderboard` with no onboarding cue | `src/server/auth/oauth-callback.ts:79` → `app/src/routes/index.tsx:21` |
| 2 | two contradictory gate sentences ("after your first feedback filing" vs "the moment you say hello"); on a gated `/trade` the same sentence three times | `app/src/routes/learn.tsx:61` · `src/domain/progression.ts:159` |
| 3 | `/trade` with no account: "No accounts are linked" with no link; Chart / Chain / Guidance panes say "Pick a symbol on the Ticket…" with no input | `app/src/routes/trade.tsx:727` · `app/src/shell/chain-section.tsx:125` |
| 4 | another member's desk: Close / Close this buy render then fail; New trade goes to `/trade?desk=sauron` which silently switches to your account | `app/src/shell/blotter-row.tsx:290` · `src/server/account-identity-gate.ts:63` · `app/src/routes/trade.tsx:628` |
| 5 | promises with no target: "click a symbol for its fill timeline"; Thesis markers link `#act-<id>` anchors that exist only on `/accounts`; `/u/:id` has no Activity | `app/src/routes/u.$id.index.tsx:92` · `app/src/shell/desk-rail.tsx:33` |
| 6 | the two profile concepts never link: Trade's "← Back to account" goes to the desk; the desk rail always says "← Leaderboard"; `/accounts` never links your own desk | `app/src/routes/trade.tsx:698` · `app/src/shell/desk-rail.tsx:78` |
| 7 | two unrelated "Playbooks" (the Profile chapter with a disabled Arm; R&D's store) | `app/src/routes/playbooks.tsx:41` · `app/src/shell/playbooks-section.tsx:84` |
| 8 | disabled controls whose reason lives only in `title` (Thesis Subscribe, Roll, Arm); "past the guards" with no gloss; docked Trade has no entry to the standalone Chain | `app/src/shell/thesis-drawer.tsx:81` · `app/src/routes/playbooks.tsx:42` · `app/src/shell/decisions-section.tsx:133` |

**Plus one run 0 found that the read-through did not** — **9**: on the offline fixture
`/api/accounts/networth` answers 500 (`h.equity.forEach`, `src/server/networth-api-routes.ts:49`,
when the history read carries no equity series), and the cockpit's whole Overview — standing, the
money strip, the positions blotter — becomes one sentence, "Net worth is unreachable right now."
The route's own header promises "one unreachable account never blanks the rest"; a thrown
`TypeError` escapes that guard. It is pinned as `known_gap` on the cockpit steps of `eric` and
`returning-trader`, and those members reach their guidance through the desk
(`/app/u/human-eric`) until it is fixed. A fix in `src/` is outside slice 0 (add-only).

## How a member edits their own file

The file is the member's, not the app's. Open `docs/members/<you>.md`, change any line in **Who**,
**needs** or **How they decide** to your own words, and add the date. Every sentence there that is
NOT a quote is a guess about you and carries `proves it wrong:` — if the guess is wrong, replace it
with what is true and delete the falsifier; if it is right, leave it and it stays a hypothesis
until you say otherwise. A journey you would never take: delete it (and its twin in the JSON). A
journey you take that is missing: add the steps in plain words and a session turns them into the
JSON. Nothing in these files is read by the running app; they change what gets built next.

**The rule for a real member:** quote, never paraphrase; date every quote; every inference is a
hypothesis with a dated, observable falsifier. A quote keeps the member's words and their order:
spelling slips are corrected silently, anything else — a cut (`…`), two messages joined, list
numbering dropped — is marked. Quote only what the member said to the project (a session, an
issue, a PR); never a private profile or preference text. A member file that states a preference the member
never said, as fact, is a defect.

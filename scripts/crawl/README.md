# The persona crawl — `npm run crawl`

Walks every member journey (`e2e/journeys/*.journey.json`, the twins of `docs/members/*.md`)
against the real offline dashboard, at phone width then desktop, and writes the data the redesign's
bets rest on. Run 0 (2026-09-26) is the baseline of today; every lift re-runs it, and "fewer dead
ends per member than run 0" is the falsifier for "did the redesign plug the gap".

## Run it

```bash
npm run build --prefix app                       # once — the crawl serves app/dist
npm run crawl                                    # everything: both boots, every member, phone + desktop
npm run crawl -- --members eric,phone-only       # a subset
npm run crawl -- --viewports phone --date 2026-09-26
npm run crawl -- --out /tmp/x --ledger /tmp/l.md --maps /tmp/m.md   # a dry run that touches no docs
```

`--port` / `--bridge-port` default to 8787 / 8788 (the dashboard and its insights bridge); pass
others if something is already listening. Runs under `tsx` (it imports `mint-session.ts`).

## What it does, per boot

The server picks ONE auth mode per boot (`playwright.auth.config.ts` says why), so the crawl boots
it twice, one after the other, never at once:

1. **open** — no auth env; every viewer is anonymous and owns nothing. Serves the `anonymous`
   fixtures (the bot-watcher).
2. **session** — OAuth with fake credentials, `SKYNET_ALLOWED_EMAILS=crawl@example.test`, and
   `fixtures/owner-links.json` mapping that email to `human-eric` (the same shape as
   `src/server/owner-link-store.ts`; `fixtures/offline/participants.json` is never touched). The
   crawl mints the `skynet_session` cookie with `mint-session.ts` (`signSession` +
   `e2e-dev-secret`) — the server verifies only the HMAC and the expiry, so a minted cookie IS a
   signed-in member with real gates and real progression. A session fixture with no `participant`
   is a signed-in member who owns nothing (the first-timer).

Never a feedback token: `SKYNET_FEEDBACK_GITHUB_TOKEN` is deleted from the child's env, so nothing
the crawl clicks can file a real issue for Moneypenny to build.

**Both boots serve a frozen copy of the offline fixtures** (`frozen-fixtures.mjs`: the committed
roster copied to a temp dir, no `events.jsonl`, `SKYNET_OFFLINE_FIXTURES` pointed at it). The
plain offline server replays the recorded fill script one tick a second from boot; run 0's second
pass watched Eric's EEM position get closed by the replay between two steps of one journey, so
"the member holds EEM" flipped with the clock. Frozen, a position a journey expects is there on
every step. The cost: Activity shows only the fixture's own orders, never replayed fills.

## What it does, per step

| pass | what | where |
|---|---|---|
| expects | every `expect` entry evaluated, recorded, never stopped on (`known_gap` steps are expected to fail; one that passes is a `fixed?` row) | `steps.mjs` — shared with `e2e/journeys.spec.ts` |
| frame | a JPEG ≤100KB via `scripts/shoot/lib.mjs`'s shooter, quality stepped down until it fits | `run.mjs` → `docs/shots/crawl-<date>/<member>/<journey>-<step>-<viewport>.jpg` |
| dead ends | DOM probes: a disabled control whose reason is only in `title`/`aria-label` · a note that tells you to click/pick/connect with no control in it · a `#hash` link with no target · the same sentence three times · a house term with no gloss · a link the server answers with a 3xx | `probes.mjs` |
| contrast | `@axe-core/playwright`, colour-contrast and control-name rules only (BRAND.md → Accessibility) | `contrast.mjs` |
| act | the step's `act` (a click), after everything above | `steps.mjs` |

Then `ledger.mjs` writes `docs/members/friction-ledger.md` (one row per finding: member ·
journey/step · what · where `file:line` · severity · fix size · judge) and `maps.mjs` writes
`docs/members/maps.md` (one mermaid map per member — the path thick, dead ends as cross-heads).
`locate.mjs` turns a finding's text into a `file:line` by fixed-string grep over `app/src` and
`src`.

## Phone checks — `--phone-audit` and `npm run phone`

Mobile-first is the house discipline on every information surface (CLAUDE.md), so the phone frame
gets four checks of its own (`phone.mjs`), **off by default** — a plain crawl's ledger and maps stay
byte-comparable with run 0:

```bash
npm run crawl -- --phone-audit                   # + docs/members/phone-ledger.md (phone viewport only)
npm run crawl -- --phone-audit --phone-ledger /tmp/p.md
npm run phone -- /app/trade                      # ONE page, ~3s against a built app/dist
npm run phone -- /app/accounts --session         # signed in as the crawl member; --strict exits 1 on high/medium; --all lists the advisory rows
```

| kind | what | severity |
|---|---|---|
| `page-sideways-scroll` | the document is wider than the window (+4px tolerance) | high |
| `overflow` | the outermost element whose content spills past its box with `overflow-x: visible` (the predicate copied from `scripts/layout-resize-scan.mjs`), named by the element inside it that reaches furthest right | medium |
| `tap-target` | a control under 24×24 CSS px — WCAG 2.2 SC 2.5.8 (AA) with its exceptions: a link inside a sentence, a 24px circle on its centre that touches no other control, an unstyled native checkbox/radio; hidden, disabled, ≤1px and off-canvas elements are skipped | medium |
| `tap-target-aaa` | every AA-passing control under 44×44 — SC 2.5.5 (AAA), advisory | low |
| `input-zoom` | a text field, textarea or select under 16px — iPhone Safari zooms the page on focus (`--text-base` is 13px) | medium |

The phone ledger (`phone-ledger.mjs`) has one row per page · finding (page · what · where ·
severity · fix · the members/steps that hit it). Limits: "a link inside a sentence" is `display: inline` inside a
`p`/`li`/`td` carrying at least two other words; the user-agent exception trusts `appearance`, so a
restyled-but-native checkbox counts as native; the overflow culprit is the rightmost descendant,
which can be content clipped inside an inner scroller.

## The judge line is not here

"Can this reader tell what to do next in ten seconds?" is a judgment on a rendered frame. The crawl
makes no model call; every ledger row's judge cell reads `pending (grind)` until a session runs
`docs/grind/journey-judge.instructions.md` over the frames (one grind item per member).

## Honest limits

- **Client-side redirects are invisible to the link probe.** It asks the server (`redirect: manual`);
  a TanStack `redirect()` (e.g. `/u/:id/playbooks` → R&D) answers 200. A journey step's `{url}`
  expect is how those are checked.
- **The promise probe is a word list** (click · tap · pick · choose · connect · link · ask · select)
  over notes, footers and list items with no control inside. It finds dead ends 3 and 5 and will
  also flag honest instructions near a control that lives elsewhere — the judge grades those.
- **The jargon probe is two terms** ("past the guards", "intents"). Extend the list in
  `probes.mjs` when a member file names another.
- **A disabled reason inside a disabled `<fieldset>`** counts as visible if the fieldset's own text
  carries it; a reason only in the button's `title` does not — exactly the phone's view of it.
- **axe runs on the frame as rendered** in dark mode at the crawl's viewport; light mode is not
  swept (BRAND says judge dark first). Only two rule families run; everything else axe knows is a
  different sweep.
- **`where` is a grep.** A string built at runtime (a number, a name interpolated in) does not
  locate and the row reads `—`.
- **A `text` expect takes the first DOM match, visible or not.** `locatorFor(...).first()` then
  waits for THAT element to be visible; at phone width the positions table is `display: none`
  and the cards that replace it come later in the DOM, so `{ "text": "EEM" }` reads "not found"
  on a phone while the card is on screen. A `role` expect skips hidden elements; a phone-only
  step (`"only": "phone"`) names the phone's own control. Preferring the first *visible* match
  would change every step's reading at once — a change for its own run, not a fix inside one.
- **Time.** ~150 steps × (settle + probes + axe) is a coffee, not a CI check; the spec is the gate,
  the crawl is the report. CI wiring for either is a platter item (workflow files are protected).

## Coverage — `npm run crawl:coverage`

Which living screen does a member journey visit at phone width? Eric asked for a comprehensive list
of journeys to drive the mobile-first audit and ruled that dead screens get no phone work, so
"comprehensive" is a count: every living page·section is visited by at least one phone step, or its
triage verdict says nobody needs it. No browser — it reads files:

- **screens** from the code: `app/src/routeTree.gen.ts` (`/u/$id` and `/u/$id/` are one), each
  route's `{ id, label }` section literals (its own file, plus any file it imports that declares a
  `PageSection<…>[] = [` list), Milestones' `?chapter=` values, and the server's own pages
  (hand-listed in `coverage.mjs`, each with the line that serves it, checked every run);
- **verdicts** from [`docs/members/triage.json`](../../docs/members/triage.json) — keep · fold ·
  retire · redirect-only · undecided, hand-maintained; retired and redirect-only rows are never gaps;
- **visits** from the journey files through `steps.mjs`: a step visits the screen its `goto` lands
  on (the route's default section; with no account, `/accounts` opens Milestones on the Onboarding
  chapter; a redirect-only row is followed to its target). Trade's sections count only from phone
  steps — at desktop they dock onto one bench.

```bash
npm run crawl:coverage                 # writes docs/members/coverage.md; prints the headline and the gaps
npm run crawl:coverage -- --json       # the joined rows on stdout, writes nothing
```

It exits 1 when the code has a screen `triage.json` does not (unjudged) or a living verdict names a
screen that is gone (stale) — a new screen cannot slip in unjudged. Limits: only `goto` counts, never
where an `act` click lands; the landing is resolved from the fixture (does this member own an
account?), not by loading the page — the crawl's `{url}` expects are what check the real redirect. A `?section=` is matched against the route's full section list, not the viewer's narrowed one
(a human account has no Heartbeat), and any path outside the SPA tree — `/login`, `/welcome` — counts
as the unknown-URL row until server pages get journey steps of their own.

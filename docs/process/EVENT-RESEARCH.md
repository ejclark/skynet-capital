# Event research — the assessment discipline behind the market-event calendar

The foresight loop: an event lands in the calendar (`src/domain/market-events.ts`, or a print in
`src/domain/earnings-calendar.ts`) → initial research asks *what is likely to happen and how will
the market react* → periodic reassessments hunt new information and adjust the stance — at a
frequency that ramps with impact × time-to-event (`assessment-cadence.json`) — until the
event passes and gets one closing outcome assessment. `scripts/event-scan.mjs` decides *when*;
this doc defines *what* each assessment does. The event router's event-research lane
(`.github/workflows/moneypenny-events.yml`, ticked by every merge to main — registered in docs/ROUTINES.md)
executes it; a human session following this doc by hand is equally valid.

**Adding an event is the trigger — above the floor.** Ship it as an ordinary PR; the scanner's
`never-assessed` rule makes it due on the next cycle (and `.github/workflows/moneypenny-events.yml`
opens an `[event-research] <id>` issue within seconds of the merge). No other ceremony.
**Just-in-time below the floor** (#2946, 2026-09-11): a low/medium-impact event does not buy its
initial session the moment it lands — it waits for its outermost cadence band (low: D-15, medium:
D-31; `EARLY_STANCE_IMPACTS` in `scripts/event-scan.mjs`). Measured because the calendar
self-feeds: 338 initial sessions in 7 days, ~89% for low/medium events whose corridors were still
churning — the initial went stale before the event arrived. High/critical keep the immediate
initial (the stance has positioning value weeks out); below the floor the deterministic screen's
corridor rows carry the event for free until its window, and the initial fires once, when the
corridor has settled.

**One file per event, named by its id.** The calendar is `src/domain/market-events/<id>.json`
(issue #1449) — there is no shared array and no ordering to keep; the loader sorts `(date, id)`
at read time. `node scripts/event-scan.mjs --validate` fails a file whose name is not its `id`
(red inside `npm test`). This replaced a single array literal that put every concurrent research
lane at the same anchor line — 22 of 47 PRs touching it were flagged conflicted at a median 13.4 h
to merge (#1324), and three merge-side fixes could not reach GitHub's server-side merge. An
adjacent event you *propose* is a proposer-owned file (see the adjacency sweep below, #1717).

**Retiring a re-slug: `"supersededBy": "<survivor-id>"`** (issue #3101). Two lanes sweeping on the
same day can each discover one release and file it under a different slug — four duplicate pairs and
one triplet reached the calendar that way, each copy drawing its own 30-day pulse and buying its own
close-out. When you prove your own event is a second name for another entry, add the field **to your
own file** and stop there: the loader drops the entry, and the file, its ledger and its forward-test
fragment stay on disk as the record. Mark, don't delete — the shape every calendar standard uses
(RFC 5545 `STATUS:CANCELLED`) and the only one one-file-per-owner permits.

- **The survivor is the id that keeps researching.** Prefer the `confirmed` copy; between two
  `estimate`s, the one filed first. Your entry must be `estimate` — the survivor owns the
  confirming flip — and the survivor must be a canonical same-date `<id>.json`, never a proposal
  and never itself superseded.
- **Score your forward tests first.** A superseded id never reaches close-out, so an unscored row in
  `docs/research/forward-tests/<id>.md` would be scored by nobody. `--validate` refuses the field
  until the fragment is clean; a test killed *by* this fix is a kill, and the row says which kind.
- **You cannot retire someone else's file.** Found a duplicate you don't own? Note it in your ledger
  and say so on the survivor's issue — the owner's next pulse writes the field. That is one more
  pulse, not thirty.
- **The old `(DUPLICATE of …)` title annotation is replaced by the field.** It retired nothing, and
  it blinded the detector: annotating one pair dropped its title-overlap score from 0.857 to 0.400.
- **`--validate` now warns on same-date title overlap ≥ 45%** (advisory, never red — ISM and S&P
  Global publish near-identical titles on the same day and are genuinely different publishers). A
  warning is a prompt to read two titles, not a verdict; `supersededBy` is the part that binds.
- **Both of those run after the duplicate exists. `--on-date` runs before it does** (#3361) — see
  "Read the date before you propose" in the adjacency sweep below. Retiring a re-slug costs a pulse
  and a forward-test reckoning; not filing it costs one command.

## The four assessment modes (keyed to the scanner's `reason` field)

### `never-assessed` → initial research

Produce `docs/research/events/<id>.md` from `docs/research/events/TEMPLATE.md`. The genre is
[`nvda-aug-2026-print.md`](../research/nvda-aug-2026-print.md): the question stated plainly →
one-line verdict → method → each conviction leg tested to SUPPORTED / MIXED / REFUTED with
sources and dates → what plays the conditions support → honest limits. End with a stance, its
kill switches, and the first ledger row. Open with an `## At a glance` decision header (TL;DR +
horizon table + signal conditions) — the `/research` page promotes it above the document; it is a
faithful surfacing of the stance below, never a new claim (see the TEMPLATE). Instruments by kind:

- **earnings / symbol-keyed** — `node scripts/research/earnings-cycle.mjs <SYM> --bench QQQ
  --peers <PEERS>` + `node scripts/research/intraday-edges.mjs <SYM>`, read against the house
  playbooks (S1/S2/E1/S3/S4 + G1) and the kill list in
  [`multi-symbol-sweep.md`](../research/multi-symbol-sweep.md) — never re-propose a killed
  hypothesis without new prints. For a full workup, the `symbol-sweep` workflow adds the
  red-team pass.
- **macro-print / sector / geopolitical** — sourced web research (primary sources over
  aggregators; the seeding of this calendar caught an aggregator publishing a wrong CPI date —
  cite the primary and the check date). Establish: consensus expectation, the whisper if
  findable, the market's recent reaction function to surprises in each direction, and which of
  our tracked names carry the most sensitivity.

### `interval-elapsed` → pulse check

Append **one** row to the ledger table and update the `**Last assessed:**` line. A pulse check
answers: *what changed since the last row, and does the stance survive it?* Every row runs the
**adjacency sweep** — the checklist below — because adjacent events are exactly the new
information Eric's brief calls out. Keep rows terse; a stance *change* earns a sentence in the
Stance section with the row as its receipt.

**Adjacency sweep (mandatory, every pulse):**

1. **Peer prints** — did a peer report or move guidance since the last row? (Measured to matter:
   NVDA-sympathy gaps supplied ~70% of MRVL's pre-print window return.)
2. **Macro surprises** — CPI/FOMC/jobs prints since the last row, and the market's actual
   reaction vs expected.
3. **Volatility regime** — VIX level/term structure vs the last row; a regime shift changes what
   any options-shaped play costs. (No date → not a calendar event; it lives here.)
4. **Geopolitical / policy** — export controls, tariffs, conflicts touching the event's symbols
   or their supply chains.
5. **Event-specific tape** — consensus drift, whisper moves, implied-move changes, unusual
   positioning commentary.

**Read the date before you propose: `node scripts/event-scan.mjs --on-date=YYYY-MM-DD`** (issue
#3361). It prints every entry already on that date — canonical, standing proposal, derived print,
and retired re-slugs marked `✗ … [RETIRED — superseded by <id>]` so you can see a slug that was
already tried. If your discovery is one of them, file nothing. **Run this instead of searching the
calendar for your own words for the release**: the failure this exists to prevent was one sweep
searching for "U.S. IIP" and filing a third copy of BEA's *"International Transactions and
Investment Position"* — not a substring, so the search found nothing that was plainly there. A date
you already hold has no false-negative rate; a search string you invented does. Reading nine titles
costs seconds. (Same-date only, deliberately: D±1 scores 14 near-title pairs over the committed
calendar and none is a re-slug — nine are Treasury auctions running a different tenor each day. The
falsifier is the first confirmed same-release re-slug whose entries carry different dates.)

Any adjacent event with a **date** discovered during the sweep is PROPOSED as a new file
`src/domain/market-events/proposals/<id>.from-<your-event-id>.json` **in the same PR**, always
`status: "estimate"` (`EST:`/`NEWS:` source) — never `confirmed` without a primary source. That
proposal is how the calendar feeds itself. **One file per owner** (issues #1449, #1717): your own
event's amendments (a status flip, a source, a notes update) go in
`src/domain/market-events/<your-event-id>.json` and nowhere else; a proposal is a brand-new file
that *you* own, named by the event it proposes and by you, so two sweeps discovering the same
event on the same day never create the same path (that add/add was the last conflict class left
after #1449 — 5 of the first 126 post-split PRs). The loader and the scanner prefer the canonical
`<id>.json` when it exists and otherwise stand in the first proposal by file name;
`node scripts/event-scan.mjs --validate` fails a misnamed proposal, a non-`estimate` one, or a
proposer that is not an event this calendar knows, and warns on competing or shadowed proposals.
Never write another event's canonical file, and never delete another lane's proposal. There is no
shared array to insert into and no ordering rule to satisfy.

**When your own event was proposed by others** (`never-assessed` initial research on an id that
exists only as `proposals/<your-id>.from-*.json`): read every proposal for your id first — each is
a sibling lane's finding — then write the canonical `src/domain/market-events/<your-id>.json`
yourself. The proposals become inert (the canonical file shadows them) and stay where they are.

**Not every `interval-elapsed` pulse reaches a session** — see "Deterministic screening" below.

### `event-passed-unscored` → close-out

Fill the ledger's `## Outcome` section within the close-out window (`closeOutWithinDays`): what
actually happened vs the stance, scored **from re-run instrument data, never from memory of the
tape**. Score any forward tests this event carried — its own fragment
[`forward-tests/<event-id>.md`](../research/forward-tests.md) (fill the Outcome cell; a scored
kill moves to the sweep doc's kill list), plus any legacy `FT-N` row about this event in
`forward-tests/legacy.md`. Once `## Outcome` exists the scanner goes silent on the event — with
exactly one door back in: a registered forward test whose `Score by` has since arrived re-opens it
as `forward-test-due` (#2884, the mode below). The assessment is closed for good; the *register*
is not.

**A close-out waits for its own predictions** (issue #2988, 2026-09-15). The scanner marks a passed
event `event-passed-unscored` from D+1 and a close-out is never screened — but scoring a prediction
before its stated window closes is falsification, so a session dispatched before the event's own
forward tests are scoreable can only re-read state and leave. Measured on `gastech-2026-09-14`:
**three dispatches in 38 minutes**, no new information available to any of them, because each
research PR's own merge re-triggered the push-driven sweep and the `research/<event-id>` branch key
only dedupes while that PR is still *open*. `scripts/event-scan.mjs` now reads the event's own
fragment (`scripts/forward-test-pending.mjs` — pure text, no network, no `npm ci`) and **holds the
close-out until the latest unscored score-by**, reporting `close-out-held-for-forward-test` with
that date on the human report. The wait is **clamped to `closeOutWithinDays`**: a test scoring after
the ceiling is a *structural* conflict, not a timing one — the event would age out of its close-out
window entirely — so the scanner dispatches immediately and names the test in `--due`'s
`forwardTestsBeyondWindow`, and the session records those rows unscoreable at close-out on purpose,
exactly as before. An unreadable row, a missing fragment, or an already-scored row all behave
exactly as they did: **every ambiguity resolves toward dispatching**, because a wrong hold loses an
outcome record permanently while a wrong dispatch only costs a session. Legacy `FT-N` rows in
`forward-tests/legacy.md` are *not* consulted — legacy ids carry no event namespace to match on.

**Registering a forward test** (initial research, or a stance change mid-run) appends one row to
`docs/research/forward-tests/<event-id>.md` — this event's own fragment, id `FT-<event-id>-<n>`
with `<n>` counting up inside that file only. Never a row in `forward-tests.md` itself (the index
carries no rows and `npm test` fails one), never another event's file. The full recipe is the
index's "How to register". **Register the score-by date the hypothesis actually needs** — a rates
or next-print test is honestly weeks out, and a date past this event's close-out window is no
longer a dead end (see the next mode). Never shorten a score-by to fit the window; that is
falsification pressure, and it is the reason #2884 is not a registration gate.

### `forward-test-due` → score one registered prediction, after the close-out (#2884)

**Closing is not resolving.** The close-out above writes `## Outcome` and the scanner goes quiet —
but a forward test is deliberately allowed to key on data that does not exist yet, and about a
quarter of honest registrations score *past* `closeOutWithinDays`. Those rows used to have no
second net at all (`scripts/forward-test-id-scan.mjs` reads ids, never the `Score by` column), so
they sat `_open_` forever while being cited in stance notes as predictions that would settle.
Measured 2026-09-20: **21 events · 31 rows** permanently orphaned that way, 6 of them already
decided by the tape and unrecorded, and the number only ever went up. The separation is the one
every forecasting platform already makes — Good Judgment Open resolves on when events occurred,
Manifold's close halts trading while "nothing is finalised" until resolution, Registered Reports
score at Stage 2 after the data exist.

So `scripts/event-scan.mjs` re-dispatches **the same owning lane** — never a second writer to a
file this doc says has exactly one — when a closed-out event's fragment still carries an unscored
row whose `scoreBy` has arrived. `--due` names the rows in `forwardTestsDue`; your assigned event
id is all the matrix forwards, so **re-read your own fragment** and act on every row that is
unscored and past its date.

**Your job in this mode is narrow.** Score those rows from re-run instrument data, never from
memory of the tape, exactly as a close-out does. Do **not** re-open the assessment, do not rewrite
`## Outcome`, do not edit any registered prediction — append-only still holds, and the Outcome
cell is the only cell you fill. A short note appended under `## Outcome` recording what was scored
and when is welcome; a second verdict on the event is not.

**The terminal-verdict rule — the reason this cannot loop.** A row you were dispatched for leaves
your session carrying one of exactly four things, and **never `_open_`**:

| Verdict | When |
| --- | --- |
| `**pass**` / `**kill**` | The data exists and the hypothesis settled. A scored kill also moves to the sweep doc's kill list. |
| `**VOID** — the reason` | The row can no longer be judged as registered (the setup never occurred, the anchor was wrong at registration). |
| `**unscoreable** — where the data will be` | The source is gone, paywalled, or was never published. Name where a human would look; that pointer *is* the record. |

The scanner treats *any* non-open cell as scored, so all four end the re-dispatch by construction.
Leaving the row `_open_` sends the same session back on the next tick — which is the intended
pressure, not a bug. If a row genuinely needs a later date than it was registered with, write
`unscoreable — settles <date>, <source>` rather than editing the `Score by` cell.

## Deterministic screening (issue #724) — not every due pulse spends a session

`scripts/event-scan.mjs` decides **when** a pulse is due; `scripts/event-material-scan.mjs`
decides **whether it needs a Claude session at all**, for `interval-elapsed` pulses only (a
`never-assessed` initial research and an `event-passed-unscored` close-out are never screened —
both always dispatch, same as before this existed). It runs between the two in
`.github/workflows/moneypenny-events.yml`'s `route` job: a screen writes its own ledger row and commits
it directly, without spending a session; anything else falls through to the full pulse-check
protocol above, unchanged.

**The reference block.** Every ledger's header carries a machine-readable line right after
`**Last assessed:**`:

```
<!-- probe-ref: {"symbols":{"NVDA":182.43},"vix":15.2,"daysBand":"critical:8+","adjacentIds":[],"adjacentStrongIds":[],"screenStreak":0} -->
```

This is the probe's one source of truth for "what did we see last time" — embedded in the ledger
itself (not a sidecar file), because the ledger is already this system's single source of truth
per event. It is **replaced in place** on every pulse (screen or full session), never appended —
distinct from the assessment ledger table, which stays strictly append-only. `TEMPLATE.md` shows
where it goes; **initial research must populate it with real readings**, or the event's first
`interval-elapsed` pulse has nothing to diff against and is automatically material (the safe
default — see below) rather than a wasted "establish the baseline" session.

**What counts as material** (the defaults `scripts/event-material-decide.mjs` ships with, chosen
because Eric approved "use the proposed defaults" before a concrete one existed — full reasoning
in that file's header):

| Check | Default | Why this number |
|---|---|---|
| Underlying price move | ≥ 5% since the last recorded price, per tracked symbol | past ordinary daily noise for this calendar's names; peers are NOT probed (v1 simplification — a full session's adjacency sweep still checks them by hand) |
| VIX regime | ≥ 3 points absolute since the last recorded reading | this calendar's own ledgers already treat a few-point VIX move as regime-relevant |
| Cadence band transition | any change in the matched `assessment-cadence.json` band | a tightening/loosening interval is itself information worth a real look |
| New adjacent event | a **confirmed, high/critical-impact** calendar entry within 5 days of this event's date not seen in the last pulse's `adjacentStrongIds` | the same "corridor" framing the adjacency sweep already uses by hand — filtered (#2946): at 446 events a corridor averages ~30 adjacents but ~3 strong ones, so the unfiltered rule tripped on the calendar's own churn (5 screens in 13 days). Weaker adjacents are **named in the screen row** (recorded, not assessed), not paid for |
| Staleness ceiling | every 3rd consecutive screen is forced material regardless of readings | an event can never coast on screens forever; a real session re-establishes the baseline at least that often |
| No reference block | always material (`no-reference-baseline`) | nothing to diff against — the safe default, never a guess |
| Probe fetch failure | always material (loud failure) | "broken ≠ quiet" — the same doctrine `event-scan.mjs` already enforces |

**The honesty invariant.** A screened row is a mechanical check, never a verdict — it is worded
`**Deterministic screen (no Claude session).**` followed by the raw readings and "nothing tracked
crossed its threshold," and its Stance-change column reads `— (screen; no assessment made)`. It
must never be worded to imply "no change" or any other conclusion an actual assessment would
draw — see CLAUDE.md's domain-accuracy-and-honesty principle. `scripts/event-material-scan.mjs`'s
own header and `tests/scripts/event-material-scan.spec.ts` enforce this wording mechanically.

## The weekly study genre (issue #1716) — what *the week* is, in one place

A ledger answers "what about this event?"; nothing answered "what about this week?" — the question
Eric's brief put plainly (#1704, item 3.1.2: *"understanding sentiment for the week… enables me to
more intelligently exit before a dip, or hold a position"*). `docs/research/weeks/<ISO-week>.md` is
that answer, and it is composed, not written:

```
npm run research:week                     # the market week of today (a Sunday resolves forward)
npm run research:week -- --week 2026-W37  # a named ISO week
npm run research:week -- --stdout         # print it, write nothing
```

**Why a script and not a session.** The brief asked for a lane to author the doc each Sunday, and in
the same breath forbade it from generating anything: *"aggregate, never generate sentiment… no
LLM-written 'mood'."* Those settle together on the precedent already in this file — a **deterministic
screen** writes its own ledger row and commits it *without spending a session*, precisely so a
mechanical check can never be worded as a verdict. A weekly study is the same shape of work: a join
over documents that already exist. `src/research/week-study.ts` composes it; `npm run research:week`
runs it; a cron is then one line, not a session.

**What the document contains** — and what each part is allowed to be:

| Section | Contents | Where every value comes from |
|---|---|---|
| `## The call — what to do, by name` | TL;DR, one row per tracked name (call · confidence · why · dated falsifier), then **Signals & conditions** | the nearest in-range ledger for that name, quoted; the signals name the week's critical/high market-wide ledgers rather than restating their calls |
| `## The week's board` | every researched event dated in range, in date order, with its authored `This week` row | one row per ledger, verbatim |
| `### Hub events` | the corridor's most-named event ids, with counts | probe-ref `adjacentIds` degrees — the same count `app/src/live/call-mix.ts`'s `hubEvents` runs for the board |
| `## How this study was composed` | the receipt | the composer itself |

**The four rules that keep the genre honest:**

1. **No claim a cited ledger does not carry.** Every Call/Why/falsifier cell is a quote with its
   ledger linked. The composer's only arithmetic is counting documents it can name.
2. **A name with no ledger in range reads "no researched event this week."** Absence is stated, never
   filled in.
3. **Under three researched events in range, no document is written** — the composer says so on
   stdout and exits 0. A quiet week is an answer.
4. **A closed week is append-only.** The composer refuses to overwrite a past week's file without
   `--force`, which is reserved for a correction to the underlying ledgers.

**The mix stays on the board.** The four-class call mix (`stand-aside`/`watch`/`act`/`conditional`)
lives in `app/src/live/call-mix.ts` and already drives `/research`'s week lens; the study reports the
authored **confidence** distribution instead, which needs no classification at all. Two copies of one
classifier would be two owners of one judgment.

**Scope, for now.** Month and quarter genres are deliberately out of scope until the weekly one has
run four times. The weekly study registers no forward tests of its own — the ledgers it cites already
carry theirs.

### The cadence — the one step that is Eric's (`next-slice`, #1716)

The genre is complete and runs on demand; nothing yet runs it unattended. That last step edits
`.github/workflows/moneypenny-events.yml`, an `envelope.json`-protected path (*a lane that can edit
its own trigger has no envelope at all*), so it is his to land — it boards the platter as one item
rather than sitting as its own held PR. There is no decision left in it, only a protected file.

**The mechanism moved, and the reason is on the record.** The brief named a *Sunday 12:00 ET cron*.
This repo has a standing directive against exactly that — Eric, 2026-08-19: *"cron jobs are generally
terrible … focus on event driven architecture"*, codified in `docs/ROUTINES.md` and written into
`moneypenny-events.yml`'s own trigger block (*"EVERY MERGE TO MAIN IS THE TICK — no cron"*), after a
generation of Routines fired ~130 times into sessions with no checkout and produced nothing. The
outcome the brief asked for — the week's call sheet standing current without anyone running a
command — is untouched; only the clock changes. The composer is already the right shape for the
merge tick, and the wrong shape for a cron:

- **It is level-based.** It re-reads the ledger set from scratch every run, so any push reconciles
  the open week — including whatever a missed tick would have skipped. A Sunday cron composes the
  week *once*, from the ledgers that happened to exist on Sunday, and never picks up the ones that
  land on Tuesday.
- **It is idempotent, so the chain terminates.** Recomposed twice in a day it emits identical bytes;
  across days only `**Last assessed:**` moves. A tick with no ledger change produces no diff, so no
  PR, so no further tick.
- **It already refuses the unsafe case.** A closed week is append-only without `--force`, and a week
  under three researched events writes nothing and exits 0 — the job needs no conditional logic.

**The step, paste-ready.** A new job in `.github/workflows/moneypenny-events.yml`, alongside `route`.
It is its own job rather than a step inside `route` because `route` installs no dependencies and the
composer needs `tsx`; keeping it separate leaves `route`'s fast path fast. Research docs land via a
PR, never a direct push to `main` (#915, Eric 2026-08-30: *"some merge to main, open PRs for
research; non-negotiable"*).

```yaml
  # THE WEEKLY STUDY (#1716) — the market week's own call sheet, composed from the ledgers already
  # on the shelf. Rides the merge tick like everything else in this file (docs/ROUTINES.md:
  # event-driven first, no crons): the composer is level-based, idempotent, skips a week under
  # three researched events, and refuses to overwrite a week that has closed — so a push
  # reconciles the open week and a quiet repo simply leaves the standing file alone.
  week-study:
    name: weekly study
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc   # .nvmrc is the single source of truth for CI — never pin here

      - name: Restore npm cache
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            npm-${{ runner.os }}-

      - run: npm ci

      - name: Compose the open week's study, and open a PR if it moved
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          set -euo pipefail
          npm run research:week
          if [ -z "$(git status --porcelain -- docs/research/weeks/)" ]; then
            echo "::notice::weekly study unchanged — nothing to open."
            exit 0
          fi
          # `Last assessed:` moves every calendar day on its own. One changed line either way is
          # only that date; anything more means a ledger in range actually changed.
          if [ "$(git diff -U0 -- docs/research/weeks/ | grep -c '^[+-][^+-]')" -le 2 ]; then
            git checkout -- docs/research/weeks/
            echo "::notice::weekly study — only the assessed-on date moved; no PR opened."
            exit 0
          fi
          BRANCH="moneypenny/week-study-${{ github.run_id }}"
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git checkout -b "$BRANCH"
          git add docs/research/weeks
          git commit -m "docs(research): recompose the open week's study from the ledgers in range"
          git push origin "$BRANCH"
          gh pr create --base main --head "$BRANCH" \
            --title "docs(research): recompose the open week's study from the ledgers in range" \
            --body "Composed by \`npm run research:week\` on the merge tick. Every cell is a ledger's own \`This week\` row, quoted — this study makes no call of its own. Contract: docs/process/EVENT-RESEARCH.md → *The weekly study genre*."
          gh pr merge --squash --auto "$BRANCH"
```

If he would rather have the literal Sunday clock the brief named, the same job takes
`on: schedule: - cron: "0 16 * * 0"` (12:00 ET during EDT; 17:00 UTC once EST starts — a fixed cron
cannot follow the offset, which is a third reason the tick is the better shape here). It would be
the only cron in the repo, and it would compose each week from Sunday's ledger set alone.

## The decision header is gated (`npm run research:lint`)

The gate reads **both** `docs/research/events/` and `docs/research/weeks/` — one contract, one eye.
A weekly study's call sheet keys by name rather than by horizon, so the four-horizon rule does not
apply to it (the lint already skips that check for a by-name table) and its advisory header budget is
wider, because a by-name sheet grows with the roster rather than with an author's prose.

A ledger without a usable call sheet fails the gate. `docs/ISSUES.md` measured why this is needed:
*"the PR surface got a template, a guide and a gate; the issue surface got none of the three, and
the numbers track that difference and nothing else."* Ledgers had the template and this guide, and
15 of 52 still carried no decision header — so the `/research` page had nothing to promote and a
reader landed on the method wall. The gate is the third thing.

What it checks, and what it deliberately does not:

| Gated (fails) | Advisory (a note) |
|---|---|
| the `# `/`**Kind:**`/`**Last assessed:**` header lines | a decision header past ~2,400 chars |
| an `## At a glance` (or study `## The call`) section exists | a signal bullet past 160 chars |
| a **TL;DR.** paragraph and a **Signals & conditions** list | a falsifier naming no date or number |
| a table with `Call` · `Confidence` · `Proves it wrong` columns | an assessment row past ~1,200 chars |
| all four horizons present, each with a graded, non-empty call | |
| an earnings ledger's `**Buy signal:**` bullet, yes or no — the line position guidance reads | |

Structure fails; prose length only informs. That split is on purpose — `docs/IDEAS.md` banks the
caution to *measure whether long entries actually hurt before gating a capture surface, and never
tax the habit*. The habit here is assessment; what gets taxed is a missing decision, not a long one.

`node scripts/research-lint.mjs --candidate` names the single highest-leverage ledger to fix, the
same way the other fitness eyes name their own targets. The budget in `research-budget.json` only
ratchets down.

**Reading is the renderer's job, not the author's.** `/research` folds `## Initial research`, the
`## Assessment ledger` and `## Outcome` into `<details>`, leaving the decision header and the live
stance open. So a document nobody has rewritten still opens on its call — and nothing is hidden from
the next assessment session, which reads the raw markdown where a fold costs it nothing.

## Cache discipline (the stale-data trap)

`earnings-cycle.mjs` and `intraday-edges.mjs` cache **permanently** under `node_modules/.cache/`.
A recurring pulse check that re-runs them without busting the cache reads week-old data and looks
fresh. **Before any assessment-driven instrument re-run:**

```
rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges
```

## Honesty rules (inherited, non-negotiable)

- **Research is not action.** An `estimate` event still gets researched; but every
  trading-adjacent statement in a ledger carries the event's confirmed/estimate label, and
  date-keyed *action* requires `confirmed` (the date policy,
  [`trade-playbooks.md`](../plans/trade-playbooks.md) decision log).
- **Ledger rows are append-only.** Editing a past row or a registered prediction after the fact
  is falsification and never happens (the forward-tests rule, verbatim).
- **Estimates only widen caution.** A cadence estimate may pull an assessment earlier or extend a
  flat window; it never licenses an entry.
- **Source prefixes are the audit trail** — see the header of `market-events.ts`. `--validate`
  enforces them in CI.
- **Blocked sources are recorded, never substituted silently.** When a fetch of a cited source
  fails — egress block, 403, 5xx — the ledger's `probe-ref.blocked` array gets a
  `{"url", "status", "at"}` entry (`TEMPLATE.md`) and the source prefix downgrades to the
  secondary's actually used (`NYSE:` → `NEWS:`), never staying the primary's; the row or stance
  text that cites the fallback states it and dates it. Two blind spots are known today: the remote
  Claude Code session's egress proxy blocks exchange/industry-body domains (nyse.com, sifma.org,
  nasdaqtrader.com) outright, and the GitHub Actions event-research lane meets 403s on bls.gov from
  plain fetchers without browser headers — see [`ppi-2026-11-13.md`](../research/events/ppi-2026-11-13.md)
  around line 60.

# Ideas & Backlog

The durable home for ideas so they leave the working context but never get lost. Eric injects
thoughts freely; Claude routes each one here (see the routing convention in
[`CLAUDE.md`](../CLAUDE.md)). The in-session task list is the *working subset* pulled from this file;
this file is the permanent record (the session environment is ephemeral — uncommitted notes die with
it).

**Format:** newest ideas at the top of _Inbox_. When one is picked up, move it to _In progress_, and
to _Shipped_ (with the PR#) when done. Keep entries one or two lines — enough to reconstruct intent.

**Attribution:** every idea records its source and the proximity that exposed it —
`_(src: Eric | Claude · while: <context>)_`. Eric-sourced entries are intent; Claude-sourced ones
(_Side quests_ below) are proposals to prune. Items without a tag predate this convention and are
Eric-sourced.

---

## Inbox (captured, not yet started)

### The CI medic can be cancelled before it files

The 2026-08-22 `gh --json` failure produced a medic run that was **cancelled** by the next push's
medic run (concurrency group is per watched-workflow name, `cancel-in-progress: false` — but the
queued run was superseded). A failure that never gets filed is the exact silence the lane exists to
break. Options: key the concurrency group by the failed run id rather than the workflow name, or
have the medic re-scan recent failed runs on each firing rather than only the one that woke it.
_(src: Claude · while: fixing the postmaster's gh field name)_

### Scripted file edits need an anchor-order assertion

`s[:start] + s[end:]` silently duplicates a region when `end < start`, which is what took the
postmaster down on 2026-08-22 (the anchor matched an earlier, identical step shape). Any scripted
edit that computes two offsets should assert their order, and any workflow edit should be diffed
against the last-good file before it is pushed — `git diff <last-good-sha> -- <file>` showed the
duplication instantly once someone looked. _(src: Claude · while: fixing the outage it caused)_

### A claim lease has no release-on-failure path

A build lane takes `claim/feedback-<n>` and then dies (the 2026-08-22 bash failure did exactly
this). The lease is correct — it stops double-builds — but nothing releases it when the job that
holds it fails, so the issue reads as claimed-and-building for the full 2h TTL and re-labelling does
nothing until it expires. Options: an `if: failure()` step that calls `releaseClaim`, or the CI
Medic releasing the lease named in the failed run. Cheap either way; the TTL already bounds the
damage. _(src: Claude · while: fixing the feedback-lane tier failure and building the medic)_

### Boot-time quarantine for a store row that collides with the roster
The owner-link PR (#466) closed the write-time hole (`addParticipant` now refuses an id already
claimed by an env-configured account), but a row written *before* that fix shipped — none should
exist, since this deployment never ran the vulnerable code — would still resolve trades onto the
roster account's real credentials, since `resolveOwnerId`/`findParticipant` don't re-check at
boot. Cheap defense-in-depth: at startup, flag any store id that collides with `envRoster` and
refuse to serve it rather than trusting the write-time guard alone. _(src: Claude · while: #466
owner-link security review, red-team verification pass, 2026-08-21)_

### Retire the display-name rename guard now that ownerEmail is the real link
`account-service.ts`'s `profileEditRefusal` still requires a human rename to match the session's
sign-in name/email local-part — a rule that existed only because `resolveCurrentId` used to
resolve by display name. Now that `Participant.ownerEmail` is the actual (immutable) link, the
rule is stricter than needed and blocks legitimate renames for no security reason. Loosen it in a
follow-up UX pass, not in the owner-link security PR itself. _(src: Claude · while: #466 owner-link
security review, 2026-08-21)_

### Intent-vs-outcome scoring → per-strategy confidence ratings
Hardcore research mode now records a forward `expectation` on every intent (alongside `strategy`),
and the durable activity ledger records what actually happened. Join them: score each closed trade's
outcome against its stated expectation, aggregate per strategy tag, and the confidence ratings Eric
named as the goal ("build confidence ratings … that drive larger profit margins") fall out — the
ratings then gate sizing (small while unproven, scaling with demonstrated edge). The data collection
side ships with hardcore mode; this is the read side. _(src: Eric ("this will enable us to build
confidence ratings in the future") · while: hardcore research mode build, 2026-08-20)_

### Real-browser smoke of the critical funnels in CI
The feedback front door shipped dead (2026-08-21 lesson) with every unit spec green — wiring-time
bugs are invisible to string-level specs. A tiny Playwright pass (login renders; /feedback coach
click produces a visible response; Send path reachable) run in `verify` or post-deploy would catch
the class. Weigh runner cost vs. the funnel's importance. _(src: Claude · while: feedback front-door
regression fix, 2026-08-21)_

### In-app "what's new" member feed built from PR pictures
Extract `## The picture` + Summary from `main`'s squash bodies into a member-facing changelog route —
the engagement flywheel (non-technical friends following along) and the first real consumer of the
Machine-context tier. A taste surface: needs a plan draft and Eric's flip, never smuggled into a
process PR. _(src: Claude · while: hat-team comms research, 2026-08-20)_

### Eric-comment reaction-capture lane (postmaster, second wave)
Route Eric's PR/issue comments through the act/park/profile/question classifier via a postmaster lane
(`issue_comment` from OWNER — real-identity events do fire webhooks; emoji reactions don't, so those
poll on the digest tick instead). Highest-grade landing signal there is; build after the checkbody
gate + digest delivery prove out. Workflow-file carve-out. _(src: Claude · while: hat-team comms
research, 2026-08-20)_

### Digest picture slot — ratchet in only after the digest loop is proven live
Add `## The picture` to `docs/digests/TEMPLATE.md` + `digest-scan` REQUIRED_SECTIONS once 2–3 digests
have actually shipped on cadence (the instrument has fired once ever; decorating a dead instrument
decorates an empty room). The digest picture = `## The picture` blocks harvested from squash bodies
via local git log. _(src: Claude · while: hat-team comms research, 2026-08-20)_

### Long-session journey nudge from duel-log telemetry
Teach `scripts/duel-log.mjs` (or the postmaster audit) a heuristic: a session with many turns and no
code diff is a journey candidate — nudge, never auto-write. Complements the orient-time trigger that
shipped with the comms-research PR. _(src: Claude · while: hat-team comms research, 2026-08-20)_

### IDEAS.md entries have the same wall-of-text disease as Summary bullets had
This file says "one or two lines — enough to reconstruct intent"; recent entries run 10+. Same cure
family as the ≤120-char bullet gate — but measure first whether long entries actually hurt retrieval
before gating a capture surface (the journey lesson: never tax the habit). _(src: Claude · while:
hat-team comms research, 2026-08-20)_

### Options-mechanics event kinds — OPEX, quad witching, VIX expiration, holidays
The `/research` shelf's event horizon renders the curated feed (folded from the old `/calendar`
view, 2026-08-25); the mechanical dates options traders also watch are
all rule-computable offline: monthly OPEX = 3rd Friday (holiday → prior Thursday), quad witching =
Mar/Jun/Sep/Dec subset, VIX expiration = the Wednesday 30 days before the *next* monthly OPEX, NYSE
holidays/early closes published 3 years out. A pure `expiration-calendar.ts` generator (verifiable
against Cboe's annual PDF) would feed these in as new `EventKind`s — which also means extending
`event-scan.mjs --validate`'s kind/source rules, so it's a domain slice, not a view tweak. Known
edge case worth a unit test: Juneteenth (obs) Fri 2027-06-18 collides with June quad witching →
expiration moves to Thu 2027-06-17. Also cheap to seed from published schedules: NFP (first-Friday
rule breaks 3× in 2026 — use the BLS schedule), PPI, PCE; BLS offers no-key iCal feeds as a later
refresh path. _(src: Claude · while: calendar-view integration research, 2026-08-16)_

### Google Finance as an A2A research source — analyst data now, Ask-AI interrogation next
Google Finance's beta surfaces per-symbol analyst ratings, 12-month price targets, and an
AI panel ("Ask AI", Deep Search, auto-generated insights). Eric's read: prompting Google's
finance-grounded AI agent-to-agent has a very high value ceiling. **Spike findings (2026-08-15):**
(1) the analyst block is server-rendered and reachable **unauthenticated** — plain curl through
the egress proxy returned CRWV's full panel (24 analysts, Buy 17/Hold 6/Sell 1, targets
$74/$136.48/$176) with no Google login, so v1 needs none of Eric's credentials; (2) the Ask-AI
textarea exists signed-out but needs a JS browser — blocked in this container by a
Chromium↔egress-proxy TLS wrinkle (curl works; Chromium gets ERR_CONNECTION_RESET; NSS trust
per /root/.ccr/README.md is the likely fix), solvable config not concept-failure; (3) HTML
parsing is brittle — build with the loud-failure discipline (confirm-print-dates precedent).
**Build sequence:** ① a new `analyst-scan` instrument under scripts/research — curl+parse for
ratings/targets per symbol, feeding event-ledger pulse checks and the adjacency sweep (also a
second confirmation source for print dates); ② fix headless-browser proxy trust; ③ the A2A
skill — structured question templates into Ask-AI, answers white-team-validated against Alpaca's
official API (the app's existing data seam) before any ledger cites them; ④ only if signed-out
AI proves limited: revisit authed access — **flagged trade-off, Eric's call**: an agent driving
his logged-in Google session is credential-adjacent (irreversible class), and v1 deliberately
avoids it. _(src: Eric ("A2A style process… my gut tells me this has a very high ceiling") ·
while: post-enablement, 2026-08-15)_

### The fill window is 15 orders — History and Analysis are honest but shallow
The desk reconstructs round trips from `getRecentOrders(limit=15)`, which is the entire fill window
we hold. The views say so out loud (`truncated` → "history begins mid-trade"), but an active account
blows through 15 orders in days, and the trade-analysis stats are only as good as the window behind
them. Two moves: pull deeper (~200) on the desk tabs only, or record fills durably as they stream
through `trade_updates` — the second doubles as the per-fill ledger the metrics-layer plan's Tier 2
is blocked on, and as the entry record `plans/trade-insights-loop.md` wants at close. _(src: Claude ·
while: building the player desk's History/Analysis tabs, 2026-08-13)_

### Limit orders as the educational default on the desk ticket
The desk ticket is market-only. Every "how not to get hurt" lesson in options and equities starts
with *don't send a naked market order into a thin book* — so the teaching-correct default may be a
limit price pre-filled at the mark, with market as the deliberate opt-out. Small UI change, real
pedagogy, and it makes the review screen's "estimates" caveat mostly disappear. Needs a taste call
from Eric before building. _(src: Claude · while: building the desk order ticket, 2026-08-13)_

### Position-detail drill-down — one symbol's whole story on one page
Today a symbol's data is split: the lot sits on Active, its closed history sits on History, its
per-symbol stats sit on Analysis. Every serious platform has a per-position page that assembles all
three plus the entry thesis (which, for bots, we already record in the decision audit trail). This
is the natural next tab once the fill window deepens. _(src: Claude · while: building the player
desk, 2026-08-13)_

### confirm-print-dates source reliability — Nasdaq's calendar API can block the proxy wholesale
`npm run confirm:print-dates` (src/scripts/confirm-print-dates.ts) automates the manual step done
by hand for NVDA (PR #309): cross-references `estimate` calendar entries against Nasdaq's public
earnings-calendar endpoint and opens an auto-mergeable PR for any hit. Built + shipped 2026-08-12,
but its first live run found the source **completely blocked** (every date fetch 503'd from this
environment's egress) — hardened to fail loudly (exit 2, distinct from "checked, found nothing")
rather than silently no-op, but the underlying reliability gap is real and unresolved. Worth: (a)
a fallback source (a second calendar API, or SEC EDGAR's own pre-announcement filings where they
exist) so one source's block doesn't fully starve confirmation, and (b) deciding whether/how to
schedule this as a recurring Routine — a separate yes/no from building the tool itself. _(src:
Claude · while: closing the "research → automatically applied" gap Eric asked about, 2026-08-12)_

### Research-instrument debt — fix earnings-cycle.mjs before its next sweep
The eight-symbol sweep's red teams caught three pipeline defects the instrument itself missed:
(1) no EDGAR acceptance-timestamp handling, so a **midday** 8-K (CRWV 2026-08-11) silently breaks
the after-close/D+1 reaction template; (2) the quarter-dedup can keep a pre-market 8-K or an
investor-day filing and drop real prints (corrupted MRVL's event list); (3) the forward-window
guard excludes the newest print on 5 of 8 tickers — hiding exactly the freshest out-of-sample
point. Fix the instrument first and let the next sweep be its test (open question #6 in
`plans/trade-playbooks.md`). _(src: Claude · while: eight-symbol sweep red-team, 2026-08-12)_

### Constraint-watch automation — a standing scan for the next binding AI constraint
Eric's research method (capital floods each successive AI bottleneck: chips → HBM → networking →
storage → energy) is now a written process: [`research/constraint-watch.md`](research/constraint-watch.md)
(the five-phase clock, false-positive guards, crowding census, tripwires). The natural next step
is a recurring scan — lead-time/earnings-language/shock-day signals checked on a cadence against
the method's tell list, plus the energy study's standing indicator dashboard
([`research/ai-energy-constraint.md`](research/ai-energy-constraint.md)) flagged into the
observatory. Open question #7 of the energy doc asks Eric whether to build it. _(src: Eric ("we
need to be pulling on all the threads… identify insights that have yet to be realized by the
market") · while: AI-energy constraint study, 2026-08-12)_

### Research lab — studies on the site, member-commissioned via the feedback funnel
Planned: [`plans/research-lab.md`](plans/research-lab.md) (draft, awaiting Eric). The `/research`
shelf renders `docs/research/*` in the house shell behind the invite gate; a `research` feedback
kind turns member topics into labelled issues that drive studies through the named sweep
workflow; published docs credit the requester. Eric intends a Claude-design iteration pass on the
reading experience later. _(src: Eric ("build a research lab on stock market opportunities for
everyone to benefit") · while: post-sweep, 2026-08-12)_

### Special-events calendar — own prints, peer prints, product releases
**→ Activated 2026-08-15:** built as the market-event calendar
([`plans/market-event-calendar.md`](plans/market-event-calendar.md) — `src/domain/market-events.ts`,
`scripts/event-scan.mjs`, the event-scan Routine). Kept here for the original framing.
A forward event calendar as a system component (the research instruments only look backward, and
next-print dates are cadence estimates). Track per symbol: its own confirmed earnings dates
(IR-sourced — the playbook plan's date-policy question), **peer prints** (measured to matter:
8/14 of MRVL's pre-print windows contain NVDA's print, supplying ~70% of the return — a playbook
blind to peer events misattributes its edge), product launches, and sector events (PJM auctions,
FERC dockets from the energy watch list). Feeds the playbook windows and the watch-indicators
dashboard. _(src: Eric ("are we tracking special events… NVDA benefits from other tech-adjacent
companies reporting strong AI usage") · while: post-sweep, 2026-08-12)_

### Sell-the-news study — is the pre-trade-and-fade pattern systematically exploitable?
Volume-driven media means events get pre-traded and faded on print. Build an instrument (same
discipline as earnings-cycle.mjs: controls, base rates, red team) measuring fade magnitude vs
coverage volume by event class, before any trade. The reaction-day fade validated on MSFT/GOOG
is this signal's best-evidenced special case — the study would test whether it generalizes to
non-earnings events. _(src: Eric · while: post-sweep, 2026-08-12)_

### Playbooks — refine strategies, and configure when to apply them
Eric's operating model for the trading side, and it resolves the "Sauron is inert" tension better
than loosening his thresholds would: **his reserve works in his favor.** The path is not "make the
bot trade more", it is:
1. **Prove the machinery with a tiny trade** — buy/sell a single share, observe that behavior is
   intact. Shipped as `npm run smoke:trade` (see `src/trading/smoke-trade.ts`); the point is that
   *verifying the path must not depend on a strategy firing*.
2. **Small calculated experiments, iteratively adapted** — each one teaches something specific.
3. **Playbooks** — named strategies plus *the conditions under which each applies*. The second half
   is the part that does not exist yet: a persona today hardcodes one strategy, and there is no
   layer that says "in regime X, run play Y." A playbook is that mapping.
4. **Patience, then size** — once playbooks cover the scenario space, wait for genuinely ripe
   conditions and *increase* the bet because conditions are favorable. Conviction sizing already
   exists (Sauron, and the Prospector's per-claim multiplier); what is missing is the regime read
   that justifies raising it.
- **Design note for when this is built:** a playbook is a *third* thing, distinct from persona
  (a character with a temperament) and strategy (a decision rule). It is the selector between them,
  and it is what makes "conditions are ripe" a computable statement rather than a feeling. It will
  need the metrics layer (`plans/metrics-layer.md`) to know whether a play *worked*.
_(src: Eric · while: sequencing after Sauron's readiness pack — "as playbooks become refined with
strategies in page to navigate every possible scenario, we can be patient for conditions to be ripe
to execute a play from a playbook and increase the size of the bets")_

### Roadmap — Eric's stated build order after Sauron goes autonomous
Season one's premise is **Sauron trading autonomously**; everything below queues behind it.

1. **Sauron autonomous** *(top priority — the season-one premise)*. Readiness pack shipped, so the
   gate no longer pins him to observe. Remaining: credentials + roster + live mode, all Fly switches.
   **Open tension worth Eric's call:** Sauron only acts at sentiment extremes (±0.7) *confirmed by a
   momentum turn*, and sentiment is a lexical score — `(pos − neg) / total` over recent headlines,
   which averages toward the middle. On a flat book he can only BUY, and only on a genuine panic. He
   is therefore authentic but close to **inert**: a season could pass with a handful of trades. Four
   ways out, in ascending intrusiveness: accept rare-but-decisive (in character, quiet season) ·
   widen the universe so an extreme occurs *somewhere* · soften the thresholds (±0.4) · make the
   sentiment signal more responsive. This is a taste call about what season one should feel like.
2. **Browser interface for basic stock trades** — buy/sell equities through our UI, calling Alpaca
   to execute. Note this is also the substrate for play-tagging (see the metrics idea below): trades
   placed through our interface are attributable *for free*, which is the cheap answer to the
   strategy-detection problem.
3. **Sell cash-covered puts and covered calls** — the wheel's two legs. **Prerequisite:** the order
   path is equity-market-orders-only today (`OrderIntent.type: "market"`, no option legs), so this
   step is really "add options to the order path" first, UI second.
4. **Buy long puts and long calls** — directional options, building on step 3's option order path.
_(src: Eric · while: sequencing after the metrics plan — "enabling sauron to trade autonomously is
the top level importance as that's the premise of season one")_

### Two gate-design findings from the deploy doom loop (see LESSONS.md 2026-08-11)
- **A gate must never gate the path it measures.** The unlearned-incident gate counts failed `main`
  runs *and* ran inside the job whose failure it counts, so one red deploy fed itself into 28. Any
  metric-over-history gate needs a structural rule: it reports on the path it measures, it does not
  block it. Candidate mechanism — a `reporting-only` class of gate that prints and never exits 1, or
  moving the incident scan to a scheduled run rather than the test suite.
- **Nothing alerts on a red `main` after a green PR.** Auto-merge reports the PR check; the post-merge
  deploy failure is silent unless somebody looks. Three merges deep before Eric spotted it by eye.
  The cheapest fix is probably a notification on `main` failure, not another gate.
_(src: Claude · while: diagnosing three consecutive failed releases)_

### "Skipped ≠ passed" — audit every gate that can skip itself (see LESSONS.md 2026-08-14)
- A check that skips reports `skipped`, and **branch protection counts that as a pass**. So any gate
  with a conditional `if:` has a second, invisible failure mode next to "goes red": *quietly doesn't
  run, and reads as green*. `verify` sat in exactly that state for every draft-opened PR until the
  `ready_for_review` fix. The class question is what else inherits the shape — `pipeline.yml`'s
  docs-only skip path is the obvious next one to look at, and the deploy job's conditions after that.
- Candidate mechanism: a scheduled scan that reads the check runs on recently-merged commits and
  flags any required check whose conclusion was `skipped` at merge time. That measures the property
  we actually care about (*did the gate run on what shipped?*), which no in-CI gate can measure about
  itself — and it deliberately reports rather than blocks, per the doom-loop finding above.
- Worth pairing with a one-time confirmation that `verify` is in fact a **required** check in branch
  protection. The `types:` fix guarantees the run happens; only branch protection makes it block.
_(src: Claude · while: watching PR #322 merge with `verify: skipped`)_

### Probot as the postmaster's host — the identity is taken, the service is parked
Eric: *"a probot app seems like a superior later abstraction as the postmaster role, to manage logic
for githook events."* The proposal splits in two, and only one half was taken.

- **Taken now — the App *identity*.** GitHub's loop guard is scoped to `GITHUB_TOKEN`; the two
  documented escapes are an App installation token or a PAT. So the App cures the severance class
  outright, needs **no server**, and beats the PAT on every axis (no expiry, installation-scoped,
  acts as its own bot). Shipped as `actions/create-github-app-token@v3` in `postmaster.yml`.
- **Parked — the hosted *service*.** What it would buy: routing in TypeScript with no YAML shim,
  local webhook replay (`probot receive`) instead of push-to-test, and clean reactions to events
  Actions handles awkwardly (review threads, cross-repo, fine-grained comment routing).
- **What it would cost, honestly.** (1) It cannot run `claude-code-action`, so it would dispatch the
  Actions workflow anyway — a *front door*, not a replacement. (2) An always-on service we don't
  have today: if it's down, webhooks are dropped and redelivery is manual, where a failed workflow
  run stays visible and re-runnable in the Actions UI. (3) The original complaint — four workflows,
  482 lines — is already answered: one workflow, ~200 lines that are mostly comments.
- **Why "later" costs nothing.** `route(ctx, deps) → Intent[]` is pure and host-agnostic by
  construction, so migrating swaps `execute()`'s I/O layer and the entry point while every fixture
  spec comes across untouched. That optionality is the decide-then-do split paying rent.
- **The trigger to revisit:** when event routing outgrows what `on:` can express — needing review-
  thread state, cross-repo reactions, or sub-second latency — not before.
_(src: Eric · while: reviewing the postmaster's abstraction after the canary shipped)_

### "Green certifies the wrong noun" — verify the artifact, not the process (see LESSONS.md 2026-08-17)
Third instance of one shape in a single day, so it is a class and not a coincidence: a success signal
that describes a **narrower event** than the one being relied on. `handoff-import.mjs` exited 0 for
"the push happened" while the caller read it as "the contract is clean"; `claude-code-action` exits
`success` for "the session completed" while the workflow's green check reads as "the handoff was
built"; and an issue opened by `GITHUB_TOKEN` is a *written* issue but not an *emitted* event.
- **The habit:** assert on the artifact — is there a branch, a commit, a PR, a claim ref? — never on
  the status of the process that was supposed to produce it. Cheap to apply by hand, and it is what
  actually caught all three.
- **Candidate mechanism:** teach the postmaster's `audit()` an artifact-shaped stall rule — *claim ref
  exists, no branch after N minutes* → comment and warn. That is the check that would have caught the
  21-turn, $0.88, zero-commit build with nobody reading a log, and it fits the auditor's existing
  ceiling (it observes and summons a human; it never reclaims a lock).
- **Sweep the `GITHUB_TOKEN` severance class, don't patch instances.** Three hops found where
  automation writes through `GITHUB_TOKEN` and something downstream is expected to react:
  issue-opened (fixed), PR-opened (found the same night, one hop past the fix), and workflow-made
  pushes (same property, not yet exercised). An auditor rule of the same artifact shape — *PR open
  N minutes with zero check runs* → comment and warn — would catch the whole family. The real fix
  for PR authorship is a credential (fine-grained PAT / App installation token for the `pr create`
  step only) and is **Eric's**, not self-authorizable.
- **Also worth having:** a repo-settings preflight. "Allow GitHub Actions to create and approve pull
  requests" being off cost a canary run, and that class of defect is invisible to every local gate —
  a scripted check of the capabilities the workflows assume would surface it before a dispatch does.
- **And: retire the hourly pickup Routine** once the event path has run clean a few times. It was not
  merely redundant — it *masked* the severed event chain by making a dead path look slow. A backup
  that can conceal the failure of the thing it backs up is a liability, not a safety net.
_(src: Claude · while: fixing the seventh defect of the postmaster cutover)_

### Metrics as the gamification substrate — multi-axis ladders + per-strategy effectiveness
Gamification is *all about metrics*: find the stats worth measuring, then let each one be its own way
onto the leaderboard. Eric's framing, and it sharpens THE-GAME.md's two-ledger idea into something
more extensible.

- **Two axes, deliberately different games.** *Percentage* isolates raw return from size — it removes
  capital as an advantage, so anyone can compete and a small account can top the board. *Raw dollars*
  requires calculated risk and real capital at stake. Neither is "the" leaderboard; both are ladders.
  This directly answers the design's founding problem (a single percent-return board produces one
  winner and several people who stop opening the tab).
  - **Flaw to design around:** a percentage-only ladder is trivially gamed by tiny stakes — a $50
    position up 20% beats a $50k position up 3%. Needs a minimum-stake floor, or a capital-weighted
    tiebreak, before it ships as a ranking.
- **Per-strategy effectiveness as a repeatable template.** "How well does this member run the wheel?"
  generalizes: for any strategy S, the same metric family — times attempted, win rate, average %,
  total $, best single, consistency (drawdown / variance), and % per unit of capital-at-risk. One
  template, many strategies, and the dashboard of insights falls out of it.
- **The detection problem, and the option Eric didn't name.** Measuring "effectiveness of strategy S"
  requires knowing which trades *belong* to S. Two obvious paths: route all execution through our
  interface (heavy), or infer strategy from raw Alpaca fills (Eric's read: more effort than it's
  worth, and he's right — inferring a wheel from bare fills is genuinely hard). **The cheap third
  path is tagging at entry:** a one-line "declare the play" surface where a member says *"opening a
  wheel on NVDA"* once, and every subsequent fill on that symbol links to the declaration. ~1 click
  per play, not per trade — and it is the **same write surface** THE-GAME.md already needs for the
  Sunday Council thesis / called-it scoring. The detection problem and the thesis-capture feature are
  one feature; building either alone is the waste.
- **Bots need no detection at all** — every bot order already carries `reason` + a persona id, so
  per-strategy dashboards can ship for bots *immediately*. Do not block the whole metrics layer on
  solving human-trade attribution; ship bot-side, add humans via opt-in tagging.
- **Honest blocker for the wheel specifically:** the wheel is an options strategy and `OrderIntent`
  is equity-market-orders-only. Wheel effectiveness is not measurable today at any effort — it needs
  the options order path first.
_(src: Eric · while: thinking through gamification metrics — "percentage focuses on/isolates raw
return on investment without the amount/risk factor at stake; raw amount requires more calculated
risk")_

### Candlestick swing day-trading persona — high volume, lower margin
A second experiment persona alongside the Prospector: read intraday candles, enter on a swing, exit
on a swing in our favor. Deliberately **high-turnover / thin-margin**, which is the opposite shape to
the Prospector (few claims, let winners run) — and that contrast is the point: high volume exercises
the live order path far harder per session, which is exactly what surfaces bugs while the market is
only open during Eric's working hours.
- **Build it after the Prospector proves the path.** Same reason the Prospector exists at all — prove
  the plumbing with the simple shape before adding an intraday one.
- **Two real constraints to design against:** (1) the order path is market-orders-only with a
  per-persona cooldown, so "sell into the swing" is coarser than a limit ladder; (2) pattern-day-trader
  rules — Alpaca enforces PDT on paper accounts too, so a high-turnover intraday bot on a sub-$25k
  account can get flagged and blocked. Check the account's equity + PDT status before turning it loose.
- Needs a candle/bar feed: today's `MarketContext` carries quotes + momentum, not OHLC bars — a bar
  source (Alpaca `/v2/stocks/bars`) is a prerequisite.
_(src: Eric · while: designing the warm-up trading experiments — "candle stick day trading, place
trades on a swing, sell on a swing in your favor")_

### A 2D UI/UX agent for `src/observatory` / `src/ui` / the login canvas
First live application of `/charter`. The forge roster (art-director, piece-wright, set-dresser,
render-alchemist) directs 3D work; nothing plays the same role for 2D UI — `ui-librarian` only dedupes
existing code, it doesn't direct new UX. That's a real architectural gap, confirmed by grep (nothing in
`src/observatory`/`src/ui` has a direction-agent, only debt-paydown coverage).
- **Charter verdict: candidate, not yet triggered — do not build now.** The 3D roster earned four agents
  because of REPEATED, high-volume rounds of taste-triggered work (many Eye rebuilds, each with distinct
  planning/building/detailing/research needs). 2D UI has no equivalent recurrence yet — `src/observatory`
  is a handful of files with no history of repeated redirection cycles. Building ahead of that evidence
  risks a second `render-alchemist`-shaped agent: plausible domain, no real trigger yet.
- **The trigger to watch for:** a second or third round of "this dashboard/card/canvas needs real
  direction" from Eric on the same surface — the same rule-of-three logic that killed the capability-scout
  and unpaved-register ideas earlier this session. First round belongs in the main thread (as the Eye
  redesign did), not delegated to an agent that doesn't exist yet.
_(src: Claude · while: chartering the requested agent batch — Eric asked for ux research ops / ux
research / ux design as three of eighteen roles; this is the honest single candidate that survived)_

### Voice profiles — decode Eric, and a rack of borrowable expert lenses
Full reasoning banked in [`JOURNEYS/voice-profiles.md`](JOURNEYS/voice-profiles.md); this is the
pickup list. Four layers, not one artifact — **stance** (the epistemic contract; when to disagree,
what to do with a bad premise), **decode** (how Eric compresses intent into words), **perception /
expression** (a borrowed register, socketed in per skill), **context** (what is true *here*).
Build order: rack → customer conversations → archetypes → personal profile.
- **Instrument first.** Tag corrections for a week as *misread* vs. *never told you* — that ratio is
  the gating number for the whole thesis and nobody knows it. Check what `duel-log.mjs intent`
  already records before building a second instrument.
- **Stance layer is the cheapest and highest-yield slice** — a dozen dials, written as commander's
  intent rather than orders (*"the end state is that when you say 'this looks good,' I can trust
  it"*), plus a `/stance-audit` that re-reads a transcript with no stake in the original answer.
- **Lens test before building any borrowed voice:** *did this expert face a constraint that forced
  them to solve a representation problem we also have?* Descriptive novelists yes; "expert
  architects" no.
- Every derived rule must carry the utterance that produced it — the audit surface, not documentation.
- Later: a `PersonaLore.voice` field so bot personas speak in-character (deferred — product surface).
_(src: Eric · while: the voice-profile thought experiment — "capture the idiolect and prosody of my
voice")_

### The University metaphor — elevate the academy into a full "Skynet University"
Eric likes the university framing; bank it to expand on. The `/learn` academy + risk ladder
(`src/domain/curriculum.ts`, `src/domain/plays.ts`, `RANKS`) is the seed — reframe the whole
learn/experiment/graduate arc as a **university** with a coherent, extensible vocabulary:
- **Majors / faculties** — options fundamentals, the Wheel, directional longs, volatility, risk mgmt;
  each a track with its own 100→400-level courses (the tiers already exist).
- **Degrees gate capability** — graduating a level *unlocks* what a member (or their bot persona) may
  actually trade — the human-side twin of the bot autonomy-readiness eval (ties to the academy
  "graduation → capability" thread already in the inbox). A diploma is a real permission, not a badge.
- **Persona-professors** — the D&D/lore personas (`persona-lore`) teach their specialty (Sauron on
  disciplined order/risk; the Day Trader on momentum) — lore as the faculty, mechanics stay honest.
- **Campus in the empire** — a university building rises in the sim-city cityscape as you matriculate;
  a Living-Universe landmark tying learning to the nation-building metaphor (a natural pairing with the
  founding-reserve / event-ceremony work).
- **Semesters / cohorts / a quad** — friendly, social framing (study groups, co-op) over the friends-
  and-family league; office hours, a syllabus, a transcript (needs the history/persistence layer for a
  real transcript). Keep it celebratory, everyone-graduates-eventually.
_(src: Eric · while: reviewing the founding-reserve / academy engagement work — "I like the university
metaphor, bank it to expand on")_

### Babylon.js as the composable 3D engine for the gameplay layer
As the product heads toward SimCity-of-the-empire / human-vs-bot gameplay, the hand-rolled 2D canvas +
one-off WebGL shaders won't scale to real 3D scenes. **Babylon.js** is the best-in-class
batteries-included option (scene graph, PBR materials, physics, GUI, glTF asset pipeline, WebGPU) for a
composable engine. Evaluate it for the north-star gameplay surface (#41): the empire cityscape as a
navigable 3D scene, personas as entities, plays as scripted set-pieces. Weigh bundle size + the
"self-contained inline / no external host" constraint (login is CSP-inline today; a game view would be
its own route/bundle, so that constraint likely relaxes there). _(src: Eric · while: shipping the WebGL
eye-gaze hero reveal — "the direction we may be headed")_

### Options academy — progression & the in-app play picker (follow-ups to the risk ladder)
The `/learn` academy + `src/domain/plays.ts` risk ladder shipped (PR #178): CCP-first, riskier plays
gated per level. Natural next threads, in priority order:
- **Server-side progression.** Academy graduation is client-side localStorage today. Persist a learner's
  unlocked level per participant so it survives devices and can gate real actions (needs the history/
  persistence backend, or a small per-user KV). _(src: Claude · while: building the options academy)_
- **Gate the play picker against the ladder.** When an in-app play-selection surface exists (and the
  login playbook), hide plays above the learner's unlocked level using `unlockedPlays()` / `isLocked()`
  — "withhold the complex/risky selections until graduated" enforced for real, one source. _(src: Eric ·
  while: know-your-audience progressive disclosure)_
- **Interactive lessons.** Each academy lesson could summon its play on a mini payoff/forecast canvas
  (reuse the login playcall machinery) so learners *see* the shape, not just read it. _(src: Claude ·
  while: building the options academy)_
- **Graduation → capability.** Tie academy level to what a member (or their bot persona) may actually
  trade — the human-side twin of the bot autonomy-readiness eval ladder. _(src: Claude · while: building
  the options academy)_

### The Eye — volumetric rebuild, and the still-open sun/gravity/electric direction
Shipped (PR #265): the Eye rebuilt as a real raymarched volume — the shipped 2D-skin version showed
empty bloom from behind (the tower's own "drag to orbit" invited exactly that view); now a genuine 3D
density field, correct from every angle, with a round-orb body and an almond gaze-aperture blended by
azimuth (a direct correction — the first raymarch pass made the whole body almond-shaped). Two real
bugs found and fixed mid-build (a wrong-root scale miscalculation, a corona system anchored to the
wrong point in space), both banked in `docs/art/EYE.md` so the next piece doesn't repeat them.
- **Still open: "burns like the sun, gravity containing the outward fire, friction generating electric
  charge."** A physically-motivated redesign, not yet built — the sun-like plasma read, a stronger
  contain-vs-escape dynamic at the boundary, and the electric layer reframed as a genuine consequence
  of that shear rather than decoration. Verbal brief only so far (the intended reference video turned
  out to be the wrong file — see below); next pass should run through `render-alchemist` first.
  _(src: Eric · while: reviewing the volumetric Eye — "the scale of 0-100, this is a 95")_
- **Lesson: a reference video was a fidelity benchmark, not content reference** — a screen recording of
  an unrelated AI-video-generator marketing page was shared to point at production polish (atmospheric
  depth, light falloff, grain, motion), not the literal imagery. Cost a round of clarification;
  `render-alchemist`'s loop now leads with distinguishing "fidelity gap" from "content-match" asks
  before spending a research pass on the wrong question. _(src: Claude · while: extracting reference
  frames that showed no Eye content at all)_

### The forge — 3D strategy, the vision register, and follow-ups (see [`3D-STRATEGY.md`](3D-STRATEGY.md))
Shipped on the gamify branch: the 3D deployment playbook (`docs/3D-STRATEGY.md`), the `/vision`
register skill (Pierce Brown-provenance pastiche generalized from `docs/art/EYE.md`; salience-finding
prose compiled into bounded generation prompts — long prose measurably degrades generators), and the
forge roster (`art-director` → `piece-wright` → `set-dresser`: decompose complex 3D models into
small ground-up pieces, one green screenshot-proven rep each; visual output always waits for Eric's
taste). Follow-ups, in leverage order:
- **Compute prominence** — nothing ranks bots 0..1 yet; `projectWorld` takes a caller-supplied map
  (`project.ts:137`). A small observatory-side rank function unlocks live landmark leveling — the
  cheapest slice that makes the tower *real*. _(src: Claude · while: grounding the 3D strategy)_
- **Ceremony-camera slice** — `Animation.CreateAndStartAnimation` on the existing `__towerCamera`
  + `FramingBehavior` + the pipeline's dormant DOF; fires on topping-out/founding ceremonies.
- **Package gaps** — `@babylonjs/loaders` (via `registerBuiltInLoaders` from `/dynamic`) and
  `@babylonjs/gui`, version-matched to core; prerequisites for GLB loading and diegetic labels.
- **First art-director rep** — run the roster end-to-end on one scene ask (e.g. the energy empire's
  reactor) to shake out the build-sheet format before it matters. _(src: Claude · while: designing
  the forge relay)_
_(src: Eric · while: "guidance on 3D gamification strategies" + "prompt like Pierce Brown" + "sub-agents
to decompose complex 3d models")_

### The game layer — rules, renown, and the season loop (see [`THE-GAME.md`](THE-GAME.md))
Full design banked; this is the pickup list. The premise the design solves: with two never-traded
members in a five-person league, a percent-return leaderboard produces one winner and two people who
stop opening the tab. Three moves — **you play your bot, not the market** (the competitive unit is a
persona, which equalizes honestly *and* is the autonomous-trading north star); **two ledgers**
(equity = the untouched truth, **renown** = a per-unit-of-risk score paying for discipline, called-it
theses, degrees, and building bots — so a flat week can still be a great week); and **renown as the
currency you spend on the city** (the truthful layer — towers, health, construction — stays
unpurchasable; the earned layer — campus, landmarks, district styling — is what you build). Loop:
Sunday Council (commit a thesis) → the week runs → Friday Recap → quarterly Season reset with the
city persisting.
- **History/persistence is recording and being consumed** — renown, ceremonies, seasons and called-it
  need durable *events*. The prod sampler was already on (`fly.toml`); the un-done work was
  consumption, now tracked in [`plans/history-layer.md`](plans/history-layer.md) (realized-P/L
  continuity and the ceremony data path shipped). _(src: Claude · while: designing the game layer)_
- **A pure `renown` module** over history + curriculum + trades, same testable pattern as `reduce.ts`.
- **Degrees as permissions** — `PLAY_LEVELS` 1–4 gate what a bot may trade; needs server-side academy
  progression (already in this file). Makes the ladder a real safety rail, not a badge.
- **Thesis capture** — a one-line-per-member-per-week write surface (the Council).
- **Mentor bounty** — renown for helping another member's bot/thesis, so veterans are incentivized to
  want the novices to do well. _(src: Claude · while: designing for the two-novice roster)_
- **Graphics: hybrid, not either/or** — 2.5D isometric for the everyday views, Babylon for hero
  ceremonies (already real in `src/three/`); `WorldState` keeps the choice reversible and per-surface.
  Promote 3D to primary when free-orbit exploration of your own city becomes a core interaction.
- **Eric's forks:** competitive unit (bot-first?) · does renown buy cosmetics? · season length ·
  divisions at five players · mentor bounty worth the complexity?
_(src: Eric · while: "I need to figure out a fun way to gamify the premise of skynet-capital")_

### North-star epic — the Living Universe (see [`LIVING-UNIVERSE.md`](LIVING-UNIVERSE.md))
The cityscape as a multiplayer, SimCity-like shared world that reflects everyone's trades, bots, and
market events — **potentially _the brand itself_**, the addictive hook. **Fun as the flywheel**
(engagement → legibility/trust → capital → autonomy). Reflects portfolio positions, news, economy, and
politics; domain-themed empires; construction = maturing bets; a judgment axis (good bet vs. hype vs.
legal risk) held to an honest, data-sourced standard. Phased:
- **P1 Landmarks from personas** — personas as skyline structures beyond the Eye (display-only). _(src: Eric)_
- **P2 "Your city"** — logged-in cityscape driven by `ParticipantSnapshot` (positions→towers, P/L→health); needs two-modes (#54) + history layer. _(src: Eric)_
- **P3 Market-event vocabulary** — regimes + macro events → city phenomena (oil shock→smoke/traffic, bull→cranes, bear→fog); matrix tracers as the transition/comms medium. _(src: Eric)_
- **P4 Contributable personas** — users add bot personas that join the universe (plugin behind the persona-lore seam). _(src: Eric)_
- **P5 Full ecosystem** — trades/events continuously animate a world that communicates the league's live state; the instrument panel underwriting autonomous real-money trading. _(src: Eric)_
- **Scale across the four views** — the sim-city grammar renders at different zoom: individual = a city,
  comparison = two cities (commonality + contrast), leaderboard = a region/map, bots-vs-humans = country
  vs country where the *units of measure change* (buildings fall off; GDP/territory/development emerge).
  A per-view rendering spec over the existing routes. _(src: Eric)_

### Living Universe — event ceremonies, the founding & player agency (see [`LIVING-UNIVERSE.md`](LIVING-UNIVERSE.md))
- **The founding + "key to the city" ceremony** — starting/uninvested capital renders as a landmark
  reserve (an empire *about to rise*, scaled to dry powder); crossing the threshold founds the city in
  the member's name, the post-login twin of the login "key to the city" reveal. _(src: Eric · while: sim-city gamification of starting state)_
- **Events as ceremonies (positive-reinforcement bias)** — deploy capital → ground breaks/construction
  begins; take ~20-30% profit on a sizable position → a building tops out; grow + reinvest → a
  hard-to-miss development/upgrade. Wins get the fanfare; losses render honestly but without punishing
  spectacle. **Depends on the history/persistence layer** (transition events can't be read from a
  snapshot). _(src: Eric · while: sim-city gamification of profit/loss)_
- **Bots as the conduit to nation-building** — first-class: a member's own bots are the primary engine
  that grows their empire and climbs the leaderboard; building a better bot *is* building a better
  nation. Elevates Living Universe P4 (contributable personas); trading authority earns up the
  autonomous-contribution trust ladder. _(src: Eric · while: sim-city gamification / user-contributed bots)_
- **Player-customizable cityscapes → a contributor on-ramp (constraint-elevation)** — let players add
  personal touches to their nation's cityscape; that authoring surface is a *bridge* to learning
  AI/Claude development, turning engaged players into direct project contributors. This **elevates the
  binding constraint (Eric's attention)** per ToC — more contributors = more capacity, fewer single
  points of failure. Eric expects token headroom to support it. Governance-gated (contributions ride the
  autonomous-contribution trust ladder). _(src: Eric · while: sim-city gamification / onboarding contributors)_

### Detail scaling — a higher-order dimension (emergent architecture)
- **Barad-dûr: squeeze more juice from the totem** — the Eye is great; the supporting tower now has a
  faithful fortress pass (stepped tiers, buttresses, forge-slits, iron-horn shoulder crown, bigger
  footprint). Reads subtle at its far-left mid-depth placement — candidate to push prominence/footprint
  further, or promote the Eye tower to a foreground hero element. _(src: Eric · while: refining the Eye of Sauron totem)_
- **A higher-order dimension to keep packing detail at scale** — as rich totems accumulate (Barad-dûr,
  per-domain empires, event ceremonies), the current flat login-canvas / skyline structure will stop
  cleanly absorbing them. Expect to need a broader organizing dimension — e.g. zoomable levels-of-detail,
  a district/region hierarchy, or a dedicated "explore your empire" surface — that lets detail nest at
  multiple scales instead of competing for one canvas. This design **emerges organically** as pieces stop
  fitting cleanly; watch for the seams and formalize the dimension when they appear. _(src: Eric · while: refining the Eye totem — foreseeing detail outgrowing one canvas)_
- **Compose the animation board from Lego pieces (scene-graph refactor)** — the login canvas is one
  large `draw*` monolith; as the sim-city gameboard evolves it needs a **composable piece system**: each
  element (a tower, the Eye, a scanner, a playcall panel, a ceremony, a forecast) is a self-contained
  **piece** with a uniform contract (place / size / z-depth / update / draw / reduced-motion), added to
  the board like Lego instead of hand-wired into one function. Unlocks reuse across the four views + the
  login, independent testing per piece, and the levels-of-detail nesting above. The seam is showing now
  (the board is getting crowded). Likely a **layered scene graph** (layers → pieces) with a shared
  transform/camera. Big refactor — sequence deliberately; until then, prefer adding new board work as
  observatory-side pieces rather than growing the login monolith. _(src: Eric · while: evolving the sim-city gameboard — build onto it like Lego)_

### Living Universe — landmarks that level up (see [`LIVING-UNIVERSE.md`](LIVING-UNIVERSE.md))
- **Persona landmark = a character you level up** — a bot's landmark prominence scales with its standing
  **relative to peers** (rank by return/equity/win-rate). Two mixed expressions: the tower itself grows
  more powerful (height/mass/Eye-blaze/beam reach/aura), and/or the district around it clearly thrives
  (brighter windows, construction, tracers). The landmark IS the scoreboard. Rises and falls as
  standings shift. _(src: Eric · while: the Tower of Sauron as a levelable character)_
  - **First real slice (P1):** in the observatory, render each bot-persona's landmark (the Eye for
    Sauron) into its empire skyline, scaled by rank among bots — snapshot-derivable, connects the login
    Eye motif to the live board. Persistent leveling/accretion leans on the history layer. _(src: Claude · while: capturing the leveling mechanic)_
- **The signal read IS the lead bot as a character** — the on-chart signal/assessment reads like a
  Terminator sizing up the situation (HUD target-lock, threat/opportunity appraisal). That "assessment
  voice" is a *character*, the same way the Tower of Sauron is one: make the lead bot a persona that
  visibly does the detect→assess→recommend, with its own signature look/motion. Each nation (1 human +
  ~2 bots) then has ONE bot serving the control-tower role (detect · correct · maintain) — Sauron's Eye
  is that persona's expression; a Terminator-flavoured bot would express the same mechanics differently
  (reticle/scan-line/HUD instead of a gaze/beam). The mechanics are shared; the skin is the persona.
  Ties to the persona-lore seam (#79) and the levelable-landmark mechanic above. _(src: Eric · while: the signal assessment feeling like a Terminator character — a template for per-nation lead bots)_
- **The player's tower is a personalised landmark on a fixed anchor** — the primary player's tower now
  renders at a STABLE central-left position (a reliable render point); that fixed anchor is the canvas for
  per-user personal touches (silhouette, palette, crown, signature motion) so each member's login/board
  feels theirs. The primary player is likely a HUMAN, and human towers may carry their own distinct
  characteristics (vs. the bot Eye/tower) — form TBD. _(src: Eric · while: anchoring the primary tower centrally + per-user personalisation)_

### Play-feedback system — game-combat model for board telemetry (Eric-directed)
The single terminal that narrates one play (and pushed the hero down / can't show many characters) is
the wrong shape. Model it like a **game**: a character invokes a **play** (attack/defense move from its
playbook); the play **resolves** against the market → **HIT** (paid off) / **MISS** (stopped out) /
**LIVE**; feedback = damage/reward (realized P/L), health (equity delta), loot (rank climb). Must handle
**many characters at once** — a log where every bot's actions stack, not one terminal for one play.
- **Foundation shipped:** `play-feedback.ts` — pure `PlayOutcome` model + `renderPlayFeedbackLog`
  (multi-character, HIT/MISS/LIVE badges, damage/reward coloring, honest idle + escaping), tested. A
  composable board piece (Lego direction). _(src: Eric · while: reframing the terminal-input feedback)_
- **Next:** style + wire it into the observatory (a live "playcall feed" showing every bot's actions),
  then bring it to the login (replacing the terminal's role there); add floating combat-text on resolve
  (the "+$420 · HIT" pop) and health/loot deltas. Full system per Eric's game-move framing.

### Governance — Eric's calls (do not build unattended)
- **Formalize the participation agreement / consent** — the shared universe pools members' trades/
  bots/info; that's authorized by the invite-only agreement. Capture the consent language explicitly
  (surfaced at signup / `/welcome`) so the basis for data-sharing is on record. Eric to define the
  wording; low-stakes (paper) but held to a real-cash integrity standard. _(src: Eric · while: clarifying the shared-universe data boundary)_
- **Issue-driven distributed development (Eric, 2026-08-11):** "enable Claude to pick up and work
  GitHub issues… lets humans create issues that get serviced, as well as orchestration for bots to
  manage their work." Two consumers, one mechanism — humans file work, and bots file their *own*
  work as issues, which is what makes the development distributed rather than just delegated.
  **Honest state:** most of the plumbing already exists and is proven — Claude already reads this
  repo, opens PRs, and auto-merges on green (this whole session is that loop). What is missing is
  narrow: (a) the **trigger** — an issue labelled `claude` starting a session, rather than Eric
  starting one; (b) the **trust ladder** below, deciding which issue classes may be serviced
  unattended; (c) a **concurrency/ownership rule** so two agents never take the same issue. Worth
  scoping as its own plan; the credentialed step (granting the trigger write access) stays Eric's.
- **Autonomous GitHub-issue contribution system** — autonomously pick up & act on issues, starting
  narrow (tier 1: additive, display-only persona/landmark integrations) and widening by a progressive-
  trust ladder. Rails-first, mantra **Detect · Correct · Maintain**: brand + Graphify `affected` +
  tests + alignment review gate every change; drift blocks/reverts. Sensitive steps (granting
  autonomy, credentials, **real-money trading**) always Eric's. Framework in `LIVING-UNIVERSE.md`. _(src: Eric)_

### Larger tasks (need dedicated focus)
- **Login terminal drawer + backstory** — convert the canvas play-panel into a terminal-style DOM
  drawer that opens with a preamble/backstory. (tasks #68/#72; canvas→DOM migration; best done live.)
- **Two modes** — intro `/login` = fast preview (gist, gloss details); logged-in = slow, controllable,
  studyable inspection. (task #54)
- **Decoupled playcall drawer** — a left collapsible drawer housing Signal→Play→profit, decoupled from
  the trend chart, carried into the logged-in view; move the playcall recap into it with a connector
  line to its chart position. (tasks #49 + #51-remainder)
- **/add as the character sheet — persona field = character class** — the persona-id input on `/add` is
  really the CLASS slot of a character sheet; redesign the flow around that: bot setup presents the
  roster as selectable class cards (name, thesis, lore line, risk read from its eval report), Human is
  the classless default, and the chosen class's readiness-eval badge shows on the card ("READY 100/100").
  First slice: replace the free-text persona field with a class picker fed from the persona registry +
  PERSONA_LORE + eval reports. The Banker (shipped) is the first character created THROUGH the
  sheet→eval→roster pipeline; its realized income is the honest peg for the tournament prize pot
  (in-app points — no transfers needed). _(src: Eric · while: recognizing the persona field as the character-class slot)_
- **Bot creation as a D&D character-sheet flow** — a guided process that walks a user through standing up
  a bot, leaning into the primary-tower template. Steps: (1) **account setup identical to a human's** —
  reuse the same account flow, no separate path; (2) **build the bot persona / strategy** — a
  character-sheet-style profile builder that defines the strategy it employs (archetype, playbook, risk,
  the tower/landmark skin). Turnaround idea: run persona-building **through GitHub issues** — Claude picks
  up the issue, comments only when it needs user input, and (as trust matures) completes the work and
  closes it (extends the autonomous-issue system below + the persona-lore seam #79). **Hard gate:** this
  hinges on **autonomous bot trades being stable/tested first** — that behaviour is not yet proven, so
  build the creation flow only once autonomy is ready (ties to the north-star pipeline below + Eric's
  irreversible-class calls). _(src: Eric · while: leaning into the primary-tower template — bot onboarding)_
- **Hero-character piece system / skill** — a reusable generator that emits a **high-fidelity primary
  character out of the box** (the caliber of the Barad-dûr tower), configurable as a **board piece**, so
  we can **autonomously create new primary characters from user input** (a persona's character sheet →
  its faithful landmark). Generalises the Sauron work into an archetype template: silhouette + the
  "surrounding area" detail (massif/base/turrets) + crown + a signature **energy/motion** (Sauron =
  fire+electric gaze/beam) + the levelable-landmark hooks + a persona binding. Likely a **Claude skill**
  (documented generation process) that is the visual counterpart to the eval-gated persona flow: the eval
  proves the persona *trades* soundly; this proves it *renders* as a lovable hero. Depends on the **Lego
  pieces scene-graph refactor** (uniform piece contract) and feeds **contributable personas (P4)** +
  bot-creation. Big — needs dedicated focus; Barad-dûr is the first worked example to extract the template
  from. _(src: Eric · while: detailing the Sauron tower — wanting hero fidelity to be systematic + generable)_
- **North-star autonomous pipeline** — recycle the playbook artifact as a systems-level pipeline
  toward autonomous deployment (recognize signal → recommend → trade, with safeguards). (task #41)
- **Lore universe (mixed multiverse)** — give each persona a character card (name, archetype,
  allegiance, one-line legend) surfaced on `/u/:id` and woven into trade narration + cityscape + copy;
  keep the system extensible to adopt others' ideas. Confirm the pantheon direction with Eric before
  broad rollout. (task #79; Sauron + the Eye of Sauron are the first thread.)
  - **Real name + character alias (identity duality).** Real names are ideal for accountability —
    within the invite gate, people should know who represents what (consistent with the consensual
    shared-universe boundary). *On top of that*, the gamification warrants a **character alias** people
    brand their personas with — D&D-style: you create and roleplay a character. So a member carries both:
    their real identity (known to the league) and one or more persona aliases (the character on the
    board/leaderboard/cityscape). The alias is the brand; the real name is the record. Bots already have
    aliases (Sauron, JARVIS); this extends the same to humans' personas. Product decisions for Eric:
    where the real name shows vs. the alias, and whether aliases are per-account or per-bot.
    _(src: Eric · while: gamifying persona identity — real names + D&D-style character aliases)_

### Feedback / engagement
- **Gamify feedback as "side quests"** — the core group skews D&D/gamer, so framing idea-contribution
  as accepting/proposing side quests could organically pique interest. v1 shipped (the `/feedback`
  "idea" kind is now a 🗺️ Side quest). Deeper version: a light quest board — proposed side quests
  visible, upvotable, with playful status (open → accepted → shipped), tied into the lore universe.
  _(src: Eric · while: extending the Claude side-quest idea system)_
- **Timed play events + bounties** — a time-boxed group event where everyone's play is measured over a
  window, with a **bounty** as the prize; adds a fun competitive beat (and pairs with human-vs-own-bot).
  Two constraints to design around: (1) **everyone needs powder to participate** — solve in-app by
  granting a fixed **event stake** (equal starting powder for the event) so entry never depends on a
  member's balance; (2) **funding a real bounty pot** means moving cash between accounts — see the
  Alpaca note below. **Recommended framing:** since the league is **paper**, model the bounty as
  **in-app points / a prize ledger** (no real money movement at all) — sidesteps transfers entirely and
  keeps it low-stakes. A real-cash bounty is a separate, later, governance-gated step.
  - _Alpaca transfer feasibility:_ the normal **Trading API / OAuth** path (individual accounts) has **no
    peer-to-peer transfer** — cash only moves via ACH to an account's **own** linked bank. Moving cash
    **between** accounts (e.g. a "bank"/secondary-bot account funding others) requires the **Broker API**
    "**journal**" endpoints (JNLC cash / JNLS securities) between accounts under one firm — a heavy B2B
    integration (firm onboarding, KYC), not the friends-and-family paper path. And on **paper** accounts
    the cash is simulated, so there's nothing real to journal. ⟹ real-money bounties = live + Broker API
    + Eric's irreversible-class call; the in-app points version needs none of that.
  _(src: Eric · while: brainstorming group engagement — timed events + bounties)_
- **Time-of-day volatility on the login market** — realism enhancement: mornings run hotter (higher
  volatility) than midday; drive the ambient `regimeVol` by a time-of-day curve so the tape breathes like
  a real session. Small, cosmetic; deferred behind the core play work. _(src: Eric · while: calming the playcall candles — market-hours realism)_

### Side quests (surfaced by Claude while working — proposals to prune)
- **Doc-rot gate — the highest-severity gap found, and it has evidence not just a hypothesis.** Both
  known instances fixed (PR #284); the gate itself is now a drafted plan awaiting Eric's ready-flip —
  [`plans/doc-rot-gate.md`](plans/doc-rot-gate.md), the PM-mode worked example. Nothing in the repo yet
  checks whether docs still describe reality; a self-improving system that drifts degrades **silently**.
  _(src: Claude · while: journey on voice-profiles · plan drafted while: PM-mode scaffolding)_
- **Mutation testing — the one gate that measures whether the other nine work.** Portfolio finding:
  `arch` · `dupe` · `clone` · `dead` · `depgraph` · `spec:gap` · `incident` are seven scanners, all
  **static and structural**; `eval:persona` / `eval:safety` are behavioral but example-based. Deep on
  shape, thin on behavior. Mutation testing is diagnostic rather than additive — delete a condition on
  purpose and see whether anything screams; if nothing does, the suite is decorative and we'd never
  have known. _(src: Claude · while: journey on voice-profiles)_
- **Metamorphic properties on `eval:persona`** — there is no oracle for what trade a persona *should*
  make, but relations hold regardless: *a bearish persona must not increase exposure when sentiment
  drops.* Asserting relations instead of outputs tests behavior we never enumerated, which is exactly
  where the induction gap lives. _(src: Claude · while: journey on voice-profiles)_
- **Differential window on promotions** — when `/dedupe` or `/decompose` consolidates, keep the
  pre-promotion original for N weeks and assert the abstraction agrees with it. Detects a boiled-out
  condition **without knowing in advance what was dropped**, because the two diverge exactly where the
  discarded condition mattered. The missing partner to `dupe:scan`: we detect duplication and prompt
  consolidation, but never verify the consolidation preserved behavior across the cases the copies
  differed on. Pair with a one-line **discard log** beside each promotion (what was dropped and why) —
  detection tells you *that*, the log tells you *why*. _(src: Claude · while: journey on voice-profiles)_
- **Is `OPERATING-MODEL.md` still load-bearing after its promotion?** It is `CLAUDE.md` with the
  Skynet-specific parts boiled out — a promotion already performed, and the live test case for the
  discard problem. Empirically checkable. _(src: Claude · while: journey on voice-profiles)_
- **Test coverage & quality audit** — the suite (~178) skews to pure logic (personas, reducers, server
  routes, renderers, empire skyline); the login canvas animation + the vision layer are screenshot- or
  docs-verified, not unit-tested (by nature). Audit for *logic* behaviors that lack a test (dashboard
  routes, observatory metrics, reduce/persistence). Balance is the goal: small **single-responsibility**
  tests (one behavior each — avoid long bundled workflows that hide failures and mix altitudes), but not
  so granular it becomes death-by-10,000-cuts. _(src: Eric · while: reviewing the suite size)_
- **Isolated-worktree `node_modules/.bin` is empty** — athletes launched with `isolation: worktree` get a
  checkout whose `node_modules/.bin` lacks the tool shims (biome/tsx), so husky hooks and the two
  subprocess-path specs (`app-version`, `dep-graph`) fail until `node_modules` is symlinked from the
  primary checkout (then removed). Every backfiller hit this and worked around it. Fix: provision the
  worktree's `.bin` at worktree-create so athletes don't each re-solve it. _(src: Claude · while: running feast athletes in isolated worktrees)_
- **`bot-broker` drops `credentials.accessToken`** — `createBotBroker` wires `FetchAlpacaTradingTransport`
  with only `{ baseUrl, apiKey, apiSecret }`, never forwarding `bot.credentials.accessToken`, so an
  OAuth-connected bot ("Connect with Alpaca", Round B) would auth with a blank key/secret instead of its
  Bearer token. Latent today (no OAuth bots yet); real fix before Round B ships. A `.todo` in
  `tests/bots/bot-broker.spec.ts` documents it. _(src: Claude · while: backfilling bot-broker specs)_
- **Empire skyline on the comparison view** — render two empire skylines side by side on `/compare`
  (the "two cities" from the scale ladder: commonality = shared towers, contrast = coal/rail vs.
  solar/silicon silhouettes). Reuses `renderEmpireSkyline`; the next natural P2 slice.
  _(src: Claude · while: building the empire skyline)_
- **Sector map from a data source** — `SECTOR_BY_TICKER` is a curated table; as holdings diversify,
  drive it from a real sector feed (or derive) so any ticker themes correctly. _(src: Claude · while: building the empire skyline)_
- **Refine energy/gold/broad silhouettes** — the non-tech sector shapes are basic; give each the
  exquisite-detail treatment once those sectors actually appear in holdings. _(src: Claude · while: building the empire skyline)_
- **Skyline label collision at high position counts** — ticker labels crowd past ~6 holdings; needs the
  same collision handling as the canvas labels (#47). _(src: Claude · while: building the empire skyline)_
- **Machine-checkable brand cohesion (`brand.json`)** — emit tokens + anchor→node bindings + per-scope
  rules so BCP's *Enforce* step can lint deliverables against the brand automatically (per community
  scope). The deeper half of the BCP × Graphify integration. _(src: Claude · while: running Graphify)_
- **Refactor candidates from the graph** — Graphify flags low-cohesion communities (`MarketContext`,
  `dashboard-data.ts`, `data-source.ts`) as split opportunities. Not urgent; run `affected` first on
  any target. _(src: Claude · while: reading the structural map)_
- **Dead-code sweep from isolated nodes** — 126 weakly-connected nodes flagged; most are config keys
  (noise), but some may be genuinely unused exports. Verify carefully (entry points / test-only aren't
  dead) before removing. _(src: Claude · while: reading the structural map)_
- **Install Graphify as a native `/graphify` skill** — `graphify install --platform claude` would make
  the commands first-class in-session; env is ephemeral so it doesn't persist, but worth it if a
  durable place to store the skill emerges. _(src: Claude · while: exploring Graphify's command surface)_
- **Eye searchlight sweep + drifting embers** — at rest, a slow narrow beam from the Eye scans the
  skyline, and embers drift up from the tower; deepens the lore anchor without stealing focus.
  _(src: Claude · while: making the Eye of Sauron more pronounced)_
- **Tie billboard ticker prices to the real sim market** — the marquee prices are independent seeded
  walks; driving them from the actual sim tape (or the `/pulse` cohort data) would make the city
  cohere with the trend it sits under. _(src: Claude · while: adding ticker billboards)_
- **Reduced-motion "distant flash"** — under `prefers-reduced-motion` the storm never fires lightning
  (rainT never reaches the threshold); render one static distant flash so the frozen frame still reads
  as a storm. _(src: Claude · while: adding the rain + lightning storm)_
- **Verify + polish the 3-bot board** — with Sauron added, sanity-check the leaderboard /
  bots-vs-humans / compare views with three bots (ordering, cohort aggregates, spacing). The offline
  server render got interrupted and was never confirmed. _(src: Claude · while: adding the Sauron persona)_
- **Login canvas frame-budget audit** — the login now stacks rain + weather + Eye + city + beams +
  playcall; a quick perf pass (frame cap, offscreen work, DPR cost) would protect the "lovable" feel
  on weaker devices. _(src: Claude · while: layering cityscape effects)_
- **Persona WATCHING richness parity** — the playcall's WATCHING/fear-greed panel is rich; the six
  older personas have plain one-line theses. A light pass could give each a signature "watches"
  signal, feeding the future lore cards. _(src: Claude · while: adding the Sauron persona)_

### Eric's governance calls (do not build unattended)
- **Feedback triage / auto-fix automation** on the issues the in-app funnel now creates. (task #74)
- **Self-service "request feedback access"** collaborator flow — largely *superseded* by the in-app
  feedback funnel (PR #80); likely closeable. (task #76)
- **History / persistence backend** — shipped and recording; consumption tracked in
  [`plans/history-layer.md`](plans/history-layer.md). Still Eric's to settle: retention (keep
  forever vs prune), and whether to add an off-machine backup export beyond Fly's default snapshots.
  Win rate and "which plays worked" still need the per-fill ledger (S7+), not equity samples.

---

## In progress

_(nothing right now)_

---

## Shipped (recent)

- Morning brief reads the full event horizon (CPI/FOMC/sector, not just earnings prints) —
  the pipeline canary, first handoff the build machinery executed end-to-end — PR #371
- Nation skylines on `/bots-vs-humans` — each cohort's holdings aggregated by ticker into one country skyline — PR (this)
- Empire thumbnails on the board — a compact skyline per participant card on `/` (region of cities) — PR (this)
- Empire skyline on `/u/:id` — positions → a domain-themed city (Living Universe P2, first slice) — PR (this)
- Persona character cards on `/u/:id` (lore mechanism half of #79) — persona-lore registry threaded
  via `personaId`, the approach Graphify's `path` query pointed to — PR (this)
- Eye of Sauron crowns a left-side empire tower and commands the tractor beam — PR #88, #89
- Sauron persona (the cold order-imposer bot) — PR #87
- Taller RSI oscillator lane — PR #86
- Cityscape: rain + blue-lightning storm — PR #85
- Cityscape: sparse red/amber accents — PR #84
- Cityscape: market-hours lighting — PR #83
- Cityscape: ticker billboards — PR #82
- In-app self-service feedback funnel + setup runbook — PR #80, #81

- **Lint the workflow files properly (`actionlint`).** `scripts/workflow-lint.mjs` now catches
  duplicate keys, dangling `steps.*` refs, dangling `needs:`, unfiltered `workflow_run`, and prompt
  shims pointing at nothing — but that is five rules hand-written after three incidents.
  `actionlint` covers the whole class — bad `needs:` graphs, undefined `steps.*` contexts
  (the orphaned `tier` step's output was referenced by nothing and flagged by nothing), shell
  problems inside `run:` blocks, expression typos. A devDependency, so it is outside the envelope's
  new-runtime-dep rule. _(src: Claude · while: resolving the #476 duplicate-job merge on PR #474)_

- **Confirm branch protection actually requires `verify` on `main`.** The deploy job's comment
  asserts "merged commits are already verified (branch protection required `verify`)" and skips the
  suite on that basis. The 2026-08-22 undeployed-main incident showed nothing in the system would
  notice if that protection were absent or misconfigured — and a wrong assumption there means an
  unverified commit deploys straight to Fly. Cheap to check (one API read of the branch protection
  rules); worth a spec that reads the live rule and fails if `verify` is not a required check.
  _(src: Claude · while: tracing why PR #492 merged but never deployed)_

- **`incident-scan` never fires in CI — the gate only bites locally.** The `Test (Rstest)` step in
  `pipeline.yml` passes no `GH_TOKEN`, so `tests/arch/lessons.spec.ts` degrades to a clean no-op on
  every CI run; the unlearned-incident budget is enforced only when someone happens to run `npm test`
  with a token in their environment. That is how 7 unlearned incidents accumulated while `main` stayed
  green. Passing `GH_TOKEN` to that step is a workflow-file change (carve-out), so it needs Eric's
  merge — worth pairing with whatever else next touches `pipeline.yml`.
  _(src: Claude · while: reviewing PR #495, which self-reported the pre-existing failure)_

- **Earnings-calendar coverage check.** The MU sweep's red team found the S2 flat-through-print
  guard silently blind to MU because `src/domain/earnings-calendar.ts` had no row — and the gap
  is systemic: every roster addition escapes the guard until someone seeds a row. Worth a spec
  that diffs the traded universe against `UPCOMING_PRINTS` and fails on any uncovered symbol.
  _(src: Claude · while: MU symbol-sweep red team, 2026-08-22)_

- **Retail-flow instrument for constraint peaks.** Eric's hypothesis (2026-08-22): retail
  overinvests in hardware-constraint names expecting AI-style continued growth, then the peak
  produces an emotional pullback. The July-2026 MU tape (−39% on a price-hike *deceleration*)
  confirms the pullback half; the overinvestment half is untestable here — no retail-vs-
  institutional flow data source exists in the repo. Candidate instruments: retail net-flow
  datasets, options open-interest skew by account class, the 6× forward multiple as the
  institutional-refusal proxy. Do not trade the hypothesis before an instrument exists.
  _(src: Eric · while: AI-hardware constraint research, 2026-08-22)_

- **AI monetization + labor-displacement macro thesis.** Eric (2026-08-22): tech companies begin
  monetizing AI near-term; the low/high-performer gap plus fewer-roles pressure produces
  significant layoffs. Adjacent tape evidence already in hand: model-lab revenue is now the
  tripwire that moves the complex (Anthropic ARR whisper-miss broke the 08-18 tape). Parked as a
  research question — what would the tradeable expression even be (software margins? staffing
  firms inverse?) — not buildable until framed.
  _(src: Eric · while: AI-hardware constraint research, 2026-08-22)_

- **Absent vs. vanished: a store's boundary should be able to tell them apart.** `FileAllowlistStore.entries()`
  reports loudly when the blob is unreadable but returns `[]` in silence when the file simply isn't
  there — and those are very different facts. "Never existed" is the normal first-boot state;
  "existed on the last boot and is gone now" is an incident, and it is what a lost volume, a bad
  mount, or an unpinned path all look like. A written-once marker beside the store (or a recorded
  entry count) would let the boundary say which it is. The same blind spot applies to the participant
  store and the history/insight stores.
  _(src: Claude · while: root-causing the guest-list lockout, 2026-08-25)_

- **`SKYNET_AUDIT_DIR` and `SKYNET_HALT_FILE` are inert in production.** Both are read on the
  autonomy path (`src/scripts/run-autonomous.ts`) with **no default** — `SKYNET_AUDIT_DIR` builds a
  `JsonlAuditStore` only when set, and the halt-file check is skipped when unset — and neither is set
  in `fly.toml`. So the deployed bots process writes no decision audit and honors no kill-file. That
  is a safety/observability decision (turning them on changes behavior), not the persistence bug next
  door, so it was deliberately left out of that diff. Worth deciding on its own: the halt file is the
  manual stop for a live autonomous trader.
  _(src: Claude · while: root-causing the guest-list lockout, 2026-08-25)_

- **Bots don't trade options — not restricted, just not built.** The desk's progression ladder
  (`domain/trade-types.ts`, `progression.ts`) is a human-only teaching gate on the manual `/trade`
  ticket; the autonomous loop (`run-autonomous.ts`, every persona, `trading-engine.ts`) never
  references it and never emits an options order — the engine only knows stock buy/sell. So
  "bots shouldn't have to follow the restriction" has no restriction to lift; giving bots options
  means building execution for it into the engine + a persona strategy that uses it, which is a
  real design surface (which structures, how sized, how a persona decides strike/expiry) worth its
  own framing before anyone builds toward it — not a flag to flip.
  _(src: Eric · while: account-connection follow-up, 2026-08-25)_

- **Let a member comment on someone ELSE's feedback from inside the app, not just their own.**
  The Wire (`/wire`, 2026-08-25) surfaces every member's filed feedback so people can see and get
  inspired by each other's ideas, and links each item out to its GitHub issue for the real
  discussion — but `feedback-followup.ts`'s in-app "Follow up" only lets a member comment on an
  issue **they themselves filed** (ownership is checked against their own logged filings). Widening
  that to "comment on anyone's open item" is a real design surface of its own — what identity shows
  on the comment (the same opaque-id-only rule as filing?), throttling shared across all commenters
  posting through one bot token, and whether it's worth building at all versus just teaching people
  the GitHub-native path (create an account, comment there) that already works today at zero
  engineering cost. Deliberately not built in the same slice as The Wire.
  _(src: Eric · while: "let users post directly on the issue," activity dashboard request, 2026-08-25)_

- **Only Eric's `@claude` mentions actually trigger anything today — the onramp copy has to say so.**
  `.github/workflows/claude.yml`'s gate requires `author_association` of OWNER/MEMBER/COLLABORATOR;
  a friend-and-family member who signs up for a fresh GitHub account and tags `@claude` on an issue
  gets silently ignored (by design — no reply rewards an unauthorized mention) unless Eric has
  separately added them as a repo collaborator. The Wire's onramp copy says this plainly rather than
  overpromising, but the actual fix — deciding whether trusted members should get collaborator
  access so the mention they're taught to use actually works — is Eric's call (repo access is the
  irreversible class) and worth deciding once rather than leaving every onramping member to discover
  the gap by a comment that goes nowhere.
  _(src: Claude · while: building The Wire's GitHub onramp, 2026-08-25)_

- **`dashboard-server.ts` is back at its ceiling (870/870) the moment `/wire` landed.** It's the
  single largest "OVER→raised" file in the repo now, and every new top-level route adds another
  branch to its one dispatch function. The Wire PR raised the budget rather than decomposing it
  (out of scope for a feature PR), but the file is a standing decompose candidate — a natural split
  is by route family (trade/research/feedback/wire already delegate to their own `serve*Route`; the
  remaining self-service/account/positions branches could follow the same pattern) rather than
  waiting for the next feature to push it further over.
  _(src: Claude · while: building The Wire, 2026-08-25)_

### `ship.sh verifybody <pr>` — lint what GitHub actually stored, not the file you sent
`checkbody` lints a body **file**; nothing checks the body GitHub ended up with. That gap is exactly
how the fridge rule shipped unfolded on #561 (LESSONS.md, 2026-08-25): the MCP write tools stripped
`<details>` and the file-side lint still passed. A `verifybody` subcommand — fetch the stored body
over REST, pipe it through the existing `cmd_checkbody`, exit non-zero on a mismatch — closes it
mechanically and costs one curl. Could run as a post-open step inside `ship.sh open` itself, so the
check is automatic rather than remembered. _(src: Claude · while: research-lab readability PR, 2026-08-25)_

<!-- AUTO-GENERATED — do not hand-edit below the marker.
     Regenerate: `npm run graph:refresh` (free, no API). Kept fresh automatically on push to main
     by .github/workflows/graph-refresh.yml. The live graph lives in graphify-out/ (git-ignored). -->

# Structural map (Graphify)

The repo's **code** as a knowledge graph — the durable, navigable structure view, generated from the
AST. This is the *code-dependency* lens ("how is it wired / what breaks if I change X"), distinct from
the *product/systems* lens ("what exists, how mature, where to aim"). To navigate live, use
`graphify explain/path/query` — see the playbook in [`GRAPHIFY.md`](GRAPHIFY.md).

<!-- BEGIN GENERATED REPORT -->

# Graph Report - .  (2026-07-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1233 nodes · 2750 edges · 83 communities (74 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e36f96e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- JsonResponse
- run-autonomous.ts
- data-source.ts
- CHANGELOG.md
- Portfolio
- project.ts
- load-participants.ts
- biome.json
- Persona
- dashboard-server.ts
- Communities (19 total, 0 thin omitted)
- render-dashboard.ts
- compilerOptions
- trading-engine.spec.ts
- trading-engine.ts
- participant-store.ts
- Bug Fixes
- authenticator.ts
- OrderIntent
- cycle-report-store.ts
- scripts
- dashboard-data.ts
- renderIndividualBody
- DecisionRecord
- sentiment-tracker.ts
- history-store.ts
- escapeHtml
- devDependencies
- providers.ts
- dashboard-server.spec.ts
- The Living Universe — the cityscape as a shared, legible world
- types.ts
- DashboardData
- participant-snapshot.ts
- reduce.ts
- Authenticator
- Running the Live Server (and keeping the laptop awake)
- plays.ts
- authenticator.spec.ts
- README.md
- Brand & Identity System — Skynet Capital
- Engineering Practices — Skynet Capital
- play-feedback.ts
- participantUnrealized
- alpaca-connect.ts
- In-App Feedback → GitHub Issues
- Inbox (captured, not yet started)
- The Operating Model — portable (lift & shift)
- shoot-login.mjs
- Contributing
- Deploying the Live Dashboard (public, always-on)
- package.json
- Skynet Capital
- serve-dashboard.ts
- Idea capture & routing (the adapter pattern)
- BCP × Structural Map — integration spec
- The Observatory Dashboard
- equity-sparkline.ts
- JsonlHistoryStore
- ADR-NNNN: <short title>
- ADR-0001: Host the live dashboard as an always-on Fly.io service
- ADR-0002: Offline data-source mode for keyless local runs
- ADR-0003: Self-service account onboarding via an encrypted store
- ADR-0004: Continuous deployment to Fly on green merge to main
- ADR-0005: In-app Google/GitHub OAuth with an allowlist
- ADR-0006: Publish the OAuth consent screen; the allowlist is the access gate
- adr/README.md
- Gamify the dashboard
- Skynet Capital — Interest-Poll Email
- Autonomous Trading
- Bots — Personas on Paper Accounts
- Graphify playbook — navigate & de-risk fast
- Skynet Capital — Launch Email
- [1.10.0](https://github.com/ejclark/skynet-capital/compare/v1.9.1...v1.10.0) (2026-07-26)
- @commitlint/config-conventional
- @semantic-release/changelog
- @types/node
- tsx
- typescript
- refresh-graph.sh

## God Nodes (most connected - your core abstractions)
1. `Features` - 64 edges
2. `MarketContext` - 43 edges
3. `OrderIntent` - 40 edges
4. `Persona` - 35 edges
5. `Portfolio` - 33 edges
6. `JsonResponse` - 32 edges
7. `AlpacaTradingTransport` - 24 edges
8. `AlpacaTradingClient` - 22 edges
9. `heldQuantity()` - 20 edges
10. `renderIndividualBody()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `startHistorySampler()` --indirect_call--> `sample()`  [INFERRED]
  src/observatory/history-sampler.ts → tests/observatory/history-store.spec.ts
- `reduceObservatory()` --indirect_call--> `p()`  [INFERRED]
  src/observatory/reduce.ts → tests/observatory/history-sampler.spec.ts
- `renderLeaderboardBody()` --indirect_call--> `p()`  [INFERRED]
  src/observatory/render-dashboard.ts → tests/observatory/history-sampler.spec.ts
- `holdingsCompare()` --indirect_call--> `s()`  [INFERRED]
  src/observatory/render-dashboard.ts → tests/observatory/equity-sparkline.spec.ts
- `comparePicker()` --indirect_call--> `p()`  [INFERRED]
  src/observatory/render-dashboard.ts → tests/observatory/history-sampler.spec.ts

## Import Cycles
- None detected.

## Communities (83 total, 9 thin omitted)

### Community 0 - "JsonResponse"
Cohesion: 0.05
Nodes (31): AlpacaBrokerAdapter, FixtureTradingTransport, ok(), AlpacaAccount, AlpacaApiError, AlpacaOrder, AlpacaPosition, AlpacaTradingClient (+23 more)

### Community 1 - "run-autonomous.ts"
Cohesion: 0.06
Nodes (39): TraderMode, MomentumTracker, assessReadiness(), ReadinessInputs, ReadinessResult, BreakerConfig, DEFAULT_BREAKERS, HaltReason (+31 more)

### Community 2 - "data-source.ts"
Cohesion: 0.07
Nodes (32): AccountFixture, parseEventsJsonl(), ReplayEventStream, ReplayEventStreamConfig, toEventsJsonl(), AlpacaMarketDataStream, AlpacaMarketMessage, priceEventFromMessage() (+24 more)

### Community 3 - "CHANGELOG.md"
Cohesion: 0.07
Nodes (55): 1.0.0 (2026-07-24), [1.11.0](https://github.com/ejclark/skynet-capital/compare/v1.10.0...v1.11.0) (2026-07-26), [1.12.0](https://github.com/ejclark/skynet-capital/compare/v1.11.0...v1.12.0) (2026-07-26), [1.13.0](https://github.com/ejclark/skynet-capital/compare/v1.12.0...v1.13.0) (2026-07-26), [1.14.0](https://github.com/ejclark/skynet-capital/compare/v1.13.0...v1.14.0) (2026-07-26), [1.16.0](https://github.com/ejclark/skynet-capital/compare/v1.15.0...v1.16.0) (2026-07-26), [1.17.0](https://github.com/ejclark/skynet-capital/compare/v1.16.0...v1.17.0) (2026-07-26), [1.18.0](https://github.com/ejclark/skynet-capital/compare/v1.17.0...v1.18.0) (2026-07-26) (+47 more)

### Community 4 - "Portfolio"
Cohesion: 0.11
Nodes (22): computeEquity(), heldQuantity(), positionFor(), Portfolio, applyGuards(), clampBuy(), clampSell(), DEFAULT_NEWS_FADER_CONFIG (+14 more)

### Community 5 - "project.ts"
Cohesion: 0.11
Nodes (30): briefMoney(), building(), capColorOf(), foundingReserve(), renderEmpireSkyline(), renderEyeEmblem(), SkylineOptions, clamp() (+22 more)

### Community 6 - "load-participants.ts"
Cohesion: 0.12
Nodes (22): Bot, BotCredentials, credentialEnvNames(), BotLoadResult, loadBots(), buildDashboardData(), BuildDashboardOptions, PERSONA_LORE (+14 more)

### Community 7 - "biome.json"
Cohesion: 0.07
Nodes (29): files, ignore, formatter, enabled, indentStyle, indentWidth, lineWidth, quoteStyle (+21 more)

### Community 8 - "Persona"
Cohesion: 0.14
Nodes (10): BankerConfig, BankerPersona, DEFAULT_BANKER_CONFIG, DayTraderConfig, DayTraderPersona, DEFAULT_DAY_TRADER_CONFIG, Persona, AlwaysBuys (+2 more)

### Community 9 - "dashboard-server.ts"
Cohesion: 0.15
Nodes (26): LeaderMetric, NavContext, NavView, addFormHtml(), addResultHtml(), addShell(), baseUrlFrom(), DashboardServerConfig (+18 more)

### Community 10 - "Communities (19 total, 0 thin omitted)"
Cohesion: 0.07
Nodes (28): Communities (19 total, 0 thin omitted), Community 0 - "MarketContext", Community 10 - "cycle-report-store.ts", Community 11 - "session.ts", Community 12 - "authenticator.ts", Community 13 - "Authenticator", Community 14 - "dashboard-server.spec.ts", Community 15 - "alpaca-connect.ts" (+20 more)

### Community 11 - "render-dashboard.ts"
Cohesion: 0.14
Nodes (22): Course, courseComplete(), CourseLevel, COURSES, Milestone, pointsFor(), Rank, rankFor() (+14 more)

### Community 12 - "compilerOptions"
Cohesion: 0.08
Nodes (23): ES2023, node, @rstest/core/globals, src, tests, vitest.config.ts, compilerOptions, esModuleInterop (+15 more)

### Community 13 - "trading-engine.spec.ts"
Cohesion: 0.22
Nodes (7): DEFAULT_FUTURIST_CONFIG, FuturistConfig, FuturistPersona, aContext(), aPortfolio(), aPosition(), aQuote()

### Community 14 - "trading-engine.ts"
Cohesion: 0.20
Nodes (13): AutonomousTrader, createBotBroker(), DEFAULT_RISK_CONFIG, RiskConfig, TradingEngine, TradingEngineOptions, BrokerPort, MarketDataPort (+5 more)

### Community 15 - "participant-store.ts"
Cohesion: 0.13
Nodes (6): createParticipantStore(), Envelope, FileParticipantStore, ParticipantStore, StoredParticipant, MemStore

### Community 16 - "Bug Fixes"
Cohesion: 0.10
Nodes (21): [1.14.1](https://github.com/ejclark/skynet-capital/compare/v1.14.0...v1.14.1) (2026-07-26), [1.14.2](https://github.com/ejclark/skynet-capital/compare/v1.14.1...v1.14.2) (2026-07-26), [1.14.3](https://github.com/ejclark/skynet-capital/compare/v1.14.2...v1.14.3) (2026-07-26), [1.15.0](https://github.com/ejclark/skynet-capital/compare/v1.14.3...v1.15.0) (2026-07-26), [1.29.1](https://github.com/ejclark/skynet-capital/compare/v1.29.0...v1.29.1) (2026-07-26), [1.2.1](https://github.com/ejclark/skynet-capital/compare/v1.2.0...v1.2.1) (2026-07-24), [1.30.0](https://github.com/ejclark/skynet-capital/compare/v1.29.1...v1.30.0) (2026-07-26), [1.30.1](https://github.com/ejclark/skynet-capital/compare/v1.30.0...v1.30.1) (2026-07-26) (+13 more)

### Community 17 - "authenticator.ts"
Cohesion: 0.22
Nodes (17): APP_VERSION, AuthDeps, Env, base64url(), clearSessionCookie(), cookie(), CookieOptions, fromBase64url() (+9 more)

### Community 18 - "OrderIntent"
Cohesion: 0.24
Nodes (7): InMemoryBroker, CycleAction, IntentOutcome, OrderIntent, OrderResult, Quote, StubPersona

### Community 19 - "cycle-report-store.ts"
Cohesion: 0.22
Nodes (4): CycleReport, InMemoryCycleReportStore, PersistedCycleReport, JsonlCycleReportStore

### Community 20 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, eval:persona, eval:safety, export:dashboard, format, lint, lint:fix, prepare (+9 more)

### Community 21 - "dashboard-data.ts"
Cohesion: 0.24
Nodes (11): AlpacaCredentials, TradingClientFactory, buildParticipantSnapshot(), readActivity(), Participant, ParticipantKind, AddParticipantInput, AddResult (+3 more)

### Community 22 - "renderIndividualBody"
Cohesion: 0.24
Nodes (17): activityFeed(), activityRow(), cohortCard(), compareColumn(), formatActivityTime(), formatCurrency(), formatMetric(), formatSigned() (+9 more)

### Community 23 - "DecisionRecord"
Cohesion: 0.21
Nodes (4): AutonomousTraderConfig, AuditStore, DecisionRecord, JsonlAuditStore

### Community 24 - "sentiment-tracker.ts"
Cohesion: 0.21
Nodes (5): NewsArticle, NEGATIVE, POSITIVE, scoreSentiment(), SentimentTracker

### Community 25 - "history-store.ts"
Cohesion: 0.23
Nodes (7): HistorySamplerOptions, sampleAll(), startHistorySampler(), EquitySample, HistoryStore, InMemoryHistoryStore, sample()

### Community 26 - "escapeHtml"
Cohesion: 0.24
Nodes (15): chip(), compareCities(), comparePicker(), courseCard(), decisionsPanel(), deltaRow(), escapeHtml(), formatTimestamp() (+7 more)

### Community 27 - "devDependencies"
Cohesion: 0.13
Nodes (15): @biomejs/biome, @commitlint/cli, husky, devDependencies, @biomejs/biome, @commitlint/cli, husky, playwright-core (+7 more)

### Community 28 - "providers.ts"
Cohesion: 0.15
Nodes (6): githubProvider(), googleProvider(), OAuthIdentity, OAuthProvider, ProviderConfig, ProviderId

### Community 29 - "dashboard-server.spec.ts"
Cohesion: 0.18
Nodes (12): createDashboardServer(), createFeedbackIssue(), FeedbackConfig, FeedbackInput, FeedbackKind, FeedbackResult, issueBody(), LABELS (+4 more)

### Community 30 - "The Living Universe — the cityscape as a shared, legible world"
Cohesion: 0.15
Nodes (13): Boundaries & consent, Construction = investment maturing (not yet paid out), Foundations we can build on today, Personalized empires by domain, Phased roadmap (each phase a trust stepping stone), Scale across the four views, The autonomous-contribution system — GOVERNANCE (Eric's calls; not built unattended), The idea (+5 more)

### Community 31 - "types.ts"
Cohesion: 0.16
Nodes (8): ScriptedMarketData, AssetClass, MarketContext, OrderStatus, Position, DEFAULT_GOLD_BUG_CONFIG, GoldBugConfig, GoldBugPersona

### Community 32 - "DashboardData"
Cohesion: 0.24
Nodes (4): DashboardData, sampleDashboardData(), Listener, ObservatoryHub

### Community 33 - "participant-snapshot.ts"
Cohesion: 0.23
Nodes (3): ActivityView, ParticipantSnapshot, PositionView

### Community 34 - "reduce.ts"
Cohesion: 0.32
Nodes (9): applyBuy(), applyFill(), applyPrice(), applySell(), applyToParticipants(), reduceObservatory(), reprice(), baseState() (+1 more)

### Community 35 - "Authenticator"
Cohesion: 0.20
Nodes (4): Authenticator, escapeHtml(), providerGlyph(), redirect()

### Community 36 - "Running the Live Server (and keeping the laptop awake)"
Cohesion: 0.18
Nodes (10): Keep it running across restarts (optional), Keep the laptop awake with the server running, Linux — systemd-inhibit, macOS — `caffeinate` (simplest), Node version, Offline mode — run without Alpaca (no keys, no network), Record a real session to replay later, Running the Live Server (and keeping the laptop awake) (+2 more)

### Community 37 - "plays.ts"
Cohesion: 0.29
Nodes (9): firstPlay(), isLocked(), Play, PLAY_LEVELS, PlayLevel, PlayLevelMeta, PLAYS, playsAtLevel() (+1 more)

### Community 38 - "authenticator.spec.ts"
Cohesion: 0.24
Nodes (6): asRes(), ENV, FakeRes, req(), res(), signIn()

### Community 40 - "Brand & Identity System — Skynet Capital"
Cohesion: 0.20
Nodes (10): Brand & Identity System — Skynet Capital, Cohesion rules (how new work stays on-brand), Color (dark-first, with a fully-considered light theme), Core metaphors & motifs, Essence, Honesty & domain-accuracy rules (non-negotiable), Identity anchors (Graphify god-nodes → where cohesion lives most vividly), The signature — the Living Universe (+2 more)

### Community 41 - "Engineering Practices — Skynet Capital"
Cohesion: 0.20
Nodes (10): Architecture decisions, Component libraries & consistent look/feel, Decomposition — explicitly named modules, no dumping grounds, DRY, with a bias toward one owner per concept, Engineering Practices — Skynet Capital, Lovable DX / UX, Ports & Adapters (Hexagonal), Stack (+2 more)

### Community 42 - "play-feedback.ts"
Cohesion: 0.31
Nodes (7): esc(), money(), PlayOutcome, PlayResult, renderPlayFeedbackLog(), RESULT_LABEL, row()

### Community 43 - "participantUnrealized"
Cohesion: 0.40
Nodes (10): botLandmarkProminence(), CohortStats, metricValue(), orderParticipants(), participantInvested(), participantReturnPct(), participantUnrealized(), renderBoardContent() (+2 more)

### Community 44 - "alpaca-connect.ts"
Cohesion: 0.24
Nodes (4): AlpacaConnectConfig, AlpacaConnection, alpacaConnectProvider, FetchFn

### Community 45 - "In-App Feedback → GitHub Issues"
Cohesion: 0.22
Nodes (8): 1. Create a scoped bot token (fine-grained PAT), 2. Give the token to the app, Guardrails, In-App Feedback → GitHub Issues, One-time setup, Rotation, Troubleshooting, Verify it's live

### Community 46 - "Inbox (captured, not yet started)"
Cohesion: 0.22
Nodes (9): Feedback / engagement, Governance — Eric's calls (do not build unattended), Ideas & Backlog, In progress, Inbox (captured, not yet started), Larger tasks (need dedicated focus), North-star epic — the Living Universe (see [`LIVING-UNIVERSE.md`](LIVING-UNIVERSE.md)), Shipped (recent) (+1 more)

### Community 47 - "The Operating Model — portable (lift & shift)"
Cohesion: 0.22
Nodes (9): Activation prompt, Brand Cohesion Protocol (BCP), `BRAND.md` (template), `CLAUDE.md` (template), `docs/IDEAS.md` (template), Handoff to a structural mapper (e.g. Graphify), Templates, The Operating Model — portable (lift & shift) (+1 more)

### Community 48 - "shoot-login.mjs"
Cohesion: 0.25
Nodes (8): auth, CANDIDATES, EXE, idle, shootAt(), sleep(), parseList(), resolveAuth()

### Community 49 - "Contributing"
Cohesion: 0.25
Nodes (7): Before opening a PR, Contributing, Conventional Commits (required), Keeping agent sessions moving (no PR churn), Merging — auto-merge on green, no babysitting, One-time repository setup (admin), Releases

### Community 50 - "Deploying the Live Dashboard (public, always-on)"
Cohesion: 0.25
Nodes (7): After deploying, Continuous deployment (merge → deploy), Deploying the Live Dashboard (public, always-on), Fly.io (recommended), Per-user login (Google + GitHub OAuth), Render / Railway (same Docker image), Self-service onboarding (`/add`)

### Community 51 - "package.json"
Cohesion: 0.25
Nodes (7): description, engines, node, name, private, type, version

### Community 52 - "Skynet Capital"
Cohesion: 0.25
Nodes (8): For Developers, How It Works, Roadmap, Skynet Capital, The Idea, Touch Points — Keeping It Alive, Where This Could Go, Why

### Community 53 - "serve-dashboard.ts"
Cohesion: 0.39
Nodes (5): createHistoryStore(), dedupeById(), main(), PORT, resolvePort()

### Community 54 - "Idea capture & routing (the adapter pattern)"
Cohesion: 0.29
Nodes (7): Idea capture & routing (the adapter pattern), Interrupt economics — protect Eric's attention, Ship loop (quick reference), Side quests — Claude generates ideas too, Skynet Capital — working notes for Claude, Synthesis & the question budget (front-load, then taper), How we work

### Community 55 - "BCP × Structural Map — integration spec"
Cohesion: 0.29
Nodes (7): BCP × Structural Map — integration spec, Flow, Mapping rules, Open questions (for a Graphify-scoped session), The pipeline, What BCP consumes from the map, Worked example (real — Graphify run 2026-07-26)

### Community 56 - "The Observatory Dashboard"
Cohesion: 0.29
Nodes (6): Data flow, Design, Generate it from live accounts, How it stays fresh ("auto-updating"), Realtime live server (no polling), The Observatory Dashboard

### Community 57 - "equity-sparkline.ts"
Cohesion: 0.52
Nodes (5): equityChange(), equityDrawdown(), renderEquitySparkline(), SparklineOptions, historyPanel()

### Community 59 - "ADR-NNNN: <short title>"
Cohesion: 0.33
Nodes (5): ADR-NNNN: <short title>, Alternatives considered, Consequences, Context, Decision

### Community 60 - "ADR-0001: Host the live dashboard as an always-on Fly.io service"
Cohesion: 0.33
Nodes (5): ADR-0001: Host the live dashboard as an always-on Fly.io service, Alternatives considered, Consequences, Context, Decision

### Community 61 - "ADR-0002: Offline data-source mode for keyless local runs"
Cohesion: 0.33
Nodes (5): ADR-0002: Offline data-source mode for keyless local runs, Alternatives considered, Consequences, Context, Decision

### Community 62 - "ADR-0003: Self-service account onboarding via an encrypted store"
Cohesion: 0.33
Nodes (5): ADR-0003: Self-service account onboarding via an encrypted store, Alternatives considered, Consequences, Context, Decision

### Community 63 - "ADR-0004: Continuous deployment to Fly on green merge to main"
Cohesion: 0.33
Nodes (5): ADR-0004: Continuous deployment to Fly on green merge to main, Alternatives considered, Consequences, Context, Decision

### Community 64 - "ADR-0005: In-app Google/GitHub OAuth with an allowlist"
Cohesion: 0.33
Nodes (5): ADR-0005: In-app Google/GitHub OAuth with an allowlist, Alternatives considered, Consequences, Context, Decision

### Community 65 - "ADR-0006: Publish the OAuth consent screen; the allowlist is the access gate"
Cohesion: 0.33
Nodes (5): ADR-0006: Publish the OAuth consent screen; the allowlist is the access gate, Alternatives considered, Consequences, Context, Decision

### Community 66 - "adr/README.md"
Cohesion: 0.33
Nodes (4): Architecture Decision Records, How, Log, When to write one

### Community 67 - "Gamify the dashboard"
Cohesion: 0.33
Nodes (5): Backlog, Gamify the dashboard, Measurements, Milestones / trophies, Notes for implementation

### Community 68 - "Skynet Capital — Interest-Poll Email"
Cohesion: 0.33
Nodes (5): Body, Notes for Eric, Recipients, Skynet Capital — Interest-Poll Email, Subject line options

### Community 69 - "Autonomous Trading"
Cohesion: 0.40
Nodes (4): Autonomous Trading, How it works, Run it, Safety notes

### Community 70 - "Bots — Personas on Paper Accounts"
Cohesion: 0.40
Nodes (4): Bots — Personas on Paper Accounts, How a bot trades, Roadmap from here, Setup

### Community 71 - "Graphify playbook — navigate & de-risk fast"
Cohesion: 0.40
Nodes (5): Commands we actually use, Graphify playbook — navigate & de-risk fast, Not used unattended, The workflow (bake this into the ship loop), Worked wins (real, this repo)

### Community 72 - "Skynet Capital — Launch Email"
Cohesion: 0.40
Nodes (4): Body, Notes for Eric, Skynet Capital — Launch Email, Subject line options

## Knowledge Gaps
- **325 isolated node(s):** `$schema`, `enabled`, `clientKind`, `useIgnoreFile`, `enabled` (+320 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OrderIntent` connect `OrderIntent` to `JsonResponse`, `run-autonomous.ts`, `Portfolio`, `Persona`, `trading-engine.spec.ts`, `trading-engine.ts`, `cycle-report-store.ts`, `types.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `Persona` connect `Persona` to `run-autonomous.ts`, `Portfolio`, `load-participants.ts`, `trading-engine.spec.ts`, `trading-engine.ts`, `OrderIntent`, `types.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `$schema`, `enabled`, `clientKind` to the rest of the system?**
  _325 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `JsonResponse` be split into smaller, more focused modules?**
  _Cohesion score 0.0522466039707419 - nodes in this community are weakly interconnected._
- **Should `run-autonomous.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06252587991718427 - nodes in this community are weakly interconnected._
- **Should `data-source.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06775956284153005 - nodes in this community are weakly interconnected._
- **Should `CHANGELOG.md` be split into smaller, more focused modules?**
  _Cohesion score 0.07012987012987013 - nodes in this community are weakly interconnected._
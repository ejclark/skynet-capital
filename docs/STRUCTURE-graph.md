<!-- AUTO-GENERATED — do not hand-edit below the marker.
     Regenerate: `npm run graph:refresh` (free, no API). Kept fresh automatically on push to main
     by .github/workflows/graph-refresh.yml. The live graph lives in graphify-out/ (git-ignored). -->

# Structural map (Graphify)

The repo's **code** as a knowledge graph — the durable, navigable structure view, generated from the
AST. This is the *code-dependency* lens ("how is it wired / what breaks if I change X"), distinct from
the *product/systems* lens ("what exists, how mature, where to aim"). To navigate live, use
`graphify explain/path/query` — see the playbook in [`GRAPHIFY.md`](GRAPHIFY.md).

<!-- BEGIN GENERATED REPORT -->

# Graph Report - skynet-capital  (2026-08-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2602 nodes · 6724 edges · 149 communities (130 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `85f8a449`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- trade-routes.ts
- controls-form.ts
- MarketContext
- alpaca-trading-client.ts
- tower.ts
- events.ts
- escapeHtml
- dashboard-data.ts
- run-autonomous.ts
- guards.ts
- run-eval.ts
- personas/registry.ts
- ParticipantSnapshot
- Persona
- scripts
- history-store.ts
- render-dashboard.ts
- activity-store.ts
- observatory/morning-brief.ts
- devDependencies
- dashboard-server.ts
- research-service.ts
- standings-view.ts
- postmaster.mjs
- participant-store.ts
- feedback-coach.ts
- settings-view.ts
- account-service.spec.ts
- compilerOptions
- createDefaultPersonas
- markdown-preview.ts
- round-trips.ts
- config-audit.mjs
- research-view.ts
- feedback-routes.ts
- event-scan.mjs
- trade-desk.spec.ts
- issue-lint.mjs
- AlpacaTradingClient
- data-source.ts
- SafetyController
- account-forms.ts
- JsonlKeyedStore
- serve-dashboard.ts
- authenticator.ts
- alpaca-options-client.ts
- earnings-cycle.mjs
- participant-service.ts
- resolve-auth.ts
- intraday-edges.mjs
- session.ts
- participant-snapshot.ts
- invite-form.ts
- sentiment-tracker.ts
- research-view.spec.ts
- ci-medic.mjs
- feedback-view.ts
- fluid-layout.spec.ts
- feedback-service.ts
- shoot-tower.mjs
- incident-scan.mjs
- shoot-portfolio.mjs
- market-events.ts
- history-metrics.ts
- self-service-forms.ts
- package.json
- arch-scan.mjs
- history-boot.spec.ts
- confirm-print-dates.ts
- rules
- digest-scan.mjs
- doc-rot-scan.mjs
- ship.sh
- workflow-lint.mjs
- beta-scout.ts
- playbook.ts
- alpaca-connect.ts
- design-extract.mjs
- envelope-scan.mjs
- shoot-desk.mjs
- spec-gap-scan.mjs
- plays.ts
- render-morning-brief.ts
- Authenticator
- authenticator.spec.ts
- biome.json
- style
- symbol-sweep.js
- knip.json
- dupe-scan.mjs
- feedback-scan.mjs
- play-feedback.ts
- JsonlFeedbackLogStore
- page-shell.ts
- decision-context.ts
- includes
- context7
- deploy-lag.mjs
- clone-scan.mjs
- journey-scan.mjs
- shoot-login.mjs
- noExcessiveCognitiveComplexity
- dead-scan.mjs
- dep-graph-scan.mjs
- dev-tower.mjs
- design-extract.spec.ts
- formatter
- formatter
- useFilenamingConvention
- isAllowedIdentity
- source
- correctness
- dockerignore-research.spec.ts
- gh-json-fields.spec.ts
- deploy-lag.spec.ts
- postmaster.spec.ts
- smoke.sh
- worktree-setup.sh
- doc-rot.spec.ts
- envelope.spec.ts
- feedback-scan.spec.ts
- workflows.spec.ts
- assessment-cadence.spec.ts
- ci-medic.spec.ts
- model-tier.spec.ts
- FakeRes
- babylon-mcp-ensure.sh
- refresh-graph.sh
- setup-babylon-mcp.sh
- setup-commit-signing.sh
- landmark-prominence.spec.ts

## God Nodes (most connected - your core abstractions)
1. `escapeHtml()` - 101 edges
2. `MarketContext` - 71 edges
3. `OrderIntent` - 67 edges
4. `Portfolio` - 58 edges
5. `ParticipantSnapshot` - 45 edges
6. `scripts` - 43 edges
7. `JsonResponse` - 40 edges
8. `Persona` - 38 edges
9. `AlpacaTradingClient` - 34 edges
10. `formatCurrency()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `Idle` --implements--> `Persona`  [EXTRACTED]
  tests/autonomous/readiness.spec.ts → src/personas/persona.ts
- `StubPersona` --implements--> `Persona`  [EXTRACTED]
  tests/engine/trading-engine.spec.ts → src/personas/persona.ts
- `Crashy` --implements--> `Persona`  [EXTRACTED]
  tests/autonomous/readiness.spec.ts → src/personas/persona.ts
- `okPreview()` --calls--> `previewOptionOrder()`  [EXTRACTED]
  tests/observatory/option-review-view.spec.ts → src/trading/option-ticket.ts
- `withSettings()` --calls--> `handleDeskSettings()`  [EXTRACTED]
  tests/server/controls-form.spec.ts → src/server/controls-form.ts

## Import Cycles
- None detected.

## Communities (149 total, 19 thin omitted)

### Community 0 - "trade-routes.ts"
Cohesion: 0.05
Nodes (86): OptionChainRow, rowPremium(), STARTER_PLAYS, StarterPlay, starterPlayById(), defaultTradeType(), TRADE_TYPES, TradeSide (+78 more)

### Community 1 - "controls-form.ts"
Cohesion: 0.05
Nodes (50): BotControls, BotControlsClient, DISABLED_CLIENT, resolveBotControls(), CONTROLS_BRIDGE_PATH, ControlsState, effectiveHardcoreIds(), EMPTY_CONTROLS (+42 more)

### Community 2 - "MarketContext"
Cohesion: 0.09
Nodes (31): ScriptedMarketData, heldQuantity(), positionFor(), MarketContext, OrderIntent, OrderStatus, Portfolio, BankerConfig (+23 more)

### Community 3 - "alpaca-trading-client.ts"
Cohesion: 0.06
Nodes (25): FixtureTradingTransport, ok(), AlpacaAccount, AlpacaApiError, AlpacaTradingConfig, AlpacaTradingTransport, FetchAlpacaTradingTransport, fetchJson() (+17 more)

### Community 4 - "tower.ts"
Cohesion: 0.06
Nodes (54): clamp(), clamp01(), lerp(), attachEnvironment(), attachGodRays(), attachPost(), createStage(), gradeImage() (+46 more)

### Community 5 - "events.ts"
Cohesion: 0.06
Nodes (33): parseEventsJsonl(), ReplayEventStream, ReplayEventStreamConfig, toEventsJsonl(), AlpacaMarketDataStream, AlpacaMarketMessage, priceEventFromMessage(), MarketDataStreamConfig (+25 more)

### Community 6 - "escapeHtml"
Cohesion: 0.12
Nodes (39): deskLedger(), fillsFrom(), formatHold(), formatPctOrDash(), formatPrice(), formatRatio(), reviewLine(), reviewNotices() (+31 more)

### Community 7 - "dashboard-data.ts"
Cohesion: 0.09
Nodes (35): positionsFrom(), BuildDashboardOptions, TradingClientFactory, buildParticipantSnapshot(), Participant, AccountServiceDeps, updateProfile(), profileEditRefusal() (+27 more)

### Community 8 - "run-autonomous.ts"
Cohesion: 0.09
Nodes (32): AlpacaCredentials, effectiveMode(), MomentumTracker, guardAccountCollisions(), ALPACA_PAPER_BASE_URL, Bot, BotCredentials, createBotBroker() (+24 more)

### Community 9 - "guards.ts"
Cohesion: 0.13
Nodes (13): etTimeOf(), computeEquity(), applyGuards(), clampBuy(), clampDiscipline(), clampSell(), DEFAULT_RISK_CONFIG, CycleReport (+5 more)

### Community 10 - "run-eval.ts"
Cohesion: 0.10
Nodes (29): assessReadiness(), ReadinessInputs, ReadinessResult, Position, EvalReport, evaluatePersona(), formatReport(), runScenario() (+21 more)

### Community 11 - "personas/registry.ts"
Cohesion: 0.08
Nodes (23): BankerPersona, ConfiguredPersona, DayTraderPersona, GoldBugPersona, DEFAULT_NEWS_FADER_CONFIG, NewsFaderConfig, NewsFaderPersona, HARDCORE_BUILDS (+15 more)

### Community 12 - "ParticipantSnapshot"
Cohesion: 0.09
Nodes (33): PositionView, briefMoney(), building(), capColorOf(), foundingReserve(), renderEmpireSkyline(), renderEyeEmblem(), SkylineOptions (+25 more)

### Community 13 - "Persona"
Cohesion: 0.11
Nodes (24): InMemoryBroker, AutonomousTrader, AutonomousTraderConfig, TraderMode, CycleAction, DecisionRecord, IntentOutcome, BetaScoutDeps (+16 more)

### Community 14 - "scripts"
Cohesion: 0.05
Nodes (43): scripts, arch:scan, backfill:activity, brief:morning, build:scene, clone:scan, confirm:print-dates, dead:scan (+35 more)

### Community 15 - "history-store.ts"
Cohesion: 0.10
Nodes (16): CeremonyChannel, CeremonyListener, HistorySamplerOptions, sampleAll(), startHistorySampler(), EquitySample, HistoryStore, InMemoryHistoryStore (+8 more)

### Community 16 - "render-dashboard.ts"
Cohesion: 0.10
Nodes (29): Course, courseComplete(), CourseLevel, COURSES, Milestone, pointsFor(), Rank, rankFor() (+21 more)

### Community 17 - "activity-store.ts"
Cohesion: 0.10
Nodes (24): appendAdvancing(), backfillParticipantActivity(), BackfillResult, knownOrders(), reconcileBrokerActivity(), ACTIVITY_TYPES, ACTIVITY_WINDOWS, ActivitySource (+16 more)

### Community 18 - "observatory/morning-brief.ts"
Cohesion: 0.11
Nodes (28): dateOf(), daysUntil(), EarningsPrint, nextPrint(), PrintDateStatus, printWithin(), recentPrint(), TradeDiscipline (+20 more)

### Community 19 - "devDependencies"
Cohesion: 0.06
Nodes (33): @balena/dockerignore, @biomejs/biome, @commitlint/cli, dependency-cruiser, esbuild, husky, jscpd, knip (+25 more)

### Community 20 - "dashboard-server.ts"
Cohesion: 0.12
Nodes (27): DeskTab, PerformanceViewOptions, LeaderMetric, baseUrlFrom(), DashboardServerConfig, gateRequest(), handle(), isAuthorized() (+19 more)

### Community 21 - "research-service.ts"
Cohesion: 0.14
Nodes (22): asOfIso, CANDIDATES, EXE, nav, pages, MarketEvent, serveInfoRoute(), shellDocument() (+14 more)

### Community 22 - "standings-view.ts"
Cohesion: 0.13
Nodes (40): activityFeed(), activityRow(), CardOptions, participantCard(), participantInvested(), participantReturnPct(), participantUnrealized(), positionRow() (+32 more)

### Community 23 - "postmaster.mjs"
Cohesion: 0.14
Nodes (29): answered(), audit(), CLAIM_TTL_MS, claimAgeOf(), claimFailureReason(), claimFeedback(), claimHandoff(), claimStamp() (+21 more)

### Community 24 - "participant-store.ts"
Cohesion: 0.13
Nodes (6): FileParticipantStore, FileAllowlistStore, deriveKey(), Envelope, open(), seal()

### Community 25 - "feedback-coach.ts"
Cohesion: 0.12
Nodes (24): AREA_PROMPT_CLAUSE, areaFrom(), FeedbackArea, isFeedbackArea(), boundsError(), CoachConfig, coachHits, CoachInput (+16 more)

### Community 26 - "settings-view.ts"
Cohesion: 0.19
Nodes (16): DashboardViewOptions, DeskNotice, deskNoticeBanner(), DeskViewOptions, profileHref(), FleetBot, FleetControls, fleetPanel() (+8 more)

### Community 27 - "account-service.spec.ts"
Cohesion: 0.10
Nodes (12): ParticipantStore, StoredParticipant, removeAccountSync(), requireEditable(), ann, board(), bot, makeService() (+4 more)

### Community 28 - "compilerOptions"
Cohesion: 0.07
Nodes (26): DOM, ES2023, node, @rstest/core/globals, src, tests, vitest.config.ts, compilerOptions (+18 more)

### Community 29 - "createDefaultPersonas"
Cohesion: 0.15
Nodes (17): buildDashboardData(), PERSONA_LORE, PersonaLore, renderStandingsDocument(), Env, humanizeSlug(), loadBotParticipants(), loadHumanParticipants() (+9 more)

### Community 30 - "markdown-preview.ts"
Cohesion: 0.18
Nodes (12): handleFeedbackPreview(), sendJson(), Blocks, cells(), inline(), isDivider(), renderMarkdownPreview(), soloBlock() (+4 more)

### Community 31 - "round-trips.ts"
Cohesion: 0.13
Nodes (20): holdMs(), isUsable(), Lot, matchRoundTrips(), matchSymbol(), OpenLot, RoundTrip, RoundTripLedger (+12 more)

### Community 32 - "config-audit.mjs"
Cohesion: 0.12
Nodes (24): AGENTS_DIR, capabilities(), CLAUDE_MD, clusterIntents(), COMPUTE_MD, computeFloorFindings(), contradictionFindings(), DUEL_LOG (+16 more)

### Community 33 - "research-view.ts"
Cohesion: 0.13
Nodes (24): MG_STYLE, NavContext, FeedbackFormViewOptions, FeedbackResultViewOptions, countdown(), agendaBandPanel(), agendaDayGroup(), agendaRow() (+16 more)

### Community 34 - "feedback-routes.ts"
Cohesion: 0.16
Nodes (16): renderFeedbackResultBody(), CoachTurn, FeedbackSpec, handleFeedbackCoach(), FeedbackInput, FeedbackKind, FeedbackLogEntry, feedbackHits (+8 more)

### Community 35 - "event-scan.mjs"
Cohesion: 0.17
Nodes (22): addDays(), arg(), assessmentDue(), daysBetween(), extractArray(), has(), KINDS, loadCadence() (+14 more)

### Community 36 - "trade-desk.spec.ts"
Cohesion: 0.13
Nodes (8): DashboardData, createDashboardServer(), Listener, ObservatoryHub, withServer(), ann, auth, withServer()

### Community 37 - "issue-lint.mjs"
Cohesion: 0.16
Nodes (21): aboveFold(), audit(), AUDIT_LIST_LIMIT, auditReport(), checkBullets(), checkFold(), checkMedia(), checkTitle() (+13 more)

### Community 38 - "AlpacaTradingClient"
Cohesion: 0.15
Nodes (12): AlpacaBrokerAdapter, AlpacaTradingClient, readActivity(), main(), leg(), MAX_SMOKE_QUANTITY, runSmokeTrade(), SmokeTradeLeg (+4 more)

### Community 39 - "data-source.ts"
Cohesion: 0.13
Nodes (16): AccountFixture, ActivitySink, ALPACA_DATA_BASE_URL, DataSource, emptyAccount(), Env, EventSink, liveDataSource() (+8 more)

### Community 40 - "SafetyController"
Cohesion: 0.13
Nodes (6): fleetEquity(), markedEquity(), BreakerConfig, DEFAULT_BREAKERS, HaltReason, SafetyController

### Community 41 - "account-forms.ts"
Cohesion: 0.19
Nodes (19): AccountAdmin, AccountFormContext, AccountRouteDeps, handleAccountRemove(), handleAccountRoute(), handleAccountSettings(), removeResultHtml(), sessionNameCandidates() (+11 more)

### Community 42 - "JsonlKeyedStore"
Cohesion: 0.13
Nodes (6): AuditStore, JsonlAuditStore, appendJsonlEntry(), JsonlKeyedStore, listJsonlFiles(), Entry

### Community 43 - "serve-dashboard.ts"
Cohesion: 0.20
Nodes (17): createActivityStore(), createBootActivityStore(), dedupeById(), createParticipantStore(), resolveDataSource(), main(), main(), PORT (+9 more)

### Community 44 - "authenticator.ts"
Cohesion: 0.18
Nodes (13): APP_VERSION, AuthDeps, completeOAuthCallback(), OAuthCallbackDeps, FetchFn, OAuthProvider, Session, asRes() (+5 more)

### Community 45 - "alpaca-options-client.ts"
Cohesion: 0.17
Nodes (9): AlpacaOptionContract, AlpacaOptionsClient, num(), PlaceOptionOrderParams, AlpacaOrder, ensureOk(), PlaceOrderParams, Side (+1 more)

### Community 46 - "earnings-cycle.mjs"
Cohesion: 0.26
Nodes (18): bars(), baseline(), binomTail(), CACHE, cached(), controlBaseRate(), controlFade(), controlPeers() (+10 more)

### Community 47 - "participant-service.ts"
Cohesion: 0.16
Nodes (11): ALLOWED_TIMEZONES, isAllowedTimezone(), TimezoneOption, VALID, ParticipantKind, AddParticipantInput, AddResult, ParticipantService (+3 more)

### Community 48 - "resolve-auth.ts"
Cohesion: 0.16
Nodes (8): liveAllowSet(), githubProvider(), googleProvider(), OAuthIdentity, ProviderConfig, Env, parseList(), resolveAuth()

### Community 49 - "intraday-edges.mjs"
Cohesion: 0.28
Nodes (17): CACHE, cached(), etParts(), firstBreak(), label(), main(), openingRangeRows(), report() (+9 more)

### Community 50 - "session.ts"
Cohesion: 0.20
Nodes (14): base64url(), clearSessionCookie(), cookie(), CookieOptions, fromBase64url(), hmac(), parseCookies(), safeEqual() (+6 more)

### Community 51 - "participant-snapshot.ts"
Cohesion: 0.20
Nodes (17): AlpacaPosition, OPTION_MULTIPLIER, costBasis(), dayPl(), fin(), unrealizedPl(), blotter(), blotterRow() (+9 more)

### Community 52 - "invite-form.ts"
Cohesion: 0.18
Nodes (10): AllowlistEntry, AllowlistStore, handleInvite(), invite(), InviteDeps, listHtml(), brandedShell(), requireOwner() (+2 more)

### Community 53 - "sentiment-tracker.ts"
Cohesion: 0.19
Nodes (5): NewsArticle, NEGATIVE, POSITIVE, scoreSentiment(), SentimentTracker

### Community 54 - "research-view.spec.ts"
Cohesion: 0.25
Nodes (11): addMonths(), dayCell(), monthGrid(), monthOf(), monthTitle(), navBounds(), navLink(), parseMonth() (+3 more)

### Community 55 - "ci-medic.mjs"
Cohesion: 0.28
Nodes (14): ensureLabel(), execute(), gatherFailures(), issueBody(), json(), LABEL, main(), MEDIC_WORKFLOW (+6 more)

### Community 56 - "feedback-view.ts"
Cohesion: 0.27
Nodes (9): FEEDBACK_KIND_ICON, formField(), renderCoachIntro(), renderFeedbackFormBody(), renderRecentFeedback(), FEEDBACK_AREAS, COACH_SCRIPT, PREVIEW_SCRIPT (+1 more)

### Community 57 - "fluid-layout.spec.ts"
Cohesion: 0.22
Nodes (7): FLUID_LAYOUT_TOKENS, renderResearchDocBody(), SHELL_STYLE, TOKEN_DECLS, TOKEN_HEX, NAV, BRAND

### Community 58 - "feedback-service.ts"
Cohesion: 0.25
Nodes (12): FEEDBACK_KIND_LABEL, issueBody(), LABELS, labelsFor(), opaqueMemberId(), specBlock(), TITLE_TAG, titleFor() (+4 more)

### Community 59 - "shoot-tower.mjs"
Cohesion: 0.14
Nodes (11): @commitlint/config-conventional, ignoreDependencies, @commitlint/config-conventional, playwright-core, playwright-core, husky, HEALTH, ONLY (+3 more)

### Community 60 - "incident-scan.mjs"
Cohesion: 0.20
Nodes (13): args, auditLedger(), budget, BUDGET_FILE, failedMainRuns(), FIELDS, flag(), isLearned() (+5 more)

### Community 61 - "shoot-portfolio.mjs"
Cohesion: 0.16
Nodes (11): CANDIDATES, data, EXE, nav, pages, CANDIDATES, data, EXE (+3 more)

### Community 62 - "market-events.ts"
Cohesion: 0.27
Nodes (10): UPCOMING_PRINTS, allEvents(), EventKind, EventStatus, ImpactTier, MARKET_EVENTS, earningsAsEvents(), eventsWithin() (+2 more)

### Community 63 - "history-metrics.ts"
Cohesion: 0.30
Nodes (11): AggregateDoubling, byParticipant(), changeOver(), DAY_MS, doubledAt(), DoublingTrophy, firstAccountToDouble(), MONTH_MS (+3 more)

### Community 64 - "self-service-forms.ts"
Cohesion: 0.30
Nodes (9): addShell(), addFormHtml(), addResultHtml(), handleAdd(), handleRotate(), handleSelfServiceForm(), rotateFormHtml(), rotateResultHtml() (+1 more)

### Community 65 - "package.json"
Cohesion: 0.15
Nodes (12): @babylonjs/core, marked, dependencies, @babylonjs/core, marked, description, engines, node (+4 more)

### Community 66 - "arch-scan.mjs"
Cohesion: 0.19
Nodes (10): ADR-0008, BUDGET_FILE, exportCount(), files, junk, lineCount(), rel(), ROOT (+2 more)

### Community 67 - "history-boot.spec.ts"
Cohesion: 0.29
Nodes (7): bootSamples(), createBootHistoryStore(), latestByParticipant(), rehydrateHistory(), seedRealizedPl(), seedSampleRecorder(), createHistoryStore()

### Community 68 - "confirm-print-dates.ts"
Cohesion: 0.23
Nodes (12): CACHE, CALENDAR_FILE, confirm(), Confirmation, datesAround(), fetchDay(), fetchOutcomes, main() (+4 more)

### Community 69 - "rules"
Cohesion: 0.17
Nodes (12): rules, noFloatingPromises, noBarrelFile, nursery, performance, preset, suspicious, noConsole (+4 more)

### Community 70 - "digest-scan.mjs"
Cohesion: 0.29
Nodes (11): arg(), commitsSince(), daysBetween(), DIGEST_DIR, digestFiles(), has(), main(), REQUIRED_SECTIONS (+3 more)

### Community 71 - "doc-rot-scan.mjs"
Cohesion: 0.21
Nodes (8): BUDGET_FILE, deadRefFindings(), existsSyncRoot(), files, findings, isGitIgnored(), pathRefs(), ROOT

### Community 72 - "ship.sh"
Cohesion: 0.24
Nodes (5): cmd_automerge(), cmd_checkbody(), cmd_merge(), cmd_open(), ship.sh script

### Community 73 - "workflow-lint.mjs"
Cohesion: 0.30
Nodes (9): danglingNeeds(), danglingPrompts(), danglingStepRefs(), duplicateKeys(), jobs(), lintWorkflow(), main(), Scopes (+1 more)

### Community 74 - "beta-scout.ts"
Cohesion: 0.24
Nodes (7): LiveCycleRunner, BETA_SCOUT_ID, BetaScoutConfig, betaScoutExitIntents(), betaScoutIntents(), directionOf(), signalStrength()

### Community 75 - "playbook.ts"
Cohesion: 0.22
Nodes (10): PlaybookMode, DesiredState, EnabledPlaybook, Playbook, playbookIntents(), base, calendar, ctx (+2 more)

### Community 76 - "alpaca-connect.ts"
Cohesion: 0.23
Nodes (5): ALPACA_DEFAULT_SCOPE, AlpacaConnectConfig, AlpacaConnection, AlpacaConnectProvider, asString()

### Community 77 - "design-extract.mjs"
Cohesion: 0.27
Nodes (9): compareVersions(), findSeedCanvases(), NOT_FOUND, pickSeedCanvas(), safeDirs(), SKILL_ROOT_GLOB, skillRoots(), versionKey() (+1 more)

### Community 78 - "envelope-scan.mjs"
Cohesion: 0.20
Nodes (7): breaches, breachOf(), globToRegExp(), lane, MANIFEST, REGEX_META, ROOT

### Community 79 - "shoot-desk.mjs"
Cohesion: 0.18
Nodes (7): CANDIDATES, EXE, history, options, pages, review, snapshot

### Community 80 - "spec-gap-scan.mjs"
Cohesion: 0.24
Nodes (8): BUDGET_FILE, isTypeOnly(), isWebglBound(), lineCount(), ROOT, srcFiles, tested, untested

### Community 81 - "plays.ts"
Cohesion: 0.29
Nodes (9): firstPlay(), isLocked(), Play, PLAY_LEVELS, PlayLevel, PlayLevelMeta, PLAYS, playsAtLevel() (+1 more)

### Community 82 - "render-morning-brief.ts"
Cohesion: 0.33
Nodes (9): MorningBrief, calendarSection(), fmtMoney(), liveSignalSection(), personaSection(), playbookSection(), positionsSection(), renderMorningBriefText() (+1 more)

### Community 83 - "Authenticator"
Cohesion: 0.27
Nodes (4): Authenticator, redirect(), providerGlyph(), ProviderId

### Community 84 - "authenticator.spec.ts"
Cohesion: 0.24
Nodes (6): asRes(), ENV, FakeRes, req(), res(), signIn()

### Community 85 - "biome.json"
Cohesion: 0.20
Nodes (9): files, linter, enabled, overrides, $schema, vcs, clientKind, enabled (+1 more)

### Community 86 - "style"
Cohesion: 0.20
Nodes (10): syntax, style, noDefaultExport, noNonNullAssertion, useCollapsedElseIf, useConsistentArrayType, useImportType, useShorthandAssign (+2 more)

### Community 87 - "symbol-sweep.js"
Cohesion: 0.20
Nodes (7): complete, DEFAULT_TICKERS, meta, NOTE: .claude/workflows/** is excluded from Biome (biome.json) — workflow…, REDTEAM_SCHEMA, RESEARCH_SCHEMA, SYNTH_SCHEMA

### Community 88 - "knip.json"
Cohesion: 0.22
Nodes (9): entry, ignore, project, $schema, scripts/duel-log.mjs, scripts/*.mjs, src/scripts/*.ts, src/**/*.ts (+1 more)

### Community 89 - "dupe-scan.mjs"
Cohesion: 0.20
Nodes (7): BUDGET_FILE, debt, defs, dupes, IGNORE, ROOT, SRC

### Community 90 - "feedback-scan.mjs"
Cohesion: 0.33
Nodes (9): fetchIssues(), firstAnswerAt(), gh(), main(), outcomeOf(), WHY: until 2026-08-22 the only number describing this lane was a sentence…, roundsOf(), scoreboard() (+1 more)

### Community 91 - "play-feedback.ts"
Cohesion: 0.31
Nodes (7): esc(), money(), PlayOutcome, PlayResult, renderPlayFeedbackLog(), RESULT_LABEL, row()

### Community 92 - "JsonlFeedbackLogStore"
Cohesion: 0.20
Nodes (3): FeedbackLogStore, InMemoryFeedbackLogStore, JsonlFeedbackLogStore

### Community 93 - "page-shell.ts"
Cohesion: 0.22
Nodes (3): EXE, page, PAGE_STYLE

### Community 94 - "decision-context.ts"
Cohesion: 0.33
Nodes (7): DecisionContext, decisionContextFor(), guardNote(), matchesOrder(), cycle(), intent(), order

### Community 95 - "includes"
Cohesion: 0.25
Nodes (8): includes, **, !.claude/workflows, !**/coverage, !**/dist, !docs/handoffs, !**/node_modules, !**/spikes

### Community 96 - "context7"
Cohesion: 0.29
Nodes (7): CONTEXT7_API_KEY, npx, babylon-mcp, context7, playwright, @playwright/mcp, @upstash/context7-mcp

### Community 97 - "deploy-lag.mjs"
Cohesion: 0.32
Nodes (5): describeLag(), gh(), readState(), short(), SILENT_MERGERS

### Community 98 - "clone-scan.mjs"
Cohesion: 0.29
Nodes (5): BUDGET_FILE, clones, outDir, report, ROOT

### Community 99 - "journey-scan.mjs"
Cohesion: 0.43
Nodes (6): JOURNEY_DIR, journeyFiles(), main(), REQUIRED_HEADINGS, ROOT, validate()

### Community 100 - "shoot-login.mjs"
Cohesion: 0.33
Nodes (6): auth, CANDIDATES, EXE, idle, shootAt(), sleep()

### Community 101 - "noExcessiveCognitiveComplexity"
Cohesion: 0.33
Nodes (6): noExcessiveCognitiveComplexity, useSimplifiedLogicExpression, level, options, maxAllowedComplexity, complexity

### Community 102 - "dead-scan.mjs"
Cohesion: 0.33
Nodes (5): BUDGET_FILE, exportsDebt, report, ROOT, typesDebt

### Community 103 - "dep-graph-scan.mjs"
Cohesion: 0.33
Nodes (5): BUDGET_FILE, byRule, DEPCRUISE, report, ROOT

### Community 106 - "formatter"
Cohesion: 0.40
Nodes (5): formatter, enabled, indentStyle, indentWidth, lineWidth

### Community 107 - "formatter"
Cohesion: 0.40
Nodes (5): quoteStyle, semicolons, trailingCommas, javascript, formatter

### Community 108 - "useFilenamingConvention"
Cohesion: 0.40
Nodes (5): filenameCases, useFilenamingConvention, level, options, kebab-case

### Community 109 - "isAllowedIdentity"
Cohesion: 0.50
Nodes (3): isAllowedIdentity(), emails, logins

### Community 110 - "source"
Cohesion: 0.50
Nodes (4): source, assist, actions, organizeImports

### Community 111 - "correctness"
Cohesion: 0.50
Nodes (4): noUnusedFunctionParameters, noUnusedImports, noUnusedPrivateClassMembers, correctness

### Community 112 - "dockerignore-research.spec.ts"
Cohesion: 0.67
Nodes (3): ignorer(), included(), ROOT

### Community 115 - "deploy-lag.spec.ts"
Cohesion: 0.67
Nodes (3): explain(), run(), STRANDED

## Knowledge Gaps
- **508 isolated node(s):** `OptionTicketRequest`, `TicketRequest`, `TradeSide`, `ReviewedOption`, `ActionResult` (+503 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `playwright-core` connect `shoot-tower.mjs` to `shoot-login.mjs`, `page-shell.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `escapeHtml()` connect `escapeHtml` to `trade-routes.ts`, `research-view.ts`, `feedback-routes.ts`, `controls-form.ts`, `self-service-forms.ts`, `account-forms.ts`, `authenticator.ts`, `render-dashboard.ts`, `participant-snapshot.ts`, `Authenticator`, `dashboard-server.ts`, `standings-view.ts`, `research-view.spec.ts`, `feedback-view.ts`, `fluid-layout.spec.ts`, `settings-view.ts`, `invite-form.ts`, `markdown-preview.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`, `shoot-tower.mjs`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `OptionTicketRequest`, `TicketRequest`, `TradeSide` to the rest of the system?**
  _508 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `trade-routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050505050505050504 - nodes in this community are weakly interconnected._
- **Should `controls-form.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05220883534136546 - nodes in this community are weakly interconnected._
- **Should `MarketContext` be split into smaller, more focused modules?**
  _Cohesion score 0.0872072072072072 - nodes in this community are weakly interconnected._
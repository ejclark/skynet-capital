<!-- AUTO-GENERATED — do not hand-edit below the marker.
     Regenerate: `npm run graph:refresh` (free, no API). Kept fresh automatically on push to main
     by .github/workflows/graph-refresh.yml. The live graph lives in graphify-out/ (git-ignored). -->

# Structural map (Graphify)

The repo's **code** as a knowledge graph — the durable, navigable structure view, generated from the
AST. This is the *code-dependency* lens ("how is it wired / what breaks if I change X"), distinct from
the *product/systems* lens ("what exists, how mature, where to aim"). To navigate live, use
`graphify explain/path/query` — see the playbook in [`GRAPHIFY.md`](GRAPHIFY.md).

<!-- BEGIN GENERATED REPORT -->

# Graph Report - skynet-capital  (2026-08-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 4000 nodes · 11034 edges · 193 communities (172 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 117 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `97e5c3a7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MarketContext
- SafetyController
- participant-snapshot.ts
- ObservatoryHub
- Persona
- insights-listener.ts
- AlpacaTradingClient
- tower.ts
- data-source.ts
- escapeHtml
- trade-ticket-route.ts
- session.ts
- outlook.ts
- positions-view.ts
- autonomous-live-wiring.ts
- JsonResponse
- run-eval.ts
- dashboard-server.ts
- comprehension.ts
- earnings-calendar.ts
- scripts
- option-trade-service.ts
- activity-store.ts
- draft-order.ts
- ticket-view.ts
- standings-view.ts
- feedback-routes.ts
- research-service.ts
- feedback-coach.ts
- persona-collections.ts
- performance-view.ts
- render-dashboard.ts
- progression-service.ts
- playbook-collections.ts
- serve-dashboard.ts
- trade-review-view.ts
- observatory/morning-brief.ts
- feedback-service.ts
- option-ticket.ts
- devDependencies
- wire-view.ts
- order-audit-log.ts
- envelope-scan.mjs
- structure-risk.ts
- probability.ts
- builders.ts
- research-view.ts
- EquitySample
- comms-scan.mjs
- unusual-flow.ts
- event-scan.mjs
- feedback-view.ts
- round-trips.ts
- day-trophies.ts
- compilerOptions
- config-audit.mjs
- issue-lint.mjs
- research-lint.mjs
- pricing.ts
- postmaster.mjs
- collections-view.ts
- trade-ledgers-view.ts
- order-ticket.ts
- candidate-score.ts
- iv-rank.ts
- providers.ts
- shoot-portfolio.mjs
- earnings-cycle.mjs
- intraday-edges.mjs
- UnusualFlowScan
- markdown-preview.ts
- market-events.ts
- JsonlKeyedStore
- dashboard-shell.ts
- owner-link-store.ts
- beta-scout.ts
- feedback-images.ts
- payoff-surface.ts
- project.ts
- iv-instrument.ts
- broker-sync.spec.ts
- cycle-report-store.ts
- empire-skyline.ts
- IvSample
- WorldPatchChannel
- dashboard-self-service-routes.ts
- ci-medic.mjs
- trade-updates-stream.ts
- sentiment-tracker.ts
- research-view.spec.ts
- feedback-status.ts
- claim-form.ts
- postmaster-shipped.mjs
- resolve-auth.ts
- ticker.ts
- knip.json
- deploy-lag.mjs
- incident-scan.mjs
- ship.sh
- board-patch-routes.ts
- controls-form.ts
- package.json
- postmaster-labels.mjs
- confirm-print-dates.ts
- world-patch.ts
- doc-rot-scan.mjs
- workflow-lint.mjs
- unusual-flow-metrics.ts
- load-participants.ts
- FileAllowlistStore
- style
- design-extract.mjs
- spec-gap-scan.mjs
- plays.ts
- account-forms.spec.ts
- feedback-areas.ts
- world-state.ts
- authenticator.spec.ts
- biome.json
- rules
- symbol-sweep.js
- arch-scan.mjs
- ci-medic-logs.mjs
- dupe-scan.mjs
- feedback-scan.mjs
- play-feedback.ts
- volume-guard.ts
- includes
- context7
- shoot-tower.mjs
- FileParticipantStore
- allowlist-store.ts
- AllowlistStore
- confirm-button.ts
- world-patch-apply.ts
- clone-scan.mjs
- journey-scan.mjs
- shoot-login.mjs
- dashboard-board-routes.spec.ts
- noExcessiveCognitiveComplexity
- suspicious
- dead-scan.mjs
- dep-graph-scan.mjs
- dev-tower.mjs
- FakeSocket
- design-extract.spec.ts
- formatter
- formatter
- options
- useFilenamingConvention
- fetch-claude-docs.mjs
- backfill-trade-activity.ts
- comms-scan.spec.ts
- fly-split.spec.ts
- postmaster.spec.ts
- source
- smoke-bots.sh
- dockerignore-research.spec.ts
- gh-json-fields.spec.ts
- research-lint.spec.ts
- deploy-lag.spec.ts
- postmaster.d.mts
- smoke.sh
- worktree-setup.sh
- feedback-scan.spec.ts
- workflows.spec.ts
- assessment-cadence.spec.ts
- model-tier.spec.ts
- babylon-mcp-ensure.sh
- refresh-graph.sh
- setup-babylon-mcp.sh
- setup-commit-signing.sh

## God Nodes (most connected - your core abstractions)
1. `escapeHtml()` - 158 edges
2. `MarketContext` - 76 edges
3. `OrderIntent` - 74 edges
4. `ParticipantSnapshot` - 72 edges
5. `JsonResponse` - 70 edges
6. `Portfolio` - 63 edges
7. `AlpacaTradingClient` - 59 edges
8. `NavContext` - 50 edges
9. `scripts` - 48 edges
10. `Persona` - 42 edges

## Surprising Connections (you probably didn't know these)
- `prospector()` --calls--> `ProspectorPersona`  [EXTRACTED]
  tests/personas/prospector.spec.ts → src/personas/prospector.ts
- `withRoute()` --calls--> `handleAccountRoute()`  [EXTRACTED]
  tests/server/account-forms.spec.ts → src/server/account-forms.ts
- `drawerViewLabels()` --calls--> `renderShell()`  [EXTRACTED]
  tests/server/feedback-areas.spec.ts → src/observatory/dashboard-shell.ts
- `SpyPersona` --implements--> `Persona`  [EXTRACTED]
  tests/discovery/probe-tape.spec.ts → src/personas/persona.ts
- `FakeTradingTransport` --implements--> `AlpacaTradingTransport`  [EXTRACTED]
  tests/adapters/alpaca-broker-adapter.spec.ts → src/alpaca/trading-transport.ts

## Import Cycles
- None detected.

## Communities (193 total, 21 thin omitted)

### Community 0 - "MarketContext"
Cohesion: 0.07
Nodes (46): heldQuantity(), positionFor(), MarketContext, OrderIntent, OrderStatus, Portfolio, BankerConfig, BankerPersona (+38 more)

### Community 1 - "SafetyController"
Cohesion: 0.06
Nodes (40): InMemoryAlertDismissals, Alert, AlertFilter, alertFingerprint(), AlertPriority, AlertBus, AlertListener, Subscription (+32 more)

### Community 2 - "participant-snapshot.ts"
Cohesion: 0.05
Nodes (40): guardAccountCollisions(), AccountCollision, AccountHolder, findAccountCollisions(), BuildDashboardOptions, DashboardData, ParticipantSnapshot, applyBuy() (+32 more)

### Community 3 - "ObservatoryHub"
Cohesion: 0.05
Nodes (35): AlpacaCredentials, isAllowedTimezone(), Participant, ParticipantKind, ParticipantStore, StoredParticipant, AccountServiceDeps, createAccountService() (+27 more)

### Community 4 - "Persona"
Cohesion: 0.07
Nodes (38): InMemoryBroker, ScriptedMarketData, AutonomousTrader, AutonomousTraderConfig, TraderMode, AuditStore, CycleAction, DecisionRecord (+30 more)

### Community 5 - "insights-listener.ts"
Cohesion: 0.06
Nodes (43): BotControls, BotControlsClient, DISABLED_CLIENT, resolveBotControls(), CONTROLS_BRIDGE_PATH, ControlsState, effectiveHardcoreIds(), effectiveMode() (+35 more)

### Community 6 - "AlpacaTradingClient"
Cohesion: 0.06
Nodes (35): AlpacaBrokerAdapter, AlpacaApiError, AlpacaOptionContract, greek(), GREEK_KEYS, GreekKey, greeksOf(), PlaceOptionOrderParams (+27 more)

### Community 7 - "tower.ts"
Cohesion: 0.06
Nodes (54): clamp(), clamp01(), lerp(), attachEnvironment(), attachGodRays(), attachPost(), createStage(), gradeImage() (+46 more)

### Community 8 - "data-source.ts"
Cohesion: 0.05
Nodes (39): AccountFixture, FixtureTradingTransport, ok(), parseEventsJsonl(), ReplayEventStream, ReplayEventStreamConfig, toEventsJsonl(), AlpacaMarketDataStream (+31 more)

### Community 9 - "escapeHtml"
Cohesion: 0.09
Nodes (51): courseCard(), milestoneRow(), ALLOWED_TIMEZONES, TimezoneOption, VALID, BotControlResult, botControlResultHtml(), botControlsBlock() (+43 more)

### Community 10 - "trade-ticket-route.ts"
Cohesion: 0.08
Nodes (49): lockedOnLadder(), starterPlayById(), ticketContext(), deskHref(), renderOptionReviewBody(), answersFromForm(), handleCheckPost(), handleOptionPost() (+41 more)

### Community 11 - "session.ts"
Cohesion: 0.06
Nodes (34): isAllowedIdentity(), APP_VERSION, AuthDeps, Authenticator, redirect(), completeOAuthCallback(), OAuthCallbackDeps, providerGlyph() (+26 more)

### Community 12 - "outlook.ts"
Cohesion: 0.08
Nodes (46): CandidateScore, BOUNDARY_SIGMAS, ChainContract, CHEAP_IV_RANK, expectedMove(), MAGNITUDE_SIGMAS, Outlook, OutlookDirection (+38 more)

### Community 13 - "positions-view.ts"
Cohesion: 0.06
Nodes (44): CANDIDATES, EXE, history, options, pages, review, snapshot, fin() (+36 more)

### Community 14 - "autonomous-live-wiring.ts"
Cohesion: 0.10
Nodes (31): AlpacaAccount, fleetDayOpenEquity(), parseDayOpenEquity(), MomentumTracker, ALPACA_PAPER_BASE_URL, Bot, BotCredentials, createBotBroker() (+23 more)

### Community 15 - "JsonResponse"
Cohesion: 0.06
Nodes (13): JsonResponse, FakeTradingTransport, StubDataTransport, FakeTradingTransport, FakeTransport, clientFor(), FakeTransport, FakeTransport (+5 more)

### Community 16 - "run-eval.ts"
Cohesion: 0.10
Nodes (28): assessReadiness(), ReadinessInputs, ReadinessResult, EvalReport, evaluatePersona(), formatReport(), runScenario(), ScenarioResult (+20 more)

### Community 17 - "dashboard-server.ts"
Cohesion: 0.10
Nodes (30): NavContext, NavView, FeedbackResultViewOptions, renderAcademyBody(), ClaimDeps, deskIndex(), serveCollectionsRoute(), ControlsDeps (+22 more)

### Community 18 - "comprehension.ts"
Cohesion: 0.08
Nodes (31): ALLOWED_MISSES, CheckQuestion, CheckResult, checkFor(), COMPREHENSION_CHECKS, OPTION_CHECKS, STOCK_CHECKS, chosenIndex() (+23 more)

### Community 19 - "earnings-calendar.ts"
Cohesion: 0.10
Nodes (34): dateOf(), daysUntil(), EarningsPrint, etTimeOf(), nextPrint(), PRINT_WINDOWS, PrintDateStatus, printWithin() (+26 more)

### Community 20 - "scripts"
Cohesion: 0.04
Nodes (48): scripts, arch:scan, backfill:activity, brief:morning, build:scene, clone:scan, comms:scan, confirm:print-dates (+40 more)

### Community 21 - "option-trade-service.ts"
Cohesion: 0.10
Nodes (27): AlpacaOptionsClient, num(), ensureOk(), positionsFrom(), TradingClientFactory, DeskSubmitResult, marketOpen(), openDesk() (+19 more)

### Community 22 - "activity-store.ts"
Cohesion: 0.10
Nodes (27): AlpacaOrder, appendAdvancing(), backfillParticipantActivity(), BackfillResult, knownOrders(), reconcileBrokerActivity(), ActivitySource, ActivityStore (+19 more)

### Community 23 - "draft-order.ts"
Cohesion: 0.09
Nodes (38): AggregateGreeks, ContractGreeks, GreekPosition, isRepresentative(), addLeg(), DraftLeg, DraftOrder, DraftPhase (+30 more)

### Community 24 - "ticket-view.ts"
Cohesion: 0.12
Nodes (38): OptionChainRow, STARTER_PLAYS, StarterPlay, defaultTradeType(), TradeSide, TradeType, tradeTypeByCode(), isLockedPlay() (+30 more)

### Community 25 - "standings-view.ts"
Cohesion: 0.12
Nodes (38): formatCurrency(), formatSigned(), pct(), formatMetric(), LEADER_METRICS, LeaderMetric, metricLabel(), metricValue() (+30 more)

### Community 26 - "feedback-routes.ts"
Cohesion: 0.10
Nodes (26): renderFeedbackFollowupResultBody(), renderFeedbackResultBody(), BOARD_PATCH_SCRIPT, BOARD_PATCH_STYLE, servePublicRoute(), servePulse(), handleFeedbackCoach(), handleFeedbackPreview() (+18 more)

### Community 27 - "research-service.ts"
Cohesion: 0.12
Nodes (32): asOfIso, CANDIDATES, EXE, nav, pages, ledgerLine(), renderResearchDocBody(), renderResearchShelfBody() (+24 more)

### Community 28 - "feedback-coach.ts"
Cohesion: 0.11
Nodes (31): boundsError(), CoachConfig, coachHits, CoachInput, coachThrottled(), CoachTurn, createFeedbackCoach(), DoFetch (+23 more)

### Community 29 - "persona-collections.ts"
Cohesion: 0.10
Nodes (29): AGAINST_THE_CROWD, ALWAYS_WORKING, BY_THE_BOOK, COLLECTION_PROBES, CollectionProbe, FLAT, FLIGHT_TO_SAFETY, HELD (+21 more)

### Community 30 - "performance-view.ts"
Cohesion: 0.12
Nodes (27): AlpacaPosition, ACTIVITY_TYPES, ACTIVITY_WINDOWS, OPTION_MULTIPLIER, longestGreenStreak(), deskLedger(), fillsFrom(), formatHold() (+19 more)

### Community 31 - "render-dashboard.ts"
Cohesion: 0.16
Nodes (22): PositionView, renderShell(), activityFeed(), activityRow(), CardOptions, participantCard(), participantInvested(), participantReturnPct() (+14 more)

### Community 32 - "progression-service.ts"
Cohesion: 0.14
Nodes (27): Course, courseComplete(), CourseLevel, COURSES, Milestone, pointsFor(), Rank, rankFor() (+19 more)

### Community 33 - "playbook-collections.ts"
Cohesion: 0.10
Nodes (30): asOfIso, CANDIDATES, collections, desks, EXE, nav, pages, scale (+22 more)

### Community 34 - "serve-dashboard.ts"
Cohesion: 0.11
Nodes (18): createBootActivityStore(), CeremonyChannel, CeremonyListener, HistorySamplerOptions, sampleAll(), startHistorySampler(), TransitionBaseline, deriveTransitions() (+10 more)

### Community 35 - "trade-review-view.ts"
Cohesion: 0.11
Nodes (29): formatPrice(), reviewLine(), reviewNotices(), bucketFor(), CANCELED_LIKE_STATUSES, cancelForm(), OPEN_STATUSES, openOrdersPanel() (+21 more)

### Community 36 - "observatory/morning-brief.ts"
Cohesion: 0.10
Nodes (27): buildMorningBrief(), CalendarBriefEntry, calendarEntries(), LiveSignalStatus, MorningBrief, PersonaBriefEntry, personaEntry(), PlaybookBriefEntry (+19 more)

### Community 37 - "feedback-service.ts"
Cohesion: 0.13
Nodes (27): memberLabelFor(), opaqueMemberId(), submitterFor(), FeedbackSpec, createFollowup(), DoFetch, FeedbackFollowupInput, FollowupConfig (+19 more)

### Community 38 - "option-ticket.ts"
Cohesion: 0.12
Nodes (25): rowPremium(), PAD, payoffSvg(), premiumByStrikeSvg(), windowChain(), viewPreview(), closePreviewFromForm(), heldShares() (+17 more)

### Community 39 - "devDependencies"
Cohesion: 0.06
Nodes (33): @balena/dockerignore, @biomejs/biome, @commitlint/cli, esbuild, husky, jscpd, npm-run-all2, devDependencies (+25 more)

### Community 40 - "wire-view.ts"
Cohesion: 0.12
Nodes (20): FeedbackFormViewOptions, statusBadge(), WirePnlRow, WireTradeRow, feedbackRow(), kindChip(), pnlRow(), renderFeedbackPulse() (+12 more)

### Community 41 - "order-audit-log.ts"
Cohesion: 0.10
Nodes (13): JsonlOrderAuditLog, OrderAuditLog, OrderAuditRecord, InMemoryOrderAuditLog, createProgressionService(), ProgressionServiceDeps, createProgressionStore(), EMPTY (+5 more)

### Community 42 - "envelope-scan.mjs"
Cohesion: 0.12
Nodes (25): addedRuntimeDeps(), argOf(), breachOf(), classifyDiff(), diffFor(), git(), globToRegExp(), main() (+17 more)

### Community 43 - "structure-risk.ts"
Cohesion: 0.12
Nodes (24): asDollars(), asLevel(), boundClause(), describeLeg(), describeMechanics(), MechanicsContext, ProfitRegion, regionClause() (+16 more)

### Community 44 - "probability.ts"
Cohesion: 0.13
Nodes (28): standardNormalCdf(), bisectBoundary(), PriceProbability, probabilityOfProfit(), profitableMass(), profitAt(), ProfitEvaluator, ProfitProbabilityInput (+20 more)

### Community 45 - "builders.ts"
Cohesion: 0.16
Nodes (12): NewsFaderPersona, HARDCORE_SAURON_CONFIG, planForceFlatten(), base, calendar, ctx, flat, nvdaPlay (+4 more)

### Community 46 - "research-view.ts"
Cohesion: 0.12
Nodes (23): AGENDA_STYLE, agendaBandPanel(), AgendaContext, agendaDayGroup(), agendaRow(), BANDS, callChip(), formatDay() (+15 more)

### Community 47 - "EquitySample"
Cohesion: 0.17
Nodes (11): bootSamples(), createBootHistoryStore(), latestByParticipant(), rehydrateHistory(), seedRealizedPl(), seedSampleRecorder(), EquitySample, HistoryStore (+3 more)

### Community 48 - "comms-scan.mjs"
Cohesion: 0.13
Nodes (27): arg(), cell(), enrich(), has(), hoursBetween(), laneOf(), main(), parseLog() (+19 more)

### Community 49 - "unusual-flow.ts"
Cohesion: 0.13
Nodes (19): AlpacaOptionsFlowSource, barVolume(), BOTH_SIDES, OptionChainReader, SnapshotPage, assessFlow(), ContractFlow, DEFAULT_UNUSUAL_FLOW_THRESHOLDS (+11 more)

### Community 50 - "event-scan.mjs"
Cohesion: 0.13
Nodes (26): addDays(), arg(), assessmentDue(), daysBetween(), extractArray(), has(), loadCadence(), loadEvents() (+18 more)

### Community 51 - "feedback-view.ts"
Cohesion: 0.13
Nodes (18): EXE, page, RECENT, tallyShot(), IMAGE_SCRIPT, FEEDBACK_KIND_ICON, FeedbackFollowupResultViewOptions, feedbackTally() (+10 more)

### Community 52 - "round-trips.ts"
Cohesion: 0.12
Nodes (20): MARKET_TIMEZONE, marketDayKey(), holdMs(), isUsable(), Lot, matchRoundTrips(), matchSymbol(), OpenLot (+12 more)

### Community 53 - "day-trophies.ts"
Cohesion: 0.16
Nodes (25): bestRun(), biggestSingleDayGain(), dailyChanges(), DayChange, dayCloses(), GreenStreak, greenStreakBoard(), GreenStreakStanding (+17 more)

### Community 54 - "compilerOptions"
Cohesion: 0.07
Nodes (26): DOM, ES2023, node, @rstest/core/globals, src, tests, vitest.config.ts, compilerOptions (+18 more)

### Community 55 - "config-audit.mjs"
Cohesion: 0.11
Nodes (25): AGENTS_DIR, capabilities(), CLAUDE_MD, COMPUTE_MD, computeFloorFindings(), contradictionFindings(), EFFORT_RANK, frontmatterValue() (+17 more)

### Community 56 - "issue-lint.mjs"
Cohesion: 0.14
Nodes (24): aboveFold(), audit(), AUDIT_LIST_LIMIT, auditReport(), checkBullets(), checkFold(), checkLabels(), checkMedia() (+16 more)

### Community 57 - "research-lint.mjs"
Cohesion: 0.12
Nodes (25): auditAll(), BUDGET_FILE, cellsOf(), checkColumns(), checkHeaderLines(), checkHorizons(), checkRow(), checkRows() (+17 more)

### Community 58 - "pricing.ts"
Cohesion: 0.14
Nodes (22): VolStance, DAYS_PER_YEAR, expiredValuation(), impliedVolatility(), ImpliedVolInput, isPositiveFinite(), ModelTerms, OptionGreeks (+14 more)

### Community 59 - "postmaster.mjs"
Cohesion: 0.22
Nodes (20): audit(), CLAIM_TTL_MS, claimAgeOf(), claimFailureReason(), claimStamp(), claimFeedback(), claimHandoff(), execute() (+12 more)

### Community 60 - "collections-view.ts"
Cohesion: 0.18
Nodes (19): CatalogKind, Collection, CollectionMember, CollectionPageOptions, CollectionsIndexOptions, countOf(), DeskIndex, DeskLink (+11 more)

### Community 61 - "trade-ledgers-view.ts"
Cohesion: 0.16
Nodes (16): DecisionContext, decisionContextFor(), guardNote(), matchesOrder(), formatActivityTime(), ActivityRow, foldedLedger(), ledgerRow() (+8 more)

### Community 62 - "order-ticket.ts"
Cohesion: 0.16
Nodes (16): DeskTradeRequest, markPrice(), previewClose(), previewOrder(), pricedFields(), ROLL_UNAVAILABLE_REASON, TicketAction, TicketContext (+8 more)

### Community 63 - "candidate-score.ts"
Cohesion: 0.15
Nodes (19): rewardTerm(), saturate(), SCORE_WEIGHTS, scoreCandidate(), ScoredStructure, ScoreInput, ScoreTerm, volAlignment() (+11 more)

### Community 64 - "iv-rank.ts"
Cohesion: 0.16
Nodes (18): absent(), byTime(), daysToMs(), extremes(), isContinuous(), IV_WINDOW_DAYS, IvAbsence, IvMetric (+10 more)

### Community 65 - "providers.ts"
Cohesion: 0.13
Nodes (9): ALPACA_DEFAULT_SCOPE, AlpacaConnectConfig, AlpacaConnection, AlpacaConnectProvider, asString(), githubProvider(), googleProvider(), OAuthIdentity (+1 more)

### Community 66 - "shoot-portfolio.mjs"
Cohesion: 0.12
Nodes (16): playwright-core, playwright-core, CANDIDATES, data, EXE, nav, pages, CANDIDATES (+8 more)

### Community 67 - "earnings-cycle.mjs"
Cohesion: 0.27
Nodes (18): binomTail(), controlBaseRate(), controlFade(), controlPeers(), controlShape(), ret(), stats(), baseline() (+10 more)

### Community 68 - "intraday-edges.mjs"
Cohesion: 0.27
Nodes (17): CACHE, cached(), etParts(), label(), main(), reportFineResolution(), reportSegments(), reportVolatilityProfile() (+9 more)

### Community 69 - "UnusualFlowScan"
Cohesion: 0.21
Nodes (6): InMemoryUnusualFlowStore, JsonlUnusualFlowStore, UnusualFlowScan, UnusualFlowStore, FLAG, FLAG

### Community 70 - "markdown-preview.ts"
Cohesion: 0.27
Nodes (9): Blocks, cells(), inline(), isDivider(), renderMarkdownPreview(), soloBlock(), stashFences(), writeLine() (+1 more)

### Community 71 - "market-events.ts"
Cohesion: 0.20
Nodes (11): allEvents(), MARKET_EVENTS, earningsAsEvents(), eventsWithin(), EventKind, EventStatus, ImpactTier, MarketEvent (+3 more)

### Community 72 - "JsonlKeyedStore"
Cohesion: 0.13
Nodes (5): JsonlFeedbackLogStore, appendJsonlEntry(), JsonlKeyedStore, listJsonlFiles(), Entry

### Community 73 - "dashboard-shell.ts"
Cohesion: 0.18
Nodes (7): NAV_ICON, FLUID_LAYOUT_TOKENS, SHELL_STYLE, TOKEN_DECLS, TOKEN_HEX, NAV, BRAND

### Community 74 - "owner-link-store.ts"
Cohesion: 0.16
Nodes (10): EMPTY_LINKS, findUnstampedLinkedId(), isOwnerLink(), OwnableParticipant, OwnerLink, OwnerLinkState, OwnerLinkStore, parseOwnerLinkState() (+2 more)

### Community 75 - "beta-scout.ts"
Cohesion: 0.16
Nodes (9): fleetEquity(), markedEquity(), LiveCycleRunner, BETA_SCOUT_ID, BetaScoutConfig, betaScoutExitIntents(), betaScoutIntents(), directionOf() (+1 more)

### Community 76 - "feedback-images.ts"
Cohesion: 0.16
Nodes (14): HttpMethod, ALLOWED_TYPES, AllowedType, DoFetch, ensureAssetBranch(), FeedbackImageUploadConfig, isAllowedType(), MAX_IMAGE_BYTES (+6 more)

### Community 77 - "payoff-surface.ts"
Cohesion: 0.20
Nodes (15): isUsableLeg(), legMultiplier(), PayoffGrid, PayoffPoint, PayoffSurface, StockLeg, structureEntryCost(), StructureMark (+7 more)

### Community 78 - "project.ts"
Cohesion: 0.18
Nodes (11): clampFinite(), empireTheme(), PERSONA_LANDMARK, pieceKey(), projectEmpire(), ProjectOptions, projectWorld(), TailAggregate (+3 more)

### Community 79 - "iv-instrument.ts"
Cohesion: 0.26
Nodes (8): ScriptedAtmQuotes, AtmOptionQuote, AtmQuotePort, IvTickOptions, IvTickReport, recordIvTick(), solveAtmIv(), trackedUnderlyings()

### Community 80 - "broker-sync.spec.ts"
Cohesion: 0.16
Nodes (10): BrokerSync, BrokerSyncOptions, createBrokerSync(), reconciledSnapshot(), sameNumbers(), buildParticipantSnapshot(), readActivity(), brokerHolding (+2 more)

### Community 81 - "cycle-report-store.ts"
Cohesion: 0.23
Nodes (5): CycleReport, CycleReportStore, InMemoryCycleReportStore, PersistedCycleReport, JsonlCycleReportStore

### Community 82 - "empire-skyline.ts"
Cohesion: 0.19
Nodes (13): briefMoney(), building(), capColorOf(), foundingReserve(), renderEmpireSkyline(), renderEyeEmblem(), SkylineOptions, MAX_STRUCTURES (+5 more)

### Community 83 - "IvSample"
Cohesion: 0.26
Nodes (4): InMemoryIvHistory, JsonlIvHistoryStore, IvHistoryPort, IvSample

### Community 84 - "WorldPatchChannel"
Cohesion: 0.15
Nodes (7): createBoardChannel(), PatchChannelOptions, PatchListener, PatchReplay, WorldPatch, WorldPatchChannel, WorldPatchOp

### Community 85 - "dashboard-self-service-routes.ts"
Cohesion: 0.32
Nodes (13): displayNameFor(), idOf(), keyOf(), ownedAccountOptions(), resolveCurrentId(), resolveOwnedIds(), rotatableAccountOptions(), handleAccountSelfServiceRoute() (+5 more)

### Community 86 - "ci-medic.mjs"
Cohesion: 0.25
Nodes (15): ensureLabel(), execute(), gatherFailures(), issueBody(), json(), LABEL, jobLog(), main() (+7 more)

### Community 87 - "trade-updates-stream.ts"
Cohesion: 0.23
Nodes (8): AlpacaTradeUpdatesStream, activityFromMessage(), fillEventFromMessage(), firstFinite(), toNumber(), TradeUpdateMessage, streamUrlFromBase(), TradeUpdatesStreamConfig

### Community 88 - "sentiment-tracker.ts"
Cohesion: 0.19
Nodes (5): NewsArticle, NEGATIVE, POSITIVE, scoreSentiment(), SentimentTracker

### Community 89 - "research-view.spec.ts"
Cohesion: 0.24
Nodes (12): addMonths(), dayCell(), MG_STYLE, monthGrid(), monthOf(), monthTitle(), navBounds(), navLink() (+4 more)

### Community 90 - "feedback-status.ts"
Cohesion: 0.26
Nodes (13): FeedbackSetup, setupFeedback(), resolveFeedbackCoach(), resolveFeedbackFollowup(), createFeedbackLogStore(), resolveFeedback(), createStatusFetcher(), DoFetch (+5 more)

### Community 91 - "claim-form.ts"
Cohesion: 0.20
Nodes (13): ClaimAccount, claimPageHtml(), handleClaim(), looksLikeEmail(), noteErr(), noteOk(), rowHtml(), submit() (+5 more)

### Community 92 - "postmaster-shipped.mjs"
Cohesion: 0.20
Nodes (11): gatherDeps(), ghRest(), isRateLimited(), mergedReference(), prIsMerged(), prMergedCache, prPath(), resolveShipped() (+3 more)

### Community 93 - "resolve-auth.ts"
Cohesion: 0.29
Nodes (11): AccessSetup, setupAccess(), createAllowlistStore(), liveAllowSet(), Env, ownerEmails(), parseList(), resolveAuth() (+3 more)

### Community 94 - "ticker.ts"
Cohesion: 0.25
Nodes (12): alignRight(), isDigit(), renderTicker(), RollDirection, rollingCell(), staticCell(), TICKER_STYLE, TickerCell (+4 more)

### Community 95 - "knip.json"
Cohesion: 0.15
Nodes (13): @commitlint/config-conventional, entry, ignore, ignoreDependencies, project, $schema, @commitlint/config-conventional, husky (+5 more)

### Community 96 - "deploy-lag.mjs"
Cohesion: 0.23
Nodes (10): botsIrrelevant(), classify(), botsDeployLag(), describeBotsLag(), describeLag(), gh(), readState(), scanRunBaselines() (+2 more)

### Community 97 - "incident-scan.mjs"
Cohesion: 0.20
Nodes (13): args, auditLedger(), budget, BUDGET_FILE, failedMainRuns(), FIELDS, flag(), isLearned() (+5 more)

### Community 98 - "ship.sh"
Cohesion: 0.36
Nodes (11): api(), body_of(), cmd_automerge(), cmd_checkarm(), cmd_checkbody(), cmd_merge(), cmd_open(), envelope_hits() (+3 more)

### Community 99 - "board-patch-routes.ts"
Cohesion: 0.22
Nodes (9): BoardPatchChannel, BoardPatchContext, driveBoardChannel(), lastEventId(), streamBoardPatches(), toCue(), writePatch(), sseFrame() (+1 more)

### Community 100 - "controls-form.ts"
Cohesion: 0.22
Nodes (11): ActionResult, applyAction(), fleetControls(), handleDeskSettings(), okNote(), sameOrigin(), requireOwner(), BOTS (+3 more)

### Community 101 - "package.json"
Cohesion: 0.15
Nodes (12): @babylonjs/core, marked, dependencies, @babylonjs/core, marked, description, engines, node (+4 more)

### Community 102 - "postmaster-labels.mjs"
Cohesion: 0.24
Nodes (10): answered(), gatherAuditDeps(), dueForResearch(), eventIssueBody(), routeSweep(), FOOTER, LABEL_NAMES, LABELS (+2 more)

### Community 103 - "confirm-print-dates.ts"
Cohesion: 0.23
Nodes (12): CACHE, CALENDAR_FILE, confirm(), Confirmation, datesAround(), fetchDay(), fetchOutcomes, main() (+4 more)

### Community 104 - "world-patch.ts"
Cohesion: 0.28
Nodes (11): byKey(), diffEmpire(), diffWorld(), EmpireVitals, sameLandmark(), samePiece(), sameVitals(), LandmarkState (+3 more)

### Community 105 - "doc-rot-scan.mjs"
Cohesion: 0.21
Nodes (8): BUDGET_FILE, deadRefFindings(), existsSyncRoot(), files, findings, isGitIgnored(), pathRefs(), ROOT

### Community 106 - "workflow-lint.mjs"
Cohesion: 0.32
Nodes (9): danglingNeeds(), danglingPrompts(), danglingStepRefs(), duplicateKeys(), jobs(), lintWorkflow(), main(), Scopes (+1 more)

### Community 107 - "unusual-flow-metrics.ts"
Cohesion: 0.32
Nodes (8): accumulate(), FlowCoverage, latestFlowScan(), orderedScans(), quietStreak(), RepeatFlag, repeatFlags(), UnusualFlowFlag

### Community 108 - "load-participants.ts"
Cohesion: 0.30
Nodes (8): Env, humanizeSlug(), loadBotParticipants(), loadHumanParticipants(), loadParticipants(), withBaseUrl(), HUMAN_TIMEZONES, timezoneForHuman()

### Community 110 - "style"
Cohesion: 0.18
Nodes (11): syntax, style, noDefaultExport, noExcessiveClassesPerFile, noNonNullAssertion, useCollapsedElseIf, useConsistentArrayType, useImportType (+3 more)

### Community 111 - "design-extract.mjs"
Cohesion: 0.27
Nodes (9): compareVersions(), findSeedCanvases(), NOT_FOUND, pickSeedCanvas(), safeDirs(), SKILL_ROOT_GLOB, skillRoots(), versionKey() (+1 more)

### Community 112 - "spec-gap-scan.mjs"
Cohesion: 0.24
Nodes (8): BUDGET_FILE, isTypeOnly(), isWebglBound(), lineCount(), ROOT, srcFiles, tested, untested

### Community 113 - "plays.ts"
Cohesion: 0.29
Nodes (9): firstPlay(), isLocked(), Play, PLAY_LEVELS, PlayLevel, PlayLevelMeta, PLAYS, playsAtLevel() (+1 more)

### Community 114 - "account-forms.spec.ts"
Cohesion: 0.22
Nodes (9): AccountAdmin, AccountRouteDeps, RemoveAccountInput, RemoveAccountResult, UpdateProfileInput, UpdateProfileResult, nav, session (+1 more)

### Community 115 - "feedback-areas.ts"
Cohesion: 0.27
Nodes (8): AREA_HINT, AREA_PROMPT_CLAUSE, areaFrom(), FEEDBACK_AREAS, FeedbackArea, isFeedbackArea(), NAV, drawerViewLabels()

### Community 116 - "world-state.ts"
Cohesion: 0.24
Nodes (7): Sector, SECTOR_BY_TICKER, EmpireState, ReserveState, StructureState, board, prominence

### Community 117 - "authenticator.spec.ts"
Cohesion: 0.25
Nodes (6): asRes(), ENV, FakeRes, req(), res(), signIn()

### Community 118 - "biome.json"
Cohesion: 0.20
Nodes (9): files, linter, enabled, overrides, $schema, vcs, clientKind, enabled (+1 more)

### Community 119 - "rules"
Cohesion: 0.20
Nodes (10): noUnusedFunctionParameters, noUnusedImports, noUnusedPrivateClassMembers, rules, noFloatingPromises, noBarrelFile, correctness, nursery (+2 more)

### Community 120 - "symbol-sweep.js"
Cohesion: 0.20
Nodes (7): complete, DEFAULT_TICKERS, meta, NOTE: .claude/workflows/** is excluded from Biome (biome.json) — workflow…, REDTEAM_SCHEMA, RESEARCH_SCHEMA, SYNTH_SCHEMA

### Community 121 - "arch-scan.mjs"
Cohesion: 0.24
Nodes (8): files, GRANDFATHER_FILE, junk, lineCount(), rel(), ROOT, SRC, violations

### Community 122 - "ci-medic-logs.mjs"
Cohesion: 0.27
Nodes (7): BEL, ESC, ESCAPE_SEQUENCE, fetchLog(), logArgVariants(), sanitizeLog(), Intent

### Community 123 - "dupe-scan.mjs"
Cohesion: 0.20
Nodes (7): BUDGET_FILE, debt, defs, dupes, IGNORE, ROOT, SRC

### Community 124 - "feedback-scan.mjs"
Cohesion: 0.33
Nodes (9): fetchIssues(), firstAnswerAt(), gh(), main(), outcomeOf(), WHY: until 2026-08-22 the only number describing this lane was a sentence…, roundsOf(), scoreboard() (+1 more)

### Community 125 - "play-feedback.ts"
Cohesion: 0.31
Nodes (7): esc(), money(), PlayOutcome, PlayResult, renderPlayFeedbackLog(), RESULT_LABEL, row()

### Community 126 - "volume-guard.ts"
Cohesion: 0.29
Nodes (6): Env, PERSISTED_STORES, volumePersistenceWarnings(), declaredStores(), EPHEMERAL, tsFiles()

### Community 127 - "includes"
Cohesion: 0.25
Nodes (8): includes, **, !.claude/workflows, !**/coverage, !**/dist, !docs/handoffs, !**/node_modules, !**/spikes

### Community 128 - "context7"
Cohesion: 0.29
Nodes (7): CONTEXT7_API_KEY, npx, babylon-mcp, context7, playwright, @playwright/mcp, @upstash/context7-mcp

### Community 129 - "shoot-tower.mjs"
Cohesion: 0.25
Nodes (5): HEALTH, ONLY, OUT, POWER, SHOTS

### Community 131 - "allowlist-store.ts"
Cohesion: 0.50
Nodes (4): deriveKey(), Envelope, open(), seal()

### Community 133 - "confirm-button.ts"
Cohesion: 0.43
Nodes (6): CONFIRM_BUTTON_STYLE, CONFIRM_LABELS, ConfirmButtonOptions, ConfirmState, renderConfirmButton(), STATES

### Community 134 - "world-patch-apply.ts"
Cohesion: 0.43
Nodes (7): applyOp(), applyWorldOps(), byMassDesc(), EmpireIndex, withoutPiece(), withPiece(), withVitals()

### Community 135 - "clone-scan.mjs"
Cohesion: 0.29
Nodes (5): BUDGET_FILE, clones, outDir, report, ROOT

### Community 136 - "journey-scan.mjs"
Cohesion: 0.43
Nodes (6): JOURNEY_DIR, journeyFiles(), main(), REQUIRED_HEADINGS, ROOT, validate()

### Community 137 - "shoot-login.mjs"
Cohesion: 0.33
Nodes (6): auth, CANDIDATES, EXE, idle, shootAt(), sleep()

### Community 138 - "dashboard-board-routes.spec.ts"
Cohesion: 0.29
Nodes (3): serveBoardFrame(), pageHtml(), nav

### Community 139 - "noExcessiveCognitiveComplexity"
Cohesion: 0.33
Nodes (6): noExcessiveCognitiveComplexity, useSimplifiedLogicExpression, level, options, maxAllowedComplexity, complexity

### Community 140 - "suspicious"
Cohesion: 0.33
Nodes (6): suspicious, noConsole, noEmptyBlockStatements, noMisplacedAssertion, useAwait, useErrorMessage

### Community 141 - "dead-scan.mjs"
Cohesion: 0.33
Nodes (5): BUDGET_FILE, exportsDebt, report, ROOT, typesDebt

### Community 142 - "dep-graph-scan.mjs"
Cohesion: 0.33
Nodes (5): BUDGET_FILE, byRule, DEPCRUISE, report, ROOT

### Community 146 - "formatter"
Cohesion: 0.40
Nodes (5): formatter, enabled, indentStyle, indentWidth, lineWidth

### Community 147 - "formatter"
Cohesion: 0.40
Nodes (5): quoteStyle, semicolons, trailingCommas, javascript, formatter

### Community 148 - "options"
Cohesion: 0.40
Nodes (5): level, options, maxLines, skipBlankLines, noExcessiveLinesPerFile

### Community 149 - "useFilenamingConvention"
Cohesion: 0.40
Nodes (5): filenameCases, useFilenamingConvention, level, options, kebab-case

### Community 150 - "fetch-claude-docs.mjs"
Cohesion: 0.40
Nodes (4): dirFlag, failures, queue, urls

### Community 151 - "backfill-trade-activity.ts"
Cohesion: 0.70
Nodes (4): createActivityStore(), mergeRoster(), createParticipantStore(), main()

### Community 152 - "comms-scan.spec.ts"
Cohesion: 0.50
Nodes (3): Report, Row, run()

### Community 155 - "source"
Cohesion: 0.50
Nodes (4): source, assist, actions, organizeImports

### Community 156 - "smoke-bots.sh"
Cohesion: 0.83
Nodes (3): bridge_armed(), machine_ok(), smoke-bots.sh script

### Community 157 - "dockerignore-research.spec.ts"
Cohesion: 0.67
Nodes (3): ignorer(), included(), ROOT

### Community 162 - "deploy-lag.spec.ts"
Cohesion: 0.67
Nodes (3): explain(), run(), STRANDED

## Knowledge Gaps
- **705 isolated node(s):** `OrderStatus`, `BankerConfig`, `DayTraderConfig`, `FuturistConfig`, `GoldBugConfig` (+700 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `playwright-core` connect `shoot-portfolio.mjs` to `playbook-collections.ts`, `shoot-tower.mjs`, `shoot-login.mjs`, `positions-view.ts`, `feedback-view.ts`, `research-service.ts`, `knip.json`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `shoot-portfolio.mjs`, `package.json`, `knip.json`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `playwright-core` connect `shoot-portfolio.mjs` to `devDependencies`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `OrderStatus`, `BankerConfig`, `DayTraderConfig` to the rest of the system?**
  _705 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MarketContext` be split into smaller, more focused modules?**
  _Cohesion score 0.06837786661056175 - nodes in this community are weakly interconnected._
- **Should `SafetyController` be split into smaller, more focused modules?**
  _Cohesion score 0.055642633228840124 - nodes in this community are weakly interconnected._
- **Should `participant-snapshot.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04517508687516707 - nodes in this community are weakly interconnected._
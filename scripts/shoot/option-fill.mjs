// Visual harness for a bot's option fill (#4642 slice 8, criterion 8) — the account's Activity row
// opened to its decision, and the same trade's pass on Heartbeat, over the real built shell + stubbed
// APIs. PHONE FIRST (docs/PICTURES.md): the 390px frames prove the contract, the dollars, the
// playbook and what would prove it wrong are all readable without a wider screen.
//
// The two payloads are built by the REAL server views — `reasoningForOrder` for the Activity row's
// decision and `decisionCyclesView` for the Heartbeat pass — over one fixture decision record, so a
// frame cannot show a cost line or a contract the code does not produce. Only the bot's own sentences
// (reason, expectation, invalidator) are fixture text, written in the CRWV wheel's and the NVDA
// spread's own templates.
//
// The NVDA $185/$200 call spread (#4650) fills as TWO leg lines, each under its leg's own order id,
// exactly as the account reports it. Its Activity row is built the way the server builds it: the
// record goes into a real (in-memory) decision store, which maps the leg ids; `deskActivityView`
// folds the two leg lines through that map; `reasoningForOrder` attaches the spread's decision.
//
// LATE FILLS (#4650): `--working` and `--late` rerun the same two trades as orders recorded
// `working` — the cancel not confirmed, the spread's legs not yet listed — first as the store holds
// them before the settle loop sees the broker end them, then after it reports each one's fill. Both
// read every payload back through the real store, which is where a settlement is read in place of
// the `working` result. Frames are named `working-*` / `late-*`.
//
// THE WIRE AND THE THESIS (#4650): `--wire` serves the same fills through the REAL `/api/wire` and
// `/api/desk/:id/thesis` routes over the same store — the league feed's spread row and the Thesis
// drawer's spread marker, each folded from the two leg lines and carrying the spread's why. Frames
// are named `wire-*` / `thesis-*`.
//
// JPEG ≤100KB. Usage: npm run build --prefix app && npx tsx scripts/shoot/option-fill.mjs [outdir]
//   [--working | --late | --wire]
import { openDecisionDb } from "../../src/autonomous/decision-db.ts";
import { decisionCyclesView } from "../../src/observatory/decision-json-view.ts";
import { deskActivityView } from "../../src/observatory/desk-json-view.ts";
import { spreadLookup } from "../../src/observatory/spread-activity.ts";
import { reasoningForOrder } from "../../src/observatory/wire-reasoning.ts";
import { serveDeskJson } from "../../src/server/desk-json-routes.ts";
import { serveWireJson } from "../../src/server/wire-routes.ts";
import { humanizeOptionSymbol } from "../../src/trading/option-symbols.ts";
import { AT, filledRecord, HIGH, LOW, PUT, sold, spread } from "./option-fill-fixture.mjs";
import { openShell } from "./shell.mjs";

const SCENARIO = process.argv.includes("--late")
  ? "late"
  : process.argv.includes("--working")
    ? "working"
    : process.argv.includes("--wire")
      ? "wire"
      : "filled";

/** The same two trades recorded `working`: neither cancel confirmed, the spread's legs unlisted. */
const workingRecord = {
  ...filledRecord,
  outcomes: filledRecord.outcomes.map(({ intent, action, result }) => ({
    intent,
    action,
    result: { intent, status: "working", orderId: result.orderId },
  })),
};
/** What the settle loop reports once the broker has ended each one (`optionSettlementOf`). */
const settlements = [
  {
    orderId: "opt-put-1",
    clientOrderId: sold.clientOrderId,
    status: "filled",
    filledQuantity: 1,
    filledPrice: 2.12,
    legs: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.12 }],
    settledAt: "2026-10-07T14:31:00Z",
  },
  {
    orderId: "opt-spread-1",
    clientOrderId: spread.clientOrderId,
    status: "filled",
    filledQuantity: 1,
    filledPrice: 3.35,
    legs: [
      { occSymbol: LOW, orderId: "opt-spread-leg-185", filledQuantity: 1, filledPrice: 5.1 },
      { occSymbol: HIGH, orderId: "opt-spread-leg-200", filledQuantity: 1, filledPrice: 1.75 },
    ],
    settledAt: "2026-10-07T14:31:00Z",
  },
];

const store = openDecisionDb(":memory:");
const AS_WRITTEN = SCENARIO === "filled" || SCENARIO === "wire";
store.record(AS_WRITTEN ? filledRecord : workingRecord);
if (SCENARIO === "late") store.recordSettlements(settlements);
// The default frames read the fixture as written; the late-fill ones read it back through the store.
const record = AS_WRITTEN ? filledRecord : store.listByPersona("bot-sauron", { limit: 1 })[0];

// The sold put's Activity row, with the decision the real join attaches to it.
const findByOrderId = (orderId) => {
  const outcome = record.outcomes.find((o) => o.result.orderId === orderId);
  return outcome ? { record, intent: outcome.intent } : undefined;
};
const putRow = {
  orderId: "opt-put-1",
  symbol: PUT,
  display: humanizeOptionSymbol(PUT),
  side: "sell",
  quantity: 1,
  filled: 1,
  price: "$2.12",
  status: "filled",
  at: "2026-10-07T14:30:12Z",
  backfilled: false,
  origin: "unknown",
  reasoning: reasoningForOrder("opt-put-1", { findByOrderId }),
};
// The spread's two leg fills, as the account's ledger holds them — and the row the server makes.
const legLine = (orderId, symbol, side, price) => ({
  orderId,
  participantId: "bot-sauron",
  symbol,
  side,
  quantity: 1,
  filledQuantity: 1,
  price,
  status: "filled",
  at: "2026-10-07T14:30:15Z",
  source: "stream",
});
const spreadRows = deskActivityView(
  [
    legLine("opt-spread-leg-185", LOW, "buy", 5.1),
    legLine("opt-spread-leg-200", HIGH, "sell", 1.75),
  ],
  undefined,
  {
    spreadOf: spreadLookup({
      findSpreadLeg: (id) => store.findSpreadLeg(id),
      findByOrderId: (id) => store.findByOrderId(id),
    }),
  },
).activity.map((row) => ({
  ...row,
  reasoning: reasoningForOrder(row.orderId, { findByOrderId: (id) => store.findByOrderId(id) }),
}));
const routePayloads = SCENARIO === "wire" ? await wireAndThesis() : {};
store.close();
const folded = spreadRows.length === 1 && spreadRows[0].legs?.length === 2;
// Recorded `working` with no legs listed, the two fills join nothing until the settlement lands.
if (folded !== (SCENARIO !== "working")) {
  throw new Error(`the spread's leg fills ${folded ? "folded" : "did not fold"} (${SCENARIO})`);
}

const shareRow = {
  orderId: "shr-1",
  symbol: "NVDA",
  display: "NVDA",
  side: "buy",
  quantity: 4,
  filled: 4,
  price: "$181.40",
  status: "filled",
  at: "2026-10-06T15:02:00Z",
  backfilled: false,
  origin: "unknown",
};

const settings = {
  authConfigured: false,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "bot-sauron", name: "Sauron", kind: "bot", hostConfigured: true, profile: null },
  ],
};
const desk = {
  generatedAt: "2026-10-07T15:00:00Z",
  desk: { id: "bot-sauron", name: "Sauron", kind: "bot", considerations: [], positions: [] },
};
const heartbeat = {
  available: true,
  heartbeat: {
    state: "beating",
    marketOpen: true,
    lastPassAt: "2026-10-07T14:59:40Z",
    sinceLastPassMs: 20_000,
    cadenceMs: 15_000,
    staleAfterMs: 120_000,
    playbooks: [],
    rollCall: [],
  },
};

/** `/api/wire` and `/api/desk/bot-sauron/thesis`, answered by the real routes over the store — the
 *  ledger is the account's own lines: the spread's two legs, the sold put, a share buy, and a member's
 *  trade beside them on the league feed. */
async function wireAndThesis() {
  const ledgerLine = (orderId, participantId, symbol, side, quantity, price, at) => ({
    orderId,
    participantId,
    symbol,
    side,
    quantity,
    filledQuantity: quantity,
    price,
    status: "filled",
    at,
    source: "stream",
  });
  const sauronLedger = [
    ledgerLine("opt-spread-leg-185", "bot-sauron", LOW, "buy", 1, 5.1, "2026-10-07T14:30:15Z"),
    ledgerLine("opt-spread-leg-200", "bot-sauron", HIGH, "sell", 1, 1.75, "2026-10-07T14:30:15Z"),
    ledgerLine("opt-put-1", "bot-sauron", PUT, "sell", 1, 2.12, "2026-10-07T14:30:12Z"),
    ledgerLine("shr-1", "bot-sauron", "NVDA", "buy", 4, 181.4, "2026-10-06T15:02:00Z"),
  ];
  const ledger = [
    ledgerLine("eric-1", "human-eric", "AAPL", "buy", 10, 227.35, "2026-10-07T14:41:00Z"),
    ...sauronLedger,
  ];
  // Six weeks of equity, deterministic, so the drawer's chart (and with it the markers) renders.
  const history = Array.from({ length: 30 }, (_, i) => ({
    at: new Date(Date.parse("2026-09-08T20:00:00Z") + i * 86_400_000).toISOString(),
    participantId: "bot-sauron",
    equity: 100_000 * (1 + 0.0009 * i + Math.sin(i / 2) * 0.003),
    cash: 60_000,
    realizedPl: 0,
  }));
  const participants = [
    {
      id: "bot-sauron",
      displayName: "Sauron",
      kind: "bot",
      personaId: "sauron",
      cash: 0,
      equity: 0,
      positions: [],
    },
    { id: "human-eric", displayName: "Eric", kind: "human", cash: 0, equity: 0, positions: [] },
  ];
  const config = {
    hub: {
      getState: () => ({ generatedAt: "2026-10-07T15:00:00Z", participants, collisions: [] }),
    },
    readAllTradeActivity: async () => ledger,
    readTradeActivity: async (id) => ledger.filter((line) => line.participantId === id),
    readDecisions: async () => [record],
    readHistory: async (id) => (id === "bot-sauron" ? history : []),
    findByOrderId: (id) => store.findByOrderId(id),
    findSpreadLeg: (id) => store.findSpreadLeg(id),
  };
  const answer = async (serve) => {
    let body = "";
    const res = { writeHead: () => res, end: (text) => (body = text ?? "") };
    await serve(res);
    return JSON.parse(body);
  };
  const wire = await answer((res) => serveWireJson(res, "/api/wire", config, true, () => true));
  const thesisPath = "/api/desk/bot-sauron/thesis";
  const thesis = await answer((res) => serveDeskJson(res, thesisPath, thesisPath, config));
  // The frames prove the fold: one spread row on the feed, one spread marker in the drawer.
  const spreadTrades = wire.wire.trades.filter((t) => t.net);
  const spreadMarkers = thesis.thesis.markers.filter((m) => m.label.includes("SPREAD"));
  if (spreadTrades.length !== 1 || !spreadTrades[0].reasoning || spreadMarkers.length !== 1) {
    throw new Error("the spread did not fold into one Wire row and one Thesis marker with its why");
  }
  return { "/api/wire": wire, [thesisPath]: thesis };
}

const { page, origin, shoot, close } = await openShell({
  name: "option-fill",
  stubs: {
    "/api/settings": settings,
    "/api/desk/bot-sauron": desk,
    "/api/desk/bot-sauron/activity": {
      available: true,
      activity: [...spreadRows, putRow, shareRow],
    },
    "/api/desk/bot-sauron/heartbeat": heartbeat,
    "/api/desk/bot-sauron/probes": { available: false },
    "/api/desk/bot-sauron/decisions": {
      available: true,
      kind: "bot",
      ...decisionCyclesView([record], { homePersonaId: "bot-sauron" }),
    },
    ...routePayloads,
  },
});

// The league feed's spread row, opened to its why; then the Thesis drawer's spread marker.
if (SCENARIO === "wire") {
  for (const [tag, viewport] of [
    ["phone", { width: 390, height: 844 }],
    ["desktop", { width: 1280, height: 900 }],
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`${origin}/app/activity`);
    const row = page.locator(".wire-trade", { hasText: "CALL SPREAD" });
    await row.waitFor();
    await row.locator(".wire-trade-row").click();
    await page.waitForTimeout(400);
    await row.evaluate((el) => {
      el.scrollIntoView({ block: "start" });
      window.scrollBy(0, -150); // clear the sticky header and the session bar
    });
    await shoot(`wire-spread-${tag}`);

    await page.goto(`${origin}/app/u/bot-sauron/thesis`);
    const marker = page.locator(".thesis-marker", { hasText: "CALL SPREAD" });
    await marker.waitFor();
    await marker.getByRole("button", { name: "Why?" }).click();
    await page.waitForTimeout(400);
    // The opened marker's why at the frame's foot, the chart its numbers sit on above it.
    await marker.evaluate((el) => {
      el.scrollIntoView({ block: "end" });
      window.scrollBy(0, 24);
    });
    await shoot(`thesis-spread-marker-${tag}`);
  }
  await close();
  process.exit(0);
}

// Before the settle loop: the pass still says the orders may fill, the legs are loose fills.
if (SCENARIO === "working") {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/u/bot-sauron/decisions#cycle-${AT}`);
  await page
    .getByText(/may still fill/)
    .first()
    .scrollIntoViewIfNeeded();
  await shoot("working-heartbeat-phone");
  await page.goto(`${origin}/app/u/bot-sauron/activity`);
  const first = page.locator("#act-opt-spread-leg-200");
  await first.waitFor();
  await page.waitForTimeout(600);
  await first.evaluate((row) => {
    row.scrollIntoView({ block: "start", inline: "start" });
    const scroller = row.closest(".blotter-scroll");
    if (scroller) scroller.scrollLeft = 0;
    window.scrollBy(0, -150);
  });
  await shoot("working-activity-phone");
  await close();
  process.exit(0);
}
const prefix = SCENARIO === "late" ? "late-" : "";

for (const [tag, viewport] of [
  ["phone", { width: 390, height: 844 }],
  ["desktop", { width: 1280, height: 900 }],
]) {
  await page.setViewportSize(viewport);
  await page.goto(`${origin}/app/u/bot-sauron/activity`);

  // The spread: one row, its net once, each leg beneath it — before anything is opened. The row
  // to the top with the blotter at its left edge (a phone-width blotter scrolls sideways, and a
  // plain scrollIntoView may nudge it), once the page's entrance has settled.
  const toTop = (locator) =>
    locator.evaluate((row) => {
      row.scrollIntoView({ block: "start", inline: "start" });
      const scroller = row.closest(".blotter-scroll");
      if (scroller) scroller.scrollLeft = 0;
      window.scrollBy(0, -150); // clear the sticky header
    });
  const spreadRow = page.locator("#act-opt-spread-1");
  await spreadRow.waitFor();
  await page.waitForTimeout(600);
  await toTop(spreadRow);
  await shoot(`${prefix}activity-spread-legs-${tag}`);
  // Opened: the decision that placed it — its playbook down to what would prove it wrong, which at
  // 390 needs the panel at the top of the frame (the legs are the frame above).
  const spreadWhy = page.getByRole("button", { name: /Why NVDA \$185\/\$200 CALL SPREAD/ });
  await spreadWhy.click();
  await toTop(tag === "phone" ? page.locator("tr.row-why") : spreadRow);
  if (!prefix) await shoot(`activity-spread-why-${tag}`);
  await spreadWhy.click();

  await page.getByRole("button", { name: /Why CRWV \$85 PUT/ }).click();
  // The row at the top, so one frame holds the contract's name and its whole why at 390.
  await page.locator("#act-opt-put-1").evaluate((row) => {
    row.scrollIntoView({ block: "start" });
    window.scrollBy(0, -150); // clear the sticky header
  });
  await shoot(`${prefix}activity-option-fill-${tag}`);

  // Arriving from the row's "the whole pass" link opens that round with its trades included.
  await page.goto(`${origin}/app/u/bot-sauron/decisions#cycle-${AT}`);
  await page.getByText(/received — 1 contract/).scrollIntoViewIfNeeded();
  await shoot(`${prefix}heartbeat-option-fill-${tag}`);
}

await close();

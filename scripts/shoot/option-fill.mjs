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
// JPEG ≤100KB. Usage: npm run build --prefix app && npx tsx scripts/shoot/option-fill.mjs [outdir]
import { openDecisionDb } from "../../src/autonomous/decision-db.ts";
import { decisionCyclesView } from "../../src/observatory/decision-json-view.ts";
import { deskActivityView } from "../../src/observatory/desk-json-view.ts";
import { spreadLookup } from "../../src/observatory/spread-activity.ts";
import { reasoningForOrder } from "../../src/observatory/wire-reasoning.ts";
import { humanizeOptionSymbol } from "../../src/trading/option-symbols.ts";
import { openShell } from "./shell.mjs";

const PUT = "CRWV261113P00085000";
const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const RETIRE =
  "the play retires if its net P/L is below 0 on 2027-01-29 or more than 1 in 3 sold puts finish in the money";

const sold = {
  symbol: "CRWV",
  side: "sell",
  quantity: 1,
  type: "limit",
  playbookId: "CRWV-WHEEL",
  playbookMode: "standard",
  clientOrderId: "sk1-sauron-CRWV-mgf2a-0",
  reason:
    "Selling one cash-secured CRWV $85 PUT · 13 NOV 26 for about $2.10 a share ($210 for the contract): $8,500 stays set aside in case CRWV finishes below $85 and the shares are put to the bot. Run on its owner's conviction — our study found CRWV's option premium underpays its moves.",
  expectation:
    "CRWV stays above $85 to 2026-11-13: the put expires and the premium is kept. Below it, the bot buys 100 shares at $85 and sells covered calls on them next.",
  forecast: {
    direction: "up",
    invalidator: `CRWV settles below $85 on 2026-11-13 — the wheel buys 100 shares at $85; ${RETIRE}`,
  },
  option: {
    effect: "open",
    structure: "cash-secured-put",
    legs: [{ occSymbol: PUT, side: "sell", ratio: 1 }],
    limitPrice: 2.1,
    band: { low: 2.0, high: 2.2, at: "2026-10-07T14:30:00Z" },
  },
};

const spread = {
  symbol: "NVDA",
  side: "buy",
  quantity: 1,
  type: "limit",
  playbookId: "NVDA-CALL-SPREAD",
  playbookMode: "standard",
  clientOrderId: "sk1-sauron-NVDA-mgf2a-1",
  strategy: "nvda-spread-open",
  reason:
    "Buying one NVDA $185/$200 CALL SPREAD · 13 NOV 26 for about $3.40 a share — the options form of S1-NVDA's pre-earnings run-up. The most it can lose is that $340 debit.",
  expectation:
    "NVDA keeps rising into the print: above $200 at expiry the spread is worth $1,500. It is sold back five sessions before the print whatever it is worth then.",
  forecast: {
    direction: "up",
    invalidator:
      "NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints, or this spread exits below its cost",
  },
  option: {
    effect: "open",
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 1 },
    ],
    limitPrice: 3.4,
    band: { low: 3.2, high: 3.6, at: "2026-10-07T14:30:00Z" },
  },
};

const AT = Date.parse("2026-10-07T14:30:00Z");
const record = {
  at: AT,
  personaId: "bot-sauron",
  mode: "live",
  rawIntents: [sold, spread],
  guardedIntents: [sold, spread],
  outcomes: [
    {
      intent: sold,
      action: "placed",
      result: {
        intent: sold,
        status: "filled",
        orderId: "opt-put-1",
        filledQuantity: 1,
        filledPrice: 2.12,
        legFills: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.12 }],
      },
    },
    {
      intent: spread,
      action: "placed",
      result: {
        intent: spread,
        status: "filled",
        orderId: "opt-spread-1",
        filledQuantity: 1,
        filledPrice: 3.35,
        legFills: [
          { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1 },
          { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75 },
        ],
        // Each leg's own broker order id — what the account's two fills carry.
        legOrders: [
          { occSymbol: LOW, orderId: "opt-spread-leg-185" },
          { occSymbol: HIGH, orderId: "opt-spread-leg-200" },
        ],
      },
    },
  ],
};

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
const store = openDecisionDb(":memory:");
store.record(record);
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
store.close();
if (spreadRows.length !== 1 || spreadRows[0].legs?.length !== 2) {
  throw new Error("the spread's two leg fills did not fold into one row");
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
  },
});

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
  await shoot(`activity-spread-legs-${tag}`);
  // Opened: the decision that placed it — its playbook down to what would prove it wrong, which at
  // 390 needs the panel at the top of the frame (the legs are the frame above).
  const spreadWhy = page.getByRole("button", { name: /Why NVDA \$185\/\$200 CALL SPREAD/ });
  await spreadWhy.click();
  await toTop(tag === "phone" ? page.locator("tr.row-why") : spreadRow);
  await shoot(`activity-spread-why-${tag}`);
  await spreadWhy.click();

  await page.getByRole("button", { name: /Why CRWV \$85 PUT/ }).click();
  // The row at the top, so one frame holds the contract's name and its whole why at 390.
  await page.locator("#act-opt-put-1").evaluate((row) => {
    row.scrollIntoView({ block: "start" });
    window.scrollBy(0, -150); // clear the sticky header
  });
  await shoot(`activity-option-fill-${tag}`);

  // Arriving from the row's "the whole pass" link opens that round with its trades included.
  await page.goto(`${origin}/app/u/bot-sauron/decisions#cycle-${AT}`);
  await page.getByText(/received — 1 contract/).scrollIntoViewIfNeeded();
  await shoot(`heartbeat-option-fill-${tag}`);
}

await close();

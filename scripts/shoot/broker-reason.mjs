// Visual harness for what the broker said about a bot's order (#4650 leftover, plan #4642): the CRWV
// put a bot offered at $2.10 that the broker canceled unfilled, on Heartbeat's pass log and opened on
// Activity. PHONE FIRST (docs/PICTURES.md): one 390px frame per surface.
//
// Nothing a frame shows is hand-written except the bot's own sentences (`option-fill-fixture.mjs`):
// the broker's words are built by the real adapter (`settledOptionResult`, over an order the broker
// reports canceled after the 15s wait), recorded into a real bots-side store, sent the way the
// replication client sends them (read back out of SQLite, through JSON and the wire's parser) into a
// second store — the dashboard's copy — and served from it by the REAL desk routes. No sign-in is
// configured, so the viewer is the account's owner, the one reader the words are for.
//
// JPEG ≤100KB. Usage: npm run build --prefix app && npx tsx scripts/shoot/broker-reason.mjs [outdir]
import { settledOptionResult } from "../../src/adapters/alpaca-option-result.ts";
import { openDecisionDb } from "../../src/autonomous/decision-db.ts";
import {
  parseDecisionBatch,
  recordWireKind,
  storeDecisionBatch,
} from "../../src/autonomous/decision-wire.ts";
import { serveDeskJson } from "../../src/server/desk-json-routes.ts";
import { AT, filledRecord, HIGH, LOW, PUT, sold } from "./option-fill-fixture.mjs";
import { openShell } from "./shell.mjs";

// The put the broker canceled at the end of the wait, nothing filled — the adapter's own answer.
const canceled = settledOptionResult(
  sold,
  {
    id: "opt-put-1",
    symbol: PUT,
    qty: "1",
    side: "sell",
    status: "canceled",
    filled_qty: "0",
    limit_price: "2.10",
    client_order_id: sold.clientOrderId,
  },
  15_000,
);
const pass = {
  ...filledRecord,
  outcomes: filledRecord.outcomes.map((o) => (o.intent === sold ? { ...o, result: canceled } : o)),
};

const bots = openDecisionDb(":memory:");
bots.record(pass);
const [sent] = bots.listSince("bot-sauron", 0);
const batch = parseDecisionBatch(
  JSON.parse(
    JSON.stringify({ kind: recordWireKind(sent), personaId: "bot-sauron", records: [sent] }),
  ),
);
const dashboard = openDecisionDb(":memory:");
storeDecisionBatch(dashboard, batch);
const words = dashboard.findByOrderId("opt-put-1")?.record.outcomes[0]?.result?.reason;
if (words !== canceled.reason) {
  throw new Error(
    `the dashboard's copy read back ${JSON.stringify(words)}, not the broker's words`,
  );
}

const line = (orderId, symbol, side, filledQuantity, price, status, at) => ({
  orderId,
  participantId: "bot-sauron",
  symbol,
  side,
  quantity: 1,
  filledQuantity,
  ...(price !== undefined ? { price } : {}),
  status,
  at,
  source: "stream",
});
const ledger = [
  line("opt-spread-leg-185", LOW, "buy", 1, 5.1, "filled", "2026-10-07T14:30:15Z"),
  line("opt-spread-leg-200", HIGH, "sell", 1, 1.75, "filled", "2026-10-07T14:30:15Z"),
  line("opt-put-1", PUT, "sell", 0, undefined, "canceled", "2026-10-07T14:30:16Z"),
];
const bot = {
  id: "bot-sauron",
  displayName: "Sauron",
  kind: "bot",
  personaId: "sauron",
  cash: 0,
  equity: 0,
  positions: [],
};
const config = {
  hub: { getState: () => ({ generatedAt: "2026-10-07T15:00:00Z", participants: [bot] }) },
  readTradeActivity: async () => ledger,
  readDecisions: async (id) => dashboard.listByPersona(id, { limit: 100 }),
  findByOrderId: (id) => dashboard.findByOrderId(id),
  findSpreadLeg: (id) => dashboard.findSpreadLeg(id),
};

const { page, origin, shoot, close } = await openShell({
  name: "broker-reason",
  stubs: {
    "/api/settings": {
      authConfigured: false,
      adminWired: false,
      fleetSuspended: false,
      timezones: [],
      accounts: [
        { id: "bot-sauron", name: "Sauron", kind: "bot", hostConfigured: true, profile: null },
      ],
    },
    "/api/desk/bot-sauron": {
      generatedAt: "2026-10-07T15:00:00Z",
      desk: { id: "bot-sauron", name: "Sauron", kind: "bot", considerations: [], positions: [] },
    },
    "/api/desk/bot-sauron/heartbeat": {
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
    },
    "/api/desk/bot-sauron/probes": { available: false },
  },
});
// The real routes, query string and all (the shell's pathname-only stubs cannot see `?trades=`).
for (const sub of ["activity", "decisions"]) {
  await page.route(`**/api/desk/bot-sauron/${sub}*`, async (route) => {
    const url = new URL(route.request().url());
    let body = "";
    const res = { writeHead: () => res, end: (text) => (body = text ?? "") };
    await serveDeskJson(res, url.pathname, `${url.pathname}${url.search}`, config);
    await route.fulfill({ json: JSON.parse(body) });
  });
}

await page.setViewportSize({ width: 390, height: 844 });

// Heartbeat's pass log, arriving from the put's "the whole pass" link: the round opens with its
// trades, the put's line saying what the broker said beside its result.
await page.goto(`${origin}/app/u/bot-sauron/decisions#cycle-${AT}`);
const said = page.getByText(/^broker said:/);
await said.waitFor();
await page.waitForTimeout(700);
await page.locator(".cycle-outcome", { has: said }).evaluate((el) => {
  el.scrollIntoView({ block: "start" });
  window.scrollBy(0, -170); // the round's head above it, clear of the sticky header
});
await shoot("pass-log-broker-said-phone");

// Activity, the canceled put opened to its why: "Broker said" beside the order it describes.
await page.goto(`${origin}/app/u/bot-sauron/activity`);
const put = page.locator("#act-opt-put-1");
await put.waitFor();
await page.waitForTimeout(700);
await page.getByRole("button", { name: /Why CRWV \$85 PUT/ }).click();
await page.getByText("Broker said").waitFor();
await put.evaluate((row) => {
  row.scrollIntoView({ block: "start", inline: "start" });
  const scroller = row.closest(".blotter-scroll");
  if (scroller) scroller.scrollLeft = 0;
  window.scrollBy(0, -150); // clear the sticky header
});
await shoot("activity-broker-said-phone");

bots.close();
dashboard.close();
await close();

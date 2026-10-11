// Visual harness for an account's Activity paged and narrowed (#4650, plan #4642) — Eric watching the
// option trades a bot makes through each playbook it runs. PHONE FIRST (docs/PICTURES.md): the 390px
// frames prove the symbol box, the owner's playbook chips, "Load older orders" and the honest empty
// line all fit a phone, and (#5101) that each order is a day-headed card that opens in place; one
// desktop frame shows the wider screen only adds room.
//
// Every `/api/desk/bot-sauron/activity` read — the first page, each older page, each filter — is
// answered by the REAL route (`serveDeskJson`) over a real in-memory decision store and a fixture
// ledger, so a frame cannot show a chip, a filtered row or a cursor the server would not produce.
// The ledger: the CRWV put and the NVDA call spread `option-fill.mjs` photographs (their legs as two
// fills, folded by the store's leg map), and 34 older orders — S1-NVDA share round trips and
// CRWV-WHEEL puts — each placed by its own decision, so the first page is full and has a cursor.
// No sign-in is configured, so the viewer is the owner and the chips are drawn.
//
// JPEG ≤100KB. Usage: npm run build --prefix app && npx tsx scripts/shoot/activity-filters.mjs [outdir]
import { openDecisionDb } from "../../src/autonomous/decision-db.ts";
import { serveDeskJson } from "../../src/server/desk-json-routes.ts";
import { filledRecord, HIGH, LOW, PUT } from "./option-fill-fixture.mjs";
import { openShell } from "./shell.mjs";

const DAY = 86_400_000;
const store = openDecisionDb(":memory:");
store.record(filledRecord);

const fill = (orderId, symbol, side, quantity, price, at) => ({
  orderId,
  participantId: "bot-sauron",
  symbol,
  side,
  quantity,
  filledQuantity: quantity,
  price,
  status: "filled",
  at,
  source: "stream",
});

/** The `n`th weekday before 2026-10-07 (1 = the session before), at `hhmm` UTC. */
function session(n, hhmm) {
  let day = Date.parse(`2026-10-07T${hhmm}:00Z`);
  for (let left = n; left > 0; ) {
    day -= DAY;
    if (![0, 6].includes(new Date(day).getUTCDay())) left -= 1;
  }
  return day;
}

/** One older order and the decision that placed it — two a session, the morning's a buy and the
 *  afternoon's a sell: S1-NVDA share round trips, with every sixth a CRWV-WHEEL put sold instead. */
function olderOrder(i) {
  const at = session(Math.floor(i / 2) + 1, i % 2 === 0 ? "19:20" : "14:40");
  const orderId = `old-${i}`;
  const put = i % 6 === 5;
  const side = put || i % 2 === 0 ? "sell" : "buy";
  const intent = put
    ? {
        symbol: "CRWV",
        side: "sell",
        quantity: 1,
        type: "limit",
        playbookId: "CRWV-WHEEL",
        playbookMode: "standard",
        reason: "Selling one cash-secured CRWV $80 PUT · 30 OCT 26 for about $1.90 a share.",
        option: {
          effect: "open",
          structure: "cash-secured-put",
          legs: [{ occSymbol: "CRWV261030P00080000", side: "sell", ratio: 1 }],
          limitPrice: 1.9,
        },
      }
    : {
        symbol: "NVDA",
        side,
        quantity: 4,
        type: "market",
        playbookId: "S1-NVDA",
        playbookMode: "standard",
        reason:
          side === "buy"
            ? "S1-NVDA window open (standard): buying into NVDA's pre-earnings run-up."
            : "S1-NVDA exit (standard): selling the run-up back before the print.",
      };
  store.record({
    at,
    personaId: "bot-sauron",
    mode: "live",
    rawIntents: [intent],
    guardedIntents: [intent],
    outcomes: [
      {
        intent,
        action: "placed",
        result: { intent, status: "filled", orderId, filledQuantity: 1 },
      },
    ],
  });
  const price = put ? 1.9 : Math.round((176 + Math.sin(i / 3) * 6 + (34 - i) * 0.12) * 100) / 100;
  const symbol = put ? "CRWV261030P00080000" : "NVDA";
  return fill(orderId, symbol, side, intent.quantity, price, new Date(at).toISOString());
}

const ledger = [
  fill("opt-spread-leg-185", LOW, "buy", 1, 5.1, "2026-10-07T14:30:15Z"),
  fill("opt-spread-leg-200", HIGH, "sell", 1, 1.75, "2026-10-07T14:30:15Z"),
  fill("opt-put-1", PUT, "sell", 1, 2.12, "2026-10-07T14:30:12Z"),
  ...Array.from({ length: 34 }, (_, i) => olderOrder(i)),
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
  findByOrderId: (id) => store.findByOrderId(id),
  findSpreadLeg: (id) => store.findSpreadLeg(id),
};

const { page, origin, shoot, close } = await openShell({
  name: "activity-filters",
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
    // The deep dive's "now" ring (#5101): CRWV a few dollars above the put's $85 strike.
    "/api/trade/quote": { symbol: "CRWV", last: 88.4, change: 1.2, changePct: 1.38, tone: "pos" },
  },
});
// The real route, query string and all (the shell's pathname-only stubs cannot see `?symbol=`).
await page.route("**/api/desk/bot-sauron/activity*", async (route) => {
  const url = new URL(route.request().url());
  let body = "";
  const res = { writeHead: () => res, end: (text) => (body = text ?? "") };
  await serveDeskJson(res, url.pathname, `${url.pathname}${url.search}`, config);
  await route.fulfill({ json: JSON.parse(body) });
});

/** `locator` at the top of the frame, clear of the phone's sticky header (topbar + market strip),
 *  the blotter at its left edge. */
const toTop = (locator) =>
  locator.evaluate((el) => {
    el.scrollIntoView({ block: "start", inline: "start" });
    const scroller = document.querySelector(".blotter-scroll");
    if (scroller) scroller.scrollLeft = 0;
    window.scrollBy(0, -150);
  });
const settle = () => page.waitForTimeout(700);

for (const [tag, viewport] of [
  ["phone", { width: 390, height: 844 }],
  ["desktop", { width: 1280, height: 900 }],
]) {
  await page.setViewportSize(viewport);
  await page.goto(`${origin}/app/u/bot-sauron/activity`);
  await page.locator("#act-opt-spread-1").waitFor();
  await settle();
  // 1 — the bar over the newest orders: the spread with its legs, the put. The desktop frame is the
  // page as it opens (its account head is sticky there too, so it is not scrolled under it).
  if (tag === "desktop") {
    await shoot(`activity-filters-${tag}`);
    // 1c — the put's full detail as a side panel (#5101): not modal, the table live beside it.
    await page.goto(`${origin}/app/u/bot-sauron/activity?order=opt-put-1#act-opt-put-1`);
    await page.locator(".act-deep-panel").waitFor();
    await settle();
    await shoot(`activity-deep-${tag}`);
    break;
  }
  await toTop(page.locator(".page-header"));
  await shoot(`activity-filters-${tag}`);

  // 1b — the phone's cards (#5101): the put opened in place, under its own row — the time, the
  // price a share, then the decision that placed it.
  await page.locator("#act-opt-put-1 .act-card-head").click();
  await settle();
  await toTop(page.locator("#act-opt-put-1"));
  await shoot(`activity-card-open-${tag}`);

  // 1c — "Full detail ›": the put's deep dive as a page, its one way back at the top.
  await page.getByRole("button", { name: /Full detail/ }).click();
  await page.locator(".act-deep-page").waitFor();
  await settle();
  await shoot(`activity-deep-${tag}`);
  await page.locator(".act-deep-page").evaluate((el) => el.scrollIntoView({ block: "end" }));
  await shoot(`activity-deep-end-${tag}`);
  await page.getByRole("button", { name: "‹ Activity" }).click();
  await page.locator("#act-opt-put-1[data-open]").waitFor();
  await page.locator("#act-opt-put-1 .act-card-head").click();

  // 2 — narrowed to one playbook: the chip pressed (✓), only the spread's card, its why open.
  await page.getByRole("button", { name: "NVDA-CALL-SPREAD", exact: true }).click();
  await page.locator("#act-opt-put-1").waitFor({ state: "detached" });
  await page.locator("#act-opt-spread-1 .act-card-head").click();
  await settle();
  await toTop(page.locator(".activity-filter-bar"));
  await shoot(`activity-playbook-${tag}`);

  // 3 — the bottom of the first page: "Load older orders", and the older page it loads.
  await page.goto(`${origin}/app/u/bot-sauron/activity`);
  const older = page.getByRole("button", { name: "Load older orders" });
  await older.waitFor();
  await settle();
  await older.evaluate((el) => {
    el.scrollIntoView({ block: "end" });
    window.scrollBy(0, 24);
  });
  await shoot(`activity-load-older-${tag}`);

  // 4 — a stock this account never traded: the empty line names the filter and offers the way out.
  await page.goto(`${origin}/app/u/bot-sauron/activity?symbol=AMD`);
  await page.getByRole("button", { name: "Clear the filter" }).waitFor();
  await settle();
  await toTop(page.locator(".page-header"));
  await shoot(`activity-no-match-${tag}`);
}

store.close();
await close();

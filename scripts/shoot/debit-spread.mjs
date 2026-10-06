// Visual harness for a member's call debit spread on the multi-leg builder (#4684) — buy the 180
// call, sell the 190, then Validate and Review. Every draft answer comes from the REAL state machine
// and cover rules (`draft-order.ts`, `draft-order-account.ts`, `draft-order-preview.ts`) instead of
// a scripted fixture like `trade.mjs`'s, so the frames show whatever those rules say today: run it
// on the commit before a cover change and on the change itself for an honest before/after.
// Two scenes, PHONE FIRST then desktop:
//   · no-shares — an account holding no NVDA, photographed after Validate
//   · review    — an account holding 100 NVDA (so the check passes either way), the review screen
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npm run shoot:debit-spread [outdir]
import {
  addLeg,
  removeLeg,
  repriceLeg,
  review,
  submitDraft,
  validate,
} from "../../src/trading/draft-order.ts";
import { validateDraftAccount } from "../../src/trading/draft-order-account.ts";
import { draftPreview } from "../../src/trading/draft-order-preview.ts";
import { openShell } from "./shell.mjs";
import { recentOrdersActivity } from "./trade-recent-orders-fixture.mjs";

const play = (code, name, kind, side, optionType) => ({
  code,
  id: code,
  name,
  tldr: "",
  kind,
  ...(side ? { side } : {}),
  ...(optionType ? { optionType } : {}),
  gloss: "",
  locked: code === "501",
  earned: !["401", "501"].includes(code),
});
// Every rung through 302 earned, so the Spread rung (401) is open — `trade.mjs`'s `throughLongs`.
const plays = {
  linked: true,
  wheels: true,
  nextUp: "401",
  plays: [
    play("101", "Buy stock", "stock", "buy"),
    play("102", "Sell stock", "stock", "sell"),
    play("201", "Sell a cash-secured put", "option", "sell", "put"),
    play("202", "Sell a covered call", "option", "sell", "call"),
    play("301", "Buy a long put", "option", "buy", "put"),
    play("302", "Buy a long call", "option", "buy", "call"),
    play("401", "Vertical spread", "multi-leg"),
    play("501", "Zero-DTE", "option"),
  ],
};

const settings = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "human-eric", name: "Eric", kind: "human", hostConfigured: false, profile: null },
  ],
};
const desk = {
  generatedAt: "2026-10-05T00:00:00Z",
  desk: {
    id: "human-eric",
    name: "Eric",
    kind: "human",
    positions: [],
    tiles: {
      openPositions: 0,
      invested: "$0.00",
      dayPl: "$0.00",
      dayTone: "flat",
      unrealized: "$0.00",
      unrealizedNote: "no positions",
      unrealizedTone: "flat",
      cash: "$10,000.00",
    },
  },
};
const quote = {
  symbol: "NVDA",
  last: 181.32,
  change: 2.14,
  changePct: 1.19,
  tone: "pos",
  bid: 181.28,
  ask: 181.32,
  mid: 181.3,
};

// One expiration of NVDA, calls cheaper as the strike rises and puts the other way, so the two
// sides of the straddle read like a real chain around a $181.32 spot.
const EXPIRATION = "2026-10-16";
const STRIKES = [175, 177.5, 180, 182.5, 185, 187.5, 190];
const CALL_BIDS = [10.1, 8.55, 7.15, 5.9, 4.8, 3.85, 3.05];
const PUT_BIDS = [3.4, 4.3, 5.35, 6.55, 7.9, 9.4, 11.05];
const chainFor = (type) => ({
  symbol: "NVDA",
  optionType: type,
  quote,
  expirations: ["2026-10-09", EXPIRATION, "2026-11-20", "2026-12-18"],
  expiration: EXPIRATION,
  spot: 181.32,
  rows: STRIKES.map((strike, i) => {
    const bid = (type === "call" ? CALL_BIDS : PUT_BIDS)[i];
    return {
      strike,
      occSymbol: `NVDA261016${type === "call" ? "C" : "P"}${String(strike * 1000).padStart(8, "0")}`,
      premium: Number((bid + 0.08).toFixed(2)),
      bid,
      ask: Number((bid + 0.15).toFixed(2)),
      openInterest: 1200 + i * 150,
      volume: 400 + i * 60,
    };
  }),
});

const ASOF = "2026-10-05T14:00:00Z";
const { page, origin, shoot, close } = await openShell({
  name: "debit-spread",
  viewport: { width: 390, height: 844 },
  stubs: {
    "/api/trade/plays": plays,
    "/api/settings": settings,
    "/api/research": { events: [], closures: [], calls: [], symbols: [], studies: [], ledgers: [] },
    "/api/desk/*": desk,
    "/api/desk/human-eric/activity": recentOrdersActivity,
    "/api/trade/quote": quote,
    "/api/trade/bars": { symbol: "NVDA", bars: [] },
    "/api/trade/orders": { available: true, asOf: ASOF, working: [], recent: [] },
    "/api/trade/option-lifecycle": { available: true, asOf: ASOF, rows: [], more: false },
    "/api/trade/alerts": { available: true, asOf: ASOF, alerts: [], dismissable: true },
    "/api/trade/alerts/delivery": {
      available: true,
      channels: ["off", "email"],
      channel: "off",
      minPriority: "critical",
    },
    "/api/trade/watchlist": { ok: true, available: true, limit: 20, watching: [] },
  },
});

// The chain answers by `?type=`, which the harness's pathname-only stubs cannot see.
await page.route("**/api/trade/chain*", (route) =>
  route.fulfill({ json: chainFor(new URL(route.request().url()).searchParams.get("type")) }),
);

// The draft route, answered by the real rules against `account` — the same transitions
// `draft-order-route.ts`'s `applyAction` makes, minus the ladder and identity checks this account
// already passes. Registered after the shell's blanket `/api/**` stub, so it wins.
let account = { cash: 10_000, positions: [] };
const act = (draft, action) => {
  if (action.kind === "add-leg") return addLeg(draft, action.leg);
  if (action.kind === "remove-leg") return removeLeg(draft, action.id);
  if (action.kind === "reprice-leg") return repriceLeg(draft, action.id, action.limitPrice);
  if (action.kind === "validate") return validate(draft, validateDraftAccount(draft, account));
  if (action.kind === "review") return review(draft);
  return submitDraft(draft);
};
await page.route("**/api/trade/draft", (route) => {
  const { draft: echoed, action } = route.request().postDataJSON();
  const draft = {
    phase: echoed.phase,
    legs: echoed.legs,
    refusals: [],
    nextLegId: echoed.nextLegId,
    ...(echoed.verdict ? { verdict: echoed.verdict } : {}),
  };
  const next = act(draft, action);
  return route.fulfill({ json: { draft: next, preview: draftPreview(next) } });
});

const answered = () => page.waitForResponse((r) => r.url().includes("/api/trade/draft"));

/** Build the 180/190 call debit spread from the chain and press Validate. */
async function buildAndValidate() {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=401`);
  await page.getByText("Multi-leg builder").waitFor();
  await page.getByLabel("Underlying").fill("NVDA");
  await page.getByLabel("Underlying").press("Enter");
  await page.getByRole("button", { name: "Pick the 180 call ask" }).click();
  await page.locator(".draft-leg-label", { hasText: "Buy 1 NVDA $180C" }).waitFor();
  await page.getByRole("button", { name: "Pick the 190 call bid" }).click();
  await page.locator(".draft-leg-label", { hasText: "Sell 1 NVDA $190C" }).waitFor();
  const validated = answered();
  await page.getByRole("button", { name: "Validate against account" }).click();
  await validated;
}

/** Land the leg rows just under the sticky header, with the gate's verdict below them. */
async function frameTheGate() {
  await page.locator(".draft-leg-list").scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const list = document.querySelector(".draft-leg-list");
    if (!list) return;
    // Whatever stays pinned at the top (the app header, the market strip) would hide the legs.
    const pinned = [...document.querySelectorAll("body *")]
      .filter((el) => ["sticky", "fixed"].includes(getComputedStyle(el).position))
      .map((el) => el.getBoundingClientRect())
      .filter((box) => box.top <= 1 && box.height < window.innerHeight / 2)
      .reduce((bottom, box) => Math.max(bottom, box.bottom), 0);
    window.scrollBy({ top: list.getBoundingClientRect().top - pinned - 12, left: 0 });
    window.scrollTo({ left: 0, top: window.scrollY });
    // The chain swipes sideways on a phone and a tap can leave it part-way across — centre it on
    // the Strike column, calls' bid/ask to its left and puts' to its right, in every frame alike.
    for (const strip of document.querySelectorAll(".straddle-scroll")) {
      const strike = strip.querySelector(".straddle-strike-h");
      if (strike instanceof HTMLElement) {
        strip.scrollLeft = strike.offsetLeft - (strip.clientWidth - strike.offsetWidth) / 2;
      }
    }
  });
}

// Scene 1: no NVDA shares. The check either names shares the spread doesn't need, or passes.
account = { cash: 10_000, positions: [] };
await buildAndValidate();
await frameTheGate();
await shoot("debit-spread-no-shares-phone");
await page.setViewportSize({ width: 1280, height: 900 });
await frameTheGate();
await shoot("debit-spread-no-shares-desktop");

// Scene 2: 100 NVDA held, so Validate passes under either rule and the review screen shows what
// the desk says about the spread's risk — the unlimited-loss banner, or its real maximum loss.
account = { cash: 10_000, positions: [{ symbol: "NVDA", quantity: 100, avgPrice: 170 }] };
await buildAndValidate();
const reviewed = answered();
await page.getByRole("button", { name: "Review order" }).click();
await reviewed;
await page.getByText("Reviewed — ready to confirm").waitFor();
await frameTheGate();
await shoot("debit-spread-review-phone");
await page.setViewportSize({ width: 1280, height: 900 });
await frameTheGate();
await shoot("debit-spread-review-desktop");

await close();

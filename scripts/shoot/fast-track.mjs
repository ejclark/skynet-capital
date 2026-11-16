// Visual harness for the landing page's first fast track (#7034 slice 2): "What's coming up that I
// should watch?" walked card by card on the REAL built shell over stub APIs. The fortnight is the
// checked-in calendar and ledgers, read through the same `fortnightEvents` the server answers with,
// at a pinned market day, with a member who holds NVDA and watches MSFT. Five frames, all at 390:
//   · ft-1-events  — tap 1: at most 3 events, the member's names first, the rest folded
//   · ft-2-stop    — tap 2 ("Plan a move"): what would prove you wrong, from the ledger
//   · ft-3-exit    — tap 3: where would you take profit, or by when
//   · ft-4-ticket  — tap 4: the move, with its stop and exit, and the door to the trade form
//   · ft-5-trade   — tap 5: the trade form, the carried plan above the ticket
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npx tsx scripts/shoot/fast-track.mjs [outdir]
import { campaignById } from "../../src/domain/campaigns.ts";
import { editions, editionView } from "../../src/domain/edition.ts";
import { fortnightEvents } from "../../src/server/fast-track-route.ts";
import { openShell } from "./shell.mjs";

const AS_OF = "2026-11-09";
const view = editionView(
  editions(),
  new Date(`${AS_OF}T15:00:00Z`),
  (id) => campaignById(id)?.title,
);
const fastTrack = {
  asOf: AS_OF,
  events: fortnightEvents(AS_OF),
  book: { held: ["NVDA"], watched: ["MSFT"] },
};

// The trade form's own reads, the smallest set it renders on (borrowed from ladder-gate.mjs): one
// paper account, the shares and options rungs open.
const play = (code, name, kind, side, optionType) => ({
  code,
  id: code,
  name,
  tldr: "",
  kind,
  side,
  ...(optionType ? { optionType } : {}),
  gloss: "",
  locked: false,
});
const plays = {
  linked: true,
  wheels: false,
  plays: [
    play("101", "Buy stock", "stock", "buy"),
    play("102", "Sell stock", "stock", "sell"),
    play("301", "Buy long put", "option", "buy", "put"),
    play("302", "Buy long call", "option", "buy", "call"),
  ],
};
const account = { id: "ann-1", name: "Ann's paper account", kind: "human", profile: null };
const settings = { authConfigured: true, timezones: [], accounts: [account] };
const desk = {
  generatedAt: `${AS_OF}T15:00:00Z`,
  desk: {
    ...account,
    positions: [],
    tiles: {
      openPositions: 0,
      invested: "$0.00",
      dayPl: "$0.00",
      dayTone: "flat",
      unrealized: "$0.00",
      unrealizedNote: "no positions",
      unrealizedTone: "flat",
      cash: "$100,000.00",
    },
  },
};

const { page, origin, shoot, close } = await openShell({
  name: "fast-track",
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  stubs: {
    "/api/edition": view,
    "/api/fast-track": fastTrack,
    "/api/campaigns/questions": { questions: [] },
    "/api/settings": settings,
    "/api/trade/plays": plays,
    "/api/desk/*": desk,
  },
});

const walk = page.locator(".ft-walk");
await page.goto(`${origin}/app/`);
await page.getByRole("button", { name: "What's coming up that I should watch?" }).click();
await walk.locator(".ft-event").first().waitFor();
await page.locator(".ask-box").scrollIntoViewIfNeeded();
await shoot("ft-1-events");

await walk
  .getByRole("button", { name: /^Plan a move on NVDA/ })
  .first()
  .click();
await walk.locator(".ft-option").first().waitFor();
await walk.scrollIntoViewIfNeeded();
await shoot("ft-2-stop");

await walk.locator(".ft-option").first().click();
await walk.getByText(/Where would you take profit/).waitFor();
await shoot("ft-3-exit");

await walk.locator(".ft-option").first().click();
await walk.locator(".ft-ticket").waitFor();
await walk.scrollIntoViewIfNeeded();
await shoot("ft-4-ticket");

await walk.getByRole("link", { name: "Open it in the trade form" }).click();
await page.locator(".ft-carried").waitFor();
await page.locator(".ft-carried").scrollIntoViewIfNeeded();
await shoot("ft-5-trade");

await close();

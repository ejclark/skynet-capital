// Visual harness for the desktop side panels (#8297): the real built shell over a stub API, one
// paper account holding three names, so the left panel's "What you hold" heads it (B's graft).
// Frames:
//   · panels-phone-home        — 390, the home unchanged: the tower's still, Needs you, the tiles
//   · panels-phone-scoreboard  — 390, the Scoreboard unchanged
//   · panels-desktop-home      — 1280, the home in the middle; left: what you hold · Needs you · the
//                                clock; right: the Journal · the Scoreboard card
//   · panels-desktop-scoreboard — 1280, the Scoreboard in the middle; its card folds to one line
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npx tsx scripts/shoot/side-panels.mjs [outdir]
import { openShell } from "./shell.mjs";

const AT = "2026-11-25T19:42:00Z";
const pos = (symbol, plainName, price, dayPct, dayTone, weightPct) => ({
  symbol,
  display: symbol,
  plainName,
  detail: "",
  isOption: false,
  quantity: "10",
  price,
  dayPct,
  dayTone,
  totalPlRaw: 0,
  returnPct: "+0.0%",
  weightPct,
});

const stubs = {
  "/api/settings": { accounts: [{ id: "paper-1", name: "Paper", kind: "human" }] },
  "/api/desk/paper-1": {
    generatedAt: AT,
    desk: {
      id: "paper-1",
      name: "Paper",
      kind: "human",
      positions: [
        pos("NVDA", "Shares of NVIDIA", "$182.40", "+2.31%", "pos", 48),
        pos("AMD", "Shares of AMD", "$141.05", "−1.12%", "neg", 31),
        pos("AAPL", "Shares of Apple", "$228.90", "+0.40%", "pos", 21),
      ],
    },
  },
  "/api/quests": {
    available: true,
    asOf: AT,
    unread: [],
    quests: [
      {
        source: "position",
        houseCall: "take",
        move: { symbol: "AAPL", label: "Sell a covered call on AAPL" },
      },
    ],
  },
  "/api/journal": {
    available: true,
    wishesEnabled: true,
    notes: [
      {
        kind: "experience",
        uuid: "n1",
        savedAt: "2026-11-24T21:10:00Z",
        text: "Held NVDA through the print. Next time, size it so a gap down doesn't sting.",
      },
    ],
  },
  // The Scoreboard: two members seated against the house bot, then the Field (#8253).
  "/api/board": {
    seq: 1,
    generatedAt: AT,
    metric: "equity",
    view: {
      rows: [
        {
          key: "a",
          name: "Member A",
          kind: "human",
          value: "$104,210",
          tone: "pos",
          bar: 1,
          sortValue: 104210,
        },
        {
          key: "house",
          name: "House bot",
          kind: "bot",
          value: "$101,880",
          tone: "pos",
          bar: 0.6,
          sortValue: 101880,
        },
        {
          key: "paper-1",
          name: "Paper",
          kind: "human",
          value: "$99,420",
          tone: "neg",
          bar: 0.4,
          sortValue: 99420,
        },
      ],
      party: {
        seats: [
          {
            key: "a",
            name: "Member A",
            monthReturn: "+4.2%",
            monthReturnTone: "pos",
            booked: "+$1,210",
            bookedTone: "pos",
          },
          {
            key: "paper-1",
            name: "Paper",
            monthReturn: "−0.6%",
            monthReturnTone: "neg",
            booked: "+$80",
            bookedTone: "pos",
          },
        ],
        partyReturn: "+1.8%",
        partyReturnTone: "pos",
        partyCount: "2 members",
        houseReturn: "+1.9%",
        houseReturnTone: "pos",
        openSeats: 3,
        openLine: "3 seats open: a first paper fill takes one",
        lead: {
          line: "The house bot leads by 0.1 points",
          glyph: "▼",
          figure: "−0.1 pts",
          tone: "neg",
        },
        footnote: "One month, paper only. Booked is closed trades.",
      },
    },
  },
  "/api/feedback": { enabled: true, feedbackCount: 0, recent: [], celebrating: [] },
};

const phone = await openShell({
  name: "side-panels",
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  stubs,
});
await phone.page.goto(`${phone.origin}/app/`);
await phone.page.locator(".home-need").first().waitFor();
await phone.page.waitForTimeout(500);
await phone.shoot("panels-phone-home");
await phone.page.goto(`${phone.origin}/app/leaderboard?by=equity`);
await phone.page.waitForTimeout(800);
await phone.shoot("panels-phone-scoreboard");
await phone.close();

const desk = await openShell({
  name: "side-panels",
  viewport: { width: 1280, height: 900 },
  stubs,
});
await desk.page.goto(`${desk.origin}/app/`);
await desk.page.locator(".dp-held-row").first().waitFor();
await desk.page.waitForTimeout(1500); // the tower frame compiles and lays over its box
await desk.shoot("panels-desktop-home");
await desk.page.goto(`${desk.origin}/app/leaderboard?by=equity`);
await desk.page.locator(".dp-folded").waitFor();
await desk.page.waitForTimeout(800);
await desk.shoot("panels-desktop-scoreboard");
await desk.close();

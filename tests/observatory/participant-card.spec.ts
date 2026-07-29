import {
  activityFeed,
  participantCard,
  participantInvested,
  participantReturnPct,
  participantUnrealized,
  positionsTable,
} from "../../src/observatory/participant-card.js";
import type {
  ActivityView,
  ParticipantSnapshot,
  PositionView,
} from "../../src/observatory/participant-snapshot.js";

const pos = (symbol: string, overrides: Partial<PositionView> = {}): PositionView => ({
  symbol,
  quantity: overrides.quantity ?? 10,
  avgPrice: overrides.avgPrice ?? 100,
  marketValue: overrides.marketValue ?? 1_000,
});

const activity = (overrides: Partial<ActivityView> = {}): ActivityView => ({
  symbol: "NVDA",
  side: "buy",
  quantity: 5,
  filledQuantity: 5,
  status: "filled",
  at: "2026-07-20T14:30:00Z",
  ...overrides,
});

const snap = (overrides: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  cash: 10_000,
  equity: 20_000,
  positions: [],
  ...overrides,
});

describe("participant-card", () => {
  describe("participantUnrealized / participantInvested / participantReturnPct", () => {
    it("sums unrealized P/L and invested value across positions", () => {
      const snapshot = snap({
        positions: [
          pos("NVDA", { quantity: 10, avgPrice: 90, marketValue: 1_000 }),
          pos("META", { quantity: 5, avgPrice: 50, marketValue: 300 }),
        ],
      });
      // NVDA: 1000 - 10*90 = 100; META: 300 - 5*50 = 50
      expect(participantUnrealized(snapshot)).toBe(150);
      expect(participantInvested(snapshot)).toBe(1_300);
    });

    it("reports 0% return when nothing is invested", () => {
      expect(participantReturnPct(snap({ positions: [] }))).toBe(0);
    });

    it("computes return as a percent of invested", () => {
      const snapshot = snap({
        positions: [pos("NVDA", { quantity: 10, avgPrice: 90, marketValue: 1_000 })],
      });
      expect(participantReturnPct(snapshot)).toBeCloseTo(10, 5);
    });

    it("handles a loss (negative unrealized P/L)", () => {
      const snapshot = snap({
        positions: [pos("NVDA", { quantity: 10, avgPrice: 120, marketValue: 1_000 })],
      });
      expect(participantUnrealized(snapshot)).toBe(-200);
      expect(participantReturnPct(snapshot)).toBeCloseTo(-20, 5);
    });
  });

  describe("positionsTable", () => {
    it("shows a friendly empty state with no open positions", () => {
      const html = positionsTable(snap({ positions: [] }));
      expect(html).toContain("No open positions");
      expect(html).not.toContain("<table");
    });

    it("renders a row per position with symbol, qty, avg, market value and signed P/L", () => {
      const html = positionsTable(
        snap({ positions: [pos("NVDA", { quantity: 10, avgPrice: 90, marketValue: 1_000 })] }),
      );
      expect(html).toContain("<table");
      expect(html).toContain(">NVDA<");
      expect(html).toContain("+$100");
    });

    it("escapes symbols to avoid HTML injection", () => {
      const html = positionsTable(
        snap({
          positions: [
            pos("<script>alert(1)</script>", { marketValue: 100, avgPrice: 100, quantity: 1 }),
          ],
        }),
      );
      expect(html).not.toContain("<script>alert(1)</script>");
      expect(html).toContain("&lt;script&gt;");
    });
  });

  describe("activityFeed", () => {
    it("renders nothing when there is no activity", () => {
      expect(activityFeed(snap({ activity: [] }))).toBe("");
      expect(activityFeed(snap({}))).toBe("");
    });

    it("renders the side, symbol, quantity and status for each activity row", () => {
      const html = activityFeed(snap({ activity: [activity({ side: "buy", symbol: "NVDA" })] }));
      expect(html).toContain("Recent Activity");
      expect(html).toContain("BUY");
      expect(html).toContain(">NVDA<");
      expect(html).toContain("filled");
    });

    it("shows at most 6 most-recent activity rows", () => {
      const many = Array.from({ length: 10 }, (_, i) =>
        activity({ symbol: `SYM${i}`, at: `2026-07-2${i % 9}T00:00:00Z` }),
      );
      const html = activityFeed(snap({ activity: many }));
      const rowCount = (html.match(/<tr>/g) ?? []).length;
      expect(rowCount).toBe(6);
    });

    it("includes the fill price when present", () => {
      const html = activityFeed(snap({ activity: [activity({ price: 123.45 })] }));
      expect(html).toContain("$123");
    });
  });

  describe("participantCard", () => {
    it("renders an error card when the account is unreachable", () => {
      const html = participantCard(snap({ error: "network error" }));
      expect(html).toContain("card-error");
      expect(html).toContain("Account unreachable");
      expect(html).not.toContain("Equity");
    });

    it("renders equity, cash, invested and unrealized for a healthy account", () => {
      const html = participantCard(
        snap({
          cash: 5_000,
          equity: 15_000,
          positions: [pos("NVDA", { quantity: 10, avgPrice: 90, marketValue: 1_000 })],
        }),
      );
      expect(html).toContain("$5,000");
      expect(html).toContain("$15,000");
      expect(html).toContain("+$100");
    });

    it("marks the signed-in viewer's own card with YOU and card-self", () => {
      const html = participantCard(snap({}), { isSelf: true });
      expect(html).toContain("YOU");
      expect(html).toContain("card-self");
    });

    it("omits the YOU marker for other participants", () => {
      const html = participantCard(snap({}), { isSelf: false });
      expect(html).not.toContain("you-mark");
    });

    it("wraps the card in a link to the profile when link is requested", () => {
      const html = participantCard(snap({ id: "gandalf" }), { link: true });
      expect(html).toContain("<a ");
      expect(html).toContain('href="/u/gandalf"');
      expect(html).toContain("</a>");
    });

    it("renders as a plain article with no href when link is not requested", () => {
      const html = participantCard(snap({ id: "gandalf" }));
      expect(html).not.toContain("<a ");
      expect(html).toContain("<article");
    });

    it("shows the bot chip with persona for bot participants", () => {
      const html = participantCard(snap({ kind: "bot", personaId: "sauron-the-strategist" }));
      expect(html).toContain("chip-bot");
      expect(html).toContain("sauron-the-strategist");
    });

    it("shows the human chip for human participants", () => {
      const html = participantCard(snap({ kind: "human" }));
      expect(html).toContain("chip-human");
      expect(html).toContain("HUMAN");
    });

    it("shows the empty positions message when a healthy account has no holdings", () => {
      const html = participantCard(snap({ positions: [] }));
      expect(html).toContain("No open positions");
    });

    it("shows a red unrealized figure when P/L is negative", () => {
      const html = participantCard(
        snap({ positions: [pos("NVDA", { quantity: 10, avgPrice: 200, marketValue: 1_000 })] }),
      );
      expect(html).toContain("neg");
      expect(html).toContain("-$1,000");
    });

    it("escapes the display name to prevent HTML injection", () => {
      const html = participantCard(snap({ displayName: "<img src=x onerror=alert(1)>" }));
      expect(html).not.toContain("<img src=x onerror=alert(1)>");
      expect(html).toContain("&lt;img");
    });

    it("omits the activity feed entirely when there is no activity", () => {
      const html = participantCard(snap({ activity: [] }));
      expect(html).not.toContain("Recent Activity");
    });

    it("includes the activity feed when activity is present", () => {
      const html = participantCard(snap({ activity: [activity()] }));
      expect(html).toContain("Recent Activity");
    });
  });
});

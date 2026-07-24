import type { DashboardData } from "./dashboard-data.js";

/**
 * Representative sample data for design previews and tests. NOT real account data —
 * hand-authored to exercise the states the dashboard must render: bots and a human,
 * gains and losses, an empty book, and a failed read.
 */
export function sampleDashboardData(): DashboardData {
  return {
    generatedAt: "2026-07-24T15:30:00.000Z",
    participants: [
      {
        id: "news-fader",
        displayName: "The News Fader",
        kind: "bot",
        personaId: "news-fader",
        cash: 4_120_500,
        equity: 5_082_300,
        positions: [
          { symbol: "EEM", quantity: 12_000, avgPrice: 42.1, marketValue: 528_000 },
          { symbol: "TSM", quantity: 1_800, avgPrice: 190.0, marketValue: 433_800 },
        ],
        activity: [
          {
            symbol: "TSM",
            side: "buy",
            quantity: 1_800,
            filledQuantity: 1_800,
            price: 190.0,
            status: "filled",
            at: "2026-07-24T13:32:10Z",
          },
          {
            symbol: "EEM",
            side: "buy",
            quantity: 12_000,
            filledQuantity: 12_000,
            price: 42.1,
            status: "filled",
            at: "2026-07-24T13:31:04Z",
          },
        ],
      },
      {
        id: "futurist",
        displayName: "The Futurist",
        kind: "bot",
        personaId: "futurist",
        cash: 3_540_000,
        equity: 4_878_100,
        positions: [
          { symbol: "PLTR", quantity: 9_000, avgPrice: 52.0, marketValue: 486_000 },
          { symbol: "NVDA", quantity: 800, avgPrice: 140.0, marketValue: 98_400 },
        ],
      },
      {
        id: "eric",
        displayName: "Eric",
        kind: "human",
        timezone: "America/Chicago",
        cash: 61_200,
        equity: 138_940,
        positions: [{ symbol: "VWO", quantity: 1_200, avgPrice: 48.0, marketValue: 61_440 }],
        activity: [
          {
            symbol: "VWO",
            side: "buy",
            quantity: 1_200,
            filledQuantity: 1_200,
            price: 48.0,
            status: "filled",
            at: "2026-07-24T14:05:00Z",
          },
        ],
      },
    ],
  };
}

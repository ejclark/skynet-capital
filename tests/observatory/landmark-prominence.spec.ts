import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { botLandmarkProminence } from "../../src/observatory/standings.js";

const bot = (id: string, ret: number): ParticipantSnapshot => ({
  id,
  displayName: id,
  kind: "bot",
  personaId: id,
  cash: 0,
  equity: 1000 + ret * 10,
  // invested 1000, unrealized = ret*10 → return% = ret
  positions: [{ symbol: "NVDA", quantity: 1, avgPrice: 1000, marketValue: 1000 + ret * 10 }],
});
const human = (id: string): ParticipantSnapshot => ({
  id,
  displayName: id,
  kind: "human",
  cash: 1000,
  equity: 1000,
  positions: [],
});

describe("botLandmarkProminence", () => {
  it("ranks bots by return: best = 1, worst = ~0.55", () => {
    const m = botLandmarkProminence([
      bot("win", 30),
      bot("mid", 10),
      bot("lose", -5),
      human("eric"),
    ]);
    expect(m.get("win")).toBe(1);
    expect(m.get("lose")).toBeCloseTo(0.55, 5);
    expect(m.get("mid")).toBeGreaterThan(0.55);
    expect(m.get("mid")).toBeLessThan(1);
    expect(m.has("eric")).toBe(false); // humans excluded
  });

  it("a lone bot is fully prominent", () => {
    expect(botLandmarkProminence([bot("solo", 0)]).get("solo")).toBe(1);
  });
});

// The threading pin — every view renders the SAME dial, never defaulting to full power for a
// trailing bot — now lives on the shell's own path: tests/server/desk-json-routes.spec.ts.

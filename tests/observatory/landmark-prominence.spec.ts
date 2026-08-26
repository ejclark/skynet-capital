import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { renderIndividualBody } from "../../src/observatory/render-dashboard.js";
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

// The landmark is the scoreboard only if every view renders the SAME dial — this pins the
// threading, so /u/:id can't silently fall back to a full-power Eye again. (The old /compare half
// of this pin is gone: Standings' folded-in head-to-head renders no nation skyline at all — design
// brief, 2026-08-25 — so there's nothing left to thread a dial through on that surface.)
describe("prominence threading", () => {
  const sauron = (ret: number): ParticipantSnapshot => ({ ...bot("sauron", ret), id: "sauron" });

  it("/u/:id renders the Eye at the passed rank, not full power", () => {
    const low = renderIndividualBody(sauron(-5), { prominence: 0.55 });
    const high = renderIndividualBody(sauron(-5), { prominence: 1 });
    expect(low).not.toBe(high); // the dial visibly reaches the skyline
  });
});

import type { ServerResponse } from "node:http";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { ParticipantProgression } from "../../src/server/progression-service.js";
import { playLocked, serveTicket, stateFromParams } from "../../src/server/trade-ticket-route.js";

const ann: ParticipantSnapshot = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  cash: 100_000,
  equity: 100_000,
  positions: [],
  activity: [],
};

const capture = () => {
  const sent = { status: 0, body: "" };
  const res = {
    writeHead(status: number) {
      sent.status = status;
    },
    end(body?: string) {
      sent.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { sent, res };
};

const progression = (over: Partial<ParticipantProgression> = {}): ParticipantProgression => ({
  wheels: true,
  earned: [],
  earnedByCode: new Map(),
  unlocked: new Set(["101"]),
  nextUp: "101",
  points: 0,
  rank: { title: "Observer", atPoints: 0 },
  unlockedLevels: new Set([100]),
  celebrating: [],
  contributions: [],
  celebratingContributions: [],
  ...over,
});

const deps = (view: ParticipantProgression | undefined) => ({
  snapshotFor: () => ann,
  requesterId: "ann",
  tradingEnabled: true,
  ...(view
    ? {
        progression: {
          view: () => Promise.resolve(view),
          setWheels: () => Promise.resolve(),
          acknowledge: () => Promise.resolve(),
        },
      }
    : {}),
  nav: { active: "trade" as const, canAdd: false, authed: true },
  document: (_title: string, body: string) => body,
});

describe("the ticket GET route — the viewer's ladder rides into the render", () => {
  it("parses ticket state from URL params, guided by default", () => {
    const state = stateFromParams(new URLSearchParams("play=201&symbol=msft&qty=2"));
    expect(state.play.code).toBe("201");
    expect(state.symbol).toBe("MSFT");
    expect(state.qty).toBe(2);
    expect(state.mode).toBe("guided");
  });

  it("locks only with wheels on and the code outside the unlocked set", () => {
    expect(playLocked("201", progression())).toBe(true);
    expect(playLocked("101", progression())).toBe(false);
    expect(playLocked("201", progression({ wheels: false }))).toBe(false);
    expect(playLocked("201", undefined)).toBe(false);
  });

  it("renders the locked panel for a locked ?play=, and the live ticket otherwise", async () => {
    const locked = capture();
    await serveTicket(locked.res, "/trade?play=201", deps(progression()));
    expect(locked.sent.status).toBe(200);
    expect(locked.sent.body).toContain("is still locked");
    expect(locked.sent.body).not.toContain("2 · Shape it");

    const open = capture();
    await serveTicket(open.res, "/trade?play=101", deps(progression()));
    expect(open.sent.body).toContain("2 · Shape it");
    expect(open.sent.body).toContain("🛞 Training wheels ON");
  });

  it("renders the full catalog, nothing locked, with no progression wired", async () => {
    const { sent, res } = capture();
    await serveTicket(res, "/trade?play=301", deps(undefined));
    expect(sent.status).toBe(200);
    expect(sent.body).not.toContain("tk-row locked");
    expect(sent.body).not.toContain("is still locked");
  });
});

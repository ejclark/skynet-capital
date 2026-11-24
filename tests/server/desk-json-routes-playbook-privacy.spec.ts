import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { bot, configWith, fakeRes } from "../support/desk-json-fixtures.js";

/** Playbook names ride to the bot owner alone (#885, #5327) across the desk JSON payloads. */
describe("serveDeskJson", () => {
  // #885 (Eric, 2026-08-29): "at this time, we do not show what playbooks others are using". The
  // `/u/:id` pages read these three payloads for ANY member, so the server withholds the key.
  describe("a bot's playbook names ride to signed-in members, never to a signed-out read (#885, #8254)", () => {
    // Built the way `playbookIntents` builds a real playbook intent's reason (#4442).
    const pick = {
      symbol: "NVDA",
      side: "buy" as const,
      quantity: 1,
      type: "market" as const,
      reason: "S1-NVDA window open (standard): fade",
      playbookId: "S1-NVDA",
      playbookMode: "standard" as const,
    };
    const pass = {
      at: Date.now(),
      personaId: "sauron",
      mode: "live" as const,
      rawIntents: [pick],
      guardedIntents: [pick],
      outcomes: [{ intent: pick, action: "placed" as const }],
      playbookVerdicts: [
        { playbookId: "S1-NVDA", mode: "standard" as const, state: "long" as const },
      ],
    };
    const fill = {
      orderId: "ord-1",
      participantId: "sauron",
      symbol: "NVDA",
      side: "buy" as const,
      quantity: 1,
      filledQuantity: 1,
      status: "filled",
      at: "2026-09-20T15:00:00.000Z",
      source: "stream" as const,
    };
    const session = (email: string) => ({ email, provider: "google" as const, exp: 0 });
    const gated = configWith({
      auth: {} as never,
      resolveOwnerIds: (email: string) => (email === "owner@x" ? ["sauron"] : ["human-eric"]),
      readDecisions: () => Promise.resolve([pass]),
      readTradeActivity: async () => [fill],
      findByOrderId: (orderId) =>
        orderId === "ord-1" ? { record: pass, intent: pick } : undefined,
    });
    const read = async (sub: string, who: string) => {
      const { res, out } = fakeRes();
      const path = `/api/desk/sauron/${sub}`;
      await serveDeskJson(res, path, path, gated, session(who));
      return out.body ?? "";
    };

    it("gives a signed-in member who does not own the bot its names, as the owner reads them (#8254)", async () => {
      const heartbeat = JSON.parse(await read("heartbeat", "guest@x"));
      expect(heartbeat.heartbeat.playbooks[0]).toMatchObject({
        playbookId: "S1-NVDA",
        mode: "standard",
        state: "long",
      });
      const thesis = JSON.parse(await read("thesis", "guest@x"));
      expect(thesis.ladder[0].playbookId).toBe("S1-NVDA");
      const decisions = JSON.parse(await read("decisions", "guest@x"));
      expect(decisions.cycles[0].outcomes[0]).toMatchObject({
        symbol: "NVDA",
        action: "placed",
        playbook: "S1-NVDA",
        playbookMode: "standard",
      });
      const activity = JSON.parse(await read("activity", "guest@x"));
      expect(activity.activity[0].reasoning).toMatchObject({
        reason: pick.reason,
        playbookId: "S1-NVDA",
      });
      // What the broker said stays the owner's on every read (#4650).
      for (const sub of ["heartbeat", "decisions", "activity", "thesis"]) {
        expect(await read(sub, "guest@x")).not.toContain("brokerReason");
      }
    });

    it("names a member-authored play on a bot to a signed-in member, as to its owner (#8254)", async () => {
      const authored = {
        ...pick,
        reason: "U-acct-7-earnings-runup window open (standard): ride the run-up",
        playbookId: "U-acct-7-earnings-runup",
      };
      const refused = {
        ...pass,
        rawIntents: [authored],
        guardedIntents: [],
        outcomes: [],
        refusals: [{ intent: authored, reason: "position-cap" as const }],
        playbookVerdicts: [],
      };
      const config = configWith({
        auth: {} as never,
        resolveOwnerIds: (email: string) => (email === "owner@x" ? ["sauron"] : ["human-eric"]),
        readDecisions: () => Promise.resolve([refused]),
      });
      const path = "/api/desk/sauron/decisions";
      const guest = fakeRes();
      await serveDeskJson(guest.res, path, `${path}?trades=none`, config, session("guest@x"));
      expect(JSON.parse(guest.out.body ?? "").cycles[0].refusedIntents[0]).toMatchObject({
        playbookId: "U-acct-7-earnings-runup",
        reason: authored.reason,
      });
      const owner = fakeRes();
      await serveDeskJson(owner.res, path, path, config, session("owner@x"));
      expect(JSON.parse(owner.out.body ?? "").cycles[0].refusedIntents[0]).toMatchObject({
        playbookId: "U-acct-7-earnings-runup",
        reason: authored.reason,
      });
    });

    it("keeps the reason's own words for the bot's owner", async () => {
      const activity = JSON.parse(await read("activity", "owner@x"));
      expect(activity.activity[0].reasoning.reason).toBe(pick.reason);
    });

    it("keeps them for the bot's owner", async () => {
      const heartbeat = JSON.parse(await read("heartbeat", "owner@x"));
      expect(heartbeat.heartbeat.playbooks[0].playbookId).toBe("S1-NVDA");
      expect(heartbeat.heartbeat.rollCall[0]).toMatchObject({
        playbookId: "S1-NVDA",
        status: "armed",
      });
      const decisions = JSON.parse(await read("decisions", "owner@x"));
      expect(decisions.cycles[0].outcomes[0]).toMatchObject({
        playbook: "S1-NVDA",
        playbookMode: "standard",
      });
      const activity = JSON.parse(await read("activity", "owner@x"));
      expect(activity.activity[0].reasoning.playbookId).toBe("S1-NVDA");
      const thesis = JSON.parse(await read("thesis", "owner@x"));
      expect(thesis.ladder[0].playbookId).toBe("S1-NVDA");
      // The ladder is dated from the pass it was read off, never undated (#3194 slice 6a).
      expect(thesis.ladderAsOf).toBe(new Date(pass.at).toISOString());
    });

    it("withholds them from a signed-out read, and keeps them with no sign-in configured", async () => {
      const { res, out } = fakeRes();
      await serveDeskJson(res, "/api/desk/sauron/heartbeat", "/api/desk/sauron/heartbeat", gated);
      expect(out.body).not.toContain("S1-NVDA");
      const local = fakeRes();
      await serveDeskJson(
        local.res,
        "/api/desk/sauron/heartbeat",
        "/api/desk/sauron/heartbeat",
        configWith({ readDecisions: () => Promise.resolve([pass]) }),
      );
      expect(local.out.body).toContain("S1-NVDA");
    });
  });

  // #5327 — the drawn play names the play, so it rides to the owner alone, like every other id.
  describe("the Thesis tab's drawn play is the bot owner's alone (#885, #5327)", () => {
    const claim = {
      symbol: "NVDA",
      side: "buy" as const,
      quantity: 6,
      type: "market" as const,
      reason: "claiming the discarded",
      strategy: "sauron-panic-claim",
      playbookId: "SAURON",
      playbookMode: "standard" as const,
    };
    const pass = {
      at: Date.now(),
      personaId: "sauron",
      mode: "live" as const,
      rawIntents: [claim],
      guardedIntents: [claim],
      outcomes: [{ intent: claim, action: "placed" as const }],
      context: {
        asOf: "2026-09-20T15:00:00.000Z",
        quotes: {},
        momentum: { NVDA: 0.003 },
        newsSentiment: { NVDA: -0.82 },
      },
      playbookVerdicts: [
        { playbookId: "SAURON", mode: "standard" as const, state: "long" as const },
      ],
    };
    const fill = {
      orderId: "ord-1",
      participantId: "sauron",
      symbol: "NVDA",
      side: "buy" as const,
      quantity: 6,
      filledQuantity: 6,
      status: "filled",
      at: "2026-09-20T15:00:00.000Z",
      source: "stream" as const,
    };
    const sauron = { ...bot, personaId: "sauron" };
    const gated = configWith({
      hub: {
        getState: () => ({ generatedAt: "t", participants: [sauron], collisions: [] }),
      } as never,
      auth: {} as never,
      resolveOwnerIds: (email: string) => (email === "owner@x" ? ["sauron"] : ["human-eric"]),
      readDecisions: () => Promise.resolve([pass]),
      readTradeActivity: async () => [fill],
      findByOrderId: (orderId) =>
        orderId === "ord-1" ? { record: pass, intent: claim } : undefined,
      signalWindows: { momentum: 20, sentiment: 10 },
    });
    const thesisFor = async (who: string) => {
      const { res, out } = fakeRes();
      const path = "/api/desk/sauron/thesis";
      await serveDeskJson(res, path, path, gated, { email: who, provider: "google", exp: 0 });
      return out.body ?? "";
    };

    it("draws the play, with its windows and each mark's recorded news score, for the owner", async () => {
      const { thesis } = JSON.parse(await thesisFor("owner@x"));
      expect(thesis.play).toMatchObject({
        playbookId: "SAURON",
        name: "Buy the rumor, sell the news",
        buyAtOrBelow: -0.7,
        sellAtOrAbove: 0.7,
        windows: { momentum: 20, sentiment: 10 },
      });
      expect(thesis.markers[0]).toMatchObject({ playbookId: "SAURON", sentiment: -0.82 });
    });

    it("sends a non-owner the marks' news scores but not the owner's drawn play", async () => {
      const body = await thesisFor("guest@x");
      const { thesis } = JSON.parse(body);
      expect(thesis.play).toBeUndefined();
      expect(thesis.markers[0]).toMatchObject({ symbol: "NVDA", sentiment: -0.82 });
      // The drawn play stays the owner's; the marks keep their playbook since #8254.
      expect(body).not.toContain("Buy the rumor");
    });
  });
});

import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { bot, configWith, fakeRes } from "../support/desk-json-fixtures.js";

/** Playbook names ride to the bot owner alone (#885, #5327) across the desk JSON payloads. */
describe("serveDeskJson", () => {
  // #885 (Eric, 2026-08-29): "at this time, we do not show what playbooks others are using". The
  // `/u/:id` pages read these three payloads for ANY member, so the server withholds the key.
  describe("playbook names are the bot owner's alone (#885)", () => {
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

    it("withholds them from a member who does not own the bot", async () => {
      const heartbeat = JSON.parse(await read("heartbeat", "guest@x"));
      expect(heartbeat.heartbeat.playbooks).toEqual([
        expect.objectContaining({ mode: "standard", state: "long" }),
      ]);
      // `thesis` carries the safeguard ladder (#3194 slice 6a) — the stages still ride, so a
      // member can see what protects the bot, with the play's name withheld like every other row.
      const thesis = JSON.parse(await read("thesis", "guest@x"));
      expect(thesis.ladder).toEqual([
        expect.objectContaining({ mode: "standard", stages: expect.any(Array) }),
      ]);
      expect(thesis.ladder[0].playbookId).toBeUndefined();
      // The fields carrying a play's name are stripped, and so is the name inside the reason's
      // free text — `call.why` and every `reasoning.reason` (#4442).
      for (const sub of ["heartbeat", "decisions", "activity", "thesis"]) {
        const body = await read(sub, "guest@x");
        expect(body).not.toContain("S1-NVDA");
        expect(body).not.toContain("playbookMode");
      }
      // The rest of the decision still rides — only the playbook's name is withheld.
      const decisions = JSON.parse(await read("decisions", "guest@x"));
      expect(decisions.cycles[0].outcomes[0]).toMatchObject({ symbol: "NVDA", action: "placed" });
      const activity = JSON.parse(await read("activity", "guest@x"));
      expect(activity.activity[0].reasoning).toMatchObject({
        reason: "a playbook window open (standard): fade",
        personaId: "sauron",
      });
    });

    it("redacts a member-authored play's id from a refused idea's reason", async () => {
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
      expect(guest.out.body).not.toContain("U-acct-7");
      expect(JSON.parse(guest.out.body ?? "").cycles[0].refusedIntents[0].reason).toBe(
        "a playbook window open (standard): ride the run-up",
      );
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

    it("sends a non-owner the marks' news scores but neither the play nor its name", async () => {
      const body = await thesisFor("guest@x");
      const { thesis } = JSON.parse(body);
      expect(thesis.play).toBeUndefined();
      expect(thesis.markers[0]).toMatchObject({ symbol: "NVDA", sentiment: -0.82 });
      expect(body).not.toContain("SAURON");
      expect(body).not.toContain("Buy the rumor");
    });
  });
});

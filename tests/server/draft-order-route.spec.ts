import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDraftOrderApi } from "../../src/server/draft-order-route.js";

/**
 * The draft's route (#582, slices 3-4): every action re-applies the actual `draft-order.ts`
 * functions server-side, so the client never carries state the state machine didn't produce —
 * same doctrine as the single-leg ticket, just spread across the whole leg-add/validate/review
 * lifecycle instead of only review/submit.
 */

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead: (status: number) => {
      out.status = status;
      return res;
    },
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

const ann = { email: "ann@x.com" } as never;
const stranger = { email: "stranger@x.com" } as never;

function config(overrides: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    hub: {
      getState: () => ({
        participants: [{ id: "human-ann", cash: 50_000, positions: [] }],
      }),
    },
    auth: {},
    resolveOwnerId: (email: string) => (email === "ann@x.com" ? "human-ann" : undefined),
    ...overrides,
  } as unknown as DashboardServerConfig;
}

const CALL_LEG = {
  underlying: "NVDA",
  optionType: "call",
  strike: 180,
  expiration: "2026-09-18",
  action: "sell",
  contracts: 1,
  limitPrice: 4.2,
};
const HIGHER_CALL_LEG = { ...CALL_LEG, strike: 200, action: "buy", limitPrice: 1.1 };
// An unrelated long put — enough to clear the "at least two legs" floor without capping the short
// call, so the naked-call risk on CALL_LEG stays visible.
const UNRELATED_PUT_LEG = {
  underlying: "NVDA",
  optionType: "put",
  strike: 150,
  expiration: "2026-09-18",
  action: "buy",
  contracts: 1,
  limitPrice: 0.5,
};

const call = async (
  body: unknown,
  cfg: DashboardServerConfig = config(),
  session: unknown = ann,
) => {
  const { res, out } = fakeRes();
  await serveDraftOrderApi(post(body), res, "/api/trade/draft", cfg, session as never);
  return { out, parsed: JSON.parse(out.body ?? "{}") };
};

describe("serveDraftOrderApi", () => {
  it("adds a leg to an empty draft through the real state machine", async () => {
    const { parsed } = await call({
      participantId: "human-ann",
      draft: undefined,
      action: { kind: "add-leg", leg: CALL_LEG },
    });
    expect(parsed.draft.phase).toBe("drafting");
    expect(parsed.draft.legs).toHaveLength(1);
    expect(parsed.draft.legs[0].id).toBe("leg-1");
  });

  it("validates against the live account and flags a naked short call as unlimited-loss", async () => {
    const one = await call({
      participantId: "human-ann",
      draft: undefined,
      action: { kind: "add-leg", leg: CALL_LEG },
    });
    const two = await call({
      participantId: "human-ann",
      draft: one.parsed.draft,
      action: { kind: "add-leg", leg: UNRELATED_PUT_LEG },
    });
    const { parsed } = await call({
      participantId: "human-ann",
      draft: two.parsed.draft,
      action: { kind: "validate" },
    });
    // The naked call needs 100 shares the account doesn't hold — validate refuses.
    expect(parsed.draft.phase).toBe("drafting");
    expect(parsed.draft.refusals.join(" ")).toContain("never sells naked calls");
    expect(parsed.preview.maxLoss).toBe("unlimited");
    expect(parsed.preview.unlimitedLoss).toBe(true);
  });

  it("walks a covered credit spread all the way to reviewed with the payoff attached", async () => {
    const one = await call({
      participantId: "human-ann",
      draft: undefined,
      action: { kind: "add-leg", leg: CALL_LEG },
    });
    const two = await call({
      participantId: "human-ann",
      draft: one.parsed.draft,
      action: { kind: "add-leg", leg: HIGHER_CALL_LEG },
    });
    const validated = await call({
      participantId: "human-ann",
      draft: two.parsed.draft,
      action: { kind: "validate" },
    });
    expect(validated.parsed.draft.phase).toBe("validated");

    const { parsed } = await call({
      participantId: "human-ann",
      draft: validated.parsed.draft,
      action: { kind: "review" },
    });
    expect(parsed.draft.phase).toBe("reviewed");
    expect(parsed.preview.netPremium).toBeCloseTo(310);
    expect(parsed.preview.maxLoss).toBeCloseTo(1_690);
    expect(parsed.preview.unlimitedLoss).toBe(false);
  });

  it("refuses to submit a draft that was never reviewed — review is the only path to fire", async () => {
    const { parsed } = await call({
      participantId: "human-ann",
      draft: { phase: "validated", legs: [], refusals: [], nextLegId: 1 },
      action: { kind: "submit" },
    });
    expect(parsed.draft.phase).not.toBe("submitted");
    expect(parsed.draft.refusals.join(" ")).toContain(
      "Orders are only sent from the review screen",
    );
  });

  it("names the honest state when a reviewed draft is confirmed — no broker is wired yet", async () => {
    const reviewed = {
      phase: "reviewed",
      legs: [
        { ...CALL_LEG, id: "leg-1" },
        { ...HIGHER_CALL_LEG, id: "leg-2" },
      ],
      refusals: [],
      nextLegId: 3,
    };
    const { parsed } = await call({
      participantId: "human-ann",
      draft: reviewed,
      action: { kind: "submit" },
    });
    expect(parsed.draft.phase).toBe("submitted");
    expect(parsed.executed).toBe(false);
    expect(parsed.note).toContain("wired up");
  });

  it("refuses a desk the session doesn't own, before touching any account data", async () => {
    const { parsed } = await call(
      {
        participantId: "human-ann",
        draft: undefined,
        action: { kind: "add-leg", leg: CALL_LEG },
      },
      config(),
      stranger,
    );
    expect(parsed.draft.refusals).toContain("You can only build an order on your own account.");
    expect(parsed.draft.legs ?? []).toHaveLength(0);
  });

  it("400s a malformed body rather than coercing it into an action", async () => {
    const { out } = await call({ participantId: "human-ann", action: { kind: "not-a-thing" } });
    expect(out.status).toBe(400);
  });
});

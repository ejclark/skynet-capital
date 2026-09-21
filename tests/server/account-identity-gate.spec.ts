import type { Participant } from "../../src/participants/participant.js";
import { resolveDeskTrading, verifyOwnAccount } from "../../src/server/account-identity-gate.js";

/**
 * `verifyOwnAccount` — the structural gate both desks share (moved from `desk-gate.ts`'s
 * `openDesk`, #928 slice 3). Both a share client and an options client are answered together now,
 * so neither desk needs its own raw factory in scope — see `account-identity-gate.ts`'s header.
 */

const ann: Participant = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
};

describe("verifyOwnAccount — the structural gate both desks share", () => {
  const deps = {
    tradingEnabled: true,
    findParticipant: (id: string) => (id === "ann" ? ann : undefined),
    clientFactory: () => ({}) as never,
    optionsClientFactory: () => ({}) as never,
  };

  it("refuses, in order: switched off · wrong identity · unknown account", () => {
    expect(verifyOwnAccount({ ...deps, tradingEnabled: false }, "ann", "ann")).toMatchObject({
      refusals: [expect.stringContaining("switched off")],
    });
    expect(verifyOwnAccount(deps, "ann", "joe")).toMatchObject({
      refusals: ["You can only trade your own account."],
    });
    expect(verifyOwnAccount(deps, "ann", undefined)).toMatchObject({
      refusals: ["You can only trade your own account."],
    });
    expect(verifyOwnAccount(deps, "ghost", "ghost")).toMatchObject({
      refusals: ["That account isn't on the board."],
    });
  });

  it("answers the participant with live share and options clients when the gate passes", () => {
    const access = verifyOwnAccount(deps, "ann", "ann");
    expect("participant" in access && access.participant.id).toBe("ann");
    expect("client" in access).toBe(true);
    expect("optionsClient" in access).toBe(true);
  });
});

describe("resolveDeskTrading — every desk hangs off the one bound closure", () => {
  const deps = {
    findParticipant: (id: string) => (id === "ann" ? ann : undefined),
    clientFactory: () => ({}) as never,
    optionsClientFactory: () => ({}) as never,
    authConfigured: true,
  };

  it("exposes the multi-leg seam beside the two single-leg ones (#3407 P3)", () => {
    const desk = resolveDeskTrading(deps);
    expect(typeof desk.submit).toBe("function");
    expect(typeof desk.submitOption).toBe("function");
    expect(typeof desk.submitDraft).toBe("function");
  });

  it("refuses a stranger on the multi-leg seam before any client is built", async () => {
    const desk = resolveDeskTrading(deps);
    const reviewed = { phase: "reviewed" as const, legs: [], refusals: [], nextLegId: 1 };
    const result = await desk.submitDraft({ participantId: "ann", draft: reviewed }, "joe");
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.refusals[0]).toContain("your own account");
  });

  it("is switched off with the authenticator, on every seam alike", async () => {
    const desk = resolveDeskTrading({ ...deps, authConfigured: false });
    expect(desk.enabled).toBe(false);
    const reviewed = { phase: "reviewed" as const, legs: [], refusals: [], nextLegId: 1 };
    const result = await desk.submitDraft({ participantId: "ann", draft: reviewed }, "ann");
    expect(result).toMatchObject({ ok: false });
  });
});

import type { Participant } from "../../src/participants/participant.js";
import { verifyOwnAccount } from "../../src/server/account-identity-gate.js";

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

import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import { buildParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { Participant } from "../../src/participants/participant.js";

class FakeTransport implements AlpacaTradingTransport {
  constructor(private readonly responses: Record<string, JsonResponse>) {}
  get(path: string): Promise<JsonResponse> {
    const hit = Object.entries(this.responses).find(([prefix]) => path.startsWith(prefix));
    return Promise.resolve(hit ? hit[1] : { status: 404, body: null });
  }
  post(): Promise<JsonResponse> {
    return Promise.resolve({ status: 404, body: null });
  }
  delete(): Promise<JsonResponse> {
    return Promise.resolve({ status: 404, body: null });
  }
}

const ann: Participant = {
  id: "human-ann",
  displayName: "Ann",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s" },
};

const clientFor = (account: unknown): AlpacaTradingClient =>
  new AlpacaTradingClient(
    new FakeTransport({
      "/v2/account": { status: 200, body: account },
      "/v2/positions": { status: 200, body: [] },
      "/v2/orders": { status: 200, body: [] },
    }),
  );

const healthy = { id: "uuid-1", cash: "1000", portfolio_value: "1500", status: "ACTIVE" };

describe("buildParticipantSnapshot", () => {
  it("reads cash, equity and the broker's account id", async () => {
    const snapshot = await buildParticipantSnapshot(ann, clientFor(healthy));
    expect(snapshot).toMatchObject({ id: "human-ann", accountId: "uuid-1", cash: 1000 });
    expect(snapshot.equity).toBe(1500);
  });

  // #732 — the member-facing identifier. `accountId` is the API's UUID and appears nowhere a
  // member would recognize; `account_number` is what Alpaca's own dashboard shows them, which is
  // what makes it the value that answers "which broker account is this board name?".
  it("carries Alpaca's account number, distinct from the API's account id", async () => {
    const snapshot = await buildParticipantSnapshot(
      ann,
      clientFor({ ...healthy, account_number: "PA3ABCDEF" }),
    );
    expect(snapshot.accountNumber).toBe("PA3ABCDEF");
    expect(snapshot.accountId).toBe("uuid-1");
  });

  it("omits the number entirely when the payload has none", async () => {
    const snapshot = await buildParticipantSnapshot(ann, clientFor(healthy));
    expect(snapshot).not.toHaveProperty("accountNumber");
  });

  it("has no number on a failed read, alongside the captured error", async () => {
    const failing = new AlpacaTradingClient(new FakeTransport({}));
    const snapshot = await buildParticipantSnapshot(ann, failing);
    expect(snapshot.error).toBeDefined();
    expect(snapshot).not.toHaveProperty("accountNumber");
  });
});

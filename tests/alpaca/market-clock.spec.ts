import { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";

class FakeTransport implements AlpacaTradingTransport {
  constructor(private readonly clock: JsonResponse) {}
  get(_path: string): Promise<JsonResponse> {
    return Promise.resolve(this.clock);
  }
  post(_path: string, _body: unknown): Promise<JsonResponse> {
    return Promise.resolve({ status: 404, body: null });
  }
}

describe("AlpacaTradingClient.isMarketOpen", () => {
  it("is true when the clock reports open", async () => {
    const client = new AlpacaTradingClient(
      new FakeTransport({ status: 200, body: { is_open: true } }),
    );
    expect(await client.isMarketOpen()).toBe(true);
  });

  it("is false when the clock reports closed", async () => {
    const client = new AlpacaTradingClient(
      new FakeTransport({ status: 200, body: { is_open: false } }),
    );
    expect(await client.isMarketOpen()).toBe(false);
  });
});

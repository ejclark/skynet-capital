import {
  AlpacaOptionsFlowSource,
  type OptionChainReader,
} from "../../src/adapters/alpaca-options-flow.js";
import type { OptionChainRow } from "../../src/alpaca/alpaca-options-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";

const CALL = "NVDA260918C00200000";
const PUT = "NVDA260918P00200000";

const chainReader = (rows: Record<"call" | "put", OptionChainRow[]>): OptionChainReader => ({
  getChain: (_underlying, _expiration, type) => Promise.resolve(rows[type]),
});

/** A data transport serving canned snapshot pages, recording the paths it was asked for. */
class StubDataTransport implements AlpacaTradingTransport {
  readonly paths: string[] = [];

  constructor(private readonly responses: (path: string) => JsonResponse) {}

  get(path: string): Promise<JsonResponse> {
    this.paths.push(path);
    return Promise.resolve(this.responses(path));
  }

  post(): Promise<JsonResponse> {
    throw new Error("the flow source must never POST");
  }
}

const okBody = (body: unknown): JsonResponse => ({ status: 200, body });

const bothSides = chainReader({
  call: [{ occSymbol: CALL, strike: 200, openInterest: 300 }],
  put: [{ occSymbol: PUT, strike: 200, openInterest: 50 }],
});

describe("AlpacaOptionsFlowSource", () => {
  it("joins open interest from the chain with session volume from the snapshot feed", async () => {
    const data = new StubDataTransport((path) =>
      okBody({
        snapshots: path.includes("type=call")
          ? { [CALL]: { dailyBar: { v: 1_200 } } }
          : { [PUT]: { dailyBar: { v: 80 } } },
      }),
    );
    const flows = await new AlpacaOptionsFlowSource(bothSides, data).flows("NVDA", "2026-09-18");

    expect(flows).toEqual([
      {
        occSymbol: CALL,
        underlying: "NVDA",
        expiration: "2026-09-18",
        strike: 200,
        type: "call",
        volume: 1_200,
        openInterest: 300,
      },
      {
        occSymbol: PUT,
        underlying: "NVDA",
        expiration: "2026-09-18",
        strike: 200,
        type: "put",
        volume: 80,
        openInterest: 50,
      },
    ]);
  });

  it("leaves volume ABSENT — never zero — when the data host is unwired", async () => {
    const flows = await new AlpacaOptionsFlowSource(bothSides).flows("NVDA", "2026-09-18");
    expect(flows).toHaveLength(2);
    expect(flows[0]?.volume).toBeUndefined();
    expect(flows[0]?.openInterest).toBe(300);
  });

  it("leaves volume absent when the data host errors, and never throws", async () => {
    const data = new StubDataTransport(() => ({ status: 500, body: null }));
    const flows = await new AlpacaOptionsFlowSource(bothSides, data).flows("NVDA", "2026-09-18");
    expect(flows[0]?.volume).toBeUndefined();
  });

  it("leaves volume absent when the transport rejects outright", async () => {
    const data: AlpacaTradingTransport = {
      get: () => Promise.reject(new Error("network down")),
      post: () => Promise.reject(new Error("no")),
    };
    const flows = await new AlpacaOptionsFlowSource(bothSides, data).flows("NVDA", "2026-09-18");
    expect(flows.map((f) => f.volume)).toEqual([undefined, undefined]);
  });

  it("leaves open interest absent when the chain row does not carry it", async () => {
    const noOi = chainReader({ call: [{ occSymbol: CALL, strike: 200 }], put: [] });
    const data = new StubDataTransport(() =>
      okBody({ snapshots: { [CALL]: { dailyBar: { v: 9 } } } }),
    );
    const flows = await new AlpacaOptionsFlowSource(noOi, data).flows("NVDA", "2026-09-18");
    expect(flows[0]).toEqual({
      occSymbol: CALL,
      underlying: "NVDA",
      expiration: "2026-09-18",
      strike: 200,
      type: "call",
      volume: 9,
    });
  });

  it("ignores a snapshot whose daily bar carries no usable volume", async () => {
    const data = new StubDataTransport(() =>
      okBody({ snapshots: { [CALL]: { dailyBar: { v: null } }, [PUT]: {} } }),
    );
    const flows = await new AlpacaOptionsFlowSource(bothSides, data).flows("NVDA", "2026-09-18");
    expect(flows.map((f) => f.volume)).toEqual([undefined, undefined]);
  });

  it("follows the snapshot feed's pagination token", async () => {
    const data = new StubDataTransport((path) =>
      path.includes("page_token")
        ? okBody({ snapshots: { [CALL]: { dailyBar: { v: 1_200 } } } })
        : okBody({ snapshots: {}, next_page_token: "page-2" }),
    );
    const flows = await new AlpacaOptionsFlowSource(bothSides, data).flows("NVDA", "2026-09-18");
    expect(flows[0]?.volume).toBe(1_200);
    expect(data.paths.some((p) => p.includes("page_token=page-2"))).toBe(true);
  });

  it("stops after the page cap rather than paginating forever", async () => {
    const data = new StubDataTransport(() => okBody({ snapshots: {}, next_page_token: "always" }));
    const flows = await new AlpacaOptionsFlowSource(bothSides, data).flows("NVDA", "2026-09-18");
    // 5 pages per side, both sides — bounded, and every contract honestly volume-less.
    expect(data.paths).toHaveLength(10);
    expect(flows.every((f) => f.volume === undefined)).toBe(true);
  });

  it("reads only — it asks the snapshot endpoint and never posts", async () => {
    const data = new StubDataTransport(() => okBody({ snapshots: {} }));
    await new AlpacaOptionsFlowSource(bothSides, data).flows("NVDA", "2026-09-18");
    expect(data.paths.every((p) => p.startsWith("/v1beta1/options/snapshots/NVDA?"))).toBe(true);
    expect(data.paths.some((p) => p.includes("expiration_date=2026-09-18"))).toBe(true);
  });
});

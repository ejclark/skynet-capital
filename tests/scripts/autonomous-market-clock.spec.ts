import { startMarketClock } from "../../src/scripts/autonomous-market-clock.js";

/** replaceCredentials fires its refresh fire-and-forget — flush the macrotask queue so every
 *  pending microtask in fetchJson's chain (fetch -> .text() -> JSON.parse) has settled. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Routes /v2/clock to whichever key/secret was sent, so a spec can prove a credential swap
 *  actually reached the underlying HTTP client rather than just updating local state. */
function fakeClockFetch(isOpenByKey: Record<string, boolean>): {
  restore: () => void;
  seenKeys: string[];
} {
  const original = globalThis.fetch;
  const seenKeys: string[] = [];
  // biome-ignore lint/suspicious/useAwait: mock must match fetch's async signature
  globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const key = headers["APCA-API-KEY-ID"] ?? "";
    seenKeys.push(key);
    const isOpen = isOpenByKey[key] ?? false;
    return {
      status: 200,
      text: async () => JSON.stringify({ is_open: isOpen, next_open: "2026-09-08T09:30:00-04:00" }),
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return {
    restore: () => {
      globalThis.fetch = original;
    },
    seenKeys,
  };
}

describe("startMarketClock", () => {
  it("reflects a real isMarketOpen() reading immediately after starting", async () => {
    const fake = fakeClockFetch({ "old-key": true });
    const clock = await startMarketClock({ apiKey: "old-key", apiSecret: "old-secret" });
    fake.restore();
    expect(clock.isOpen()).toBe(true);
  });

  it("exposes Alpaca's own next_open — the holiday-aware answer to 'when is the next session'", async () => {
    const fake = fakeClockFetch({ "old-key": false });
    const clock = await startMarketClock({ apiKey: "old-key", apiSecret: "old-secret" });
    fake.restore();
    expect(clock.nextOpen()).toBe("2026-09-08T09:30:00-04:00");
  });

  describe("replaceCredentials", () => {
    it("switches to the new key/secret on the very next refresh", async () => {
      const fake = fakeClockFetch({ "old-key": false, "new-key": true });
      const clock = await startMarketClock({ apiKey: "old-key", apiSecret: "old-secret" });
      expect(clock.isOpen()).toBe(false);

      clock.replaceCredentials({ apiKey: "new-key", apiSecret: "new-secret" });
      await flush();

      fake.restore();
      expect(clock.isOpen()).toBe(true);
      expect(fake.seenKeys).toContain("new-key");
    });

    it("stops using the old credential once swapped", async () => {
      const fake = fakeClockFetch({ "old-key": true, "new-key": true });
      const clock = await startMarketClock({ apiKey: "old-key", apiSecret: "old-secret" });

      clock.replaceCredentials({ apiKey: "new-key", apiSecret: "new-secret" });
      await flush();
      const seenBeforeRestore = [...fake.seenKeys];
      fake.restore();

      expect(seenBeforeRestore[seenBeforeRestore.length - 1]).toBe("new-key");
    });
  });
});

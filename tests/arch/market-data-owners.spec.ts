import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * WHO OWNS EACH ALPACA MARKET-DATA SOCKET (#4864's retro, docs/LESSONS.md).
 *
 * Alpaca allows ONE concurrent market-data websocket per USER LOGIN per endpoint — every paper
 * account under one login shares it (Alpaca docs, streaming-market-data → Connection limit). A second socket on the
 * same key is refused (`406 connection limit exceeded`) or evicts the first, and the loser goes
 * silent. The bots app's eval loop runs only on a price tick, so losing its socket means no trades.
 *
 * The rule was already written down twice (quote-stream-hub.ts's header, docs/architecture/
 * runtime-api.md) and was still broken by a third opener: the dashboard's held-symbol stream took
 * `participants[0]`, which is Sauron, and blocked autonomous trading for days. Text didn't hold, so
 * this ledger is the gate: every file that opens a socket must be listed here with WHOSE key it
 * uses and why that key can't collide. A new opener fails this spec until that question is
 * answered in the diff.
 */
const OWNERS: Record<string, string> = {
  "src/scripts/autonomous-data-connections.ts":
    "bots app — the bot's own credential (bots[0]). The one owner of every bot account's socket.",
  "src/scripts/dashboard-desk-wiring.ts":
    "dashboard quote hub — the requesting member's own credential, one socket per member (quote-stream-hub.ts).",
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((path) => /\.tsx?$/.test(path))
    .map((path) => join(dir, path));
}

const openers = sourceFiles("src")
  .filter((path) => readFileSync(path, "utf8").includes("new AlpacaMarketDataStream("))
  .sort();

describe("Alpaca market-data socket ownership (one connection per account)", () => {
  it("lists every file that opens a market-data socket, with whose key it uses", () => {
    // Failing here? You added (or removed) an opener. Add it to OWNERS with the credential it
    // uses and why that account has no other socket — or reuse an existing owner's stream.
    expect(openers).toEqual(Object.keys(OWNERS).sort());
  });

  it("keeps the dashboard from opening its own held-symbol price socket", () => {
    // 2026-10-09: the limit is per USER LOGIN per endpoint (Alpaca docs → Connection limit), so
    // even a member's key on the bots' login starved them. The dashboard opens none.
    expect(readFileSync("src/runtime/data-source.ts", "utf8")).not.toContain(
      "new AlpacaMarketDataStream(",
    );
  });
});

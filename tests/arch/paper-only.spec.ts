import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ALPACA_DATA_HOST, PAPER_TRADING_HOST } from "../../src/alpaca/paper-host.js";
import { AlpacaTradeUpdatesStream } from "../../src/alpaca/trade-updates-stream.js";
import { FetchAlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import { ALPACA_PAPER_BASE_URL } from "../../src/bots/bot.js";
import { ALPACA_DATA_BASE_URL } from "../../src/runtime/data-source.js";

// Paper-only as a fact in code (#6954 slice 2): the structural half. `paper-host.spec.ts` proves
// the rule; this proves nothing builds an Alpaca transport or fills stream around it, and that a
// new file naming an Alpaca host is noticed rather than silently trusted.
const SRC = join(__dirname, "..", "..", "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".ts") ? [path] : [];
  });
}

const read = (rel: string): string => readFileSync(join(SRC, rel), "utf8");

describe("paper-only: the two hosts are pinned", () => {
  it("names paper trading and market data, and the url constants agree", () => {
    expect(PAPER_TRADING_HOST).toBe("paper-api.alpaca.markets");
    expect(ALPACA_DATA_HOST).toBe("data.alpaca.markets");
    expect(ALPACA_PAPER_BASE_URL).toBe(`https://${PAPER_TRADING_HOST}`);
    expect(ALPACA_DATA_BASE_URL).toBe(`https://${ALPACA_DATA_HOST}`);
  });
});

describe("paper-only: every trading transport goes through the check", () => {
  it("the REST transport asserts its host in its constructor", () => {
    const source = read("alpaca/trading-transport.ts");
    expect(source).toMatch(/import \{ assertPaperOrDataHost \} from "\.\/paper-host\.js"/);
    expect(source).toMatch(/constructor\([^)]*\)\s*\{\s*assertPaperOrDataHost\(config\.baseUrl\)/);
  });

  it("the fills stream asserts its host in its constructor", () => {
    const source = read("alpaca/trade-updates-stream.ts");
    expect(source).toMatch(/import \{ assertPaperTradingHost \} from "\.\/paper-host\.js"/);
    expect(source).toMatch(/constructor\([^)]*\)\s*\{\s*assertPaperTradingHost\(config\.baseUrl\)/);
  });

  it("a non-paper host throws when the REST transport is built", () => {
    expect(
      () =>
        new FetchAlpacaTradingTransport({
          baseUrl: "https://api.alpaca.markets",
          apiKey: "k",
          apiSecret: "s",
        }),
    ).toThrow(/paper-only/);
  });

  it("a non-paper host throws when the fills stream is built", () => {
    expect(
      () =>
        new AlpacaTradeUpdatesStream({
          participantId: "p",
          apiKey: "k",
          apiSecret: "s",
          baseUrl: "https://api.alpaca.markets",
          onEvent: () => undefined,
        }),
    ).toThrow(/paper-only/);
  });

  it("only the known files name an Alpaca host, so a new route is noticed", () => {
    // Each of these is read-only data, an OAuth hand-off, copy, or the pinned constants above.
    const known = new Set([
      "alpaca/paper-host.ts",
      "alpaca/market-data-stream.ts",
      "bots/bot.ts",
      "companion/companion-help.ts",
      "runtime/data-source.ts",
      "server/auth/alpaca-connect.ts",
    ]);
    const naming = sourceFiles(SRC)
      .filter((file) => /alpaca\.markets/.test(readFileSync(file, "utf8")))
      .map((file) => relative(SRC, file))
      .filter((rel) => !(known.has(rel) || /^\s*(\*|\/\/)/.test(rel)));
    // Doc-comment mentions (alpaca-options-client.ts) are fine; a code literal is what we hunt.
    const literal = naming.filter((rel) =>
      read(rel)
        .split("\n")
        .some((line) => /alpaca\.markets/.test(line) && !/^\s*(\*|\/\/|\/\*)/.test(line)),
    );
    expect(literal).toEqual([]);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Bar } from "../alpaca/alpaca-options-client.js";
import type { Participant } from "../participants/participant.js";
import type { DataSource } from "../runtime/data-source.js";
import type { PracticeData } from "../server/practice-puzzle.js";

/** What a live puzzle says its numbers are. */
export const LIVE_SOURCE = "Alpaca daily bars, IEX feed";
/** What an offline boot says — the fixture's prices are invented, and the page says so. */
export const OFFLINE_SOURCE = "Offline fixture bars, not market data";

/**
 * The newcomer puzzle's data login (#8250). A member with no account has no data client of their
 * own, so the puzzle reads on a HOUSE account's — the first bot in the env roster, the league's
 * own paper login — never a member's credential. Bars are read once a day (`PuzzleCache`), so this
 * adds one small REST read per name per day, and opens no socket.
 *
 * Offline (dev, e2e) there is no feed; the bars come from `fixtures/offline/practice-bars.json`,
 * labelled as invented wherever they show, on the edition's pinned clock.
 */
export function wirePracticeData(input: {
  readonly dataSource: Pick<DataSource, "mode" | "optionsClientFactory">;
  readonly envRoster: readonly Participant[];
  readonly offlineNow?: () => Date;
  readonly fixturePath?: string;
}): PracticeData | undefined {
  if (input.dataSource.mode === "offline") {
    const fixture = readFixture(
      input.fixturePath ?? join(process.cwd(), "fixtures/offline/practice-bars.json"),
    );
    return {
      source: OFFLINE_SOURCE,
      bars: (symbol) => Promise.resolve(fixture[symbol]),
      ...(input.offlineNow ? { now: input.offlineNow } : {}),
    };
  }
  const house = input.envRoster.find((p) => p.kind === "bot");
  if (!house) return undefined;
  const client = input.dataSource.optionsClientFactory(house);
  return {
    source: LIVE_SOURCE,
    bars: (symbol, start, end) => client.getBars(symbol, start, end, 1000, "all"),
  };
}

function readFixture(path: string): Record<string, readonly Bar[]> {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { bars?: Record<string, Bar[]> };
    return parsed.bars ?? {};
  } catch {
    return {};
  }
}

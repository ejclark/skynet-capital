import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import {
  type DecisionPage,
  readAccountDecisions,
  readAccountDecisionsPage,
} from "../../src/server/decision-account-view.js";

/**
 * `readAccountDecisions` (#3608 follow-up, found live 2026-09-24) — beta-scout trades on Sauron's
 * account while keeping its own decision history under `personaId: "beta-scout"`, so Sauron's own
 * `readDecisions("sauron")` never saw it. This pools in any OTHER persona the account's own trade
 * activity resolves to via `findByOrderId` — the same order-id join `playbook-performance.ts`
 * (PR 7d) already proves pools correctly across personas.
 */

const decision = (over: Partial<DecisionRecord> = {}): DecisionRecord => ({
  at: 1,
  personaId: "sauron",
  mode: "live",
  rawIntents: [],
  guardedIntents: [],
  outcomes: [],
  ...over,
});

const trade = (over: Partial<TradeActivityRecord> = {}): TradeActivityRecord =>
  ({
    orderId: "o1",
    symbol: "NVDA",
    side: "buy",
    quantity: 10,
    filledQuantity: 10,
    status: "filled",
    at: "2026-01-01T00:00:00Z",
    participantId: "sauron",
    source: "broker",
    ...over,
  }) as TradeActivityRecord;

describe("readAccountDecisions", () => {
  it("pools a foreign persona's full decision history when its trade lands on this account", async () => {
    const sauronRecords = [decision({ at: 1, personaId: "sauron" })];
    const betaRecords = [
      decision({ at: 2, personaId: "beta-scout" }),
      decision({ at: 3, personaId: "beta-scout", rawIntents: [], outcomes: [] }), // a quiet cycle
    ];
    const records = await readAccountDecisions("sauron", {
      readDecisions: async (id) => (id === "sauron" ? sauronRecords : betaRecords),
      readTradeActivity: async () => [trade({ orderId: "beta-order" })],
      findByOrderId: (orderId) =>
        orderId === "beta-order"
          ? { record: decision({ personaId: "beta-scout" }), intent: {} as never }
          : undefined,
    });
    expect(records?.map((r) => r.at).sort()).toEqual([1, 2, 3]);
  });

  it("never pools anything when every trade's origin already matches the account", async () => {
    const sauronRecords = [decision({ at: 1 })];
    const records = await readAccountDecisions("sauron", {
      readDecisions: async () => sauronRecords,
      readTradeActivity: async () => [trade()],
      findByOrderId: () => ({ record: decision({ at: 1 }), intent: {} as never }),
    });
    expect(records).toBe(sauronRecords);
  });

  it("dedupes a foreign persona discovered via multiple trades — one fetch, not two", async () => {
    let betaFetches = 0;
    const records = await readAccountDecisions("sauron", {
      readDecisions: (id) => {
        if (id === "beta-scout") betaFetches++;
        return Promise.resolve(
          id === "sauron" ? [decision({ at: 1 })] : [decision({ at: 2, personaId: "beta-scout" })],
        );
      },
      readTradeActivity: async () => [trade({ orderId: "b1" }), trade({ orderId: "b2" })],
      findByOrderId: () => ({ record: decision({ personaId: "beta-scout" }), intent: {} as never }),
    });
    expect(betaFetches).toBe(1);
    expect(records?.map((r) => r.at).sort()).toEqual([1, 2]);
  });

  it("returns undefined — an honest absence — when the account has no decisions wired at all", async () => {
    const records = await readAccountDecisions("sauron", {});
    expect(records).toBeUndefined();
  });

  it("degrades to the account's own records when the cross-persona join isn't wired", async () => {
    const sauronRecords = [decision({ at: 1 })];
    const records = await readAccountDecisions("sauron", {
      readDecisions: async () => sauronRecords,
      // no readTradeActivity, no findByOrderId — an older deployment, or a desk with no ledger
    });
    expect(records).toBe(sauronRecords);
  });
});

describe("readAccountDecisionsPage — the whole history, not the newest default page (found 2026-09-24)", () => {
  /** A store with listByPersona's real semantics: newest first, strictly before `before`, at most
   *  `limit` (default 30 — the window "Load older" used to be trapped inside). */
  const store = (byPersona: Record<string, number[]>) => ({
    readDecisions: (id: string, page?: DecisionPage) =>
      Promise.resolve(
        (byPersona[id] ?? [])
          .filter((at) => at < (page?.before ?? Number.POSITIVE_INFINITY))
          .sort((a, b) => b - a)
          .slice(0, page?.limit ?? 30)
          .map((at) => decision({ at, personaId: id })),
      ),
  });

  /** Walk every page the way the route does, returning each page's `at`s. */
  async function walk(deps: Parameters<typeof readAccountDecisionsPage>[1], limit: number) {
    const pages: number[][] = [];
    let before: number | undefined;
    for (let guard = 0; guard < 50; guard++) {
      const page = await readAccountDecisionsPage("sauron", deps, {
        limit,
        ...(before !== undefined ? { before } : {}),
      });
      pages.push((page?.records ?? []).map((r) => r.at));
      if (page?.horizon === undefined) break;
      before = page.horizon;
    }
    return pages;
  }

  it("reaches every one of 250 passes exactly once, 100 at a time", async () => {
    const ats = Array.from({ length: 250 }, (_, i) => i + 1);
    const pages = await walk(store({ sauron: ats }), 100);
    expect(pages.map((p) => p.length)).toEqual([100, 100, 50]);
    expect(pages.flat().sort((a, b) => a - b)).toEqual(ats);
  });

  it("interleaves a dense and a sparse persona with no pass skipped or repeated", async () => {
    const sauron = Array.from({ length: 230 }, (_, i) => i * 2 + 2); // every even at
    const scout = [7, 151, 333, 459]; // a few forced picks, spread through the same span
    const deps = {
      ...store({ sauron, "beta-scout": scout }),
      readTradeActivity: () => Promise.resolve([trade({ orderId: "scout-order" })]),
      findByOrderId: () => ({ record: decision({ personaId: "beta-scout" }), intent: {} as never }),
    };
    const seen = (await walk(deps, 100)).flat();
    expect(seen.length).toBe(sauron.length + scout.length);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("terminates without repeats on a legacy reader that ignores the page and returns everything", async () => {
    const all = Array.from({ length: 150 }, (_, i) => decision({ at: i + 1 }));
    const deps = { readDecisions: () => Promise.resolve(all) };
    const seen = (await walk(deps, 100)).flat();
    expect(seen.length).toBe(150);
    expect(new Set(seen).size).toBe(150);
  });

  it("is undefined when no decision trail is wired", async () => {
    expect(await readAccountDecisionsPage("sauron", {}, { limit: 100 })).toBeUndefined();
  });
});

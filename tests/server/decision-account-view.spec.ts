import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import {
  type DecisionPage,
  readAccountDecisions,
  readAccountDecisionsPage,
} from "../../src/server/decision-account-view.js";

/**
 * `readAccountDecisions` (#3608 follow-up, found live 2026-09-24) — beta-scout trades on Sauron's
 * account while keeping its own decision history under `personaId: "beta-scout"`, so Sauron's own
 * `readDecisions("sauron")` never saw it. This pools in any OTHER persona the account's own trade
 * activity resolves to — the order-id join, held per account by `account-personas-fold.ts`
 * (#4619), whose own spec checks the join against a whole read.
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

describe("readAccountDecisions", () => {
  it("pools a foreign persona's full decision history when it trades on this account", async () => {
    const sauronRecords = [decision({ at: 1, personaId: "sauron" })];
    const betaRecords = [
      decision({ at: 2, personaId: "beta-scout" }),
      decision({ at: 3, personaId: "beta-scout", rawIntents: [], outcomes: [] }), // a quiet cycle
    ];
    const records = await readAccountDecisions("sauron", {
      readDecisions: async (id) => (id === "sauron" ? sauronRecords : betaRecords),
      readAccountPersonas: async () => ["sauron", "beta-scout"],
    });
    expect(records?.map((r) => r.at).sort()).toEqual([1, 2, 3]);
  });

  it("never pools anything when the only persona trading here is the account's own", async () => {
    const sauronRecords = [decision({ at: 1 })];
    const records = await readAccountDecisions("sauron", {
      readDecisions: async () => sauronRecords,
      readAccountPersonas: async () => ["sauron"],
    });
    expect(records).toBe(sauronRecords);
  });

  it("returns undefined — an honest absence — when the account has no decisions wired at all", async () => {
    const records = await readAccountDecisions("sauron", {});
    expect(records).toBeUndefined();
  });

  it("degrades to the account's own records when the cross-persona join isn't wired", async () => {
    const sauronRecords = [decision({ at: 1 })];
    const records = await readAccountDecisions("sauron", {
      readDecisions: async () => sauronRecords,
      // no readAccountPersonas — no decision store to join against, so no whole-ledger join either
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
      readAccountPersonas: () => Promise.resolve(["sauron", "beta-scout"]),
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

  it("pages a legacy reader's whole audit trail even past the engine's argument limit (#4615)", async () => {
    // The JSONL fallback hands back a persona's whole audit file; finding that page's oldest pass
    // with Math.min(...ats) threw RangeError once the file passed ~121k cycles.
    const all = Array.from({ length: 130_000 }, (_, i) => decision({ at: i + 1 }));
    const deps = { readDecisions: () => Promise.resolve(all) };

    const page = await readAccountDecisionsPage("sauron", deps, { limit: 100 });

    expect(page?.horizon).toBe(1);
    expect(page?.records).toHaveLength(130_000);
  });

  it("is undefined when no decision trail is wired", async () => {
    expect(await readAccountDecisionsPage("sauron", {}, { limit: 100 })).toBeUndefined();
  });
});

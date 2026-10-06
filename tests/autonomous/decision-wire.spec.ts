import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import {
  DECISION_BATCH_KIND,
  DECISION_BATCH_KIND_V2,
  MAX_DECISION_BATCH,
  parseDecisionBatch,
  parseDecisionRecord,
  parseDecisionsCursor,
  recordWireKind,
} from "../../src/autonomous/decision-wire.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { GUARD_REFUSAL_REASONS } from "../../src/engine/guards.js";
import { anOptionIntent } from "../support/builders.js";

const rawIntent = { symbol: "NVDA", side: "buy", quantity: 10, type: "market", reason: "x" };

/** The eleven refusal reasons an older dashboard has never heard of. */
const OPTION_REFUSALS = [
  "option-shape",
  "options-level",
  "option-unallocated",
  "option-print-unknown",
  "option-spans-print",
  "option-quote-stale",
  "option-limit-outside-quote",
  "put-not-secured",
  "call-not-covered",
  "uncovers-short-call",
  "collateral-reserved",
] as const;

/** Reasons taught to the dashboard after the option guards, before any bot sends them — the
 *  subscribed-only rule (#4642 slice 10). An older dashboard has never heard of these either. */
const LATER_REFUSALS = ["unsubscribed"] as const;
/** Every reason a v1 dashboard never knew. */
const V2_ONLY_REFUSALS: readonly string[] = [...OPTION_REFUSALS, ...LATER_REFUSALS];

const validRecord = () => ({
  at: 1_700_000_000_000,
  personaId: "sauron",
  mode: "observe",
  rawIntents: [rawIntent],
  guardedIntents: [rawIntent],
  outcomes: [{ intent: rawIntent, action: "observed" }],
});

describe("parseDecisionRecord", () => {
  it("parses a well-formed record", () => {
    const parsed = parseDecisionRecord(validRecord());
    expect(parsed).toMatchObject({ at: 1_700_000_000_000, personaId: "sauron", mode: "observe" });
    expect(parsed?.outcomes).toHaveLength(1);
  });

  it("rejects a record missing outcomes — the exact malformed shape PR 0's crash-vector test used", () => {
    expect(parseDecisionRecord({ at: 1, personaId: "sauron", mode: "observe" })).toBeUndefined();
  });

  it("fails closed on one malformed element inside a well-formed envelope", () => {
    const bad = { ...validRecord(), rawIntents: [rawIntent, { symbol: "NVDA" }] };
    expect(parseDecisionRecord(bad)).toBeUndefined();
  });

  it("rejects an unknown mode", () => {
    expect(parseDecisionRecord({ ...validRecord(), mode: "sideways" })).toBeUndefined();
  });

  it("carries context and refusals when present, omits them when absent", () => {
    const withExtras = parseDecisionRecord({
      ...validRecord(),
      refusals: [{ intent: rawIntent, reason: "s2-print" }],
      context: { asOf: "t", quotes: {} },
    });
    expect(withExtras?.refusals).toEqual([{ intent: rawIntent, reason: "s2-print" }]);
    expect(withExtras?.context).toEqual({ asOf: "t", quotes: {} });

    const bare = parseDecisionRecord(validRecord());
    expect(bare).not.toHaveProperty("refusals");
    expect(bare).not.toHaveProperty("context");
  });

  describe("playbook verdicts (#3687)", () => {
    const verdict = { playbookId: "S1-NVDA", mode: "standard", state: "no-window" };

    it("carries well-formed verdicts across the wire", () => {
      const parsed = parseDecisionRecord({ ...validRecord(), playbookVerdicts: [verdict] });
      expect(parsed?.playbookVerdicts).toEqual([verdict]);
    });

    it("omits the field when absent or empty", () => {
      expect(parseDecisionRecord(validRecord())).not.toHaveProperty("playbookVerdicts");
      expect(parseDecisionRecord({ ...validRecord(), playbookVerdicts: [] })).not.toHaveProperty(
        "playbookVerdicts",
      );
    });

    it("fails the whole record closed on one malformed verdict", () => {
      for (const bad of [
        { ...verdict, state: "maybe" },
        { ...verdict, mode: "yolo" },
        { ...verdict, playbookId: "" },
        "S1-NVDA",
      ]) {
        expect(parseDecisionRecord({ ...validRecord(), playbookVerdicts: [verdict, bad] })).toBe(
          undefined,
        );
      }
    });
  });
});

describe("parseDecisionBatch", () => {
  it("parses a well-formed batch", () => {
    const batch = parseDecisionBatch({
      kind: DECISION_BATCH_KIND,
      personaId: "sauron",
      records: [validRecord()],
    });
    expect(batch?.personaId).toBe("sauron");
    expect(batch?.records).toHaveLength(1);
  });

  it("rejects the wrong/missing kind — the version gate", () => {
    expect(
      parseDecisionBatch({ kind: "decision.v3", personaId: "sauron", records: [validRecord()] }),
    ).toBeUndefined();
    expect(parseDecisionBatch({ personaId: "sauron", records: [validRecord()] })).toBeUndefined();
  });

  it("reads a v1 batch exactly as before", () => {
    const batch = parseDecisionBatch({
      kind: DECISION_BATCH_KIND,
      personaId: "sauron",
      records: [validRecord()],
    });
    expect(batch?.records).toEqual([
      {
        at: 1_700_000_000_000,
        personaId: "sauron",
        mode: "observe",
        rawIntents: [rawIntent],
        guardedIntents: [rawIntent],
        outcomes: [{ intent: rawIntent, action: "observed" }],
      },
    ]);
  });

  it("reads a v2 batch: option orders, every refusal reason, and a limit's two other endings", () => {
    const sold = anOptionIntent();
    const submitted = { ...sold, clientOrderId: "sk1-sauron-CRWV-abc-0" };
    const refused = rawIntent;
    const record = {
      ...validRecord(),
      mode: "live",
      rawIntents: [sold, sold, ...GUARD_REFUSAL_REASONS.map(() => refused)],
      guardedIntents: [sold, sold],
      outcomes: [
        { intent: submitted, action: "placed", result: { intent: submitted, status: "unfilled" } },
        { intent: submitted, action: "placed", result: { intent: submitted, status: "working" } },
      ],
      refusals: GUARD_REFUSAL_REASONS.map((reason) => ({ intent: refused, reason })),
    };

    const batch = parseDecisionBatch(
      JSON.parse(
        JSON.stringify({ kind: DECISION_BATCH_KIND_V2, personaId: "sauron", records: [record] }),
      ),
    );

    expect(batch?.records[0]?.outcomes.map((o) => o.result?.status)).toEqual([
      "unfilled",
      "working",
    ]);
    expect(batch?.records[0]?.outcomes[0]?.intent).toEqual(submitted);
    const reasons = batch?.records[0]?.refusals?.map((r) => r.reason);
    expect(reasons).toEqual(GUARD_REFUSAL_REASONS);
    expect(reasons).toEqual(expect.arrayContaining([...OPTION_REFUSALS]));
  });

  // #4642 slice 10 ships app-first: the dashboard keeps a refusal of an open that came from no
  // subscribed playbook before any bot names one. Without this, the record is dropped whole.
  it("keeps a buy refused as not from a subscribed playbook, reason and all", () => {
    const record = {
      ...validRecord(),
      guardedIntents: [],
      outcomes: [],
      refusals: [{ intent: rawIntent, reason: "unsubscribed" }],
    };

    const batch = parseDecisionBatch({
      kind: DECISION_BATCH_KIND_V2,
      personaId: "sauron",
      records: [record],
    });

    expect(batch?.records[0]?.refusals).toEqual([{ intent: rawIntent, reason: "unsubscribed" }]);
    expect(recordWireKind(record as DecisionRecord)).toBe(DECISION_BATCH_KIND_V2);
  });

  it("rejects a batch mixing another persona's record into this envelope", () => {
    const mixed = {
      kind: DECISION_BATCH_KIND,
      personaId: "sauron",
      records: [{ ...validRecord(), personaId: "beta-scout" }],
    };
    expect(parseDecisionBatch(mixed)).toBeUndefined();
  });

  it("drops an unreadable record alone, keeping every record beside it (#4644)", () => {
    const batch = parseDecisionBatch({
      kind: DECISION_BATCH_KIND,
      personaId: "sauron",
      records: [validRecord(), { personaId: "sauron", nonsense: true }, validRecord()],
    });
    expect(batch?.records).toHaveLength(2);
  });

  it("rejects an empty or over-cap records array — the bounded-batch invariant", () => {
    expect(
      parseDecisionBatch({ kind: DECISION_BATCH_KIND, personaId: "sauron", records: [] }),
    ).toBeUndefined();
    const tooMany = Array.from({ length: MAX_DECISION_BATCH + 1 }, () => validRecord());
    expect(
      parseDecisionBatch({ kind: DECISION_BATCH_KIND, personaId: "sauron", records: tooMany }),
    ).toBeUndefined();
  });

  it("rejects a malformed body outright — never throws", () => {
    expect(parseDecisionBatch("not an object")).toBeUndefined();
    expect(parseDecisionBatch(null)).toBeUndefined();
  });
});

describe("parseDecisionsCursor", () => {
  it("parses a plain personaId -> epochMs map", () => {
    expect(parseDecisionsCursor({ sauron: 100, "beta-scout": 200 })).toEqual({
      sauron: 100,
      "beta-scout": 200,
    });
  });

  it("fails open to {} on anything malformed — a torn poll must never crash replication", () => {
    expect(parseDecisionsCursor(undefined)).toEqual({});
    expect(parseDecisionsCursor(null)).toEqual({});
    expect(parseDecisionsCursor("garbage")).toEqual({});
  });

  it("drops a non-numeric entry rather than failing the whole cursor", () => {
    expect(parseDecisionsCursor({ sauron: 100, ghost: "not a number" })).toEqual({ sauron: 100 });
  });
});

describe("recordWireKind — v2 only when an older dashboard would misread the record", () => {
  const shares: OrderIntent = {
    symbol: "NVDA",
    side: "buy",
    quantity: 10,
    type: "market",
    reason: "x",
  };
  const legacy = (over: Partial<DecisionRecord> = {}): DecisionRecord => ({
    at: 1,
    personaId: "sauron",
    mode: "live",
    rawIntents: [shares],
    guardedIntents: [shares],
    outcomes: [
      {
        intent: shares,
        action: "placed",
        result: { intent: shares, status: "filled", orderId: "o" },
      },
    ],
    ...over,
  });

  it.each([
    ["a filled share order", legacy()],
    [
      "a rejected share order",
      legacy({
        outcomes: [
          { intent: shares, action: "rejected", result: { intent: shares, status: "rejected" } },
        ],
      }),
    ],
    ["an observed cycle", legacy({ outcomes: [{ intent: shares, action: "observed" }] })],
    ["a quiet cycle", legacy({ rawIntents: [], guardedIntents: [], outcomes: [] })],
    [
      "a halted cycle",
      legacy({ halted: "manual", rawIntents: [], guardedIntents: [], outcomes: [] }),
    ],
    [
      "every legacy refusal",
      legacy({
        refusals: GUARD_REFUSAL_REASONS.filter((r) => !V2_ONLY_REFUSALS.includes(r)).map(
          (reason) => ({ intent: shares, reason }),
        ),
      }),
    ],
    [
      "a share-shaped order naming a contract",
      legacy({ rawIntents: [{ ...shares, symbol: "NVDA261113C00185000" }] }),
    ],
  ])("keeps %s on decision.v1", (_name, record) => {
    expect(recordWireKind(record)).toBe(DECISION_BATCH_KIND);
  });

  const sold = anOptionIntent();
  it.each([
    ["an option order", legacy({ rawIntents: [sold] })],
    ["a limit order", legacy({ guardedIntents: [{ ...shares, type: "limit" }] })],
    [
      "a client order id",
      legacy({ outcomes: [{ intent: { ...shares, clientOrderId: "c-1" }, action: "observed" }] }),
    ],
    [
      "an unfilled limit",
      legacy({
        outcomes: [
          { intent: shares, action: "placed", result: { intent: shares, status: "unfilled" } },
        ],
      }),
    ],
    [
      "a working limit",
      legacy({
        outcomes: [
          { intent: shares, action: "placed", result: { intent: shares, status: "working" } },
        ],
      }),
    ],
    [
      "leg fills",
      legacy({
        outcomes: [
          {
            intent: shares,
            action: "placed",
            result: { intent: shares, status: "filled", legFills: [] },
          },
        ],
      }),
    ],
    [
      "an option refusal reason",
      legacy({ refusals: [{ intent: shares, reason: "option-shape" }] }),
    ],
    [
      "an option intent that was refused",
      legacy({ refusals: [{ intent: sold, reason: "no-quote" }] }),
    ],
    [
      "a share buy refused as not from a subscribed playbook",
      legacy({ refusals: [{ intent: shares, reason: "unsubscribed" }] }),
    ],
  ])("sends %s alone on decision.v2", (_name, record) => {
    expect(recordWireKind(record)).toBe(DECISION_BATCH_KIND_V2);
  });
});

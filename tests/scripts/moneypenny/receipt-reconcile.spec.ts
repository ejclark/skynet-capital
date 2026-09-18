import { readFileSync } from "node:fs";
import {
  RECONCILE_CAP,
  reconcileReceipts,
  routeSweep,
} from "../../../scripts/moneypenny/events.mjs";

// THE RECEIPT LIFECYCLE GATE (#2969).
//
// `routeSweep` opened one `[event-research]` receipt per never-assessed event and only ever closed
// one from a merged PR GitHub happened to link. Three ways a receipt goes stale on its own had no
// closer at all, and by 2026-09-18 all three had fired: 343 of 403 open issues were receipts — 236
// naming an event whose ledger was already on `main`, 62 naming an event #2971's research horizon
// had put out of scope, 108 duplicates the unpaginated dedupe read had reopened.
//
// These specs pin the properties that make the reconcile safe to run unattended:
//   - it never closes a receipt for work still outstanding, however the ledger looks on disk;
//   - "outstanding" is the UNCAPPED `--due`, so the dispatch ceiling's deferral is not mistaken
//     for handled — the distinction `dueForResearch`'s own header insists on;
//   - duplicates lose to the OLDEST receipt, deterministically, so the survivor is stable;
//   - it never double-acts with `routeShipped` on the same issue;
//   - it is capped per tick, because it is level-based and defers what it cannot drop.

type Receipt = { number: number; title: string };

const receipt = (number: number, id: string): Receipt => ({
  number,
  title: `[event-research] ${id}`,
});

const due = (id: string, reason = "never-assessed") => ({
  id,
  reason,
  impact: "high",
  daysUntil: 30,
});

const reasonsById = (intents: readonly { id: string; reason: string }[]) =>
  Object.fromEntries(intents.map((i) => [i.id, i.reason]));

describe("reconcileReceipts — one open receipt per outstanding event, none for anything else", () => {
  it("keeps the receipt for an event that is still never-assessed and due", () => {
    const intents = reconcileReceipts({
      openEventReceipts: [receipt(10, "jobs-2026-10-02")],
      dueEvents: [due("jobs-2026-10-02")],
    });
    expect(intents).toEqual([]);
  });

  it("keeps it even when a ledger file exists but the event is still never-assessed", () => {
    // The flap guard: `hasLedger` words the comment, it never decides. A ledger whose
    // `Last assessed:` header does not parse leaves the event never-assessed, so closing on the
    // file's existence alone would close a receipt the very next sweep reopens, forever.
    const intents = reconcileReceipts({
      openEventReceipts: [receipt(10, "jobs-2026-10-02")],
      dueEvents: [due("jobs-2026-10-02")],
      hasLedger: () => true,
    });
    expect(intents).toEqual([]);
  });

  it("closes a receipt whose ledger already shipped, as `researched`", () => {
    const intents = reconcileReceipts({
      openEventReceipts: [receipt(2895, "costco-q4-fy2026-2026-09-24")],
      dueEvents: [],
      hasLedger: (id: string) => id === "costco-q4-fy2026-2026-09-24",
    });
    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({
      kind: "close-receipt",
      issueNumber: 2895,
      reason: "researched",
    });
    expect(intents[0]?.body ?? "").toContain("docs/research/events/costco-q4-fy2026-2026-09-24.md");
  });

  it("closes a receipt the research horizon put out of scope, as `not-due` — the #2969 case", () => {
    const intents = reconcileReceipts({
      openEventReceipts: [receipt(2969, "jobs-2027-06-04")],
      dueEvents: [],
      hasLedger: () => false,
    });
    expect(intents[0]).toMatchObject({ issueNumber: 2969, reason: "not-due" });
    // The member-facing promise that makes closing safe rather than lossy.
    expect(intents[0]?.body ?? "").toContain("fresh");
  });

  it("closes every duplicate of an outstanding event but keeps the oldest", () => {
    const intents = reconcileReceipts({
      openEventReceipts: [
        receipt(2969, "jobs-2027-06-04"),
        receipt(2762, "jobs-2027-06-04"),
        receipt(2815, "jobs-2027-06-04"),
      ],
      dueEvents: [due("jobs-2027-06-04")],
    });
    expect(intents.map((i) => i.issueNumber)).toEqual([2815, 2969]);
    expect(intents.every((i) => i.reason === "duplicate")).toBe(true);
  });

  it("is order-independent — the survivor is the lowest issue number, not the input order", () => {
    const ordered = reconcileReceipts({
      openEventReceipts: [receipt(2762, "x-2027-01-01"), receipt(2969, "x-2027-01-01")],
      dueEvents: [due("x-2027-01-01")],
    });
    const reversed = reconcileReceipts({
      openEventReceipts: [receipt(2969, "x-2027-01-01"), receipt(2762, "x-2027-01-01")],
      dueEvents: [due("x-2027-01-01")],
    });
    expect(ordered.map((i) => i.issueNumber)).toEqual([2969]);
    expect(reversed.map((i) => i.issueNumber)).toEqual([2969]);
  });

  it("closes ALL receipts for an event that is no longer outstanding, not all-but-one", () => {
    const intents = reconcileReceipts({
      openEventReceipts: [receipt(10, "opex-2028-01-21"), receipt(20, "opex-2028-01-21")],
      dueEvents: [],
    });
    expect(intents.map((i) => i.issueNumber)).toEqual([10, 20]);
  });

  it("treats a cap-deferred event as outstanding — `--due` is uncapped, deferred is not handled", () => {
    // `dueForResearch` truncates AFTER `--due`; the receipt pass reads `--due` itself, so an event
    // waiting its turn behind the dispatch ceiling still holds its receipt.
    const many = Array.from({ length: 50 }, (_, n) => due(`ev-${n}`));
    const intents = reconcileReceipts({
      openEventReceipts: many.map((e, n) => receipt(n + 1, e.id)),
      dueEvents: many,
    });
    expect(intents).toEqual([]);
  });

  it("ignores an open issue whose title is not a receipt", () => {
    const intents = reconcileReceipts({
      openEventReceipts: [{ number: 5, title: "[plan] something else" }],
      dueEvents: [],
    });
    expect(intents).toEqual([]);
  });

  it("never acts on an issue routeShipped is already closing", () => {
    const intents = reconcileReceipts({
      openEventReceipts: [receipt(700, "a-2027-01-01"), receipt(701, "b-2027-01-01")],
      dueEvents: [],
      alreadyClosing: new Set([700]),
    });
    expect(intents.map((i) => i.issueNumber)).toEqual([701]);
  });

  it("caps how many it closes in one tick, and defers rather than drops the rest", () => {
    const receipts = Array.from({ length: RECONCILE_CAP + 15 }, (_, n) =>
      receipt(n + 1, `ev-${n}`),
    );
    const intents = reconcileReceipts({ openEventReceipts: receipts, dueEvents: [] });
    expect(intents).toHaveLength(RECONCILE_CAP);
    expect(intents[0]?.issueNumber).toBe(1);
  });
});

describe("routeSweep — the reconcile rides the same push as the open pass", () => {
  it("opens what is due and closes what is stale in one tick, with no issue in both lists", () => {
    const intents = routeSweep({
      dueEvents: [due("fresh-2026-10-02")],
      openIssueTitles: ["[event-research] shipped-2026-09-01"],
      openEventReceipts: [receipt(900, "shipped-2026-09-01")],
      hasLedger: () => true,
    });
    const kinds = intents.map((i: { kind?: unknown }) => i.kind);
    expect(kinds).toContain("open-issue");
    expect(kinds).toContain("close-receipt");
    const closing = intents
      .filter((i: { kind?: unknown }) => i.kind === "close-receipt")
      .map((i: { issueNumber?: unknown }) => i.issueNumber);
    expect(closing).toEqual([900]);
  });

  it("is a no-op on a push with nothing due and no stale receipts", () => {
    expect(routeSweep({ dueEvents: [], openIssueTitles: [], openEventReceipts: [] })).toEqual([]);
  });

  it("reports the three stale classes distinctly, so a closed receipt says WHY", () => {
    const intents = reconcileReceipts({
      openEventReceipts: [
        receipt(1, "shipped-2026-09-01"),
        receipt(2, "far-out-2027-06-04"),
        receipt(3, "live-2026-10-02"),
        receipt(4, "live-2026-10-02"),
      ],
      dueEvents: [due("live-2026-10-02")],
      hasLedger: (id: string) => id === "shipped-2026-09-01",
    });
    expect(reasonsById(intents)).toEqual({
      "shipped-2026-09-01": "researched",
      "far-out-2027-06-04": "not-due",
      "live-2026-10-02": "duplicate",
    });
  });
});

describe("the reads that feed it", () => {
  // The duplicate engine itself: one unpaginated page of a 403-issue repo. The dedupe set and the
  // reconcile pass both read this list, so a truncated read does not just miss cleanups — it
  // manufactures the very duplicates the cleanup then has to close.
  it("gatherDeps pages the open-issue read instead of taking one 100-item page", () => {
    const src = readFileSync("scripts/moneypenny/index.mjs", "utf8");
    expect(src).toMatch(/MAX_TITLE_PAGES/);
    expect(src).not.toMatch(/ghRest\("issues\?state=open&per_page=100"\)/);
  });

  // One read, two consumers. A second paged pass over the same endpoint to pick up issue numbers
  // would double the router's open-issue cost for one extra scalar per row.
  it("feeds the dedupe and the reconcile pass from the same paged read", () => {
    const src = readFileSync("scripts/moneypenny/index.mjs", "utf8");
    expect(src).toMatch(/const openIssues = needsScan \? openIssueList\(\) : \[\];/);
    expect(src).toMatch(/openEventReceipts: openIssues/);
  });

  // The stall audit and the reconcile must agree on what "outstanding" means, or a receipt gets
  // flagged as a dead build on the same push another pass closes it as out of scope.
  it("the stall audit reads the same uncapped --due oracle", () => {
    const src = readFileSync("scripts/moneypenny/audit.mjs", "utf8");
    expect(src).toMatch(/outstandingEventIds/);
    expect(src).toMatch(/event-scan\.mjs/);
    expect(src).not.toMatch(/maxPerTick|dispatch-budget/);
  });
});

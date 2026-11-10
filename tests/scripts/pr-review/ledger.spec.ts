import { describe, expect, it } from "@rstest/core";
import {
  appendJsonl,
  appendLedgerRows,
  datesBetween,
  ensureLedgerBranch,
  LEDGER_BRANCH,
  ledgerPath,
  ledgerRow,
  parseJsonl,
  readLedgerDays,
  receiptPath,
  reviewTokens,
} from "../../../scripts/pr-review/ledger.mjs";
import { b64, fakeApi, httpError, type Sent, unb64 } from "./fake-api";

// #6870 S2. Every finding and answer lands in a JSONL ledger on a data branch the weekly review
// reads. These pin that a row holds only its kind's fields (the repo is public), that a write is
// sha-checked and survives a lost race, and that the first write makes the branch.

const NOW = () => new Date("2026-11-05T10:00:00.000Z");
const REF = `?ref=${encodeURIComponent(LEDGER_BRANCH)}`;
const noSleep = () => undefined;

describe("a ledger row", () => {
  it("keeps only its kind's fields, so nothing stray reaches a public branch", () => {
    const row = ledgerRow(
      "review",
      {
        pr: 6870,
        sha: "abc1234",
        round: 1,
        tier: "standard",
        tokens: 120000,
        findings: [
          {
            id: "r1f1",
            severity: "important",
            category: "logic",
            file: "src/a.ts",
            line: 4,
            summary: "words",
            localPath: "/Users/x/a.ts",
          },
        ],
        dropped: { "outside a changed hunk": 2, bogus: "x" },
        log: "a raw log line",
        home: "/Users/someone",
      },
      { now: NOW },
    );
    expect(row).toEqual({
      kind: "review",
      at: "2026-11-05T10:00:00.000Z",
      pr: 6870,
      sha: "abc1234",
      round: 1,
      tier: "standard",
      tokens: 120000,
      findings: [
        { id: "r1f1", severity: "important", category: "logic", file: "src/a.ts", line: 4 },
      ],
      dropped: { "outside a changed hunk": 2 },
    });
  });

  it("builds an outcome and an escape row, and caps a decline's reason", () => {
    const outcome = ledgerRow(
      "outcome",
      { pr: 1, id: "r1f1", outcome: "declined", reason: "x".repeat(900) },
      { now: NOW },
    );
    expect(String(outcome.reason).length).toBe(300);
    expect(
      ledgerRow(
        "escape",
        { pr: 1, file: "src/a.ts", line: 9, source: "post-merge-audit", issue: 7000 },
        { now: NOW },
      ),
    ).toEqual({
      kind: "escape",
      at: "2026-11-05T10:00:00.000Z",
      pr: 1,
      file: "src/a.ts",
      line: 9,
      source: "post-merge-audit",
      issue: 7000,
    });
  });

  it("refuses a row missing what its kind needs", () => {
    expect(() => ledgerRow("verdict", { pr: 1 })).toThrow(/kind/);
    expect(() => ledgerRow("review", { round: 1, tier: "light" })).toThrow(/pr/);
    expect(() => ledgerRow("review", { pr: 1, round: 0, tier: "light" })).toThrow(/round/);
    expect(() => ledgerRow("outcome", { pr: 1, id: "r1f1", outcome: "maybe" })).toThrow(/outcome/);
    expect(() => ledgerRow("escape", { pr: 1, source: "audit" })).toThrow(/file/);
  });

  it("reads JSONL back, skipping a broken line, and appends with one newline between rows", () => {
    expect(parseJsonl('{"a":1}\nnot json\n\n{"b":2}\n')).toEqual([{ a: 1 }, { b: 2 }]);
    expect(appendJsonl("", [{ a: 1 }])).toBe('{"a":1}\n');
    expect(appendJsonl('{"a":1}', [{ b: 2 }, { c: 3 }])).toBe('{"a":1}\n{"b":2}\n{"c":3}\n');
    expect(appendJsonl('{"a":1}\n\n', [{ b: 2 }])).toBe('{"a":1}\n{"b":2}\n');
  });

  it("sums the review tokens of a day, and only review rows", () => {
    expect(
      reviewTokens([
        { kind: "review", tokens: 50 },
        { kind: "review" },
        { kind: "outcome", tokens: 9 },
        { kind: "review", tokens: 25 },
      ]),
    ).toBe(75);
  });
});

describe("writing to the ledger branch", () => {
  const path = ledgerPath("2026-11-05");
  const row = { kind: "outcome", pr: 1 };

  it("appends to the day's file with its sha, on the ledger branch", () => {
    const api = fakeApi({ [`contents/${path}${REF}`]: { sha: "s1", content: b64('{"old":1}\n') } });
    appendLedgerRows(path, [row], { api, sleep: noSleep });
    const [put] = api.sent as Sent[];
    expect(put).toMatchObject({
      method: "PUT",
      path: `contents/${path}`,
      body: { sha: "s1", branch: LEDGER_BRANCH },
    });
    expect(unb64(put?.body.content)).toBe('{"old":1}\n{"kind":"outcome","pr":1}\n');
  });

  it("makes the branch as an orphan on the first write, then creates the file without a sha", () => {
    const api = fakeApi({}, (s) =>
      s.path === "git/trees" ? { sha: "t1" } : s.path === "git/commits" ? { sha: "c1" } : {},
    );
    appendLedgerRows(path, [row], { api, sleep: noSleep });
    expect(api.sent.map((s) => `${s.method} ${s.path}`)).toEqual([
      "POST git/trees",
      "POST git/commits",
      "POST git/refs",
      `PUT contents/${path}`,
    ]);
    expect(api.sent[1]?.body).toMatchObject({ tree: "t1", parents: [] });
    expect(api.sent[2]?.body).toEqual({ ref: `refs/heads/${LEDGER_BRANCH}`, sha: "c1" });
    expect(api.sent[3]?.body.sha).toBeUndefined();
  });

  it("takes a twin writer's branch as made, when its ref lands first", () => {
    const api = fakeApi({}, (s) => {
      if (s.path === "git/refs") throw httpError(422);
      return { sha: "x" };
    });
    expect(ensureLedgerBranch({ api })).toBe(true);
  });

  it("does not make the branch when it already exists", () => {
    const api = fakeApi({ [`git/ref/heads/${LEDGER_BRANCH}`]: { object: { sha: "h" } } });
    expect(ensureLedgerBranch({ api })).toBe(false);
    expect(api.sent).toEqual([]);
  });

  it("re-reads and appends again after losing a race, keeping the winner's rows", () => {
    let version = 1;
    const api = fakeApi(
      {
        [`contents/${path}${REF}`]: () => ({
          sha: `s${version}`,
          content: b64(version === 1 ? '{"a":1}\n' : '{"a":1}\n{"twin":1}\n'),
        }),
      },
      (s) => {
        if (s.body.sha === "s1") {
          version = 2;
          throw httpError(409);
        }
        return {};
      },
    );
    appendLedgerRows(path, [row], { api, sleep: noSleep });
    expect(api.sent.map((s) => s.body.sha)).toEqual(["s1", "s2"]);
    expect(unb64(api.sent[1]?.body.content)).toBe(
      '{"a":1}\n{"twin":1}\n{"kind":"outcome","pr":1}\n',
    );
  });

  it("reads a day file over 1 MB through its blob, so an append never overwrites it", () => {
    const api = fakeApi({
      [`contents/${path}${REF}`]: { sha: "big", size: 2_000_000, content: "", encoding: "none" },
      "git/blobs/big": { content: b64('{"old":1}\n') },
    });
    appendLedgerRows(path, [row], { api, sleep: noSleep });
    expect(unb64(api.sent[0]?.body.content)).toBe('{"old":1}\n{"kind":"outcome","pr":1}\n');
  });

  it("stops when a write that answered 5xx had landed after all, rather than appending twice", () => {
    let landed = false;
    const api = fakeApi(
      {
        [`contents/${path}${REF}`]: () => ({
          sha: landed ? "s2" : "s1",
          content: b64(landed ? '{"kind":"outcome","pr":1}\n' : ""),
        }),
      },
      () => {
        landed = true;
        throw httpError(409); // the 5xx retry's answer: the first try had already committed
      },
    );
    appendLedgerRows(path, [row], { api, sleep: noSleep });
    expect(api.sent).toHaveLength(1);
  });

  it("goes red after every attempt loses, rather than dropping the rows", () => {
    const api = fakeApi({ [`contents/${path}${REF}`]: { sha: "s", content: b64("") } }, () => {
      throw httpError(409);
    });
    expect(() => appendLedgerRows(path, [row], { api, attempts: 3, sleep: noSleep })).toThrow(
      /409/,
    );
    expect(api.sent).toHaveLength(3);
  });

  it("writes nothing for no rows", () => {
    const api = fakeApi();
    appendLedgerRows(path, [], { api });
    expect(api.reads).toEqual([]);
  });
});

describe("reading the ledger back", () => {
  it("lists every UTC day a window touches, ends included", () => {
    expect(
      datesBetween(Date.parse("2026-11-03T23:00:00Z"), Date.parse("2026-11-05T01:00:00Z")),
    ).toEqual(["2026-11-03", "2026-11-04", "2026-11-05"]);
  });

  it("reads the days that exist and treats a missing day as empty", () => {
    const api = fakeApi({
      [`contents/${ledgerPath("2026-11-04")}${REF}`]: {
        sha: "s",
        content: b64('{"kind":"review","tokens":7}\n'),
      },
    });
    expect(readLedgerDays(["2026-11-04", "2026-11-05", "not-a-date"], { api })).toEqual([
      { kind: "review", tokens: 7 },
    ]);
  });

  it("keeps the audit's receipts in their own day files beside the ledger", () => {
    expect(receiptPath("2026-11-05")).toBe("audit/2026-11-05.jsonl");
    expect(ledgerPath("2026-11-05")).toBe("ledger/2026-11-05.jsonl");
  });
});

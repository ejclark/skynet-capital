import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { openAsks } from "../../scripts/newsletter/asks.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { buildNewsletter } from "../../scripts/newsletter/build.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { labelHistory } from "../../scripts/newsletter/decision-reads.mjs";
import {
  decisionsReport,
  labelEpisodes,
  ledgerStats,
  MEASURES,
  oldestBotAsk,
  refiled,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/newsletter/decisions.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { windowOf } from "../../scripts/newsletter/week.mjs";

// #6953 slice 4: WHEN the weekly numbers run, they SHALL report each measure in section 5 of the
// plan beside last week's value. The fixtures are the plan's own records: the ledger as written,
// the 11-02..11-06 breaker capsules, and the label episodes the live read found for W45.

const W45 = windowOf("2026-W45", Date.parse("2026-11-09T00:00:00Z"));
const ALIGNMENT = readFileSync(
  fileURLToPath(new URL("../../docs/process/ALIGNMENT.md", import.meta.url)),
  "utf8",
);
type Measure = { id: string; value: unknown; lastWeek: unknown; detail?: unknown };

describe("the ledger (docs/process/ALIGNMENT.md)", () => {
  it("reads the plan's baseline from the real table: 5 of 8 decided, best streak 1, none ready", () => {
    expect(ledgerStats(ALIGNMENT, "2026-11-07")).toMatchObject({
      decided: 8,
      matches: 5,
      matchRate: 0.63,
      bestStreak: 1,
      ready: [],
    });
  });

  it("names a class ready under rule 3 — three matches in a row, no miss in its last five", () => {
    const row = (d: string, cls: string, score: string) =>
      `| ${d} | ${cls} | ask | A | A | ${score} |`;
    const md = [
      "## Ledger",
      "",
      "| Date | Class | The ask | Predicted | Answer | Score |",
      "|---|---|---|---|---|---|",
      row("2026-11-10", "bot safety rules", "match <!-- ledger:1/2/0 -->"),
      row("2026-11-10", "bot safety rules", "unclear (deferred: not now)"),
      row("2026-11-11", "bot safety rules", "match"),
      row("2026-11-12", "bot safety rules", "match"),
      row("2026-11-12", "spend limits", "miss"),
      row("2026-11-13", "spend limits", "match"),
      row("2026-11-13", "spend limits", "match"),
      row("2026-11-14", "spend limits", "match"),
      row("2026-11-20", "credentials", "match"),
      "",
      "## After",
    ].join("\n");
    const s = ledgerStats(md, "2026-11-16");
    expect(s.ready).toEqual(["bot safety rules"]); // spend limits has a miss in its last five
    expect(s.bestStreak).toBe(3);
    expect(s.rows).toBe(8); // the 11-20 row is after the week
  });
});

describe("the same question under a new number", () => {
  // The breaker sequence of the plan's call 2: one signature, a new capsule every day or so.
  const t = "[ci] Moneypenny — circuit breaker";
  const capsules = [
    { number: 6306, title: t, createdAt: "2026-10-30T10:00:00Z" },
    { number: 6640, title: t, createdAt: "2026-11-02T01:00:00Z" },
    { number: 6763, title: t, createdAt: "2026-11-03T00:50:00Z" },
    { number: 6794, title: t, createdAt: "2026-11-03T07:40:00Z" },
    { number: 6800, title: "[ci] other — job", createdAt: "2026-11-03T08:00:00Z" },
  ];

  it("counts each capsule filed in the week whose signature another carried within 14 days", () => {
    expect(refiled(capsules, W45)).toEqual({
      count: 3,
      items: [
        { number: 6640, sameAs: 6306 },
        { number: 6763, sameAs: 6640 },
        { number: 6794, sameAs: 6763 },
      ],
    });
  });

  it("counts a refile beside an older capsule still open, and not one closed long before", () => {
    const old = { number: 6000, title: t, createdAt: "2026-10-01T00:00:00Z" };
    const fresh = { number: 6900, title: t, createdAt: "2026-11-04T00:00:00Z" };
    expect(refiled([{ ...old, closedAt: null }, fresh], W45).items).toEqual([
      { number: 6900, sameAs: 6000 },
    ]);
    expect(refiled([{ ...old, closedAt: "2026-11-01T00:00:00Z" }, fresh], W45).count).toBe(1);
    expect(refiled([{ ...old, closedAt: "2026-10-10T00:00:00Z" }, fresh], W45).count).toBe(0);
  });

  it("reads 0 once a returning fault reopens its one capsule instead of filing (slice 2)", () => {
    expect(refiled([capsules[1], capsules[4]], W45).count).toBe(0);
  });
});

describe("labels that came off: did he answer, and how fast", () => {
  const ep = (number: number, on: string, off: string, answer?: string, card?: string) => ({
    number,
    labeledAt: on,
    unlabeledAt: off,
    answeredAt: answer ?? null,
    assignedAt: card ?? null,
  });

  it("shares answered over closed in the week, medians from the label and from the card", () => {
    const r = labelEpisodes(
      [
        ep(
          1,
          "2026-11-01T00:00:00Z",
          "2026-11-03T00:00:00Z",
          "2026-11-02T00:00:00Z",
          "2026-11-01T12:00:00Z",
        ),
        ep(2, "2026-11-02T00:00:00Z", "2026-11-04T00:00:00Z"),
        ep(3, "2026-11-03T00:00:00Z", "2026-11-05T00:00:00Z", "2026-11-04T12:00:00Z"),
        ep(4, "2026-10-20T00:00:00Z", "2026-10-30T00:00:00Z", "2026-10-21T00:00:00Z"), // before W45
      ],
      W45,
    );
    expect(r).toEqual({
      closed: 3,
      answered: 2,
      share: 0.67,
      hoursToAnswer: 30,
      hoursAssignToAnswer: 12,
      answeredItems: [1, 3],
    });
  });

  it("finds his answer as his comment without the lane footer, between label and removal", () => {
    const pages: Record<string, unknown[]> = {
      events: [
        {
          event: "unlabeled",
          label: { name: "needs-eric" },
          issue: { number: 9 },
          created_at: "2026-11-04T00:00:00Z",
        },
        {
          event: "unlabeled",
          label: { name: "ready" },
          issue: { number: 8 },
          created_at: "2026-11-04T00:00:00Z",
        },
        {
          event: "labeled",
          label: { name: "needs-eric" },
          issue: { number: 9 },
          created_at: "2026-11-01T00:00:00Z",
        },
      ],
      "9/events": [
        { event: "labeled", label: { name: "needs-eric" }, created_at: "2026-10-01T00:00:00Z" },
        { event: "labeled", label: { name: "needs-eric" }, created_at: "2026-11-02T00:00:00Z" },
      ],
      "9/comments": [
        { user: { login: "ejclark" }, body: "old answer", created_at: "2026-11-01T00:00:00Z" },
        {
          user: { login: "skynet-envoy[bot]" },
          body: "card <!-- moneypenny:assigned -->",
          created_at: "2026-11-02T00:01:00Z",
        },
        {
          user: { login: "ejclark" },
          body: "a session\n---\n_Generated by [Claude Code](x)_",
          created_at: "2026-11-02T01:00:00Z",
        },
        { user: { login: "ejclark" }, body: "B", created_at: "2026-11-03T00:00:00Z" },
      ],
    };
    const rest = {
      api: (path: string) => {
        if (!path.includes("page=1")) return [];
        if (path.includes("/issues/events")) return pages.events;
        const m = /issues\/(\d+)\/(events|comments)/.exec(path);
        return pages[`${m?.[1]}/${m?.[2]}`] ?? [];
      },
    };
    expect(labelHistory(rest, W45)).toEqual([
      {
        number: 9,
        labeledAt: "2026-11-02T00:00:00Z",
        unlabeledAt: "2026-11-04T00:00:00Z",
        answeredAt: "2026-11-03T00:00:00Z",
        assignedAt: "2026-11-02T00:01:00Z",
      },
    ]);
  });
});

describe("the report, beside last week", () => {
  const snapshot = {
    needsYou: [
      { number: 5452, criterion: 1 },
      { number: 6886, criterion: 1 },
      { number: 6967, criterion: 4 },
    ],
    artifactGaps: [{ number: 6620, why: "a held PR whose only files are patches" }],
    asks: [5452, 6886],
    predicted: [5452],
    unseen: [{ case: "comment-only", ref: 6771, why: "only in a comment" }],
  };
  const needsEric = [
    { number: 5452, labeledAt: "2026-10-17T00:00:00Z", rank: 2 },
    { number: 6886, labeledAt: "2026-11-05T00:00:00Z", rank: 4 },
  ];
  const series = [
    {
      week: "2026-W44",
      metrics: {
        decisions: {
          measures: [
            { id: "openAsks", value: 10 },
            { id: "unseen", value: 9 },
          ],
        },
      },
    },
  ];
  const r = decisionsReport(
    { snapshot, episodes: [], capsules: [], ledger: { text: ALIGNMENT }, needsEric, series },
    { w: W45, asOfMs: W45.untilMs, priorWeek: "2026-W44" },
  );
  const by = (id: string) => r.measures.find((m: Measure) => m.id === id);

  it("reports every measure of section 5, in its order, each with a value and last week's", () => {
    expect(r.measures.map((m: Measure) => m.id)).toEqual(MEASURES.map((m: Measure) => m.id));
    for (const m of r.measures) expect(m).toHaveProperty("lastWeek");
    expect([by("openAsks").value, by("openAsks").lastWeek]).toEqual([3, 10]);
    expect([by("unseen").value, by("unseen").lastWeek]).toEqual([1, 9]);
    expect(by("artifactMissing").value).toBe(1);
    expect(by("predictedShare")).toMatchObject({ value: 0.5, detail: "1 of 2" });
    expect(by("oldestBotAskDays")).toMatchObject({ value: 23, detail: "#5452, 1 open" });
    expect(by("ledgerMatchRate").value).toBe(0.63);
  });

  it("reads a week with nothing closed as no answer share, never as zero or full", () => {
    expect(by("answeredShare").value).toBeNull();
    expect(by("refiled").value).toBe(0);
  });

  it("keeps a measure it could not read null, and says which read failed", () => {
    const failed = decisionsReport(
      {
        snapshot: "unavailable: read now, it cannot stand for 2026-W44",
        episodes: "unavailable: gh api refused",
        capsules: [],
        ledger: { text: ALIGNMENT },
        needsEric: "unavailable: x",
        series: "unavailable: y",
      },
      { w: W45, asOfMs: W45.untilMs, priorWeek: "2026-W44" },
    );
    const value = (id: string) => failed.measures.find((m: Measure) => m.id === id).value;
    expect([value("openAsks"), value("answeredShare"), value("oldestBotAskDays")]).toEqual([
      null,
      null,
      null,
    ]);
    expect(failed.measures.every((m: Measure) => m.lastWeek === null)).toBe(true);
    expect(Object.keys(failed.unread)).toEqual(["snapshot", "episodes", "series"]);
  });

  it("loses only the unseen measure when the unseen scan fails, never the open asks", () => {
    const partial = decisionsReport(
      {
        snapshot: { ...snapshot, unseen: null, unseenUnread: "unavailable: search rate limit" },
        episodes: [],
        capsules: [],
        ledger: { text: ALIGNMENT },
        needsEric,
        series,
      },
      { w: W45, asOfMs: W45.untilMs, priorWeek: "2026-W44" },
    );
    const value = (id: string) => partial.measures.find((m: Measure) => m.id === id).value;
    expect([value("openAsks"), value("unseen")]).toEqual([3, null]);
    expect(partial.unread).toEqual({ unseen: "unavailable: search rate limit" });
  });

  it("cuts the ledger at a partial week's asOf day, so a re-run reads as it stood", () => {
    const md = `## Ledger\n\n| Date | Class | Ask | P | A | Score |\n|---|---|---|---|---|---|\n| 2026-11-04 | x | a | A | A | match |\n| 2026-11-06 | x | a | A | B | miss |\n`;
    const wed = windowOf("2026-W45", Date.parse("2026-11-04T18:00:00Z"));
    const r = decisionsReport(
      {
        snapshot: null,
        episodes: [],
        capsules: [],
        ledger: { text: md },
        needsEric: [],
        series: [],
      },
      { w: wed, asOfMs: wed.untilMs, priorWeek: "2026-W44" },
    );
    expect(r.measures.find((m: Measure) => m.id === "ledgerMatchRate").value).toBe(1);
  });

  it("gives Your part this week the open-ask count and the oldest, from the same selector", () => {
    expect(openAsks(snapshot, needsEric, W45.untilMs)).toEqual({
      count: 3,
      oldest: { number: 5452, days: 23 },
    });
    expect(openAsks("unavailable: x", needsEric, W45.untilMs)).toBeNull();
  });

  it("rides the newsletter's metrics, so the series stores it for next week", () => {
    const fixture = JSON.parse(
      readFileSync(
        fileURLToPath(new URL("../fixtures/newsletter/inputs-2026-W45.json", import.meta.url)),
        "utf8",
      ),
    );
    const n = buildNewsletter({
      ...fixture,
      decisions: { snapshot, episodes: [], capsules: [], ledger: { text: ALIGNMENT }, series },
    });
    expect(n.metrics.decisions.measures.find((m: Measure) => m.id === "openAsks")).toMatchObject({
      value: 3,
      lastWeek: 10,
    });
    expect(n.humanSteps.openAsks.count).toBe(3);
    expect(buildNewsletter(fixture).metrics.decisions).toBeNull();
  });
});

describe("oldestBotAsk", () => {
  it("is unknown for rows read before ranks were kept, and 0 when no such ask is open", () => {
    expect(oldestBotAsk([], 0)).toEqual({ days: 0, number: null, count: 0 });
    expect(oldestBotAsk([{ number: 1, labeledAt: "2026-11-01T00:00:00Z" }], 0)).toBeNull();
    expect(oldestBotAsk([{ number: 1, labeledAt: "2026-11-01T00:00:00Z", rank: 4 }], 0)).toEqual({
      days: 0,
      number: null,
      count: 0,
    });
  });
});

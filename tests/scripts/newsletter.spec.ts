import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "@rstest/core";
import { parseLoopList } from "../../scripts/loop-list-decide.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { main } from "../../scripts/newsletter.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { asksDue } from "../../scripts/newsletter/asks.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { buildNewsletter } from "../../scripts/newsletter/build.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { mergeSeries, seriesEntry } from "../../scripts/newsletter/series.mjs";

// The weekly newsletter's numbers (#6872, N1), built from a fixture shaped on 2026-W45's public
// records: three of #4153's audit reports (A with its receipt, B and E with only a table), an audit
// cut short, a local receipt that repeats batch A, and the registry's first human steps. The spec
// pins the whole build: what it counts, what it reads as unknown, and that it is deterministic.

const FIXTURE = fileURLToPath(
  new URL("../fixtures/newsletter/inputs-2026-W45.json", import.meta.url),
);
const inputs = () => JSON.parse(readFileSync(FIXTURE, "utf8"));

describe("buildNewsletter over the 2026-W45 fixture", () => {
  const n = buildNewsletter(inputs());

  it("is deterministic: the same inputs give the same bytes", () => {
    expect(JSON.stringify(buildNewsletter(inputs()))).toBe(JSON.stringify(n));
    expect(main(["--inputs", FIXTURE, "--week", "2026-W45"])).toBe(JSON.stringify(n, null, 2));
  });

  it("counts merged PRs by kind inside the week only", () => {
    expect(n.metrics.mergedPrs).toEqual({
      total: 7,
      code: 2,
      research: 2,
      process: 1,
      dependabot: 1,
      other: 1,
      otherPrs: [7007],
    });
  });

  it("reads defects per PR from #4153's records, the receipt once, the unreadable audit apart", () => {
    const d = n.metrics.defects;
    expect([d.audits, d.auditedPrs, d.confirmed, d.perPr, d.unreadable]).toEqual([
      4, 26, 12, 0.46, 1,
    ]);
    expect([d.tokens, d.pricedConfirmed, d.tokensPerConfirmed]).toEqual([5590000, 12, 465833]);
    expect(
      d.batches.map((b: { batch: string | null; source: string }) => [b.batch, b.source]),
    ).toEqual([
      ["B", "table"],
      ["A", "receipt"],
      ["E", "table"],
      [null, "table"],
      [null, "local receipt"],
    ]);
    expect(d.filed).toEqual({ issues: 2, prsWithDefect: 2 });
  });

  it("keeps the meter's unknowns unknown and fills only the audit row from the records", () => {
    const rows = n.metrics.tokensPerVerified;
    expect(rows[0]).toMatchObject({
      job: "post-merge audit",
      tokens: 5590000,
      verified: 12,
      source: "#4153 audit records",
    });
    expect(rows.find((r: { job: string }) => r.job === "communication")).toMatchObject({
      tokens: null,
      verified: null,
    });
    expect(n.metrics.verifyFirstTry.local).toEqual({ runs: 4, passed: 3, rate: 0.75 });
    expect(n.metrics.verifyFirstTry.ci).toEqual({ runs: 4, failed: 1, rate: 0.75 });
    expect(n.tokenSplit.byBucket.reliability).toMatchObject({
      tokens: 5790000,
      verified: 16,
      unknownTokens: 2,
    });
    expect(n.tokenSplit.byBucket.unmapped).toMatchObject({ tokens: 50000, unknownTokens: 1 });
  });

  it("reads usage, needs-eric, fitness, loops and the scorecard", () => {
    expect(n.metrics.usage).toMatchObject({ mode: "normal", used: 6, gone: 26, gap: -20 });
    expect(n.metrics.needsEric).toMatchObject({ count: 3, medianDays: 15.4, oldestDays: 23.8 });
    expect(n.metrics.fitness).toMatchObject({
      redDuringWeek: ["bots-running", "main-deploys", "alerts-reach-owner"],
      redAtEnd: ["alerts-reach-owner"],
      blindIssues: [6900],
    });
    expect([n.metrics.loops.iterated, n.metrics.loops.moved]).toEqual([2, 1]);
    expect(n.metrics.research.all.passRate).toBe(0.77);
  });

  it("finds milestones: closed sub-issues and Log lines dated in the week, long ones clipped", () => {
    expect(n.milestones.closedSubIssues.map((i: { number: number }) => i.number)).toEqual([6598]);
    expect(n.milestones.planLog.map((l: { date: string }) => l.date)).toEqual([
      "2026-11-03",
      "2026-11-05",
    ]);
    expect(n.milestones.planLog[1].text.length).toBeLessThanOrEqual(201);
  });

  it("reads last week's commitments and its rollover, dropping an ask whose loop ended", () => {
    expect(n.lastWeek.commitments.map((c: { id: string }) => c.id)).toEqual(["W44-1", "W44-2"]);
    expect(n.humanSteps.asks[0]).toMatchObject({
      loop: "Brand ideas",
      since: "2026-W44",
      waitedWeeks: 1,
    });
    expect([
      n.humanSteps.due,
      n.humanSteps.asks.length,
      n.humanSteps.rolledOver.length,
      n.humanSteps.carriedIn,
    ]).toEqual([8, 5, 3, 1]);
  });

  it("passes a source gather could not read through as its words, and the rest still builds", () => {
    const broken = {
      ...inputs(),
      prs: "unavailable: gh api: 502",
      tracker: "unavailable: gh api: 403",
      previous: null,
    };
    const b = buildNewsletter(broken);
    expect([b.metrics.mergedPrs, b.metrics.defects, b.metrics.usage]).toEqual([
      "unavailable: gh api: 502",
      "unavailable: gh api: 403",
      "unavailable: gh api: 403",
    ]);
    expect(b.lastWeek).toEqual({
      week: "2026-W44",
      source: null,
      note: "no newsletter for 2026-W44",
    });
    expect(b.metrics.fitness.contracts).toBe(5);
  });
});

describe("the series on data/newsletter", () => {
  it("keeps one entry per week, replacing a partial reading, oldest week first", () => {
    const series = mergeSeries([{ week: "2026-W46" }, { week: "2026-W45", partial: true }], {
      week: "2026-W45",
      partial: false,
    });
    expect(series).toEqual([{ week: "2026-W45", partial: false }, { week: "2026-W46" }]);
  });

  it("stores the numbers and the counts, not the newsletter's lists", () => {
    const entry = seriesEntry(buildNewsletter(inputs()));
    expect(entry.milestones).toEqual({ closedSubIssues: 1, planLogLines: 2 });
    expect(entry.humanSteps).toEqual({ due: 8, asked: 5, rolledOver: 3 });
  });
});

describe("the real registry (docs/process/LEARNING-LOOP.md)", () => {
  const rows = parseLoopList(
    readFileSync(new URL("../../docs/process/LEARNING-LOOP.md", import.meta.url), "utf8"),
  );

  it("gives every human step a cadence the newsletter can read", () => {
    expect(asksDue({ rows, week: "2026-W45" }).unreadableCadence).toEqual([]);
  });

  it("carries the plan's first loops, each with its step", () => {
    const steps = Object.fromEntries((rows ?? []).map((r) => [r.loop, r.humanStep]));
    for (const loop of [
      "Plan check",
      "Weekly token split",
      "Memory review (/dream)",
      "Review rules",
      "Falsifiers due",
      "Alignment",
      "Showcase",
      "Playbook library",
      "Brand ideas",
      "Role catalog",
      "Pre-merge PR review",
    ])
      expect(steps[loop], loop).toBeTruthy();
  });
});

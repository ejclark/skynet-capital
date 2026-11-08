import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { buildNewsletter } from "../../scripts/newsletter/build.mjs";
import {
  isMemberSurface,
  knownGaps,
  memberChanges,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/newsletter/member-changes.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { journeyGaps } from "../../scripts/newsletter/member-reads.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { windowOf } from "../../scripts/newsletter/week.mjs";

// The newsletter's playthrough and reaction counters (#7031, slice 3). Each is pinned on the case
// that would print a wrong number without anything failing: a failed read shown as zero, a stranger
// counted as a reaction, a PR counted twice.

const W45 = windowOf("2026-W45", Date.parse("2026-11-09T00:00:00Z"));
const IN = "2026-11-04T12:00:00Z";
const OUT = "2026-10-20T12:00:00Z";
const ROOT = fileURLToPath(new URL("../..", import.meta.url));

describe("known_gap steps", () => {
  it("counts them by member and lists each step", () => {
    const gaps = [
      { member: "eric", step: "j1-s2", gap: "a" },
      { member: "eric", step: "j3-s1", gap: "b" },
      { member: "returning-trader", step: "j1-s2", gap: "c" },
    ];
    expect(knownGaps(gaps)).toEqual({
      count: 3,
      byMember: { eric: 2, "returning-trader": 1 },
      steps: ["eric/j1-s2", "eric/j3-s1", "returning-trader/j1-s2"],
    });
  });

  it("passes a failed read through as its words, and reads no input as unknown, never 0", () => {
    expect(knownGaps("unavailable: boom")).toBe("unavailable: boom");
    expect(knownGaps(undefined)).toBeNull();
  });

  it("agrees with the journey files on disk", () => {
    const onDisk = journeyGaps(ROOT);
    const raw = readFileSync(`${ROOT}e2e/journeys/eric.journey.json`, "utf8");
    expect(onDisk.filter((g: { member: string }) => g.member === "eric").length).toBe(
      (raw.match(/"known_gap"/g) ?? []).length,
    );
    expect(knownGaps(onDisk).count).toBe(onDisk.length);
  });
});

describe("member-facing changes", () => {
  it("knows a member surface by the paths the member-surfaces rule scopes", () => {
    expect(isMemberSurface("app/src/routes/app.tsx")).toBe(true);
    expect(isMemberSurface("src/ui/Card.tsx")).toBe(true);
    expect(isMemberSurface("src/server/auth/session.ts")).toBe(false);
    expect(isMemberSurface("docs/app/src/x.md")).toBe(false);
  });

  const prs = [
    { number: 7001, mergedAt: IN, surfaceFiles: 2 },
    { number: 7002, mergedAt: IN, surfaceFiles: 0 },
    { number: 7003, mergedAt: IN, surfaceFiles: null },
    { number: 7004, mergedAt: OUT, surfaceFiles: 5 },
    { number: 7005, mergedAt: IN, surfaceFiles: 1 },
  ];

  it("counts only this week's merges that touched a surface, and the unread apart", () => {
    const m = memberChanges(prs, [], W45);
    expect([m.merged, m.unread]).toEqual([2, 1]);
  });

  it("counts a reaction once per change, Eric's from a Revisit and a member's from a named PR", () => {
    const issues = [
      { number: 7100, createdAt: IN, revisit: 7001, member: false, refs: [] },
      { number: 7101, createdAt: IN, revisit: 7001, member: false, refs: [] },
      { number: 7102, createdAt: IN, revisit: 7004, member: false, refs: [] },
      { number: 7103, createdAt: IN, revisit: null, member: true, refs: [7005, 7005, 12] },
      { number: 7104, createdAt: OUT, revisit: null, member: true, refs: [7001] },
    ];
    const m = memberChanges(prs, issues, W45);
    expect(m.reactions).toEqual({ eric: 1, members: 2 });
    expect(m.memberFilings).toBe(1);
  });

  it("reads a failed issue read as its words and still counts the changes", () => {
    const m = memberChanges(prs, "unavailable: rate limited", W45);
    expect([m.merged, m.reactions, m.memberFilings]).toEqual([
      2,
      "unavailable: rate limited",
      "unavailable: rate limited",
    ]);
  });

  it("passes a failed PR read through, and reads missing inputs as unknown", () => {
    expect(memberChanges("unavailable: x", [], W45)).toBe("unavailable: x");
    expect(memberChanges(undefined, [], W45)).toBeNull();
  });
});

describe("the newsletter object", () => {
  const fixture = JSON.parse(
    readFileSync(new URL("../fixtures/newsletter/inputs-2026-W45.json", import.meta.url), "utf8"),
  );

  it("reads both counters unknown when gather saved neither, and carries them when it did", () => {
    const bare = buildNewsletter(fixture).metrics;
    expect([bare.playthroughGaps, bare.memberChanges]).toEqual([null, null]);
    const full = buildNewsletter({
      ...fixture,
      journeyGaps: [{ member: "eric", step: "j1-s2", gap: "x" }],
      memberPrs: [{ number: 7001, mergedAt: IN, surfaceFiles: 1 }],
      memberIssues: [{ number: 7100, createdAt: IN, revisit: 7001, member: false, refs: [] }],
    }).metrics;
    expect(full.playthroughGaps.count).toBe(1);
    expect(full.memberChanges).toMatchObject({ merged: 1, reactions: { eric: 1, members: 0 } });
  });
});

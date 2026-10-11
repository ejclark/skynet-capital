import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  clusters,
  commonsPaths,
  digest,
  type Finding,
  formatFinding,
  makeFinding,
} from "../../../scripts/redesign/commons.mjs";

// #5143: parallel redesign sessions share one design language through the commons — a findings
// log they append to and a digest the curator reads. A bad line costs the curator a guess, so
// `add` validates; the digest's job is the cross-screen view no single session has.

const IDS = ["activity", "trade-ticket", "profile-events"];
const NOW = new Date("2026-10-11T05:30:00.000Z");

describe("makeFinding", () => {
  it("stamps a valid finding and keeps only the fields given", () => {
    const { finding, problems } = makeFinding(
      { screen: "activity", kind: "wording", what: " Four date formats on one screen ", where: "" },
      IDS,
      NOW,
    );
    expect(problems).toEqual([]);
    expect(finding).toEqual({
      at: "2026-10-11T05:30:00Z",
      screen: "activity",
      kind: "wording",
      what: "Four date formats on one screen",
    });
  });

  it("names everything wrong at once", () => {
    const { problems } = makeFinding({ screen: "trade", kind: "idea", what: "x".repeat(141) }, IDS);
    expect(problems).toEqual([
      "--screen is one of: activity, trade-ticket, profile-events",
      "--kind is one of: component, pattern, wording, data, request, ia-move",
      "--what is 141 characters — keep it to 140",
    ]);
  });

  it("makes an IA move say where it goes and why, and a request say whom it asks", () => {
    expect(
      makeFinding({ screen: "activity", kind: "ia-move", what: "Booked P&L" }, IDS).problems,
    ).toEqual([
      "an ia-move needs --to (the screen/section it should move to)",
      "an ia-move needs --why (the goal it serves and the information it would sit beside)",
    ]);
    expect(
      makeFinding({ screen: "activity", kind: "request", what: "One row" }, IDS).problems,
    ).toEqual(["a request needs --to (the owner it is asked of)"]);
  });
});

describe("commonsPaths", () => {
  it("takes REDESIGN_COMMONS as a folder or as the findings file itself", () => {
    expect(commonsPaths({ REDESIGN_COMMONS: "/c" })).toEqual({
      dir: "/c",
      log: "/c/findings.jsonl",
      page: "/c/commons.md",
    });
    expect(commonsPaths({ REDESIGN_COMMONS: "/c/log.jsonl" }).log).toBe("/c/log.jsonl");
    expect(commonsPaths({}).dir).toMatch(/\/claude-\d+\/.+\/redesign-commons$/);
  });
});

const F: Finding[] = [
  {
    screen: "profile-events",
    kind: "wording",
    what: "One option position, three names: list drops 'short'",
    where: "Events list",
  },
  {
    screen: "trade-chain",
    kind: "wording",
    what: "Option position named three ways; drops short",
    where: "chain rows",
  },
  { screen: "activity", kind: "data", what: "Human fills on Saturdays", where: "study world" },
  {
    screen: "trade-ticket",
    kind: "ia-move",
    what: "the trading ladder",
    to: "profile-milestones",
    why: "it teaches",
  },
];

describe("digest", () => {
  it("clusters the same thing found on different screens", () => {
    const shared = clusters(F).filter((c) => c.items.length > 1);
    expect(shared.map((c) => c.items.map((f) => f.screen))).toEqual([
      ["profile-events", "trade-chain"],
    ]);
  });

  it("counts kinds by screens, lists shared findings, and every IA move as from → to", () => {
    const md = digest(F);
    expect(md).toContain("# Commons digest — 4 findings from 4 screens");
    expect(md).toContain("| wording | 2 | 2 |");
    expect(md).toContain("- **wording** · 2 screen(s): profile-events, trade-chain");
    expect(md).toContain(
      "- **trade-ticket** → **profile-milestones**: the trading ladder — it teaches",
    );
  });

  it("formats a finding on one line, IA moves with their destination", () => {
    expect(formatFinding({ ...F[3], at: "2026-10-11T05:30:00Z" } as Finding)).toBe(
      "- 2026-10-11 05:30 · trade-ticket · ia-move: the trading ladder → profile-milestones: it teaches",
    );
  });
});

describe("the commons command", () => {
  it("adds one JSON line, reads it back under the protocol page, and digests the log", () => {
    const dir = mkdtempSync(join(tmpdir(), "commons-"));
    writeFileSync(join(dir, "commons.md"), "# Redesign commons\n");
    const run = (...args: string[]) =>
      spawnSync(process.execPath, ["scripts/redesign/commons.mjs", ...args], {
        encoding: "utf8",
        env: { ...process.env, REDESIGN_COMMONS: dir },
      });
    const added = run(
      "add",
      "--screen",
      "activity",
      "--kind",
      "pattern",
      "--what",
      "Chips clip with no sign of more",
    );
    expect(added.status).toBe(0);
    expect(run("add", "--screen", "activity", "--kind", "ia-move", "--what", "x").status).toBe(1);
    const lines = readFileSync(join(dir, "findings.jsonl"), "utf8").trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({ screen: "activity", kind: "pattern" });
    const read = run("read", "--n", "5");
    expect(read.stdout).toMatch(
      /^# Redesign commons\n\n## The last 1 of 1 findings\n\n- .* · activity · pattern: Chips clip/,
    );
    expect(run("digest").stdout).toContain("| pattern | 1 | 1 |");
  });
});

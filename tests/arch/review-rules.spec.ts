import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

// docs/review/REVIEW.md is the pre-merge reviewer's whole rulebook, read into every review's prompt,
// so its size is what each review pays and its words are what the reviewer obeys literally. These
// pin the size, the parts the plan (#6870) requires, and the one way it could flatter its own
// replay. Whether the rules find anything is only known from a replay (scripts/review-replay.mjs).
const FILE = "docs/review/REVIEW.md";
const text = readFileSync(FILE, "utf8");
const flat = (s: string) => s.replace(/\s+/g, " ");
const section = (heading: string) => text.split(`## ${heading}`)[1]?.split("\n## ")[0] ?? "";
const tableRows = (body: string) =>
  body
    .split("\n")
    .filter((line) => line.startsWith("|") && !/^\|[-| ]+\|$/.test(line))
    .slice(1);

describe("the pre-merge review rules", () => {
  it("stay under 4,000 characters, and say their size to within 50", () => {
    expect(text.length).toBeLessThan(4000);
    const said = /\*\*Size:\*\* ([\d,]+) characters/.exec(text)?.[1] ?? "0";
    expect(Math.abs(Number(said.replace(",", "")) - text.length)).toBeLessThanOrEqual(50);
  });

  // A reviewer told to find gaps manufactures them, so the warning comes before any rule.
  it("ask for a concrete failure and call zero findings normal, before any rule", () => {
    const opening = flat(text.split("## Report")[0] ?? "");
    expect(opening).toContain("concrete failure");
    expect(opening).toContain("Zero findings is a normal answer");
  });

  it("carry the reviewer agent's three questions", () => {
    const reviewer = flat(readFileSync(".claude/agents/reviewer.md", "utf8"));
    const report = flat(section("Report"));
    for (const phrase of [
      "name the signal it reads against the real effect it claims",
      "when it fails or its window holds no sample",
      "grep every reader of that state and say what each now sees",
    ]) {
      expect(reviewer, `reviewer.md still asks: ${phrase}`).toContain(phrase);
      expect(report, phrase).toContain(phrase);
    }
  });

  it("leave to CI what CI already fails a PR for", () => {
    const gates = flat(section("Do not report: CI already fails the PR"));
    for (const gate of [
      "npm run typecheck",
      "npm run lint",
      "arch",
      "dupe",
      "dead",
      "npm run check",
    ]) {
      expect(gates, gate).toContain(gate);
    }
  });

  it("make an Important finding name a file:line and a failure, and cap a Nit at 3", () => {
    const severity = flat(section("Severity"));
    expect(severity).toMatch(/\*\*Important\*\*.*`file:line`.*failure scenario/);
    expect(severity).toMatch(/\*\*Nit\*\*.*At most 3/);
    expect(severity).toMatch(/At most 5 per review/);
  });

  // The suppressed table is filled by the weekly review of reviews, keyed on these categories.
  it("give each finding one category, and suppress only a category it names", () => {
    const categories = [...section("Severity").matchAll(/`([a-z]+)`/g)].map((m) => m[1]);
    expect(categories.length).toBeGreaterThanOrEqual(4);
    const suppressed = section("Suppressed categories");
    expect(suppressed).toContain("| Category | Paths | Since | Evidence |");
    for (const row of tableRows(suppressed)) {
      const category = row.split("|")[1]?.trim().replaceAll("`", "");
      expect(categories, row).toContain(category);
    }
  });

  it("point each per-path note at paths that exist", () => {
    const rows = tableRows(section("Per-path notes"));
    expect(rows.length).toBeGreaterThanOrEqual(4);
    for (const row of rows) {
      for (const [, path = ""] of row.split("|")[1]?.matchAll(/`([^`]+)`/g) ?? []) {
        if (path.endsWith("*")) {
          const prefix = path.slice(0, -1);
          const names = readdirSync(dirname(prefix)).map((name) => `${dirname(prefix)}/${name}`);
          expect(
            names.some((name) => name.startsWith(prefix)),
            path,
          ).toBe(true);
        } else expect(existsSync(path), path).toBe(true);
      }
    }
  });

  // The replay scores these rules on labelled PRs. A rule that names one of them hands it the answer.
  it("name no PR and no defect from the replay set it is scored on", () => {
    expect(text).not.toMatch(/#\d{3,5}\b/);
    const set = JSON.parse(readFileSync("docs/review/replay-set.json", "utf8"));
    const scoredOn = (c: { isControl: boolean; facet?: string }) =>
      !c.isControl && c.facet === "correctness";
    for (const row of set.cases.filter(scoredOn)) {
      expect(text, row.id).not.toContain(row.defect.file);
    }
  });
});

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// A review lens is loaded on demand into one reviewer's prompt, so its size is what that reviewer
// pays, and its shape is what lets a finding be refuted. These pin both. They say nothing about
// whether a lens finds anything: only a replay can (docs/review/README.md).
const DIR = "docs/review/lenses";
const LENSES = [
  "adversarial",
  "context-loop",
  "information-architecture",
  "performance",
  "reuse-composability",
  "security",
  "smells-and-patterns",
];
const read = (lens: string) => readFileSync(`${DIR}/${lens}.md`, "utf8");
/** Markdown wraps wherever it likes, and a phrase checked here must not depend on where. */
const flat = (text: string) => text.replace(/\s+/g, " ");

/** The paragraphs under `## Smells`, each one a smell. */
function smellsIn(text: string) {
  const body = text.split("## Smells\n")[1]?.split("\n## ")[0] ?? "";
  return body.split(/\n\s*\n/).filter((block) => block.trim());
}
const nameOf = (smell: string) => /^\*\*(.+?)\.\*\*/.exec(smell.trim())?.[1] ?? "";

describe("the review lenses", () => {
  it("are exactly the lenses the README lists, each with its size", () => {
    expect(readdirSync(DIR).sort()).toEqual(LENSES.map((lens) => `${lens}.md`));
    const readme = readFileSync("docs/review/README.md", "utf8");
    for (const lens of LENSES) {
      expect(readme, lens).toContain(`lenses/${lens}.md`);
      const row = new RegExp(`lenses/${lens}\\.md.*\\| ([\\d,]+) \\|`).exec(readme);
      const said = Number(row?.[1]?.replace(",", ""));
      expect(
        Math.abs(said - read(lens).length),
        `${lens}'s size in the README`,
      ).toBeLessThanOrEqual(50);
    }
  });

  for (const lens of LENSES) {
    describe(lens, () => {
      const text = read(lens);

      it("stays under 4,000 characters, and says its size to within 50", () => {
        expect(text.length).toBeLessThan(4000);
        const said = /\*\*Size:\*\* ([\d,]+) characters/.exec(text)?.[1] ?? "0";
        expect(Math.abs(Number(said.replace(",", "")) - text.length)).toBeLessThanOrEqual(50);
      });

      it("says what fires it, by path", () => {
        const fires = /\*\*Fires on:\*\* (.+)/.exec(text)?.[1] ?? "";
        expect(fires).toMatch(/`[^`]+`|every code path/);
      });

      it("carries its kill rule in the header, above the smells", () => {
        const header = flat(text.split("## Smells")[0] ?? "");
        expect(header).toContain("under 0.1 confirmed findings per reviewed PR");
        expect(header).toContain("fewer than one in three surviving the refuters");
        expect(header).toContain("after 40 PRs");
      });

      // A reviewer told to find gaps manufactures them: the warning is the lens's first instruction.
      it("asks for a concrete failure or cost and treats zero findings as normal", () => {
        const header = flat(text.split("## Smells")[0] ?? "");
        expect(header).toMatch(/concrete failure|concrete cost/);
        expect(header).toContain("Zero findings is a normal answer");
      });

      it("gives each smell how to spot it, the fix, when not to, and a real example", () => {
        const smells = smellsIn(text);
        expect(smells.length).toBeGreaterThanOrEqual(3);
        for (const raw of smells) {
          const smell = flat(raw);
          expect(nameOf(smell), smell).not.toBe("");
          for (const part of ["Spot it:", "Fix:", "Not when:", "Real:"]) {
            expect(smell, `${nameOf(smell)}: ${part}`).toContain(part);
          }
          const real = smell.split("Real:")[1] ?? "";
          expect(real, nameOf(smell)).toMatch(/#\d{3,5}|`[^`]+:\d+`/);
        }
      });

      // The replay strips Real: clauses because its cases are these examples, so a PR number left
      // anywhere else in a smell would hand a reviewer the answer.
      it("cites past PRs only in a smell's real example", () => {
        for (const smell of smellsIn(text)) {
          expect(smell.split("Real:")[0], nameOf(smell)).not.toMatch(/#\d{3,5}/);
        }
      });

      it("says which problems are worth solving and which are taste", () => {
        expect(text).toContain("## Worth solving, or taste");
        expect(text).toMatch(/Taste:/);
      });

      // Squash merges carry (#N), so history answers this and never goes stale; a shallow clone cannot.
      it("cites only PRs that merged", () => {
        const git = (...args: string[]) =>
          execFileSync("git", args, {
            encoding: "utf8",
            env: hermeticGitEnv(),
            maxBuffer: 2 ** 28,
          }).trim();
        if (git("rev-parse", "--is-shallow-repository") === "true") return;
        const subjects = git("log", "--format=%s");
        for (const smell of smellsIn(text)) {
          for (const [, pr] of (smell.split("Real:")[1] ?? "").matchAll(/#(\d{3,5})/g)) {
            expect(subjects, `${nameOf(smell)} cites #${pr}`).toContain(`(#${pr})`);
          }
        }
      });
    });
  }
});

describe("the smells-and-patterns lens and the ledger", () => {
  const ledger =
    readFileSync("docs/PATTERNS.md", "utf8").split("## The ledger — code smells")[1] ?? "";
  const lens = read("smells-and-patterns");

  it("reads the ledger, which is the one home for a recognised pattern", () => {
    expect(lens).toContain("docs/PATTERNS.md");
    expect(ledger).toContain("smells-and-patterns");
  });

  it("gives every smell the lens names a row in the ledger", () => {
    for (const smell of smellsIn(lens)) {
      expect(ledger, nameOf(smell)).toContain(`| **${nameOf(smell)}** |`);
    }
  });
});

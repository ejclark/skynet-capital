import { execFileSync } from "node:child_process";
import { placementProblems } from "../../scripts/forward-test-id-scan.mjs";

/**
 * The forward-test placement contract — BLOCKING (issue #1449).
 *
 * The register is one markdown fragment per event under docs/research/forward-tests/, and the
 * index docs/research/forward-tests.md carries no rows. That is the property that lets every
 * event-research PR merge clean on GitHub: a lane writes only the file its own event id names, so
 * no two lanes ever touch the same file. This spec is the net behind that property — and, because
 * the research prompt is envelope-protected and cannot be corrected in the moment, it is also how
 * a session following a stale "append to forward-tests.md" instruction learns the new shape: the
 * failure message names the right file.
 */
describe("forward-test fragments — placement contract (blocking)", () => {
  it("the committed register satisfies the contract", () => {
    expect(() =>
      execFileSync("node", ["scripts/forward-test-id-scan.mjs", "--contract"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  const header =
    "| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |\n|---|---|---|---|---|---|";
  const fragment = (eventId: string, ids: string[], hasHeader = true) => ({
    file: `${eventId}.md`,
    eventId,
    ids,
    hasHeader,
  });

  it("a row in the index is a violation that names the per-event file", () => {
    const problems = placementProblems({
      indexMd: `${header}\n| FT-cpi-2026-09-11-1 | x | y | z | 2026-09-12 | _open_ |`,
      fragments: [],
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/forward-tests\/<event-id>\.md/);
  });

  it("a namespaced row filed under another event names the file it belongs in", () => {
    const problems = placementProblems({
      indexMd: "",
      fragments: [fragment("fomc-2026-09-16", ["FT-fomc-2026-09-16-1", "FT-cpi-2026-09-11-2"])],
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/forward-tests\/cpi-2026-09-11\.md/);
  });

  it("bare-number ids live only in legacy.md; event ids with a date tail resolve to their file", () => {
    expect(
      placementProblems({
        indexMd: "",
        fragments: [
          fragment("legacy", ["FT-1", "FT-47", "FT-54-umich-final"]),
          fragment("aapl-2026-10-29-print", ["FT-aapl-2026-10-29-print-1"]),
        ],
      }),
    ).toEqual([]);
    expect(
      placementProblems({ indexMd: "", fragments: [fragment("cpi-2026-09-11", ["FT-9"])] }),
    ).toEqual([expect.stringMatching(/not namespaced/)]);
  });

  it("a fragment without the table header is named", () => {
    expect(
      placementProblems({ indexMd: "", fragments: [fragment("cpi-2026-09-11", [], false)] }),
    ).toEqual([expect.stringMatching(/missing the table header/)]);
  });
});

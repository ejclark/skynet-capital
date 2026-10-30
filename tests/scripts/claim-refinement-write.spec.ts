import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Conviction } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";
import { writeRefinement } from "../../src/scripts/claim-proposals.js";

/** #5482 criterion 6 — the scoring pass commits what a decided claim implies, so the PR that scores
 *  the claim carries the proposal as a diff. A file, never a setting change. */

/** The seed with no score attached: the live ledger's scores must never move these specs. */
const UNSCORED: Conviction = {
  ...AI_DIP_2026_10,
  claims: AI_DIP_2026_10.claims.map(({ score: _, ...c }) => c),
};

const failed2a: Conviction = {
  ...UNSCORED,
  claims: UNSCORED.claims.map((c) =>
    c.statement.startsWith("2a.")
      ? {
          ...c,
          score: {
            outcome: "fail",
            basis: "CRWV closed under $54 on 2026-11-06.",
            dueOn: "2026-11-06",
            scoredOn: "2026-11-09",
          },
        }
      : c,
  ),
};

describe("writeRefinement", () => {
  let dir: string;
  beforeEach(() => {
    dir = join(mkdtempSync(join(tmpdir(), "refinements-")), "refinements");
  });
  afterEach(() => rmSync(join(dir, ".."), { recursive: true, force: true }));

  it("writes nothing while no decided claim backs a fence", () => {
    expect(writeRefinement(UNSCORED, { dir })).toBeUndefined();
    expect(existsSync(dir)).toBe(false);
  });

  it("writes the conviction's file once a claim a fence rests on is decided", () => {
    const done = writeRefinement(failed2a, { dir });
    expect(done).toEqual({ path: join(dir, "ai-dip-2026-10.md"), action: "wrote" });
    const text = readFileSync(join(dir, "ai-dip-2026-10.md"), "utf8");
    expect(text).toContain("<!-- refinement: ai-dip-2026-10/2a/CRWV-WHEEL -->");
    expect(text).toContain("Retire CRWV-WHEEL from this view");
  });

  it("rewrites the same text on a re-run, so a second lane's PR shows no diff", () => {
    writeRefinement(failed2a, { dir });
    const first = readFileSync(join(dir, "ai-dip-2026-10.md"), "utf8");
    writeRefinement(failed2a, { dir });
    expect(readFileSync(join(dir, "ai-dip-2026-10.md"), "utf8")).toBe(first);
  });

  it("removes a stale file when no decided claim backs a fence any more", () => {
    writeRefinement(failed2a, { dir });
    expect(writeRefinement(UNSCORED, { dir })).toEqual({
      path: join(dir, "ai-dip-2026-10.md"),
      action: "removed",
    });
    expect(existsSync(join(dir, "ai-dip-2026-10.md"))).toBe(false);
  });

  it("only says what it would do on a dry run", () => {
    expect(writeRefinement(failed2a, { dir, dry: true })).toEqual({
      path: join(dir, "ai-dip-2026-10.md"),
      action: "wrote",
    });
    expect(existsSync(dir)).toBe(false);
  });

  it("never names a file from an id that is not a slug", () => {
    expect(writeRefinement({ ...failed2a, id: "../escape" }, { dir })).toBeUndefined();
    expect(existsSync(join(dir, "..", "escape.md"))).toBe(false);
  });
});

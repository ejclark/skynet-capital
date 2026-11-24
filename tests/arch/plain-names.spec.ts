import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PLAIN_NAMES, plainNameHits, plainNameProblems } from "../../scripts/plain-names.mjs";
import { copyProblems } from "../../scripts/redesign/lint-rules.mjs";

// #8290: a name Eric rejected (docs/plain-names.json) fails in copy, an issue, a PR body or a design
// page, and never in code. The #8161 redesign brought Desk back after a prose rule banned it; Eric,
// 2026-11-24: "'desk' verbiage still gives 'wtf is that' vibes".

const found = (text: string) => plainNameHits(text).map((h) => h.found);

describe("the rejected-name list", () => {
  it("gives every row a plain name, Eric's dated words and a source link", () => {
    expect(PLAIN_NAMES.length).toBeGreaterThanOrEqual(5);
    for (const row of PLAIN_NAMES) {
      expect(row.plain).toBeTruthy();
      expect(row.said).toBeTruthy();
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row.source).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it("holds the four names renamed on 2026-11-24 and the Brief", () => {
    const plain = Object.fromEntries(
      PLAIN_NAMES.map((r: { term: string; plain: string }) => [r.term, r.plain]),
    );
    expect(plain).toMatchObject({
      Desk: "Trade",
      Cast: "Who's who",
      Garage: "Bots",
      "Film Room": "Practice",
    });
    expect(plain["the Brief"]).toBeTruthy();
  });
});

describe("a rejected name in copy fails", () => {
  it.each([
    ["open the Desk", "Desk"],
    ["two Desks side by side", "Desks"],
    ["back to the desk", "the desk"],
    ["ask in the Cast.", "Cast"],
    ["your Garage of bots", "Garage"],
    ["replay it in the Film Room", "Film Room"],
    ["read the Brief first", "the Brief"],
  ])("%s", (text, hit) => {
    expect(found(text)).toEqual([hit]);
  });

  it("names the plain name in the failure", () => {
    expect(plainNameProblems("open the Desk")).toEqual([
      "“Desk” is a name Eric rejected (2026-11-24) — say “Trade” (docs/plain-names.json)",
    ]);
  });
});

describe("the same word in code passes", () => {
  it.each([
    "DeskTiles",
    "app/src/live/desk.ts",
    "/api/desk/:id",
    "desk-rail",
    "fetchDesk(id)",
    "Desk.tsx",
    "desk_id",
    "see `Desk` in the type",
    "```ts\nexport interface Desk {}\n```",
    "https://example.com/Desk",
  ])("%s", (text) => {
    expect(found(text)).toEqual([]);
  });

  it("passes a quoted name: his words, or the name discussed as a name", () => {
    expect(found('Eric: "the Desk gives wtf vibes"; renamed “Cast” to Who\'s who')).toEqual([]);
  });

  it("passes ordinary words that only share letters", () => {
    expect(found("desk width adds room · a brief note · cast a vote · the garage door")).toEqual(
      [],
    );
  });
});

describe("where the check runs", () => {
  const issueLint = (body: string, title: string) => {
    const r = spawnSync("node", ["scripts/issue-lint.mjs", "--stdin", "--json", "--title", title], {
      input: body,
      encoding: "utf8",
    });
    return JSON.parse(r.stdout) as { problems: string[] };
  };

  it("issue-lint fails an issue body that says open the Desk, naming Trade", () => {
    const { problems } = issueLint("**Ask:** open the Desk and place a trade.\n", "a plain title");
    expect(problems.some((p) => p.includes("“Desk”") && p.includes("“Trade”"))).toBe(true);
  });

  it("issue-lint fails a rejected name in the title", () => {
    const { problems } = issueLint("**Ask:** a trade form fix.\n", "Rework the Garage");
    expect(problems.some((p) => p.startsWith("title:") && p.includes("“Bots”"))).toBe(true);
  });

  it("issue-lint passes the identifiers and skips below the fold", () => {
    const body =
      "**Ask:** split `DeskTiles` out of app/src/live/desk.ts.\n\n<details><summary>more</summary>\n\nthe old Desk\n</details>\n";
    const { problems } = issueLint(body, "split the trade tiles");
    expect(problems.filter((p) => p.includes("rejected"))).toEqual([]);
  });

  it("the redesign lint fails it even where the app still says it", () => {
    const ui = { text: "Desk\nGarage", lower: "desk\ngarage" };
    expect(copyProblems("q1 ask", "Open the Desk first.", ui)).toEqual([
      "q1 ask: “Desk” is a name Eric rejected (2026-11-24) — say “Trade” (docs/plain-names.json)",
    ]);
  });

  it("ship checkbody fails a PR body with one above the fold", () => {
    const dir = mkdtempSync(join(tmpdir(), "plain-names-"));
    const f = join(dir, "body.md");
    writeFileSync(
      f,
      "## The picture\n\nPicture: waived — a lint\n\n## Summary\n\n- the Film Room tab\n",
    );
    const r = spawnSync("bash", [resolve("scripts/ship.sh"), "checkbody", f], {
      encoding: "utf8",
      env: { ...process.env, GH_TOKEN: "", GITHUB_TOKEN: "" },
    });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("“Practice”");
  });

  it("the CLI exits 0 on clean text", () => {
    const dir = mkdtempSync(join(tmpdir(), "plain-names-"));
    const f = join(dir, "ok.md");
    writeFileSync(f, "Trade · Who's who · Bots · Practice\n");
    expect(() => execFileSync("node", ["scripts/plain-names.mjs", f])).not.toThrow();
  });
});

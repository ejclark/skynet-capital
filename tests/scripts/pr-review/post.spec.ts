import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { LEDGER_BRANCH, ledgerPath } from "../../../scripts/pr-review/ledger.mjs";
import { findingMarker, parseMarkers } from "../../../scripts/pr-review/markers.mjs";
import {
  buildReview,
  CAPS,
  checkFindings,
  gatherPost,
  hunksOf,
  parseReviewJson,
  runPost,
  suppressedCategories,
} from "../../../scripts/pr-review/post.mjs";
import { b64, fakeApi, unb64 } from "./fake-api";

// #6870 S2. The model only writes review.json; this plain code decides what reaches the PR. Each
// check in post.mjs's header has a case that drops a finding by it, and the status is pinned for
// every combination of the gate, an open Important finding and a response session.

const SHA = "abc1234def5678";
const PATCH = [
  "@@ -10,3 +10,5 @@ function f() {",
  " a",
  "+b",
  "+c",
  " d",
  " e",
  "@@ -40,0 +43 @@",
  "+one",
  "@@ -60,2 +64,0 @@",
  "-gone",
  "-gone",
].join("\n");
const FILES = [{ filename: "src/a.ts", patch: PATCH }, { filename: "src/huge.ts" }];
const finding = (over: Record<string, unknown> = {}) => ({
  severity: "important",
  category: "logic",
  file: "src/a.ts",
  line: 11,
  summary: "the loop skips the last row",
  ...over,
});
const check = (findings: unknown[], opts = {}) =>
  checkFindings(findings, { files: FILES, ...opts });

describe("the hunks a comment may land in", () => {
  it("reads each hunk's new-side range, a one-line hunk, and no range for a pure deletion", () => {
    expect(hunksOf(PATCH)).toEqual([
      { start: 10, end: 14 },
      { start: 43, end: 43 },
    ]);
    expect(hunksOf(undefined)).toEqual([]);
  });
});

describe("each check drops what it should", () => {
  it("keeps a finding inside a changed hunk and gives it a stable id", () => {
    const { kept, dropped } = check(
      [finding(), finding({ line: 43, severity: "Nit", summary: "name" })],
      { round: 2 },
    );
    expect(kept.map((f) => [f.id, f.severity, f.line])).toEqual([
      ["r2f1", "important", 11],
      ["r2f2", "nit", 43],
    ]);
    expect(dropped).toEqual([]);
  });

  it("drops a malformed finding: unknown severity, no line, no summary", () => {
    const { dropped } = check([
      finding({ severity: "high" }),
      finding({ line: "eleven" }),
      finding({ summary: " " }),
    ]);
    expect(dropped.map((d) => d.why)).toEqual(["malformed", "malformed", "malformed"]);
  });

  it("drops a finding on a file the PR does not change", () => {
    expect(check([finding({ file: "src/other.ts" })]).dropped[0]?.why).toBe("not in the diff");
  });

  it("drops a finding outside every changed hunk, and one on a file too big to have a patch", () => {
    const { dropped } = check([
      finding({ line: 20 }),
      finding({ line: 64 }),
      finding({ file: "src/huge.ts", line: 1 }),
    ]);
    expect(dropped.map((d) => [d.line, d.why])).toEqual([
      [20, "outside a changed hunk"],
      [64, "outside a changed hunk"],
      [1, "outside a changed hunk"],
    ]);
  });

  it("drops a category REVIEW.md suppresses, however the model spells it", () => {
    expect(
      check([finding({ category: "Style Nits" })], { suppressed: ["style-nits"] }).dropped[0]?.why,
    ).toBe("suppressed");
  });

  it("folds the same defect from two readers by the audit's rule, but keeps one reader's two", () => {
    const twoReaders = check([
      finding({ lens: "review" }),
      finding({ lens: "adversarial", line: 13, summary: "other words" }),
    ]);
    expect(twoReaders.dropped.map((d) => d.why)).toEqual(["duplicate"]);
    const oneReader = check([finding(), finding({ line: 12, summary: "a second defect" })]);
    expect(oneReader.kept).toHaveLength(2);
    expect(check([finding(), finding()]).dropped.map((d) => d.why)).toEqual(["duplicate"]);
  });

  it("never raises again what an earlier round already raised", () => {
    const { dropped } = check([finding({ line: 12 })], {
      prior: [{ file: "src/a.ts", line: 10, round: 1 }],
      round: 2,
    });
    expect(dropped[0]?.why).toBe("duplicate");
  });

  it("keeps the first 5 Important and 3 Nit, in the model's order", () => {
    // One file per finding, so only the cap, never the duplicate rule, decides.
    const at = (i: number) => `src/f${i}.ts`;
    const files = Array.from({ length: 11 }, (_, i) => ({ filename: at(i), patch: PATCH }));
    const findings = Array.from({ length: 11 }, (_, i) =>
      finding({ file: at(i), severity: i < 7 ? "important" : "nit", summary: `defect ${i}` }),
    );
    const { kept, dropped } = checkFindings(findings, { files });
    expect(kept.filter((f) => f.severity === "important")).toHaveLength(CAPS.important);
    expect(kept.filter((f) => f.severity === "nit")).toHaveLength(CAPS.nit);
    expect(dropped.map((d) => [d.file, d.why])).toEqual([
      [at(5), "over the cap"],
      [at(6), "over the cap"],
      [at(10), "over the cap"],
    ]);
  });
});

describe("REVIEW.md's suppressed categories", () => {
  it("reads bullets and table rows under a suppress heading, and nothing elsewhere", () => {
    const md = [
      "# Review rules",
      "## What to report",
      "- `logic` — wrong results",
      "## Suppressed categories",
      "- `style` — Biome owns it",
      "* Formatting: the formatter owns it",
      "| Category | Why |",
      "|---|---|",
      "| `import-order` | Biome |",
      "### Suppressed by path",
      "| Name | Why |",
      "| :-- | --- |",
      "| copy | the linguist owns it |",
      "## Severity",
      "- `important` — blocks",
    ].join("\n");
    expect(suppressedCategories(md)).toEqual(["style", "formatting", "import-order", "copy"]);
    expect(suppressedCategories("")).toEqual([]);
  });
});

describe("review.json", () => {
  it("accepts {findings} or a bare list, and refuses anything else", () => {
    expect(parseReviewJson('{"findings":[{"a":1}]}').findings).toHaveLength(1);
    expect(parseReviewJson("[]").findings).toEqual([]);
    expect(() => parseReviewJson('{"items":[]}')).toThrow(/findings/);
    expect(() => parseReviewJson("not json")).toThrow();
  });
});

describe("the review and the status", () => {
  const kept = check([finding(), finding({ severity: "nit", line: 43, summary: "rename" })]).kept;
  const built = (over = {}) =>
    buildReview({
      kept,
      dropped: [],
      sha: SHA,
      round: 1,
      tier: "standard",
      patchId: "def5678",
      ...over,
    });
  const sent = { dispatch: true, reason: "2 Important finding(s) open in round 1", marker: "m" };

  it("holds only when the gate is on, an Important finding is open, and a session was sent", () => {
    expect(built({ gateOn: true, respond: sent }).status).toMatchObject({
      state: "failure",
      context: "pr-review",
    });
    expect(built({ gateOn: false, respond: sent }).status.state).toBe("success");
    const unsent = built({
      gateOn: true,
      respond: { dispatch: false, reason: "a person wrote #1" },
    }).status;
    expect(unsent).toMatchObject({
      state: "success",
      description: expect.stringMatching(/a person wrote #1/),
    });
    const nitsOnly = buildReview({
      kept: kept.filter((f) => f.severity === "nit"),
      sha: SHA,
      round: 1,
      tier: "light",
      gateOn: true,
      respond: sent,
    });
    expect(nitsOnly.status).toEqual({
      state: "success",
      context: "pr-review",
      description: "no Important findings (1 Nit)",
    });
  });

  it("keeps a status description within GitHub's 140 characters", () => {
    const long = built({ gateOn: true, respond: { dispatch: false, reason: "x".repeat(300) } })
      .status.description;
    expect(long.length).toBe(140);
  });

  it("posts one COMMENT review: inline comments on the new side, each with its finding marker", () => {
    const { review } = built();
    expect(review).toMatchObject({ commit_id: SHA, event: "COMMENT" });
    expect(review.comments.map((c) => [c.path, c.line, c.side])).toEqual([
      ["src/a.ts", 11, "RIGHT"],
      ["src/a.ts", 43, "RIGHT"],
    ]);
    expect(review.comments[0]?.body).toContain(
      findingMarker({ id: "r1f1", severity: "important" }),
    );
    expect(review.comments[0]?.body).toMatch(/Answer in this thread/);
    expect(review.comments[1]?.body).toMatch(/No answer needed/);
  });

  it("carries the round's receipt and counts what the checks dropped", () => {
    const { review } = built({
      dropped: [
        { file: "x", line: 1, why: "outside a changed hunk" },
        { file: "y", line: 2, why: "outside a changed hunk" },
      ],
    });
    expect(parseMarkers(review.body)).toEqual([
      { kind: "receipt", sha: SHA, patchId: "def5678", tier: "standard", round: 1 },
    ]);
    expect(review.body).toContain("- 2 outside a changed hunk");
  });
});

describe("the CLI round", () => {
  const routes = (number: number) => ({
    [`pulls/${number}`]: {
      number,
      state: "open",
      labels: [],
      body: "🤖 Generated with [Claude Code](https://claude.com/claude-code)",
      author_association: "OWNER",
      user: { login: "ejclark", type: "User" },
      base: { ref: "main", sha: "base123", repo: { full_name: "r" } },
      head: { ref: "x", sha: SHA, repo: { full_name: "r" } },
    },
    [`pulls/${number}/files`]: FILES,
    [`pulls/${number}/reviews`]: [],
    [`pulls/${number}/comments`]: [],
    [`issues/${number}/comments`]: [],
    "contents/docs/review/REVIEW.md?ref=base123": { content: b64("## Suppressed\n- `style`\n") },
  });
  const withReview = (findings: unknown[], fn: (file: string) => void) => {
    const dir = mkdtempSync(join(tmpdir(), "pr-review-post-"));
    try {
      const file = join(dir, "review.json");
      writeFileSync(file, JSON.stringify({ findings }));
      fn(file);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  it("on --dry-run, reads the rules at the base commit and posts nothing", () => {
    withReview([finding(), finding({ category: "style", line: 12, summary: "s" })], (file) => {
      const api = fakeApi(routes(7));
      const out = JSON.parse(
        runPost(["--pr", "7", "--review", file, "--tier", "light", "--dry-run"], { api }),
      );
      expect(out.dropped).toEqual([{ file: "src/a.ts", line: 12, why: "suppressed" }]);
      expect(out.status.state).toBe("success");
      expect(api.sent).toEqual([]);
    });
  });

  it("posts the review, sets the status, and writes the round's ledger row", () => {
    withReview([finding()], (file) => {
      const api = fakeApi(routes(7), (s) => (s.path.startsWith("git/") ? { sha: "g" } : {}));
      runPost(
        [
          "--pr",
          "7",
          "--review",
          file,
          "--tier",
          "standard",
          "--patch",
          "def5678",
          "--tokens",
          "120000",
        ],
        { api },
      );
      const paths = api.sent.map((s) => `${s.method} ${s.path}`);
      // The ledger first, so a failed write stops before anything reaches the PR.
      expect(paths.filter((p) => !p.includes("git/"))).toEqual([
        "PUT contents/ledger/" +
          String(
            paths
              .find((p) => p.startsWith("PUT"))
              ?.split("/")
              .pop(),
          ),
        "POST pulls/7/reviews",
        `POST statuses/${SHA}`,
      ]);
      const put = api.sent.find((s) => s.method === "PUT");
      expect(put?.path).toMatch(new RegExp(`^contents/${ledgerPath("\\d{4}-\\d\\d-\\d\\d")}$`));
      expect(put?.body.branch).toBe(LEDGER_BRANCH);
      expect(JSON.parse(unb64(put?.body.content))).toMatchObject({
        kind: "review",
        pr: 7,
        round: 1,
        tier: "standard",
        tokens: 120000,
        patchId: "def5678",
      });
    });
  });

  it("with --gate, holds the PR and leaves the round's respond line when a session is sent", () => {
    withReview([finding()], (file) => {
      const api = fakeApi(routes(7), (s) => (s.path.startsWith("git/") ? { sha: "g" } : {}));
      const gate = () => ({ dispatch: true, position: "normal", reason: "" });
      runPost(["--pr", "7", "--review", file, "--tier", "standard", "--gate"], { api, gate });
      expect(api.sent.find((s) => s.path === `statuses/${SHA}`)?.body.state).toBe("failure");
      const line = api.sent.find((s) => s.path === "issues/7/comments")?.body.body;
      expect(parseMarkers(line)).toEqual([{ kind: "respond", sha: SHA, round: 1 }]);
    });
  });

  it("with --gate and a refusing dial, posts the finding but holds nothing", () => {
    withReview([finding()], (file) => {
      const api = fakeApi(routes(7));
      const gate = () => ({ dispatch: false, position: "halt", reason: "work-mode=halt" });
      const out = JSON.parse(
        runPost(["--pr", "7", "--review", file, "--tier", "standard", "--gate", "--dry-run"], {
          api,
          gate,
        }),
      );
      expect(out.respond).toEqual({ dispatch: false, reason: "work-mode=halt" });
      expect(out.status).toMatchObject({
        state: "success",
        description: expect.stringMatching(/work-mode=halt/),
      });
    });
  });

  it("posts nothing when the ledger write fails, so a rerun cannot spend a second round", () => {
    withReview([finding()], (file) => {
      const api = fakeApi(routes(7), (s) => {
        if (s.method === "PUT") throw new Error("curl: (22) The requested URL returned error: 403");
        return { sha: "g" };
      });
      expect(() => runPost(["--pr", "7", "--review", file, "--tier", "light"], { api })).toThrow(
        /403/,
      );
      expect(api.sent.filter((s) => s.method === "POST" && !s.path.startsWith("git/"))).toEqual([]);
    });
  });

  it("leaves the respond line before the failing status, so no hold lacks its record", () => {
    withReview([finding()], (file) => {
      const api = fakeApi(routes(7), (s) => (s.path.startsWith("git/") ? { sha: "g" } : {}));
      const gate = () => ({ dispatch: true, position: "normal", reason: "" });
      runPost(["--pr", "7", "--review", file, "--tier", "standard", "--gate"], { api, gate });
      const order = api.sent.map((s) => s.path);
      expect(order.indexOf("issues/7/comments")).toBeLessThan(order.indexOf(`statuses/${SHA}`));
    });
  });

  it("compares only with earlier findings GitHub still places on the current diff", () => {
    const bot = { author_association: "NONE", user: { type: "Bot" }, created_at: "t" };
    const api = fakeApi({
      ...routes(7),
      "pulls/7/comments": [
        {
          ...bot,
          id: 1,
          path: "src/a.ts",
          line: null,
          original_line: 11,
          body: findingMarker({ id: "r1f1", severity: "important" }),
        },
        {
          ...bot,
          id: 2,
          path: "src/a.ts",
          line: 43,
          original_line: 40,
          body: findingMarker({ id: "r1f2", severity: "nit" }),
        },
      ],
    });
    expect(gatherPost(7, { api }).prior.map((p) => [p.line, p.round])).toEqual([[43, 1]]);
  });

  it("refuses a call missing its PR, review file or tier", () => {
    expect(() => runPost(["--pr", "7"], { api: fakeApi() })).toThrow(/usage/);
  });
});

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "@rstest/core";
import {
  auditMarker,
  auditReceiptRow,
  recordAuditReceipt,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/agent-meter/defects.mjs";
import {
  classify,
  decide,
  main,
  parseLog,
  parseMarker,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/audit-due.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// #7311 slice 1. The post-merge audit starts itself once enough code has merged, and a quiet day
// must cost one REST read. These pin the plan's criterion: WHEN 6 or more non-docs, non-research,
// non-dependabot PRs have merged since the last audit's marker, the script prints them by tier;
// otherwise `due: false` after one read — and an unread marker is never `due: false`.

type Commit = {
  sha: string;
  at: string;
  author: string;
  subject: string;
  pr: number | null;
  files: string[];
};
const commit = (pr: number | null, files: string[], over: Partial<Commit> = {}): Commit => ({
  sha: `${String(pr ?? 0).padStart(7, "0")}abc`,
  at: "2026-11-10T06:00:00Z",
  author: "skynet-envoy[bot]",
  subject: `fix(x): a change (#${pr})`,
  pr,
  files,
  ...over,
});
const RULES = [{ pattern: ".github/workflows/**", why: "workflow files" }];

describe("which merged PRs count toward an audit", () => {
  it("leaves out dependabot, docs-only and research-data PRs, and anything with no PR number", () => {
    expect(classify(commit(1, ["package.json"], { author: "dependabot[bot]" }))).toEqual({
      tier: "excluded",
      why: "dependabot",
    });
    expect(classify(commit(2, ["docs/a.md", "src/domain/market-events/proposals/p.json"]))).toEqual(
      {
        tier: "excluded",
        why: "docs-only",
      },
    );
    const research = { subject: "docs(research): jobs d-30 pulse (#3)" };
    expect(
      classify(commit(3, ["docs/research/x.md", "src/domain/market-events/jobs.json"], research)),
    ).toEqual({ tier: "excluded", why: "research" });
    expect(classify(commit(null, ["src/x.ts"]))).toEqual({ tier: "excluded", why: "no PR" });
  });

  it("counts a research-scoped PR that changes code, and routes money and protected paths deep", () => {
    const research = { subject: "docs(research): scorecard (#4)" };
    expect(
      classify(commit(4, ["docs/x.md", "scripts/research-scorecard.mjs"], research)).tier,
    ).toBe("standard");
    expect(classify(commit(5, ["src/trading/fill.ts"])).tier).toBe("deep");
    expect(classify(commit(6, [".github/workflows/x.yml"]), RULES).tier).toBe("deep");
    expect(classify(commit(7, ["envelope.json"]), [{ pattern: "envelope.json" }]).tier).toBe(
      "deep",
    );
    expect(classify(commit(8, ["scripts/digest-scan.mjs"]), RULES).tier).toBe("standard");
  });
});

describe("the verdict", () => {
  const code = (n: number, from = 100) =>
    Array.from({ length: n }, (_, i) =>
      commit(from + i, [i % 2 ? "src/storage/a.ts" : "app/src/b.tsx"]),
    );

  it("is not due with five code PRs, however many docs PRs merged beside them", () => {
    const docs = Array.from({ length: 20 }, (_, i) => commit(500 + i, ["docs/x.md"]));
    const v = decide([...code(5), ...docs]);
    expect(v.due).toBe(false);
    expect(v.code).toBe(5);
    expect(v.excluded).toEqual({ "docs-only": 20 });
  });

  it("is due at six, lists them by tier, and names the newest commit as the marker's next stop", () => {
    const commits = [...code(6), commit(900, ["docs/x.md"])];
    const v = decide(commits);
    expect(v.due).toBe(true);
    expect(v.deep).toEqual([101, 103, 105]);
    expect(v.standard).toEqual([100, 102, 104]);
    expect(v.through).toBe(commits.at(-1)?.sha);
    expect(v.left).toBe(0);
  });

  it("caps the batch and stops the marker at the last listed PR, so the rest come next time", () => {
    const commits = code(10);
    const v = decide(commits, { max: 4 });
    expect(v.prs).toEqual([100, 101, 102, 103]);
    expect(v.through).toBe(commits[3]?.sha);
    expect(v.left).toBe(6);
    expect(v.due).toBe(true);
  });

  it("skips a PR the last audit already read, and a PR seen twice counts once", () => {
    const v = decide([...code(6), commit(100, ["src/x.ts"])], { audited: [101] });
    expect(v.code).toBe(5);
    expect(v.due).toBe(false);
    expect(v.excluded).toEqual({ "already audited": 2 });
  });
});

describe("reading git and the marker", () => {
  it("parses squash and merge-commit subjects and their files", () => {
    const text =
      "\u001eaaa1111\u001f2026-11-10T06:00:00Z\u001fdependabot[bot]\u001fchore(deps): bump x (#7282)\n\npackage.json\n" +
      "\u001ebbb2222\u001f2026-11-10T07:00:00Z\u001fejclark\u001fMerge pull request #7400 from ejclark/platter\n\n.github/workflows/a.yml\nenvelope.json\n" +
      "\u001eccc3333\u001f2026-11-10T08:00:00Z\u001fejclark\u001fchore: no number\n\nx.ts\n";
    expect(parseLog(text).map((c: Commit) => [c.pr, c.author, c.files])).toEqual([
      [7282, "dependabot[bot]", ["package.json"]],
      [7400, "ejclark", [".github/workflows/a.yml", "envelope.json"]],
      [null, "ejclark", ["x.ts"]],
    ]);
  });

  it("reads a marker, and refuses one with no time", () => {
    expect(
      parseMarker('{"at":"2026-11-10T05:00:00Z","through":"abc1234","prs":[1,"x",2]}'),
    ).toEqual({
      at: "2026-11-10T05:00:00Z",
      through: "abc1234",
      prs: [1, 2],
    });
    expect(parseMarker('{"through":"abc1234"}')).toBeNull();
    expect(parseMarker("not json")).toBeNull();
  });
});

// End to end over a real (temporary) git history, with the one REST read faked.
const root = mkdtempSync(join(tmpdir(), "audit-due-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));
const up = join(root, "up");
const work = join(root, "work");
const sh = (cwd: string, args: string[], env: Record<string, string> = {}) =>
  execFileSync("git", args, { cwd, encoding: "utf8", env: hermeticGitEnv(env) }).trim();
const shas: string[] = [];
let hour = 0;
function land(subject: string, file: string, author = "skynet-envoy[bot]") {
  const path = join(up, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${subject}\n`);
  sh(up, ["add", "-A"]);
  hour += 1;
  const at = `2026-11-10T${String(hour).padStart(2, "0")}:00:00Z`;
  sh(up, ["-c", `user.name=${author}`, "-c", "user.email=a@b.c", "commit", "-q", "-m", subject], {
    GIT_AUTHOR_DATE: at,
    GIT_COMMITTER_DATE: at,
  });
  shas.push(sh(up, ["rev-parse", "HEAD"]));
}
mkdirSync(up);
sh(up, ["init", "-q", "-b", "main"]);
land("chore: start", "envelope.json");
writeFileSync(join(up, "envelope.json"), JSON.stringify({ protected: RULES }));
sh(up, ["add", "-A"]);
sh(up, ["-c", "user.name=x", "-c", "user.email=a@b.c", "commit", "-q", "-m", "chore: envelope"]);
for (let i = 0; i < 6; i++) land(`fix(app): change ${i} (#${10 + i})`, `app/src/f${i}.ts`);
land("chore(deps): bump x (#30)", "package-lock.json", "dependabot[bot]");
land("docs: note (#31)", "docs/n.md");
land("fix(bots): fill (#32)", "src/bots/b.ts");
execFileSync("git", ["clone", "-q", up, work], { env: hermeticGitEnv() });

const NOT_FOUND = Object.assign(new Error("curl: (22) The requested URL returned error: 404"), {
  stderr: "curl: (22) The requested URL returned error: 404",
});
const ledger = (marker: object | null) => {
  const calls: string[] = [];
  return {
    calls,
    get(path: string) {
      calls.push(path);
      if (!marker) throw NOT_FOUND;
      return { content: Buffer.from(JSON.stringify(marker)).toString("base64"), sha: "s" };
    },
    send() {
      throw new Error("audit-due must not write");
    },
  };
};
const run = (args: string[], api: object) =>
  main(args, {
    cwd: work,
    api,
    // The script's own git, but scrubbed: under a git hook an inherited GIT_DIR is the real repo.
    git: (...a: string[]) => sh(work, a),
    now: () => Date.parse("2026-11-11T00:00:00Z"),
  });

describe("the CLI over a real history", () => {
  it("with no marker, reads the last day and lists the code PRs by tier", () => {
    const api = ledger(null);
    const v = JSON.parse(run(["--json"], api));
    expect(v.due).toBe(true);
    expect(v.deep).toEqual([32]);
    expect(v.standard).toEqual([10, 11, 12, 13, 14, 15]);
    expect(v.excluded).toMatchObject({ dependabot: 1, "docs-only": 1 });
    expect(v.through).toBe(shas.at(-1));
    expect(v.from).toMatch(/no marker/);
    expect(api.calls).toEqual(["contents/audit/marker.json?ref=data%2Fpr-review"]);
  });

  it("from a marker, counts only what merged after its commit, and says due: false after one read", () => {
    const api = ledger({ at: "2026-11-10T05:00:00Z", through: shas[3], prs: [11, 12] });
    const out = run([], api);
    expect(out.split("\n")[0]).toMatch(/^due: false · 4 code PR\(s\) merged since marker through/);
    expect(api.calls).toHaveLength(1);
  });

  it("fails loudly when the marker cannot be read, never a quiet due: false", () => {
    const api = {
      get() {
        throw Object.assign(new Error("returned error: 403"), { stderr: "returned error: 403" });
      },
    };
    expect(() => run([], api)).toThrow(/403/);
  });
});

describe("the receipt moves the marker", () => {
  const runsDir = join(root, "runs");
  const sha = "0123456789abcdef0123456789abcdef01234567";

  it("writes the marker after the receipt, only when the audit came from the due list", () => {
    const order: string[] = [];
    const append = (path: string) => {
      order.push(`append ${path.split("/")[0]}`);
      return path;
    };
    const write = (path: string, text: string) => {
      order.push(`write ${path}`);
      return JSON.parse(text);
    };
    const token = () => undefined;
    recordAuditReceipt(
      { prs: "10,11", confirmed: "2", through: sha, runsDir },
      { append, write, token },
    );
    expect(order).toEqual(["append audit", "write audit/marker.json"]);
    order.length = 0;
    recordAuditReceipt({ prs: "10,11", confirmed: "2", runsDir }, { append, write, token });
    expect(order).toEqual(["append audit"]);
  });

  it("refuses a through that is not a sha before writing anything", () => {
    const write = () => {
      throw new Error("must not write");
    };
    expect(() =>
      recordAuditReceipt(
        { prs: "10", confirmed: "0", through: "main", runsDir: join(root, "none") },
        { append: write, write, token: () => undefined },
      ),
    ).toThrow(/--through needs a commit sha/);
    const row = auditReceiptRow({
      prs: "10",
      confirmed: "1",
      through: sha,
      at: "2026-11-10T00:00:00Z",
    });
    expect(auditMarker(row)).toEqual({ at: "2026-11-10T00:00:00Z", through: sha, prs: [10] });
  });
});

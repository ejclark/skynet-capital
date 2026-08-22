import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Ship contract gate — the eval Eric asked for after three PRs shipped with a literal "{}"
// description (docs/LESSONS.md 2026-08-15): a PR is a document, and ship.sh must refuse to open
// one without a real body. The refusal fires before verify/push, so exercising it here has no
// side effects. If someone re-introduces a silent body default, this goes red the same day.
const run = (args: string[], env: NodeJS.ProcessEnv = {}) => {
  try {
    execFileSync("bash", ["scripts/ship.sh", ...args], {
      cwd: process.cwd(),
      stdio: "pipe",
      env: { ...process.env, GH_TOKEN: "test-token-never-used", ...env },
    });
    return { code: 0, stderr: "" };
  } catch (error) {
    const e = error as { status?: number; stderr?: Buffer };
    return { code: e.status ?? -1, stderr: e.stderr?.toString() ?? "" };
  }
};

describe("ship open — the PR-description contract", () => {
  it("refuses to open a PR with no --body-file", () => {
    const { code, stderr } = run(["open", "test: no body"]);
    expect(code).toBe(1);
    expect(stderr).toContain("--body-file is required");
  });

  it("refuses an EMPTY body file — a blank document is no document", () => {
    const dir = mkdtempSync(join(tmpdir(), "ship-spec-"));
    const empty = join(dir, "empty.md");
    writeFileSync(empty, "");
    const { code, stderr } = run(["open", "test: empty body", "--body-file", empty]);
    rmSync(dir, { recursive: true, force: true });
    expect(code).toBe(1);
    expect(stderr).toContain("--body-file is required");
  });
});

// The picture/format contract (2026-08-20 hat-team research): comment-only format rules decay
// (fridge rule: 4/126 bodies), machine-checked ones hold. `checkbody` is the pure linter cmd_open
// runs before verify/push — existence and honesty gated, taste left to docs/PICTURES.md. The
// waiver line is first-class: an honest skip beats a decorative diagram on a typo fix.
describe("ship checkbody — the picture/format contract", () => {
  let dir: string;
  const body = (content: string) => {
    const f = join(dir, `${Math.random().toString(36).slice(2)}.md`);
    writeFileSync(f, content);
    return f;
  };
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "ship-checkbody-"));
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const PIC_MERMAID = [
    "## The picture",
    "",
    "```mermaid",
    "flowchart LR",
    "    a[form] --> b[issue]",
    "```",
    "",
    "_Caption — feedback flow, from the routing design_",
    "",
  ].join("\n");

  it("passes a captioned stable-type mermaid picture", () => {
    const { code } = run(["checkbody", body(`${PIC_MERMAID}\n## Summary\n\n- adds the thing\n`)]);
    expect(code).toBe(0);
  });

  it("passes an explicit waiver — trivial PRs stay cheap, skips stay visible", () => {
    const { code } = run([
      "checkbody",
      body(
        "## The picture\n\nPicture: waived — pure docs, no behavior change\n\n## Summary\n\n- fixes a typo\n",
      ),
    ]);
    expect(code).toBe(0);
  });

  it("refuses a body with no '## The picture' section", () => {
    const { code, stderr } = run(["checkbody", body("## Summary\n\n- does stuff\n")]);
    expect(code).toBe(1);
    expect(stderr).toContain("The picture");
  });

  it("accepts a captioned before/after table — the picture PICTURES.md prescribes for config", () => {
    // The gate used to demand an image or a mermaid, so a config change with the right picture had
    // to add a decorative diagram to pass. That is the waiver doctrine inverted (2026-08-22).
    const table = [
      "## The picture",
      "",
      "| | before | after |",
      "|---|---|---|",
      "| `workflows:` filter | absent | names + paths |",
      "",
      "_Caption — the trigger block, before and after this change._",
      "",
      "## Summary",
      "",
      "- restores the filter",
      "",
    ].join("\n");

    const { code } = run(["checkbody", body(table)]);
    expect(code).toBe(0);
  });

  it("refuses a picture section with neither media nor waiver", () => {
    const { code, stderr } = run([
      "checkbody",
      body("## The picture\n\nwords about a picture\n\n## Summary\n\n- does stuff\n"),
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("waived");
  });

  it("refuses media without a filled caption — the template placeholder does not count", () => {
    const noCaption = PIC_MERMAID.replace(
      "_Caption — feedback flow, from the routing design_",
      "_Caption —_",
    );
    const { code, stderr } = run([
      "checkbody",
      body(`${noCaption}\n## Summary\n\n- adds the thing\n`),
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("caption");
  });

  it("refuses mermaid types off the stable allowlist (journey is a UX chart)", () => {
    const { code, stderr } = run([
      "checkbody",
      body(
        "## The picture\n\n```mermaid\njourney\n    title day\n```\n\n_Caption — a chart_\n\n## Summary\n\n- x\n",
      ),
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("journey");
  });

  it("refuses branch-form raw.githubusercontent URLs — they 404 at squash-merge (PR #446)", () => {
    const { code, stderr } = run([
      "checkbody",
      body(
        '## The picture\n\n<img src="https://raw.githubusercontent.com/o/r/my-branch/docs/shots/pr-9/x.jpg">\n\n_Caption — before/after of /login_\n\n## Summary\n\n- x\n',
      ),
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("SHA-pinned");
  });

  it("accepts SHA-pinned raw URLs", () => {
    const sha = "a".repeat(40);
    const { code } = run([
      "checkbody",
      body(
        `## The picture\n\n<img src="https://raw.githubusercontent.com/o/r/${sha}/docs/shots/pr-9/x.jpg">\n\n_Caption — before/after of /login, npm run shoot:login_\n\n## Summary\n\n- x\n`,
      ),
    ]);
    expect(code).toBe(0);
  });

  it("refuses Summary bullets over 120 chars — one short line each (Eric, 2026-08-19)", () => {
    const long = `- ${"narrates every mechanical step ".repeat(5)}`;
    const { code, stderr } = run([
      "checkbody",
      body(`## The picture\n\nPicture: waived — chore\n\n## Summary\n\n${long}\n`),
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("120");
  });
});

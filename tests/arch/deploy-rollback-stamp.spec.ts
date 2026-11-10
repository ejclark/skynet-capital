import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// #6697 (post-merge audit, 2026-11-02): the dashboard's deploy step stamped `GIT_SHA = <push sha>`
// into the workspace fly.toml IN PLACE, and the rollback in the same job deployed the previous
// image with no `--config`, so flyctl read the stamped file. The machine came back on the old image
// claiming the new sha, the next docs-only push diffed from that sha and skipped, and production
// stayed behind main. deploy-bots never had the gap: it stamps a temp copy and rolls back with the
// committed config, so the rollback drops the stamp and the next preflight fails open to deploying.
//
// A decision in a workflow `run:` block is untested by construction (docs/LESSONS.md), so this
// runs the real blocks, read from pipeline.yml, in a scratch workspace with a stub fly-deploy.mjs
// that records the config each call deploys with. Both jobs go through the same harness, the bots
// pair as the control the dashboard pair is held to.
const pipeline = readFileSync(".github/workflows/pipeline.yml", "utf8");
const jobs = {
  deploy: pipeline.slice(pipeline.indexOf("\n  deploy:"), pipeline.indexOf("\n  deploy-bots:")),
  "deploy-bots": pipeline.slice(pipeline.indexOf("\n  deploy-bots:")),
};

const step = (job: string, name: string) => {
  const start = job.indexOf(`- name: ${name}`);
  if (start < 0) throw new Error(`no step named "${name}"`);
  return job.slice(start, job.indexOf("\n      - name: ", start + 1));
};

const indentOf = (line: string) => line.length - line.trimStart().length;

/** The step's `run: |` body, dedented. */
const runBlock = (stepText: string) => {
  const lines = stepText.split("\n");
  const at = lines.findIndex((line) => /^\s+run: \|\s*$/.test(line));
  if (at < 0) throw new Error("step has no `run: |` block");
  const keyIndent = indentOf(lines[at] ?? "");
  const body: string[] = [];
  for (const line of lines.slice(at + 1)) {
    const indent = indentOf(line);
    if (line.trim() !== "" && indent <= keyIndent) break;
    body.push(line);
  }
  const pad = Math.min(...body.filter((l) => l.trim()).map(indentOf));
  return body.map((l) => l.slice(pad)).join("\n");
};

const PUSH_SHA = "b".repeat(40);
const PREV_IMAGE = "registry.fly.io/skynet-capital@sha256:aaaa";

/** Run one block in `dir` with GitHub's expressions filled in; returns the configs fly-deploy saw. */
const execute = (dir: string, block: string): string[] => {
  const script = block
    .replace(/\$\{\{ github\.sha \}\}/g, PUSH_SHA)
    .replace(/\$\{\{ steps\.[\w-]+\.outputs\.image \}\}/g, PREV_IMAGE)
    .replace(/\$\{\{[^}]*\}\}/g, "x")
    .replace(/\/tmp\//g, `${dir}/tmp/`);
  execFileSync("bash", ["-euo", "pipefail", "-c", script], { cwd: dir, stdio: "pipe" });
  const log = join(dir, "configs.log");
  try {
    return readFileSync(log, "utf8").split("\n=====\n").filter(Boolean);
  } finally {
    rmSync(log, { force: true });
  }
};

/** The GIT_SHA a machine deployed with this config would carry in `config.env`, or "". */
const stampedSha = (toml: string) => {
  const lines = toml.split("\n");
  const start = lines.findIndex((line) => /^\[env\]/.test(line));
  if (start < 0) return "";
  for (const line of lines.slice(start + 1)) {
    if (/^\[/.test(line)) break;
    const match = /^\s*GIT_SHA\s*=\s*"([^"]*)"/.exec(line);
    if (match) return match[1];
  }
  return "";
};

const STUB = `import { appendFileSync, readFileSync } from "node:fs";
const args = process.argv.slice(2);
const at = args.findIndex((a) => a === "--config" || a === "-c");
const config = at >= 0 ? args[at + 1] : "fly.toml";
appendFileSync("configs.log", readFileSync(config, "utf8") + "\\n=====\\n");
`;

const pairs = [
  {
    job: "deploy" as const,
    toml: "fly.toml",
    deploy: "Deploy to Fly",
    rollback: "Roll back to previous image",
  },
  {
    job: "deploy-bots" as const,
    toml: "fly.bots.toml",
    deploy: "Deploy bots",
    rollback: "Roll back bots to previous image",
  },
];

describe("deploy rollbacks drop the failed push's GIT_SHA stamp (#6697)", () => {
  for (const pair of pairs) {
    describe(pair.job, () => {
      let dir = "";
      beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), "rollback-stamp-"));
        mkdirSync(join(dir, "scripts"));
        mkdirSync(join(dir, "tmp"));
        writeFileSync(join(dir, pair.toml), readFileSync(pair.toml, "utf8"));
        writeFileSync(join(dir, "scripts/fly-deploy.mjs"), STUB);
        writeFileSync(join(dir, "scripts/smoke.sh"), "exit 0\n");
        writeFileSync(join(dir, "scripts/bots-start-stopped.sh"), "exit 0\n");
      });
      afterEach(() => rmSync(dir, { recursive: true, force: true }));

      const job = jobs[pair.job];

      it("deploys the push stamped with its own sha", () => {
        const config = execute(dir, runBlock(step(job, pair.deploy)))[0] ?? "";
        expect(stampedSha(config)).toBe(PUSH_SHA);
      });

      it("leaves the committed config unstamped, so a later step never inherits the push's sha", () => {
        execute(dir, runBlock(step(job, pair.deploy)));
        expect(readFileSync(join(dir, pair.toml), "utf8")).toBe(readFileSync(pair.toml, "utf8"));
      });

      it("rolls back on a config that carries no GIT_SHA, whatever the failed deploy stamped", () => {
        execute(dir, runBlock(step(job, pair.deploy)));
        const config = execute(dir, runBlock(step(job, pair.rollback)))[0] ?? "";
        expect(stampedSha(config)).toBe("");
      });

      it("pins the rollback to the committed config by name", () => {
        expect(runBlock(step(job, pair.rollback))).toContain(`--config ${pair.toml} `);
      });
    });
  }

  it("the dashboard's next preflight after a rollback deploys, as its own comment promises", () => {
    const dir = mkdtempSync(join(tmpdir(), "rollback-stamp-"));
    try {
      mkdirSync(join(dir, "scripts"));
      writeFileSync(join(dir, "fly.toml"), readFileSync("fly.toml", "utf8"));
      writeFileSync(join(dir, "scripts/fly-deploy.mjs"), STUB);
      writeFileSync(join(dir, "scripts/smoke.sh"), "exit 0\n");
      execute(dir, runBlock(step(jobs.deploy, "Deploy to Fly")));
      const config =
        execute(dir, runBlock(step(jobs.deploy, "Roll back to previous image")))[0] ?? "";
      // The real CLI, as the preflight step calls it: an empty baseline decides before any diff.
      const verdict = execFileSync("node", ["scripts/dashboard-deploy-preflight.mjs"], {
        env: { ...process.env, DEPLOYED_SHA: stampedSha(config), HEAD_SHA: "c".repeat(40) },
        encoding: "utf8",
      });
      // Deploy for the stated reason, not a diff that merely failed open on unknown shas.
      const [decision, reason] = verdict.split("\n");
      expect(decision).toBe("deploy");
      expect(reason).toContain("no GIT_SHA baseline");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

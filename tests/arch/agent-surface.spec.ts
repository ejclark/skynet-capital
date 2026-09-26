import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { advisoryScan } from "../support/advisory-scan.js";

// Agent-surface eye (scripts/agent-surface-scan.mjs): the files that route plain intent to
// machinery must resolve as written — a skill named for its directory, an agent named for its
// file, a hook wired to an event Claude Code fires. Each failure is silent at runtime, which is
// the class this eye exists for (#3769 slice 3). Advisory on the real repo; the fixture cases
// below are ordinary unit tests of the tool and stay blocking.
const SCRIPT = join(process.cwd(), "scripts/agent-surface-scan.mjs");

const HOOKS_DOC = `# Hooks\n\n## Hook events\n\n### SessionStart\n\ntext\n\n### PreToolUse\n\ntext\n\n## Next section\n\n### NotAnEvent\n`;

function scanFixture(seed: (root: string) => void): { status: number; out: string } {
  const root = mkdtempSync(join(tmpdir(), "agent-surface-"));
  try {
    mkdirSync(join(root, "docs", "vendor", "claude-code"), { recursive: true });
    writeFileSync(join(root, "docs", "vendor", "claude-code", "hooks.md"), HOOKS_DOC);
    seed(root);
    try {
      const out = execFileSync("node", [SCRIPT, "--root", root], { encoding: "utf8" });
      return { status: 0, out };
    } catch (err) {
      const e = err as { status: number; stdout?: string; stderr?: string };
      return { status: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const skill = (
  root: string,
  dir: string,
  name: string,
  description = "Do the thing. Use when asked.",
) => {
  mkdirSync(join(root, ".claude", "skills", dir), { recursive: true });
  writeFileSync(
    join(root, ".claude", "skills", dir, "SKILL.md"),
    `---\nname: ${name}\ndescription: >-\n  ${description}\n---\n\n# ${name}\n`,
  );
};

describe("agent-surface eye (advisory on the real repo)", () => {
  it("reports the repo's skills, agents and hooks without blocking CI", () => {
    advisoryScan(SCRIPT);
  });
});

describe("agent-surface eye — fixtures", () => {
  it("passes a skill, an agent and a hook that all resolve as written", () => {
    const { status, out } = scanFixture((root) => {
      skill(root, "retro", "retro");
      mkdirSync(join(root, ".claude", "agents"), { recursive: true });
      writeFileSync(
        join(root, ".claude", "agents", "reviewer.md"),
        "---\nname: reviewer\ndescription: Reviews a diff. Use before opening a PR.\ntools: Read, Grep\n---\n",
      );
      writeFileSync(
        join(root, ".claude", "settings.json"),
        JSON.stringify({
          hooks: {
            PreToolUse: [{ matcher: "Task", hooks: [{ type: "command", command: "true" }] }],
          },
        }),
      );
    });
    expect(status).toBe(0);
    expect(out).toContain("every skill, agent and hook resolves as written");
  });

  it("fails a skill whose frontmatter name is not its directory", () => {
    const { status, out } = scanFixture((root) => skill(root, "retro", "retrospective"));
    expect(status).toBe(1);
    expect(out).toContain('name "retrospective" ≠ directory "retro"');
  });

  it("fails an agent with no description and notes one with no Use trigger", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, ".claude", "agents"), { recursive: true });
      writeFileSync(join(root, ".claude", "agents", "a.md"), "---\nname: a\ntools: Read\n---\n");
      writeFileSync(
        join(root, ".claude", "agents", "b.md"),
        "---\nname: b\ndescription: Does b.\ntools: Read\n---\n",
      );
    });
    expect(status).toBe(1);
    expect(out).toContain("a.md — no description");
    expect(out).toContain("b.md — description states no `Use when` trigger");
  });

  it("fails a hook wired to an event the vendored docs do not list, and one outside `hooks`", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, ".claude"), { recursive: true });
      writeFileSync(
        join(root, ".claude", "settings.json"),
        JSON.stringify({
          SessionStart: ["npm ci"],
          hooks: { NotAnEvent: [{ hooks: [{ type: "command", command: "true" }] }] },
        }),
      );
    });
    expect(status).toBe(1);
    expect(out).toContain("hooks.NotAnEvent — not a Claude Code hook event");
    expect(out).toContain('"SessionStart" sits at the top level, outside "hooks"');
  });

  it("degrades honestly: no vendored hooks doc means UNKNOWN, exit 2, never a pass", () => {
    const root = mkdtempSync(join(tmpdir(), "agent-surface-nodoc-"));
    try {
      mkdirSync(join(root, ".claude"), { recursive: true });
      writeFileSync(join(root, ".claude", "settings.json"), JSON.stringify({ hooks: {} }));
      let status = 0;
      let out = "";
      try {
        out = execFileSync("node", [SCRIPT, "--root", root], { encoding: "utf8" });
      } catch (err) {
        const e = err as { status: number; stdout?: string };
        status = e.status;
        out = e.stdout ?? "";
      }
      expect(status).toBe(2);
      expect(out).toContain("UNKNOWN");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

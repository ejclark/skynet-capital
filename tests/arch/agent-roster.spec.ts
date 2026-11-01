import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// The 2026-11-01 roster pass (docs/COACHES.md → *Roster pass*) as checks. agent-surface-scan and
// config-audit say a file is well-formed; neither says a decision held: that the worker carries no
// model line, that the blind rule lives in the file the grader runs from, that nothing starts the
// on-demand agent, that a benched file stays out of the folder Claude Code loads. Each test below
// goes red when one of those decisions is undone.
const AGENTS = ".claude/agents";
const BENCH = "docs/agents/bench";
const read = (path: string) => readFileSync(path, "utf8");

function frontmatter(path: string): string {
  const text = read(path);
  return text.slice(0, text.indexOf("\n---", 3));
}
function description(path: string): string {
  const lines = frontmatter(path).split("\n");
  const start = lines.findIndex((l) => l.startsWith("description:"));
  const out: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith("  ")) break;
    out.push(line.trim());
  }
  return out.join(" ");
}
const toolsOf = (path: string) =>
  (frontmatter(path).match(/^tools: (.+)$/m)?.[1] ?? "").split(", ").filter(Boolean);
const bodyOf = (path: string) => read(path).slice(read(path).indexOf("\n---", 3));

const RETIRED = ["decomposer", "mortician", "test-backfiller", "ui-librarian", "artifact-smith"];
const BENCHED = ["art-director", "piece-wright", "render-alchemist", "set-dresser"];

describe("the worker agent", () => {
  const file = join(AGENTS, "worker.md");

  // A model line would make the file a second dial next to the one grind sets per call.
  it("has no model line, so the calling script sets the tier", () => {
    expect(frontmatter(file)).not.toMatch(/^model:/m);
  });

  it("carries file and shell tools and nothing that needs a listing", () => {
    const tools = toolsOf(file);
    for (const tool of ["Read", "Edit", "Write", "Grep", "Glob", "Bash"]) {
      expect(tools).toContain(tool);
    }
    for (const tool of ["Skill", "Agent", "ToolSearch", "ReportFindings"]) {
      expect(tools).not.toContain(tool);
    }
  });
});

describe("the evals expert", () => {
  const file = join(AGENTS, "evals-expert.md");

  it("keeps its description under 450 characters with a Use-when trigger", () => {
    const text = description(file);
    expect(text.length).toBeLessThan(450);
    expect(text).toMatch(/\bUse when\b/);
  });

  it("has exactly the tools its two modes need", () => {
    expect(toolsOf(file).sort()).toEqual(["Bash", "Edit", "Glob", "Grep", "Read", "Write"]);
  });

  it("preloads the fitness skill", () => {
    expect(frontmatter(file)).toMatch(/^skills: \[fitness\]$/m);
  });

  // Independence has to travel with the pass: a spec graded on a list its author wrote scored 39 of
  // 40, and 7 of 28 on bugs written without it.
  it("states the blind rule as a hard rule in the agent file", () => {
    const hardRules = bodyOf(file).slice(bodyOf(file).indexOf("## Hard rules"));
    expect(hardRules).toMatch(/never (read|open)[^.]*spec/i);
  });

  it("is dispatched by nothing automatic until it has three reps", () => {
    const automatic = [".github/workflows", ".github/prompts", ".claude/workflows"];
    for (const dir of automatic) {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (path.endsWith(".md") || path.endsWith(".yml") || path.endsWith(".js")) {
          expect(`${path}: ${read(path).includes("evals-expert")}`).toBe(`${path}: false`);
        }
      }
    }
  });
});

describe("the attack on a check moved out of red-team", () => {
  it("red-team no longer carries the check class", () => {
    const body = bodyOf(join(AGENTS, "red-team.md"));
    expect(body).not.toMatch(/one class for checks/i);
    expect(body).not.toMatch(/passes? (this|the) check while/i);
    expect(body).toContain("evals-expert");
  });

  it("the skill pointers name the agent that now does it", () => {
    const fitness = read(".claude/skills/fitness/SKILL.md");
    expect(fitness).toContain("evals-expert");
    expect(fitness).not.toMatch(/`red-team`/);
    expect(read(".claude/skills/retro/SKILL.md")).toContain("evals-expert");
  });
});

describe("retired and benched agents", () => {
  it("removes the retired files, keeping the drills they ran", () => {
    for (const name of RETIRED) expect(existsSync(join(AGENTS, `${name}.md`))).toBe(false);
    for (const drill of ["decompose", "dedupe", "bury", "backfill"]) {
      expect(existsSync(`.claude/skills/${drill}/SKILL.md`)).toBe(true);
    }
  });

  // Claude Code scans .claude/agents recursively, so a bench under it would stay listed. Each file
  // is in exactly one place, so the documented restore (one git mv) never turns this red.
  it("keeps each benched agent in exactly one place, and the bench outside the loaded folder", () => {
    expect(BENCH.startsWith(AGENTS)).toBe(false);
    for (const name of BENCHED) {
      const places = [AGENTS, BENCH].filter((dir) => existsSync(join(dir, `${name}.md`)));
      expect(`${name}: ${places.length}`).toBe(`${name}: 1`);
    }
  });

  it("the bench README holds the restore command and each agent's floor row", () => {
    const readme = read(join(BENCH, "README.md"));
    expect(readme).toContain("git mv docs/agents/bench/");
    for (const name of BENCHED) expect(readme).toMatch(new RegExp(`^\\| ${name} \\|`, "m"));
  });

  // Live routes only: dated review sections in docs/COACHES.md keep the names they counted.
  it("leaves no route to a retired agent in the files that route work", () => {
    const routes = [
      "CLAUDE.md",
      "docs/COMPUTE.md",
      "docs/grind/README.md",
      "docs/process/DECOMPOSE.md",
      "docs/process/TOKEN-EFFICIENCY.md",
      ".claude/agents/reviewer.md",
      ".claude/skills/governor/SKILL.md",
      ".claude/skills/charter/SKILL.md",
      ".claude/skills/decompose/SKILL.md",
      ".claude/skills/dedupe/SKILL.md",
      ".claude/skills/bury/SKILL.md",
      ".claude/skills/backfill/SKILL.md",
    ];
    for (const path of routes) {
      for (const name of RETIRED) {
        expect(`${path}: ${read(path).includes(name)}`).toBe(`${path}: false`);
      }
    }
  });

  it("every coach in the defensive roster names the chore, not a deleted file", () => {
    const rows = read("docs/COACHES.md")
      .split("\n")
      .filter((l) => /^\| \*\*(Size|Duplication|Dead code|Spec gap)\*\*/.test(l));
    expect(rows).toHaveLength(4);
    for (const row of rows) expect(row).toContain("docs/grind/governor.instructions.md");
  });

  it("the shareable-page rules moved into BRAND.md with the route", () => {
    const cohesion = read("docs/BRAND.md").split("## Cohesion rules")[1];
    expect(cohesion).toContain("artifact-design");
    expect(cohesion).toMatch(/numbered/i);
    expect(read("CLAUDE.md")).toMatch(/shareable page[^\n]*\n?[^\n]*artifact-design/);
  });
});

describe("the process-file lens", () => {
  it("is in the reviewer with its four context and loop checks", () => {
    const body = bodyOf(join(AGENTS, "reviewer.md"));
    for (const check of [
      /startup cost/i,
      /stale(ness)? at birth/i,
      /rule with no reader/i,
      /loop with no number/i,
    ]) {
      expect(body).toMatch(check);
    }
  });

  // Without this the lens's oracle (keep it if 3 of the next 10 reads find something) has no clock.
  it("has a trigger in /ship that cites the scope module", () => {
    const line = read(".claude/skills/ship/SKILL.md")
      .split("\n")
      .find((l) => l.includes("scripts/instructions/scope.mjs"));
    expect(line).toBeDefined();
    expect(line).toContain("reviewer");
  });
});

describe("sunset mode", () => {
  const skill = read(".claude/skills/charter/SKILL.md");

  it("is in /charter with the three endings and the unmeasured default", () => {
    const section = skill.slice(skill.indexOf("## Sunset mode"));
    expect(section.length).toBeGreaterThan(20);
    for (const word of ["keep", "merge", "retire"]) expect(section).toContain(word);
    expect(section).toMatch(/unmeasured/);
    expect(section).toContain("*.meta.json");
  });

  it("linguist carries the dated pass that will judge it", () => {
    expect(read(join(AGENTS, "linguist.md"))).toMatch(/2026-12-31[^.]*`\/charter`/);
    expect(description(join(AGENTS, "linguist.md")).length).toBeLessThan(600);
  });
});

// agent-surface-scan and config-audit stay advisory on the real repo (tests/arch/agent-surface.spec.ts);
// this only pins the two rows the pass added, without making either gate blocking.
describe("the floor table", () => {
  it("has a row for each agent the pass added", () => {
    const compute = read("docs/COMPUTE.md");
    const table = compute.slice(
      compute.indexOf("FLOOR-TABLE:START"),
      compute.indexOf("FLOOR-TABLE:END"),
    );
    expect(table).toMatch(/^\| worker \| .* \| sonnet \| high \|$/m);
    expect(table).toMatch(/^\| evals-expert \| .* \| fable \| xhigh \|$/m);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";

// Claude Code's worktree check refuses shell shapes it cannot show stay inside the worktree. On
// 2026-11-01 those refusals cost 148 agents 129 failed calls, because the rule lived only in
// docs/DELEGATION.md, which an agent never loads unprompted: no workflow prompt or agent definition
// carried it. CLAUDE.md is the one file every agent loads, so the rule has to stay in it. Each shape
// below was refused in a live isolated agent; the spec fails if the line is dropped or loses one.
const shipLoop = () => {
  const text = readFileSync(join(process.cwd(), "CLAUDE.md"), "utf8");
  return text.slice(text.indexOf("## Ship loop")).replace(/\s+/g, " "); // the file wraps at 100
};

describe("the worktree shell rule reaches every agent", () => {
  it.each([
    ["a loop or subshell around git", "a loop or `$(…)` around git"],
    ["bash chained to an exit status", "`bash file; echo $?`"],
    ["bash given text that names git", "`bash -c` whose text names git"],
    ["a variable handed to sed or node", "a variable as an argument to sed or node"],
    ["find with a grouped expression", "`find` with `( … )`"],
  ])("names %s as refused", (_name, shape) => {
    expect(shipLoop()).toContain(shape);
  });

  it("says what to do instead, so a refusal is not the first the agent hears of it", () => {
    const rule = shipLoop();
    expect(rule).toContain("run as `bash <file>`");
    expect(rule).toContain("Spell paths out");
  });
});

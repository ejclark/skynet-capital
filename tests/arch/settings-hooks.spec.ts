import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";

// THE MEMORY HOOK REACHES THE SESSION (2026-11-01, #6470's study; #6524's note). The per-file memory
// history hook exits 2 with a one-line reason when a version cannot land. settings.json ran it as a
// plain `async` hook behind `2>/dev/null || true`: docs/vendor/claude-code/hooks.md says an async
// hook delivers only the JSON fields of its stdout, and the mask dropped stderr and the exit code
// besides — so a lost version reached nobody. `asyncRewake` is the field that "runs in the
// background and wakes Claude on exit code 2", showing the hook's stderr as a system reminder.
type Hook = { type: string; command?: string; async?: boolean; asyncRewake?: boolean };
type Settings = { hooks?: Record<string, { matcher?: string; hooks: Hook[] }[]> };

const settings = JSON.parse(readFileSync(".claude/settings.json", "utf8")) as Settings;
const allHooks = Object.values(settings.hooks ?? {}).flatMap((group) =>
  group.flatMap((entry) => entry.hooks),
);
const memory = allHooks.find((h) => h.command?.includes("scripts/hooks/memory-history.mjs"));

describe("the memory history hook can wake the session on a lost version", () => {
  it("is registered", () => {
    expect(memory).toBeTruthy();
  });

  it("runs under asyncRewake, not plain async — exit 2 reaches Claude only that way", () => {
    expect(memory?.asyncRewake).toBe(true);
    expect(memory?.async).toBeUndefined();
  });

  it("keeps its stderr and exit code: no 2>/dev/null, no || true", () => {
    expect(memory?.command).not.toContain("2>/dev/null");
    expect(memory?.command).not.toContain("|| true");
  });

  // The doc this rests on is vendored; the field must still be the one it names, or the setting
  // above is a word the harness ignores.
  it("names a field the vendored hooks reference documents", () => {
    const doc = readFileSync("docs/vendor/claude-code/hooks.md", "utf8");
    expect(doc).toMatch(/`asyncRewake`[^\n]*wakes Claude on exit code 2/);
  });
});

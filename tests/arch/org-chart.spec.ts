import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LABEL_NAMES } from "../../scripts/moneypenny/labels.mjs";

// The org chart is generated from the seat registry (docs/agents/seats.json, #6886 slice 1) and is
// the compact context workflows read (Eric, 2026-11-07). Four contracts keep it a true claim:
// the page equals the render, every code root a seat cites exists, every agent, skill, workflow,
// lane prompt and output style is covered by a seat (a roster file with no seat is a role nobody
// can find on the chart), and every seat names what starts it, from the closed list.

type Seat = {
  id: string;
  department: string;
  name: string;
  invoker: string;
  status: string;
  codeRoots: string[];
  role?: string;
  pulls?: string[];
};
type Registry = {
  depts: { id: string }[];
  people: { id: string }[];
  links: { from: string; to: string; label: string }[];
  friction: { edge: string; number: string; cite: string; tracked: string }[];
  seats: Seat[];
  roleOrder?: string[];
};

const registry = JSON.parse(readFileSync("docs/agents/seats.json", "utf8")) as Registry;
const INVOKERS = ["event", "schedule", "lane", "session", "member", "eric", "self", "none"];
const STATUSES = ["hired", "on trial", "benched", "retired", "planned"];

/** Every file of one kind under a directory: `.claude/skills/<name>/SKILL.md` style, or flat. */
const roster = (): string[] => {
  const flat = (dir: string, ext: string) =>
    existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => f.endsWith(ext))
          .map((f) => join(dir, f))
      : [];
  const skills = readdirSync(".claude/skills")
    .map((d) => join(".claude/skills", d, "SKILL.md"))
    .filter(existsSync);
  return [
    ...flat(".claude/agents", ".md"),
    ...skills,
    ...flat(".claude/workflows", ".js"),
    ...flat(".claude/output-styles", ".md"),
    ...flat(".github/workflows", ".yml"),
    ...flat(".github/prompts", ".md"),
  ];
};

const covers = (root: string, file: string) =>
  file === root || file.startsWith(`${root.replace(/\/$/, "")}/`);

describe("the org chart — generated from the seat registry, grounded", () => {
  it("the page on disk matches the render of docs/agents/seats.json", () => {
    const out = execFileSync("node", ["scripts/org-chart.mjs", "--check"], { encoding: "utf8" });
    expect(out).toContain("org chart matches");
  });

  it("every code root a seat cites exists", () => {
    const missing = registry.seats.flatMap((s) =>
      s.codeRoots.filter((r) => !existsSync(r)).map((r) => `${s.id}: ${r}`),
    );
    expect(missing).toEqual([]);
  });

  it("every agent, skill, workflow, lane prompt and output style is covered by a seat", () => {
    const roots = registry.seats.flatMap((s) => s.codeRoots);
    const uncovered = roster().filter((f) => !roots.some((r) => covers(r, f)));
    expect(uncovered).toEqual([]);
  });

  it("every seat has a unique id, a known department, a known status and a named invoker", () => {
    const depts = new Set(registry.depts.map((d) => d.id));
    const ids = registry.seats.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const bad = registry.seats.filter(
      (s) =>
        !(depts.has(s.department) && STATUSES.includes(s.status) && INVOKERS.includes(s.invoker)),
    );
    expect(bad.map((s) => s.id)).toEqual([]);
  });

  // #6886 slice 1b: the board's Role field is derived from these keys, so a typo'd label would
  // silently empty a lane and a seat missing from roleOrder would never be anyone's Role.
  it("every seat that pulls board cards has a unique role, known labels, and a place in roleOrder", () => {
    const pulling = registry.seats.filter((s) => s.role || s.pulls);
    const order = registry.roleOrder ?? [];
    expect([...order].sort()).toEqual(pulling.map((s) => s.id).sort());
    expect(new Set(order).size).toBe(order.length);
    const roles = pulling.map((s) => s.role);
    expect(new Set(roles).size).toBe(roles.length);
    const thin = pulling.filter((s) => !(s.role && s.pulls?.length));
    expect(thin.map((s) => s.id)).toEqual([]);
    const unknown = pulling.flatMap((s) =>
      (s.pulls ?? []).filter((l) => !LABEL_NAMES.includes(l)).map((l) => `${s.id}: ${l}`),
    );
    expect(unknown).toEqual([]);
  });

  it("every friction row carries a number, a source and where its change is tracked", () => {
    const thin = registry.friction.filter((f) => !(f.number && f.cite && f.tracked));
    expect(thin.map((f) => f.edge)).toEqual([]);
  });
});

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sitesIn } from "../../scripts/whole-read-scan.mjs";

// The whole-read gate (#4612 criterion 6, #4619): a request or boot path of the dashboard server
// that gains a whole read of a growing ledger fails the build. BLOCKING, unlike the advisory debt
// scans — this is the class that OOM-killed production (scripts/whole-read-scan.mjs's header).
const SCRIPT = join(process.cwd(), "scripts/whole-read-scan.mjs");

function run(cwd: string): { status: number; out: string } {
  try {
    const out = execFileSync("node", [SCRIPT], { cwd, encoding: "utf8", stdio: "pipe" });
    return { status: 0, out };
  } catch (err) {
    const e = err as { status: number; stdout?: string; stderr?: string };
    return { status: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

describe("whole-read gate — this repo", () => {
  it("finds no whole read the grandfather list doesn't name, and no stale entry", () => {
    const { status, out } = run(process.cwd());
    expect({ status, out }).toEqual({ status: 0, out: expect.stringContaining("✓") });
  });
});

describe("whole-read scan — what counts as a site", () => {
  it("counts a call to a named read seam, optional or not", () => {
    const src = [
      "const a = await config.readTradeActivity?.(id);",
      "const b = await deps.readHistory(id);",
    ].join("\n");
    expect(sitesIn(src)).toEqual([
      { read: "readTradeActivity()", line: 1 },
      { read: "readHistory()", line: 2 },
    ]);
  });

  it("does not count a seam that is declared or passed along, only one that is called", () => {
    const src = [
      "readonly readHistory?: (participantId: string) => Promise<readonly EquitySample[]>;",
      "readTradeActivity: deps.readFills,",
    ].join("\n");
    expect(sitesIn(src)).toEqual([]);
  });

  it("counts .list( on a store name, a store-typed identifier and a const alias of either", () => {
    const src = [
      "function f(store: ActivityStore, bus: Pick<ActivityEventBus, 'list'>) {",
      "  const log = config.activityLog;",
      "  return [store.list(id), bus.list(), log.list(id), history.list(id)];",
      "}",
    ].join("\n");
    expect(sitesIn(src).map((s) => s.read)).toEqual([
      "store.list()",
      "bus.list()",
      "log.list()",
      "history.list()",
    ]);
  });

  it("ignores .list( on a store that is not a growing ledger", () => {
    expect(sitesIn("const rows = feedbackLog.list(id); savedPositions.list(key);")).toEqual([]);
  });

  it("does not count a composition-root binding under a seam key, even across lines", () => {
    const src = [
      "const config = {",
      "  readHistory: (id) => history.list(id),",
      "  readAllOrderAudit: async (ids) =>",
      "    ids",
      "      ? (await Promise.all(ids.map((id) => orderAudit.list(id)))).flat()",
      "      : orderAudit.list(),",
      "};",
    ].join("\n");
    expect(sitesIn(src)).toEqual([]);
  });

  it("counts a binding under any other key, so a new seam can't slip in unnamed", () => {
    const src = ["const config = {", "  readEverything: () => activity.list(),", "};"].join("\n");
    expect(sitesIn(src)).toEqual([{ read: "activity.list()", line: 2 }]);
  });

  it("does not count a fold's fallback for a store with no append-aware read", () => {
    const src = [
      "function read(store: HistoryStore) {",
      "  const since = store.since?.bind(store);",
      "  if (!since) return fold(await store.list(id));",
      "  if (since) {",
      "    await advance(since);",
      "  } else {",
      "    replace(await store.list());",
      "  }",
      "}",
    ].join("\n");
    expect(sitesIn(src)).toEqual([]);
  });

  it("does not count the fallback of a fold over two stores, however the guard is spelled", () => {
    const src = [
      "function read(activity: ActivityStore, orderAudit: OrderAuditLog) {",
      "  const since = activity.since?.bind(activity);",
      "  const sinceTags = orderAudit.since?.bind(orderAudit);",
      "  if (!(since && sinceTags)) {",
      "    return fold(await activity.list(id), await orderAudit.list(id));",
      "  }",
      "}",
    ].join("\n");
    expect(sitesIn(src)).toEqual([]);
  });

  it("ignores a read named only in a comment", () => {
    const src = [
      "// config.readHistory?.(id) used to run here",
      "/* history.list(id) */",
      'const url = "https://example.test"; // activity.list()',
    ].join("\n");
    expect(sitesIn(src)).toEqual([]);
  });
});

describe("whole-read scan — the grandfather list only shrinks", () => {
  function fixture(grandfather: unknown, route: string): { status: number; out: string } {
    const root = mkdtempSync(join(tmpdir(), "whole-read-fixture-"));
    try {
      for (const dir of ["src/server", "src/scripts", "src/observatory"]) {
        mkdirSync(join(root, dir), { recursive: true });
      }
      writeFileSync(join(root, "src/server/route.ts"), route);
      writeFileSync(join(root, "src/server/route.spec.ts"), "config.readHistory?.(id);\n");
      writeFileSync(join(root, "src/scripts/cli.ts"), "history.list();\n");
      if (grandfather !== undefined) {
        writeFileSync(join(root, "whole-read-grandfather.json"), JSON.stringify(grandfather));
      }
      return run(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
  const listed = (count: number) => ({
    "src/server/route.ts": { "readHistory()": { count, why: "fixture" } },
  });

  it("passes when every site in scope is listed (specs and non-server scripts are out of scope)", () => {
    const { status, out } = fixture(listed(1), "await config.readHistory?.(id);\n");
    expect(status).toBe(0);
    expect(out).toContain("1 whole read(s)");
  });

  it("fails a site past its listed count as new, naming file, line and what it reads", () => {
    const { status, out } = fixture(listed(1), "config.readHistory(a);\nconfig.readHistory(b);\n");
    expect(status).toBe(1);
    expect(out).toContain(
      "src/server/route.ts:1,2  readHistory() — one participant's every equity",
    );
  });

  it("fails a listed count the code no longer reaches, so the total stays honest", () => {
    const { status, out } = fixture(listed(2), "config.readHistory(a);\n");
    expect(status).toBe(1);
    expect(out).toContain("src/server/route.ts  readHistory(): listed 2, found 1");
  });

  it("exits 2, never a quiet pass, when the grandfather list is missing", () => {
    const { status, out } = fixture(undefined, "config.readHistory(a);\n");
    expect(status).toBe(2);
    expect(out).toContain("whole-read verdict UNKNOWN");
  });
});

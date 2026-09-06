import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eventHorizonCalls } from "../../src/server/research-horizon-calls.js";

/** A disposable docs/research tree: one ledger with all four horizons, one with none. */
function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "research-horizons-"));
  mkdirSync(join(root, "events"));
  writeFileSync(
    join(root, "events", "boj-decision-2026-09-18.md"),
    "# BoJ — ledger\n\n**Last assessed:** 2026-09-05\n\n## At a glance\n\n**TL;DR.** Stand aside.\n\n" +
      "| Horizon | Call | Confidence | Why | Proves it wrong |\n|---|---|---|---|---|\n" +
      "| Today | **Stand aside** — nothing here is ours to hold | High | no channel | a 2% move |\n" +
      "| This week | Stand aside; the week's fork is CPI 09-11 | High | behind the Fed | odds under 50% |\n" +
      "| This month | Do not read the open as the verdict | Medium | opex confound | USD/JPY ±2% |\n" +
      "| This quarter | Never size a US position to this | High | second-order | rate above 1.25% |\n\n" +
      "## Initial research\n\nBody.\n",
  );
  writeFileSync(
    join(root, "events", "quiet-2026-10-01.md"),
    "# Quiet — ledger\n\n**Last assessed:** 2026-09-05\n\n## Initial research\n\nNo header.\n",
  );
  writeFileSync(join(root, "events", "TEMPLATE.md"), "# Template\n");
  return root;
}

describe("eventHorizonCalls", () => {
  it("maps each researched event to every horizon row its ledger states", () => {
    const calls = eventHorizonCalls(fixtureRoot());
    const boj = calls.get("boj-decision-2026-09-18");
    expect(boj?.today?.call).toBe("Stand aside — nothing here is ours to hold");
    expect(boj?.week).toEqual({
      call: "Stand aside; the week's fork is CPI 09-11",
      horizon: "This week",
      confidence: "High",
    });
    expect(boj?.month?.confidence).toBe("Medium");
    expect(boj?.quarter?.horizon).toBe("This quarter");
  });

  it("leaves out a ledger with no decision header and never lists the template", () => {
    const calls = eventHorizonCalls(fixtureRoot());
    expect(calls.has("quiet-2026-10-01")).toBe(false);
    expect(calls.has("TEMPLATE")).toBe(false);
    expect(calls.size).toBe(1);
  });
});

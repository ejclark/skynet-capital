import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ledgerDigests } from "../../src/server/research-horizon-calls.js";

/** A disposable docs/research tree: one ledger with all four horizons, one with none. */
function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "research-horizons-"));
  mkdirSync(join(root, "events"));
  writeFileSync(
    join(root, "events", "boj-decision-2026-09-18.md"),
    "# BoJ — ledger\n\n**Last assessed:** 2026-09-05\n" +
      '<!-- probe-ref: {"symbols":{},"vix":14.5,"adjacentIds":["fomc-2026-09-16","opex-2026-09-18"],"screenStreak":0} -->\n\n' +
      "## At a glance\n\n**TL;DR.** **Stand aside** — see [the Fed](fomc-2026-09-16.md); the yen\nbarely flinched in June.\n\n" +
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

describe("ledgerDigests", () => {
  it("maps each researched event to every horizon row its ledger states", () => {
    const calls = ledgerDigests(fixtureRoot());
    const boj = calls.get("boj-decision-2026-09-18")?.horizons;
    expect(boj?.today?.call).toBe("Stand aside — nothing here is ours to hold");
    expect(boj?.week).toEqual({
      call: "Stand aside; the week's fork is CPI 09-11",
      horizon: "This week",
      confidence: "High",
    });
    expect(boj?.month?.confidence).toBe("Medium");
    expect(boj?.quarter?.horizon).toBe("This quarter");
  });

  it("carries the TL;DR as plain text and the probe-ref's adjacent ids", () => {
    const boj = ledgerDigests(fixtureRoot()).get("boj-decision-2026-09-18");
    expect(boj?.tldr).toBe("Stand aside — see the Fed; the yen barely flinched in June.");
    expect(boj?.adjacent).toEqual(["fomc-2026-09-16", "opex-2026-09-18"]);
  });

  it("leaves out a ledger with no decision header and never lists the template", () => {
    const calls = ledgerDigests(fixtureRoot());
    expect(calls.has("quiet-2026-10-01")).toBe(false);
    expect(calls.has("TEMPLATE")).toBe(false);
    expect(calls.size).toBe(1);
  });
});

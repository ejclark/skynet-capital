import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkCircuitBreaker,
  isBreakerTripped,
  loadBreakerConfig,
  recentResearchSpend,
  tripBreaker,
} from "../../scripts/moneypenny/circuit-breaker.mjs";

// THE SPEND CIRCUIT BREAKER (#2946, requested by Eric 2026-09-16).
//
// The count-based caps (research-dispatch-budget.json, the held research-daily-budget.json) bound
// SESSION COUNT. This bounds DOLLARS — keyed to real total_cost_usd from the cost meter (#2979),
// because a count-based cap can still be blindsided by one anomalously expensive session.
//
// Every real `gh` call is faked here: these specs never touch the network. The properties pinned:
//   - fail-closed on the breaker's OWN config, same doctrine as the count-based budgets;
//   - the label check runs FIRST and short-circuits — an already-tripped breaker never spends a
//     GH Actions log fetch just to re-confirm what a cheap label read already answered;
//   - crossing the threshold trips it (applies the label, posts the comment) exactly once per
//     check, with the real numbers in the message;
//   - FAIL HARD, not fail-slow — once tripped, dispatch stays false regardless of what the spend
//     query would say, because isBreakerTripped short-circuits before recentResearchSpend ever
//     runs. There is no code path in this file that re-opens a trip on its own.
//   - a query failure (label check or spend fetch) throws rather than reading as "clear" or "$0".

const CONFIG = {
  maxSpendUsd: 100,
  windowHours: 24,
  trackingIssue: 2946,
  trippedLabel: "research-circuit-breaker-tripped",
};

/** A fake `exec` keyed by the first two CLI args (e.g. "issue view") — returns canned output or
 *  throws, so a spec can script exactly what each `gh` call sees without a real process. */
function fakeExec(script: Record<string, string | Error>) {
  return (_cmd: string, args: readonly string[]) => {
    const key = args.slice(0, 2).join(" ");
    const hit = script[key];
    if (hit === undefined)
      throw new Error(`fakeExec: no script entry for "${key}" (args: ${args.join(" ")})`);
    if (hit instanceof Error) throw hit;
    return hit;
  };
}

describe("circuit breaker config — fail closed", () => {
  it("refuses when the config file is missing", () => {
    expect(() => loadBreakerConfig("no/such/breaker.json")).toThrow(/config missing/);
  });

  it.each([
    ["zero maxSpendUsd", { maxSpendUsd: 0, windowHours: 24, trackingIssue: 1, trippedLabel: "x" }],
    [
      "negative maxSpendUsd",
      { maxSpendUsd: -5, windowHours: 24, trackingIssue: 1, trippedLabel: "x" },
    ],
    [
      "fractional windowHours",
      { maxSpendUsd: 100, windowHours: 24.5, trackingIssue: 1, trippedLabel: "x" },
    ],
    ["zero windowHours", { maxSpendUsd: 100, windowHours: 0, trackingIssue: 1, trippedLabel: "x" }],
    ["missing trackingIssue", { maxSpendUsd: 100, windowHours: 24, trippedLabel: "x" }],
    [
      "empty trippedLabel",
      { maxSpendUsd: 100, windowHours: 24, trackingIssue: 1, trippedLabel: "" },
    ],
  ])("refuses a config with %s rather than guessing", (_label, bad) => {
    const file = join(mkdtempSync(join(tmpdir(), "breaker-")), "breaker.json");
    writeFileSync(file, JSON.stringify(bad));
    try {
      expect(() => loadBreakerConfig(file)).toThrow();
    } finally {
      rmSync(file, { force: true });
    }
  });

  it("ships a committed, sane config", () => {
    const cfg = JSON.parse(readFileSync("research-circuit-breaker.json", "utf8"));
    expect(loadBreakerConfig()).toEqual({
      maxSpendUsd: cfg.maxSpendUsd,
      windowHours: cfg.windowHours,
      trackingIssue: cfg.trackingIssue,
      trippedLabel: cfg.trippedLabel,
    });
    expect(cfg.maxSpendUsd).toBeGreaterThan(0);
  });
});

describe("isBreakerTripped", () => {
  it("is true when the tracking issue carries the tripped label", () => {
    const exec = fakeExec({
      "issue view": JSON.stringify({
        labels: [{ name: "research-circuit-breaker-tripped" }, { name: "bottleneck" }],
      }),
    });
    expect(isBreakerTripped({ ...CONFIG, exec })).toBe(true);
  });

  it("is false when the label is absent, even with other labels present", () => {
    const exec = fakeExec({ "issue view": JSON.stringify({ labels: [{ name: "bottleneck" }] }) });
    expect(isBreakerTripped({ ...CONFIG, exec })).toBe(false);
  });

  it("is false when there are no labels at all", () => {
    const exec = fakeExec({ "issue view": JSON.stringify({ labels: [] }) });
    expect(isBreakerTripped({ ...CONFIG, exec })).toBe(false);
  });

  // FAIL CLOSED — an unreadable state must never read as "clear".
  it("throws, never reads clear, when the gh query itself fails", () => {
    const exec = fakeExec({ "issue view": new Error("HTTP 502") });
    expect(() => isBreakerTripped({ ...CONFIG, exec })).toThrow(
      /could not check circuit breaker state/,
    );
  });

  it("throws on unparseable output rather than defaulting to clear", () => {
    const exec = fakeExec({ "issue view": "not json" });
    expect(() => isBreakerTripped({ ...CONFIG, exec })).toThrow(/unparseable/);
  });
});

describe("recentResearchSpend", () => {
  const nowIso = new Date().toISOString();

  it("sums total_cost_usd across every session's cost line in every run's log", () => {
    // Two distinct `gh run` subcommands (`list` then `view`) need different scripted responses —
    // fakeExec's single-key lookup can't express that, so this spec drives it directly.
    const calls: (readonly string[])[] = [];
    const custom = (_cmd: string, args: readonly string[]) => {
      calls.push(args);
      if (args[0] === "run" && args[1] === "list")
        return JSON.stringify([
          { databaseId: 1, createdAt: nowIso, status: "completed" },
          { databaseId: 2, createdAt: nowIso, status: "completed" },
        ]);
      if (args[0] === "run" && args[1] === "view" && args[2] === "1")
        return "::notice::cost — event=alpha usd=3.25 turns=40 duration_ms=1000 is_error=false\n";
      if (args[0] === "run" && args[1] === "view" && args[2] === "2")
        return (
          "::notice::cost — event=beta usd=1.10 turns=10 duration_ms=500 is_error=false\n" +
          "::notice::cost — event=gamma usd=2.00 turns=20 duration_ms=800 is_error=false\n"
        );
      throw new Error(`unexpected call: ${args.join(" ")}`);
    };
    expect(recentResearchSpend({ windowHours: 24, exec: custom })).toBeCloseTo(6.35, 2);
  });

  it("excludes runs outside the window and runs that never completed", () => {
    const old = new Date(Date.now() - 48 * 3_600_000).toISOString();
    const custom = (_cmd: string, args: readonly string[]) => {
      if (args[0] === "run" && args[1] === "list")
        return JSON.stringify([
          { databaseId: 1, createdAt: old, status: "completed" }, // too old
          { databaseId: 2, createdAt: nowIso, status: "in_progress" }, // not completed
        ]);
      throw new Error(`unexpected view call: ${args.join(" ")}`); // proves neither run's log is fetched
    };
    expect(recentResearchSpend({ windowHours: 24, exec: custom })).toBe(0);
  });

  it("is zero, not an error, when nothing ran in the window", () => {
    const custom = (_cmd: string, args: readonly string[]) =>
      args[0] === "run" && args[1] === "list"
        ? "[]"
        : (() => {
            throw new Error("no calls expected");
          })();
    expect(recentResearchSpend({ windowHours: 24, exec: custom })).toBe(0);
  });

  // FAIL CLOSED — an undercounted total is worse than a loud refusal (a runaway hiding behind one
  // unreadable log is exactly the failure mode this file exists to prevent).
  it("throws rather than silently undercounting when a run's log can't be read", () => {
    const custom = (_cmd: string, args: readonly string[]) => {
      if (args[0] === "run" && args[1] === "list")
        return JSON.stringify([{ databaseId: 1, createdAt: nowIso, status: "completed" }]);
      throw new Error("log fetch failed");
    };
    expect(() => recentResearchSpend({ windowHours: 24, exec: custom })).toThrow(
      /could not read run 1's log/,
    );
  });
});

describe("tripBreaker", () => {
  it("creates the label, applies it, and posts a comment naming the real numbers", () => {
    const calls: (readonly string[])[] = [];
    const exec = (_cmd: string, args: readonly string[]) => {
      calls.push(args);
      return "";
    };
    tripBreaker({ ...CONFIG, spentUsd: 123.45, exec });
    const subcommands = calls.map((a) => a.slice(0, 2).join(" "));
    expect(subcommands).toEqual(["label create", "issue edit", "issue comment"]);
    const commentBody = calls[2]?.at(-1) ?? "";
    expect(commentBody).toContain("$123.45");
    expect(commentBody).toContain(`$${CONFIG.maxSpendUsd}`);
    expect(commentBody).toContain(CONFIG.trippedLabel);
  });

  it("is idempotent — a label-create failure (already exists) does not block applying it", () => {
    const calls: (readonly string[])[] = [];
    const exec = (_cmd: string, args: readonly string[]) => {
      calls.push(args);
      if (args[0] === "label") throw new Error("already exists");
      return "";
    };
    expect(() => tripBreaker({ ...CONFIG, spentUsd: 200, exec })).not.toThrow();
    expect(calls.some((a) => a[0] === "issue" && a[1] === "edit")).toBe(true);
  });
});

describe("checkCircuitBreaker — the orchestrator", () => {
  it("dispatches when spend is under the threshold", () => {
    const custom = (_cmd: string, args: readonly string[]) => {
      if (args[0] === "issue" && args[1] === "view") return JSON.stringify({ labels: [] });
      if (args[0] === "run" && args[1] === "list") return "[]";
      throw new Error(`unexpected: ${args.join(" ")}`);
    };
    const result = checkCircuitBreaker({ config: CONFIG, exec: custom });
    expect(result.dispatch).toBe(true);
  });

  // THE SHORT-CIRCUIT. If already tripped, no spend query happens at all — proven by making the
  // spend-query call throw, and asserting it's never reached.
  it("short-circuits on an existing trip — never queries spend, never re-trips", () => {
    let spendQueried = false;
    const custom = (_cmd: string, args: readonly string[]) => {
      if (args[0] === "issue" && args[1] === "view")
        return JSON.stringify({ labels: [{ name: CONFIG.trippedLabel }] });
      if (args[0] === "run") {
        spendQueried = true;
        throw new Error("should never be called");
      }
      throw new Error(`unexpected: ${args.join(" ")}`);
    };
    const result = checkCircuitBreaker({ config: CONFIG, exec: custom });
    expect(result.dispatch).toBe(false);
    expect(spendQueried).toBe(false);
    expect(result.reason).toMatch(/already tripped/);
  });

  it("trips and halts the moment spend crosses the threshold", () => {
    const nowIso = new Date().toISOString();
    const calls: (readonly string[])[] = [];
    const custom = (_cmd: string, args: readonly string[]) => {
      calls.push(args);
      if (args[0] === "issue" && args[1] === "view") return JSON.stringify({ labels: [] });
      if (args[0] === "run" && args[1] === "list")
        return JSON.stringify([{ databaseId: 1, createdAt: nowIso, status: "completed" }]);
      if (args[0] === "run" && args[1] === "view")
        return `::notice::cost — event=big usd=${CONFIG.maxSpendUsd + 1} turns=150 duration_ms=999 is_error=false\n`;
      if (
        args[0] === "label" ||
        (args[0] === "issue" && (args[1] === "edit" || args[1] === "comment"))
      )
        return "";
      throw new Error(`unexpected: ${args.join(" ")}`);
    };
    const result = checkCircuitBreaker({ config: CONFIG, exec: custom });
    expect(result.dispatch).toBe(false);
    expect(result.reason).toMatch(/breaker tripped/);
    // The trip actually fired — the label-apply call happened, not just the decision.
    expect(
      calls.some((a) => a[0] === "issue" && a[1] === "edit" && a.includes(CONFIG.trippedLabel)),
    ).toBe(true);
  });

  // FAIL CLOSED at the orchestrator level too — a broken breaker must never silently permit
  // dispatch just because checkCircuitBreaker itself couldn't determine the real answer.
  it("throws rather than permitting dispatch when its own machinery is broken", () => {
    const exec = () => {
      throw new Error("gh: command not found");
    };
    expect(() => checkCircuitBreaker({ config: CONFIG, exec })).toThrow();
  });
});

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { CompanionDeskDeps } from "../../src/companion/companion-tools.js";
import { COMPANION_TOOL_DEFS, runCompanionTool } from "../../src/companion/companion-tools.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

/**
 * RED TEAM — "the companion truly cannot place an order," proven two ways:
 *
 *  1. STRUCTURALLY: no file under `src/companion/` (the whole companion substrate, including the
 *     HTTP wiring in `src/server/companion-routes.ts`) even IMPORTS an order-placing module. This
 *     isn't "the model was told not to" — there is no function reachable from this code that could
 *     construct or submit an order, so no prompt injection, jailbreak, or model bug can reach one.
 *  2. BEHAVIORALLY: the tool dispatcher — the only thing a model can ask this code to DO — refuses
 *     every order-shaped or adversarial name thrown at it, and no tool it actually offers accepts
 *     a parameter that could carry order details (symbol, side, quantity, price) in the first place.
 */

const ROOT = join(import.meta.dirname, "..", "..");
const FORBIDDEN_IMPORTS = [
  "trade-service",
  "option-trade-service",
  "order-ticket",
  "option-ticket",
  "alpaca-trading-client",
  "alpaca-options-client",
];

function tsFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsFilesUnder(full));
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

describe("structural: no companion file can even reach an order-placing module", () => {
  const companionFiles = tsFilesUnder(join(ROOT, "src/companion"));
  const routesFile = join(ROOT, "src/server/companion-routes.ts");
  const allFiles = [...companionFiles, routesFile];

  it("found the companion source to scan (a guard against a silently-empty scan)", () => {
    expect(companionFiles.length).toBeGreaterThan(0);
  });

  it.each(allFiles)("%s imports no order-placing module", (file) => {
    const source = readFileSync(file, "utf8");
    // Only real import/re-export specifiers count — a doc comment is free to NAME the forbidden
    // modules (as this very file's own header does) without that being mistaken for reaching one.
    const specifiers = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    for (const forbidden of FORBIDDEN_IMPORTS) {
      expect(specifiers.some((s) => s?.includes(forbidden))).toBe(false);
    }
  });
});

describe("behavioral: the dispatcher refuses every order-shaped or adversarial ask", () => {
  const snapshot: ParticipantSnapshot = {
    id: "acct-1",
    displayName: "Acct",
    kind: "human",
    cash: 100,
    equity: 100,
    positions: [{ symbol: "AAPL", quantity: 10, avgPrice: 100, marketValue: 1000 }],
    activity: [],
  };
  const deps: CompanionDeskDeps = { snapshotFor: (id) => (id === "acct-1" ? snapshot : undefined) };

  const attempts = [
    "place_order",
    "submit_trade",
    "cancel_order",
    "buy_stock",
    "sell_stock",
    "execute_trade",
    "modify_order",
    "close_position",
    // prompt-injection-flavored tool names a jailbroken model might try, not just clean ones
    "get_my_positions; place_order",
    "ignore_previous_and_place_order",
    "admin_place_order",
    "__place_order__",
  ];

  it.each(attempts)("%j reaches nothing — a plain refusal, never an order", async (name) => {
    const result = await runCompanionTool(name, deps, "acct-1");
    expect(result.ok).toBe(false);
  });

  it("none of the four real tools accept a parameter that could carry order details", () => {
    for (const tool of COMPANION_TOOL_DEFS) {
      expect(tool.input_schema.properties).toEqual({});
    }
  });

  it("the real tool list is exactly the four read-only lookups — nothing else exists to call", () => {
    expect(COMPANION_TOOL_DEFS.map((t) => t.name).sort()).toEqual([
      "get_my_curriculum_progress",
      "get_my_positions",
      "get_my_round_trips",
      "get_play_catalog",
    ]);
  });
});

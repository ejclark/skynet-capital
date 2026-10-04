import { readFileSync } from "node:fs";

// Progression-evidence gate — the ladder's evidence is OURS, never the broker's.
//
// #3407's P4 spike (study row 27) asked whether progression could re-derive its earned rungs "from
// a snapshot rather than live fills", because thinkorswim's paperMoney reset wipes an account's
// balances, positions and order history, and the fear was that a reset control would wipe a
// member's earned ladder with it. The answer the code gives is better than the question assumed:
// nothing in the ladder reads the broker at all. `readFills` is wired to our own append-only JSONL
// journal (`SKYNET_ACTIVITY_DIR`, pinned to the volume by volume-persistence.spec.ts) and
// `readTags` to our own order-audit log. A broker-side reset can erase everything Alpaca holds and
// cannot touch either file — so the rungs survive a reset for free, with no snapshot mechanism to
// build.
//
// That property is load-bearing AND invisible, which is why it needs a gate. A future refactor that
// "simplified" either read into a `client.listOrders()` call would still pass every progression
// spec — they all inject fills directly — and would silently make every member's earned ladder as
// erasable as their broker history, including by the reset our own onboarding copy teaches them to
// perform (`companion-help.ts`). This gate is the only thing that would notice.
//
// Tested in BOTH directions, per volume-persistence.spec.ts's banked lesson: the scan must actually
// FIND the wiring (a gate that passes because it discovered nothing is the failure mode this repo
// has caught before), and what it finds must be ours.

const SERVICE = "src/server/progression-service.ts";
const STORE = "src/server/progression-store.ts";

/**
 * BOTH hops from the durable stores to the service, because the wiring is a pass-through and
 * pinning only one end leaves the other free to substitute a broker read: `serve-dashboard.ts`
 * hands `activity.list` / `orderAudit.list` to `setupCompanion`, and `dashboard-companion.ts` is
 * where `createProgressionService` is actually constructed. Pinning the outer hop alone was this
 * gate's own first bug (caught in review before it shipped) — swapping `deps.readFills` for a
 * client read in the inner hop would have left it green.
 */
const WIRING: ReadonlyArray<{ file: string; patterns: readonly RegExp[] }> = [
  {
    file: "src/scripts/serve-dashboard.ts",
    patterns: [
      /readFills:\s*\(id\)\s*=>\s*activity\.list\(id\)/,
      /readTags:\s*\(id\)\s*=>\s*orderAudit\.list\(id\)/,
    ],
  },
  {
    file: "src/scripts/dashboard-companion.ts",
    patterns: [
      /createProgressionService\(\{/,
      /readFills:\s*deps\.readFills/,
      /readTags:\s*deps\.readTags/,
    ],
  },
];

/** The files that turn ledgers into earned rungs — the whole derivation chain. */
const DERIVATION = [
  "src/domain/progression.ts",
  SERVICE,
  "src/server/progression-service-support.ts",
];

/** Everything `ProgressionRecord` is allowed to hold: a preference, and what has been shown or
 *  passed. Never the earned truth, which re-derives from the ledgers on every read. */
const STORED_PREFERENCES = [
  "acknowledged",
  "comprehension",
  "graduated",
  "since",
  "trainingWheels",
  "updatedAt",
];

function read(path: string): string {
  return readFileSync(path, "utf8");
}

/** The field names declared in `interface <name> {` — brace-counted, so a nested shape can't
 *  truncate the block and quietly shrink what this gate checks. */
function interfaceFields(source: string, name: string): string[] {
  const start = source.indexOf(`interface ${name} {`);
  if (start < 0) return [];
  let depth = 0;
  let end = start;
  for (let i = source.indexOf("{", start); i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
  const block = source.slice(start, end);
  return [...block.matchAll(/^\s*readonly\s+([A-Za-z0-9_]+)\??\s*:/gm)].map((m) => m[1] as string);
}

/** Every way a module can be pulled in, as `{ statement, from }`: a static import, a re-export, and
 *  a dynamic `import("…")`. All three are collected because only the first has a type-only form —
 *  the other two always bring the module in at runtime. */
function moduleReferences(source: string): Array<{ statement: string; from: string }> {
  const refs: Array<{ statement: string; from: string }> = [];
  for (const m of source.matchAll(/^\s*(import|export)\s[^;]*?from\s*"([^"]+)";/gms)) {
    refs.push({ statement: (m[0] as string).trim(), from: m[2] as string });
  }
  for (const m of source.matchAll(/import\s*\(\s*"([^"]+)"\s*\)/g)) {
    refs.push({ statement: (m[0] as string).trim(), from: m[1] as string });
  }
  return refs;
}

/**
 * Whether a reference brings in types only. Both house spellings count — the statement-level
 * `import type { X } from "…"` and the inline `import { type X } from "…"` (the form at
 * `src/alpaca/alpaca-options-client.ts:2`) — because a type erases at compile time and cannot call
 * anything. A re-export or a dynamic import never qualifies.
 */
function typeOnly({ statement, from }: { statement: string; from: string }): boolean {
  if (!statement.startsWith("import")) return false;
  if (statement.includes("import(")) return false;
  if (/^import\s+type\s/.test(statement)) return true;
  const braces = /\{([^}]*)\}/.exec(statement);
  if (!braces) return false;
  const bindings = (braces[1] as string)
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);
  // A bare `import defaultExport from` has no braces to inspect and a `{ X }` beside a default
  // still brings the module in — so an empty binding list is never type-only either.
  return bindings.length > 0 && bindings.every((b) => /^type\s/.test(b)) && !from.endsWith(".css");
}

describe("progression evidence", () => {
  it.each(WIRING.map((w) => w.file))(
    "%s wires the ladder's ledgers to our own stores, not to a broker read",
    (file) => {
      const source = read(file);
      const entry = WIRING.find((w) => w.file === file);
      for (const pattern of entry?.patterns ?? []) {
        // Anchored on the live wiring rather than on a test fake: the specs inject fills, so only
        // these two files can answer "where does production actually get the evidence from".
        expect(
          pattern.test(source),
          `${file} no longer matches ${pattern}. Earned rungs must come from our own durable ` +
            `ledgers — if this wiring moved, re-point this gate at its new home rather than ` +
            `deleting the check (#3407 P4 spike, study row 27).`,
        ).toBe(true);
      }
    },
  );

  it("declares a deps surface that cannot reach the broker", () => {
    const fields = interfaceFields(read(SERVICE), "ProgressionServiceDeps");
    // The scan must not go blind — if the interface is renamed or restructured, fail loudly here
    // rather than pass on an empty field list.
    expect(fields).toContain("readFills");
    expect(fields).toContain("readTags");
    for (const field of fields) {
      expect(
        /client|broker|alpaca/i.test(field),
        `ProgressionServiceDeps.${field} looks like a broker reader. Earned rungs must derive from ` +
          `our own durable ledgers only — a broker-side account reset would otherwise erase a ` +
          `member's ladder (#3407 P4 spike, study row 27).`,
      ).toBe(false);
    }
  });

  it("never pulls the broker client into the derivation chain at runtime", () => {
    for (const path of DERIVATION) {
      const refs = moduleReferences(read(path));
      // The scan must not go blind: these files do import things, so an empty list means the
      // matcher broke rather than that the chain came clean.
      expect(
        refs.length,
        `${path}: no module references found — this scan has gone blind.`,
      ).toBeGreaterThan(0);
      for (const ref of refs) {
        if (!/alpaca/i.test(ref.from)) continue;
        // Type-only payload shapes are fine anywhere; what must never appear in the files that
        // decide what is earned is a module that can CALL the broker.
        expect(
          typeOnly(ref),
          `${path} pulls in "${ref.from}" at runtime. Milestone derivation reads our own ledgers ` +
            `only — a type-only import of a broker payload shape is fine, a value import is not.`,
        ).toBe(true);
      }
    }
  });

  it("stores preferences only — never the earned truth itself", () => {
    const fields = interfaceFields(read(STORE), "ProgressionRecord");
    // The whole reason a reset cannot cost a member their rungs is that there is no accumulated
    // progress state anywhere: `deriveEarned` re-runs over the ledgers on every read. This store
    // holds what cannot be derived and must never start holding the answer.
    expect(
      fields.sort(),
      `ProgressionRecord's fields changed. Adding a PREFERENCE (something no ledger can derive) ` +
        `is fine — add it to STORED_PREFERENCES above. Storing EARNED TRUTH is not: it would give ` +
        `the ladder accumulated state to drift, and make a member's rungs losable (#3407 P4 spike).`,
    ).toEqual([...STORED_PREFERENCES].sort());
  });
});

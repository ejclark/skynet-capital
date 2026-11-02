import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";
import { resolveSteering } from "../../src/playbooks/conviction-steering.js";
import { FENCE_CALLS, fenceCall, PAIR_RULE_KINDS } from "../../src/playbooks/fence-studies.js";
import { findPlaybook } from "../../src/playbooks/registry.js";
import { withOwnRules } from "../../src/playbooks/steered-playbook.js";

/** #6598 slice 3 — the studies' calls on each fence a view puts on a pair, which
 *  `research:refine` reads before it adopts a passed claim's fence. */

describe("the calls table", () => {
  it.each(FENCE_CALLS.map((c) => [`${c.pair} ${c.fence}`, c] as const))(
    "%s matches its study's call-sheet row: the call, the confidence and the falsifier's day",
    (_, call) => {
      const path = join(process.cwd(), call.study);
      expect(existsSync(path)).toBe(true);
      const row = readFileSync(path, "utf8")
        .split("\n")
        .find((line) => line.startsWith(`| ${call.question} |`));
      expect(row).toBeDefined();
      expect(row).toContain(`| **${call.words}** | ${call.confidence} |`);
      expect(row).toContain(`**${call.falsifierOn}**`);
    },
  );

  // The done line of #6598 slice 3: a pass key on either AI-dip pair names its study. A later
  // view's new fence is refused for want of one until a study judges it, which is not a red build.
  it("judges every fence the AI-dip view puts on CRWV-WHEEL and CRWV-LONG-CALL", () => {
    const unjudged = (AI_DIP_2026_10.narrowings ?? []).flatMap((entry) =>
      entry.narrow
        .filter((n) => !fenceCall(entry.pair, n.kind))
        .map((n) => `${entry.pair} ${n.kind}`),
    );
    expect(unjudged).toEqual([]);
  });

  it("states each adopt call's rule as a date-free kind inside its playbook's bounds", () => {
    for (const call of FENCE_CALLS) {
      if (call.call !== "adopt") continue;
      expect(PAIR_RULE_KINDS).toContain(call.rule.kind);
      const bounds = findPlaybook(call.pair)?.steerable?.bounds;
      expect(bounds).toBeDefined();
      if (bounds) expect(resolveSteering([call.rule], bounds, [])).toMatchObject({ ok: true });
    }
  });

  it("has one call per pair and fence", () => {
    const keys = FENCE_CALLS.map((c) => `${c.pair}/${c.fence}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("withOwnRules — a pair's own rules and a view's fences as one", () => {
  it("keeps one fence per setting, the narrower, and says which is the pair's own", () => {
    expect(
      withOwnRules(
        [
          { kind: "quiet", sessionsAfterPrint: 6 },
          { kind: "contracts", max: 3 },
          { kind: "dte", min: 14, max: 45 },
        ],
        [
          { kind: "quiet", sessionsAfterPrint: 2 },
          { kind: "contracts", max: 1 },
          { kind: "dte", min: 21 },
          { kind: "expiry-from", day: "2027-03-18" },
        ],
      ),
    ).toEqual({
      narrow: [
        { kind: "quiet", sessionsAfterPrint: 6 },
        { kind: "contracts", max: 1 },
        { kind: "dte", min: 21, max: 45 },
        { kind: "expiry-from", day: "2027-03-18" },
      ],
      own: [true, false, false, false],
    });
  });

  it("adds a rule the view does not fence", () => {
    expect(withOwnRules([{ kind: "quiet", sessionsAfterPrint: 6 }], [])).toEqual({
      narrow: [{ kind: "quiet", sessionsAfterPrint: 6 }],
      own: [true],
    });
  });
});

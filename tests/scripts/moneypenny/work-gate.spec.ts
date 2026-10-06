import { runCli, workGate } from "../../../scripts/moneypenny/work-gate.mjs";
import type { WorkMode } from "../../../scripts/moneypenny/work-mode.d.mts";

// THE ONE QUESTION A LANE ASKS BEFORE IT DISPATCHES (#3960 slice 2, criterion 1): "may I, and how
// much?" Two controls can say no — the work spigot's dial and the #2946 spend breaker — and the
// criterion names both, so these specs pin the composition rather than either half:
//   - either one saying no is a refusal, and the reason says WHICH, because they are cleared
//     differently (a dial is flipped; a tripped breaker waits for a human);
//   - the breaker is asked FIRST, so a tripped breaker is never reported as a mere `halt`;
//   - the caps ride through on a cleared gate, so a caller needs one call, not two;
//   - fail-closed splits by control: an unreadable BREAKER refuses, while an unreadable DIAL is
//     already conserve-plus-warning upstream and must still dispatch (work-mode.mjs's doctrine);
//   - the CLI's exit code is the verdict (0 cleared / 3 refused), so a skill never parses JSON.
// Nothing here touches the network: both reads are injected.

const mode = (position: string, extra: Partial<WorkMode> = {}): WorkMode =>
  ({
    position,
    until: null,
    caps: {
      inFlightCap: 3,
      researchPerTick: 6,
      governorDispatches: 4,
      grindWidth: 200,
      continuationsPerDay: 3,
      startedPlanCap: 4,
    },
    reason: `set to ${position}`,
    ...extra,
  }) as WorkMode;

const gateWith = (position: string, breaker: boolean | (() => boolean), extra = {}) =>
  workGate({
    readMode: () => mode(position, extra),
    readBreaker: typeof breaker === "function" ? breaker : () => breaker,
  });

describe("the work gate — the dial and the spend breaker in one answer", () => {
  it("clears a normal dial with an untripped breaker, and hands back the caps", () => {
    const g = gateWith("normal", false);
    expect(g.dispatch).toBe(true);
    expect(g.breakerTripped).toBe(false);
    expect(g.reason).toBe("cleared: work-mode is normal");
    expect(g.caps).toEqual({
      inFlightCap: 3,
      researchPerTick: 6,
      governorDispatches: 4,
      grindWidth: 200,
      continuationsPerDay: 3,
      startedPlanCap: 4,
    });
  });

  it("clears conserve and surge too — they are allowances, not stops", () => {
    expect(gateWith("conserve", false).dispatch).toBe(true);
    expect(gateWith("surge", false).dispatch).toBe(true);
  });

  it("refuses under halt, and says it was the dial", () => {
    const g = gateWith("halt", false);
    expect(g.dispatch).toBe(false);
    expect(g.reason).toContain("work-mode is halt");
  });

  // Order matters for the REASON, not the verdict: both refuse, but a tripped breaker needs a
  // human and a halt needs a label, so a lane reporting the wrong one sends its reader nowhere.
  it("names the breaker, not the dial, when both would refuse", () => {
    const g = gateWith("halt", true);
    expect(g.dispatch).toBe(false);
    expect(g.breakerTripped).toBe(true);
    expect(g.reason).toContain("spend breaker is tripped");
  });

  it("refuses a tripped breaker even while the dial reads surge", () => {
    const g = gateWith("surge", true);
    expect(g.dispatch).toBe(false);
    expect(g.reason).toContain("spend breaker is tripped");
  });

  it("refuses when the breaker's own state is unreadable — broken never reads as clear", () => {
    const g = gateWith("normal", () => {
      throw new Error("gh: not found");
    });
    expect(g.dispatch).toBe(false);
    expect(g.breakerTripped).toBe(true);
    expect(g.reason).toContain("unreadable");
    expect(g.reason).toContain("gh: not found");
  });

  // The opposite answer, deliberately: work-mode.mjs turns an unreadable dial into conserve plus a
  // warning rather than throwing, because every lane reads the dial and a GitHub blip must not
  // halt the repo. The gate carries that warning through and still dispatches.
  it("dispatches on an unreadable dial, carrying its warning", () => {
    const g = gateWith("conserve", false, { warning: "work-mode: could not read issue #4153" });
    expect(g.dispatch).toBe(true);
    expect(g.warning).toContain("could not read issue");
  });
});

describe("the gate's CLI — the exit code is the verdict", () => {
  const run = (g: Partial<ReturnType<typeof workGate>>) => {
    const out: string[] = [];
    const err: string[] = [];
    const code = runCli({
      gate: () => g as ReturnType<typeof workGate>,
      print: (l) => out.push(l),
      printErr: (l) => err.push(l),
    });
    return { code, out: out.join("\n"), err: err.join("\n") };
  };

  it("exits 0 and prints the gate as JSON on stdout when cleared", () => {
    const { code, out, err } = run({
      dispatch: true,
      position: "normal",
      until: null,
      caps: {
        inFlightCap: 3,
        researchPerTick: 6,
        governorDispatches: 4,
        grindWidth: 200,
        continuationsPerDay: 3,
        startedPlanCap: 4,
      },
      breakerTripped: false,
      reason: "cleared: work-mode is normal",
    });
    expect(code).toBe(0);
    expect(JSON.parse(out).caps.governorDispatches).toBe(4);
    expect(err).toContain("::notice::work-mode=normal");
    expect(err).not.toContain("::warning::");
  });

  it("exits 3 and warns with the reason when refused", () => {
    const { code, err } = run({
      dispatch: false,
      position: "halt",
      until: "2026-10-05",
      caps: {
        inFlightCap: 0,
        researchPerTick: 0,
        governorDispatches: 0,
        grindWidth: 0,
        continuationsPerDay: 0,
        startedPlanCap: 0,
      },
      breakerTripped: false,
      reason: "refused: work-mode is halt",
    });
    expect(code).toBe(3);
    expect(err).toContain("::notice::work-mode=halt (until 2026-10-05)");
    expect(err).toContain("::warning::refused: work-mode is halt");
  });
});

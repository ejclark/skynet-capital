import type { ControlsState } from "../../src/autonomous/bot-controls.js";
import type { Persona } from "../../src/personas/persona.js";
import {
  buildTuning,
  gateBuild,
  HARDCORE_COOLDOWN_MS,
  watchHardcore,
} from "../../src/scripts/autonomous-hardcore-live.js";

const state = (bots: ControlsState["bots"]): ControlsState => ({ bots });

function harness(
  opts: { initial?: string[]; env?: string[]; ids?: string[]; wanted?: "live" | "observe" } = {},
) {
  const applied: Array<{ id: string; persona: Persona; tuning: unknown }> = [];
  const logs: string[] = [];
  const warns: string[] = [];
  const gates: Array<{ id: string; ready: boolean }> = [];
  let failApply = false;
  const poll = watchHardcore({
    ids: opts.ids ?? ["sauron", "day-trader"],
    envIds: new Set(opts.env ?? []),
    initial: new Set(opts.initial ?? []),
    wantedMode: () => opts.wanted ?? "live",
    report: (verdict) => gates.push({ id: verdict.id, ready: verdict.ready }),
    apply: (id, persona, tuning) => {
      if (failApply) throw new Error("boom");
      applied.push({ id, persona, tuning });
    },
    log: (line) => logs.push(line),
    warn: (line) => warns.push(line),
  });
  return { poll, applied, logs, warns, gates, failNext: (v: boolean) => (failApply = v) };
}

describe("watchHardcore — the owner's hardcore switch, live (#4535 slice 2c)", () => {
  it("does nothing while the setting matches the build in force", () => {
    const h = harness();
    h.poll(state({}));
    h.poll(state({ sauron: { hardcore: false } }));
    expect(h.applied).toHaveLength(0);
    expect(h.logs).toHaveLength(0);
  });

  it("swaps in the hardcore build with its cooldown, and re-runs the readiness gate on it", () => {
    const h = harness();

    h.poll(state({ sauron: { hardcore: true } }));

    expect(h.applied).toHaveLength(1);
    expect(h.applied[0]?.id).toBe("sauron");
    expect(h.applied[0]?.persona.id).toBe("sauron");
    expect(h.applied[0]?.tuning).toMatchObject({ cooldownMs: HARDCORE_COOLDOWN_MS });
    expect(h.gates.map((g) => g.id)).toEqual(["sauron"]); // verdict re-reported on the new build
    expect(h.logs.join("\n")).toContain("armed: sauron");
    expect(h.logs.join("\n")).toContain("no restart");
  });

  it("never lets the flip put a bot live that the gate holds in observe", () => {
    const h = harness({ wanted: "observe" });

    h.poll(state({ sauron: { hardcore: true } }));

    expect(h.applied[0]?.tuning).toEqual({ mode: "observe", cooldownMs: HARDCORE_COOLDOWN_MS });
  });

  it("swaps back to the standard build, with the default cooldown, when the switch is turned off", () => {
    const h = harness({ initial: ["sauron"] });

    h.poll(state({ sauron: { hardcore: false } }));

    expect(h.applied).toHaveLength(1);
    expect(h.applied[0]?.tuning).toEqual({ mode: "live" });
    expect(h.logs.join("\n")).toContain("disarmed: sauron");
  });

  it("falls back to the env roster for a bot with no stored setting, as boot does", () => {
    const h = harness({ initial: [], env: ["sauron"] });

    h.poll(state({}));

    expect(h.applied.map((a) => a.id)).toEqual(["sauron"]);
  });

  it("is quiet once applied — the same state next poll swaps nothing", () => {
    const h = harness();
    h.poll(state({ sauron: { hardcore: true } }));
    h.poll(state({ sauron: { hardcore: true } }));
    expect(h.applied).toHaveLength(1);
  });

  it("refuses a hardcore build the bot does not have, once, and leaves it as it is", () => {
    const h = harness();

    h.poll(state({ "day-trader": { hardcore: true } }));
    h.poll(state({ "day-trader": { hardcore: true } }));

    expect(h.applied).toHaveLength(0);
    expect(h.warns).toHaveLength(1);
    expect(h.warns[0]).toContain("REFUSED");
  });

  it("does not record a failed swap, so the next poll tries again", () => {
    const h = harness();
    h.failNext(true);
    h.poll(state({ sauron: { hardcore: true } }));
    expect(h.applied).toHaveLength(0);
    expect(h.warns[0]).toContain("retried next poll");

    h.failNext(false);
    h.poll(state({ sauron: { hardcore: true } }));

    expect(h.applied).toHaveLength(1);
  });
});

describe("gateBuild", () => {
  const sauron = { id: "sauron", name: "Sauron", thesis: "t", decide: () => [] } as Persona;

  it("reports the verdict and returns observe for a build that wanted observe", () => {
    const gates: string[] = [];
    const mode = gateBuild(sauron, false, "observe", (v) => gates.push(v.id));
    expect(mode).toBe("observe");
    expect(gates).toEqual(["sauron"]);
  });
});

describe("buildTuning", () => {
  it("gives hardcore the 90s cooldown and standard none", () => {
    expect(buildTuning("live", true)).toEqual({ mode: "live", cooldownMs: 90_000 });
    expect(buildTuning("live", false)).toEqual({ mode: "live" });
  });
});

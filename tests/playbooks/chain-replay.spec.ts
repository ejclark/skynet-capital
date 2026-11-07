import { AI_DIP_CHAIN, type PlaybookChain } from "../../src/playbooks/chain.js";
import {
  AI_DIP_MODELS,
  type ChainRun,
  type Holding,
  type LinkModel,
  nextPrintAfter,
  ownershipCheck,
  runChain,
  type Tape,
} from "../../src/playbooks/chain-replay.js";

/**
 * THE CHAIN SHADOW REPLAY (#6959 slice 1) — the engine asks only the owner each session, hands off
 * on a linked event in the same session, books each link's own result, and the ownership check
 * catches a session two links decided.
 */

/** `n` weekday sessions from Monday 2026-01-05. */
function weekdays(n: number): string[] {
  const out: string[] = [];
  for (let d = Date.parse("2026-01-05T00:00:00Z"); out.length < n; d += 864e5) {
    const day = new Date(d);
    if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6) out.push(day.toISOString().slice(0, 10));
  }
  return out;
}

const tapeOf = (closes: number[], prints: string[] = []): Tape => ({
  dates: weekdays(closes.length),
  closes,
  prints,
  volAt: () => 0.5,
});

const flat = (n: number, price = 100) => Array.from({ length: n }, () => price);

describe("Given the AI-dip chain on a flat tape", () => {
  const tape = tapeOf(flat(260));
  const run = runChain(AI_DIP_CHAIN, AI_DIP_MODELS, tape, 0);

  it("then the wheel sells a put, it expires, and the long call takes the freed cash", () => {
    expect(run.path.map((p) => `${p.event}:${p.by}>${p.to}`)).toEqual([
      "filled:CRWV-WHEEL>CRWV-WHEEL",
      "expired:CRWV-WHEEL>CRWV-LONG-CALL",
      "filled:CRWV-LONG-CALL>CRWV-LONG-CALL",
      "stopped:CRWV-LONG-CALL>CRWV-LONG-CALL",
    ]);
    expect(run.status).toBe("closed");
  });

  it("then ownership passes on the expiry session and the wheel decides nothing after it", () => {
    const expired = run.path.find((p) => p.event === "expired");
    const after = run.steps.filter((s) => s.t > (expired?.t ?? Infinity));
    expect(after.length).toBeGreaterThan(0);
    expect(after.every((s) => s.asked.join() === "CRWV-LONG-CALL")).toBe(true);
    expect(run.path.find((p) => p.event === "filled" && p.by === "CRWV-LONG-CALL")?.t).toBe(
      (expired?.t ?? 0) + 1,
    );
  });

  it("then each link reports its own result and the total sits beside them", () => {
    const wheel = run.links.find((l) => l.playbook === "CRWV-WHEEL")?.result ?? 0;
    const call = run.links.find((l) => l.playbook === "CRWV-LONG-CALL")?.result ?? 0;
    expect(wheel).toBeGreaterThan(0); // the premium, kept
    expect(call).toBeLessThan(0); // a flat tape bleeds the call to its time stop
    expect(run.total).toBeCloseTo(wheel + call, 6);
  });

  it("then the ownership check finds one owner every session", () => {
    expect(ownershipCheck(run, AI_DIP_CHAIN)).toEqual({
      sessions: run.steps.length,
      twoDeciders: 0,
      unowned: 0,
    });
  });
});

describe("Given the AI-dip chain when CRWV falls through the strike", () => {
  const closes = [...flat(5), ...flat(80, 60)];
  const run = runChain(AI_DIP_CHAIN, AI_DIP_MODELS, tapeOf(closes), 0);

  it("then the put is assigned and the wheel keeps the shares, with no link to anyone", () => {
    expect(run.path.map((p) => p.event)).toEqual(["filled", "assigned"]);
    expect(run.links.map((l) => l.playbook)).toEqual(["CRWV-WHEEL"]);
    expect(run.steps.every((s) => s.asked.join() === "CRWV-WHEEL")).toBe(true);
  });

  it("then a run the tape ends first is open and marked at the last close", () => {
    expect(run.status).toBe("open");
    // Shares cost the strike (~$80s) and are marked at $60: the premium does not cover it.
    expect(run.total).toBeLessThan(-1000);
  });
});

/** A scripted model: emits `events[t]` on session t and holds otherwise; ends when told. */
function scripted(
  events: Record<number, { kind: "assigned" | "expired" | "take-profit"; ends?: true }>,
  worth = 0,
): LinkModel {
  return {
    step(_tape, t, holding) {
      const e = events[t];
      if (!e) return { holding, cash: 0 };
      const next: Holding =
        e.kind === "assigned" ? { kind: "shares", basis: 50 } : { kind: "cash" };
      return {
        holding: next,
        cash: 10,
        event: { kind: e.kind },
        ...(e.ends ? { ends: true } : {}),
      };
    },
    mark: (_tape, _t, holding) => (holding.kind === "cash" ? 0 : worth),
  };
}

describe("Given a chain that passes the position itself", () => {
  const chain: PlaybookChain = {
    id: "T",
    title: "t",
    source: "spec",
    links: [{ from: "A", on: { kind: "assigned" }, to: "B" }],
  };
  const models = new Map([
    ["A", scripted({ 2: { kind: "assigned" } }, 5000)],
    ["B", scripted({ 4: { kind: "take-profit", ends: true } }, 5000)],
  ]);
  const run = runChain(chain, models, tapeOf(flat(10)), 0);

  it("then the giver books the position at its mark and the taker pays it", () => {
    expect(run.links).toEqual([
      { playbook: "A", result: 10 + 5000 },
      { playbook: "B", result: -5000 + 10 },
    ]);
    expect(run.status).toBe("closed");
    expect(run.steps.map((s) => s.asked.join())).toEqual(["A", "A", "A", "B", "B"]);
  });
});

describe("Given a run whose steps show two links deciding (the plan's falsifier)", () => {
  it("then the ownership check counts it", () => {
    const run = runChain(AI_DIP_CHAIN, AI_DIP_MODELS, tapeOf(flat(30)), 0);
    const last = run.steps.at(-1);
    if (!last) throw new Error("the run took no steps");
    const doctored: ChainRun = {
      ...run,
      steps: [...run.steps, { ...last, t: last.t + 1, asked: ["CRWV-WHEEL", "CRWV-LONG-CALL"] }],
    };
    expect(ownershipCheck(doctored, AI_DIP_CHAIN).twoDeciders).toBe(1);
  });

  it("then a session no model was asked counts as a position with no owner", () => {
    const run = runChain(AI_DIP_CHAIN, AI_DIP_MODELS, tapeOf(flat(30)), 0);
    const last = run.steps.at(-1);
    if (!last) throw new Error("the run took no steps");
    const doctored: ChainRun = {
      ...run,
      steps: [...run.steps, { ...last, t: last.t + 1, asked: [] }],
    };
    expect(ownershipCheck(doctored, AI_DIP_CHAIN).unowned).toBe(1);
  });
});

describe("Given a put still alive when the tape ends", () => {
  // 10 sessions: the wheel's put is 14+ days out, so it cannot have expired by the last close.
  const run = runChain(AI_DIP_CHAIN, AI_DIP_MODELS, tapeOf(flat(10)), 0);

  it("then it is marked open, never settled early as expired or assigned", () => {
    expect(run.path.map((p) => p.event)).toEqual(["filled"]);
    expect(run.status).toBe("open");
    expect(run.links.map((l) => l.playbook)).toEqual(["CRWV-WHEEL"]);
  });
});

describe("Given the next print after a date", () => {
  it("then a filed print is used, and past the last one a print every 91 days is projected", () => {
    expect(nextPrintAfter(["2026-05-14", "2026-08-12"], "2026-06-01")).toBe("2026-08-12");
    expect(nextPrintAfter(["2026-05-14", "2026-08-12"], "2026-10-01")).toBe("2026-11-11");
    expect(nextPrintAfter([], "2026-10-01")).toBeNull();
  });
});

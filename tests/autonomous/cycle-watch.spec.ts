import { createCycleWatch } from "../../src/autonomous/cycle-watch.js";

/**
 * The cycle watch (#4995) turns three look-alike quiet states — no signal, a tripped breaker, a
 * stopped loop — into distinct log lines. Observed only through the lines it logs.
 */
function setup(overrides: { open?: boolean; block?: string | null } = {}) {
  let clock = 0;
  let open = overrides.open ?? true;
  let block: string | null = overrides.block ?? null;
  const lines: string[] = [];
  const watch = createCycleWatch({
    isMarketOpen: () => open,
    blockedReason: () => block,
    log: (line) => lines.push(line),
    now: () => clock,
    heartbeatMs: 15 * 60_000,
    stallMs: 5 * 60_000,
  });
  return {
    watch,
    lines,
    advance: (ms: number) => {
      clock += ms;
    },
    setOpen: (value: boolean) => {
      open = value;
    },
    setBlock: (value: string | null) => {
      block = value;
    },
  };
}

const MIN = 60_000;
const ok = (): Promise<void> => Promise.resolve();

describe("cycle watch", () => {
  it("logs a block once when it starts and once when it clears", () => {
    const { watch, lines, setBlock } = setup();
    setBlock("daily-loss");
    watch.tick();
    watch.tick();
    setBlock(null);
    watch.tick();
    expect(lines).toEqual([
      "[safety] BLOCKED — daily-loss; no orders until cleared",
      "[safety] block cleared",
    ]);
  });

  it("logs a failed cycle and never rethrows, so the caller's latch releases", async () => {
    const { watch, lines } = setup();
    await watch.guard(() => Promise.reject(new Error("broker timeout")));
    expect(lines).toEqual(["[cycle] failed: broker timeout"]);
  });

  it("warns once when the market is open and no cycle has completed for the stall window", async () => {
    const { watch, lines, advance } = setup();
    watch.tick(); // session opens
    advance(6 * MIN);
    watch.tick();
    watch.tick();
    expect(lines.filter((l) => l.startsWith("[stall]"))).toHaveLength(1);
    await watch.guard(ok);
    expect(lines).toContain("[stall] cleared — cycles are running again");
  });

  it("stays quiet about stalls while the market is closed", () => {
    const { watch, lines, advance } = setup({ open: false });
    watch.tick();
    advance(60 * MIN);
    watch.tick();
    expect(lines).toEqual([]);
  });

  it("does not count overnight silence as a stall at the open", async () => {
    const { watch, lines, advance, setOpen } = setup({ open: false });
    await watch.guard(ok); // last cycle yesterday
    advance(17 * 60 * MIN);
    setOpen(true);
    watch.tick();
    expect(lines).toEqual([]);
  });

  it("emits a heartbeat with the cycle count every heartbeat window", async () => {
    const { watch, lines, advance } = setup();
    watch.tick();
    for (let i = 0; i < 3; i += 1) await watch.guard(ok);
    advance(15 * MIN);
    watch.tick();
    expect(lines).toContain("[heartbeat] 3 cycle(s), 0 failed, in the last 15m; not blocked");
  });
});

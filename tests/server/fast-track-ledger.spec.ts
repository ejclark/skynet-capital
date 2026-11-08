import { readFileSync } from "node:fs";
import type { MarketEvent } from "../../src/domain/market-events.js";
import {
  fastTrackEventOf,
  killSwitchBullets,
  liveKillSwitches,
  stillLive,
} from "../../src/server/fast-track-ledger.js";

/** A research ledger read for a fast track's cards (#7034 slice 1): its stance and its live kill switches. */

const ledger = (stance: string) => `# X print

## At a glance

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** · E1 | High | reasons | NVDA closes under $150 by **2026-10-01** |
| This week | Watch | Medium | reasons | A notice naming a date outside Nov 17–25 |

## Stance & kill switches

${stance}

## Assessment ledger
`;

const LISTED = `**Kill switches:**

- *Existence* (new, 2026-08-31): the print dies if appropriations lapse
  deep into October. Retired once a CR is signed.

- IR call notice **before 2026-10-21** confirming the date → S1 reopens.
- Reaction-day open→close green on this print → two greens retire the fade.

**Stance update 2026-10-30.** Not a kill switch.`;

const nvdaEvent: MarketEvent = {
  id: "nvda-2026-11-18-print",
  kind: "earnings",
  title: "NVDA earnings print",
  date: "2026-11-17",
  status: "confirmed",
  source: "IR: fixture",
  impact: "critical",
  symbols: ["NVDA"],
};

describe("fast-track ledger reading", () => {
  it("reads every bullet under the kill-switch line, continuation lines joined, markup gone", () => {
    expect(killSwitchBullets(ledger(LISTED))).toEqual([
      "Existence (new, 2026-08-31): the print dies if appropriations lapse deep into October. Retired once a CR is signed.",
      "IR call notice before 2026-10-21 confirming the date → S1 reopens.",
      "Reaction-day open→close green on this print → two greens retire the fade.",
    ]);
  });

  it("drops a switch whose every date has passed, but never for its own authoring stamp", () => {
    expect(stillLive("a notice before 2026-10-21", "2026-11-07")).toBe(false);
    expect(stillLive("closes under $150 by 2026-10-01 or by 2026-11-20", "2026-11-07")).toBe(true);
    expect(stillLive("Existence (new, 2026-08-31): the print dies", "2026-11-07")).toBe(true);
    expect(stillLive("undated reaction-day switch", "2026-11-07")).toBe(true);
  });

  it("offers the listed switches still live, in the ledger's order", () => {
    expect(liveKillSwitches(ledger(LISTED), "2026-11-07")).toEqual([
      "Existence (new, 2026-08-31): the print dies if appropriations lapse deep into October. Retired once a CR is signed.",
      "Reaction-day open→close green on this print → two greens retire the fade.",
    ]);
  });

  it("falls back to the horizon table's live falsifiers when the ledger lists no switches", () => {
    expect(liveKillSwitches(ledger("Stance only."), "2026-11-07")).toEqual([
      "A notice naming a date outside Nov 17–25",
    ]);
  });

  it("carries the house's stance, and nothing at all for an event with no ledger", () => {
    expect(fastTrackEventOf(nvdaEvent, ledger(LISTED), "2026-11-07").stance).toBe("Stand aside");
    expect(fastTrackEventOf(nvdaEvent, undefined, "2026-11-07")).toEqual({
      event: nvdaEvent,
      killSwitches: [],
    });
  });

  it("reads the real NVDA ledger to at least one live switch on 2026-11-07, none of them past", () => {
    const md = readFileSync("docs/research/events/nvda-2026-11-18-print.md", "utf8");
    const live = liveKillSwitches(md, "2026-11-07");
    expect(live.length).toBeGreaterThan(0);
    expect(live.join(" ")).not.toMatch(/before 2026-10-21/);
  });
});

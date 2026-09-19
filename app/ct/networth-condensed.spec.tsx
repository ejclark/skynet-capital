import { expect, test } from "@playwright/experimental-ct-react";
import type { HarnessOptions } from "../playwright/index";
import type { NetWorthStatsView } from "../src/live/networth";
import { NetWorthCondensed } from "../src/shell/networth-summary";
import { expectComponentShot } from "./harness";

/**
 * Proof-of-concept 2 of 3 (#3333 slice 3) — THE case this harness exists for.
 *
 * `NetWorthCondensed` is the Cockpit's sticky at-a-glance: every figure on it moves with
 * `src/observatory/history-sampler.ts`'s tick, which runs even against offline fixtures. A
 * route-level screenshot of `/accounts` therefore can never be a baseline — that is exactly why
 * `/leaderboard` was given behavioural-only coverage in #3330. Mounted alone with server-formatted
 * strings as literals, the same component is byte-stable, so the visual regression the route had to
 * give up is recovered here in full: the tone classes, the partial-window marker, both palettes.
 *
 * The strings below are formatted the way the SERVER formats them — these components only place
 * text, never compute it (`networth-summary.tsx`'s own header comment), so a fixture that invented
 * its own number formatting would be testing a shape the app never renders.
 */

const WINDOWS = [
  { label: "7D", note: "since Sep 12", value: "+1.8%", tone: "pos", known: true },
  { label: "1M", note: "since Aug 19", value: "−0.4%", tone: "neg", known: true },
  { label: "3M", note: "since Jun 19", value: "+6.2%", tone: "pos", known: true },
  { label: "1Y", note: "since Sep 19", value: "+11.0%", tone: "pos", known: true, partial: true },
] as const;

const STATS: NetWorthStatsView = {
  value: "$128,431.07",
  valueKnown: true,
  dayChange: "+$1,204.55",
  dayTone: "pos",
  dayKnown: true,
  cash: "$18,200.00",
  cashKnown: true,
  positionCount: 7,
  windows: WINDOWS,
};

const DOWN_DAY: NetWorthStatsView = {
  ...STATS,
  value: "$126,980.12",
  dayChange: "−$1,450.95",
  dayTone: "neg",
};

test("places the server-formatted total, the day's move and the ROI pills", async ({ mount }) => {
  const component = await mount(<NetWorthCondensed stats={STATS} caption="All accounts" />);

  await expect(component.getByText("Net worth · All accounts")).toBeVisible();
  await expect(component.getByText("$128,431.07")).toBeVisible();
  await expectComponentShot(component, "networth-condensed-up-day.png");
});

test("carries the losing day in its own tone without changing the layout", async ({ mount }) => {
  const component = await mount(<NetWorthCondensed stats={DOWN_DAY} caption="All accounts" />);

  await expectComponentShot(component, "networth-condensed-down-day.png");
});

test("renders the same figures in the light palette", async ({ mount }) => {
  const component = await mount<HarnessOptions>(
    <NetWorthCondensed stats={STATS} caption="All accounts" />,
    { hooksConfig: { theme: "light" } },
  );

  await expectComponentShot(component, "networth-condensed-light-palette.png");
});

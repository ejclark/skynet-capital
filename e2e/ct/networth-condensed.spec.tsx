import { expect, test } from "@playwright/experimental-ct-react";
import type { HarnessOptions } from "../../app/playwright/index";
import type { NetWorthStatsView } from "../../app/src/live/networth";
import { NetWorthCondensed } from "../../app/src/shell/networth-summary";
import { expectComponentShot } from "./harness";

/**
 * THE case this harness exists for. `NetWorthCondensed` is `/accounts`'s sticky at-a-glance:
 * every figure on it moves with `src/observatory/history-sampler.ts`'s tick, which runs even
 * against offline fixtures — a route-level screenshot of `/accounts` can never be a stable
 * baseline, the same reason `/leaderboard` got behavioral-only coverage in #3330. Mounted alone
 * with server-formatted strings as literals, the same component is byte-stable, so the visual
 * regression the route had to give up is recovered here in full: tone classes, the partial-window
 * marker, both palettes.
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

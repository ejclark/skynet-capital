import { expect, test } from "@playwright/experimental-ct-react";
import { GuidanceView } from "../../app/src/shell/guidance-view";
import { positionGuidance } from "../../src/options/position-guidance";
import { inputs, quoteAt } from "../../tests/options/position-guidance-fixture";
import { expectComponentShot } from "./harness";

// The trade form's Guidance tab (#3729 step 3), phone frame FIRST — mobile-first on the trading
// surfaces (CLAUDE.md): what survives 390px is the curated set, and the desktop frame only adds
// room. The guidance is the engine's own output over the frozen CRWV fixture (400 shares, paid
// $70, earning income), so the picture is exactly what the rules say, not a hand-built mock.
const STAKE = { shares: 400, costBasis: 70, cash: 40_000, goal: "income" as const };
const guidance = positionGuidance(inputs({ stake: STAKE }));
const noop = () => undefined;

test.describe("phone, 390px", () => {
  test.use({ viewport: { width: 390, height: 1400 } });
  test("a holder earning income: the glance lines, then each call", async ({ mount }) => {
    const component = await mount(
      <GuidanceView
        guidance={guidance}
        stake={STAKE}
        changes={[
          "Stock price +2.4% since Sep 24.",
          "Covered calls: Wait (low) → Reasonable now (medium).",
        ]}
        refreshing={false}
        onStake={noop}
        onRefresh={noop}
        onUse={noop}
      />,
    );
    await expect(component.getByRole("list", { name: "At a glance" })).toBeVisible();
    await expectComponentShot(component, "guidance-view-phone.png");
  });
});

test.describe("desktop, 1280px", () => {
  test.use({ viewport: { width: 1280, height: 1100 } });
  test("the same guidance with room to breathe", async ({ mount }) => {
    const component = await mount(
      <GuidanceView
        guidance={guidance}
        stake={STAKE}
        changes={undefined}
        refreshing={false}
        onStake={noop}
        onRefresh={noop}
        onUse={noop}
      />,
    );
    await expectComponentShot(component, "guidance-view-desktop.png");
  });
});

test.describe("phone, 390px — from your paper account", () => {
  test.use({ viewport: { width: 390, height: 1400 } });
  test("the positions link lands with the account's shares already in", async ({ mount }) => {
    const HELD = { shares: 400, costBasis: 70, callsSold: 2 };
    const component = await mount(
      <GuidanceView
        guidance={positionGuidance(inputs({ stake: HELD }))}
        stake={HELD}
        stakeKey="account"
        held={HELD}
        changes={undefined}
        refreshing={false}
        onStake={noop}
        onRefresh={noop}
        onUse={noop}
      />,
    );
    await expectComponentShot(
      component.getByRole("list", { name: "At a glance" }).locator(".."),
      "guidance-view-from-account.png",
    );
  });
});

test.describe("phone, 390px — calls you've already sold", () => {
  test.use({ viewport: { width: 390, height: 1600 } });
  test("one to buy back (most of the premium kept), one to roll (open through earnings)", async ({
    mount,
  }) => {
    const near = quoteAt("2026-10-16", 100, "call");
    const far = quoteAt("2026-11-13", 95, "call");
    const openCalls = [
      {
        occ: "CRWV261016C00100000",
        strike: 100,
        expiration: "2026-10-16",
        contracts: 1,
        premium: (near.ask ?? 0) * 2.6,
        ...(near.bid !== undefined ? { bid: near.bid } : {}),
        ...(near.ask !== undefined ? { ask: near.ask } : {}),
      },
      {
        occ: "CRWV261113C00095000",
        strike: 95,
        expiration: "2026-11-13",
        contracts: 1,
        premium: 4.1,
        ...(far.bid !== undefined ? { bid: far.bid } : {}),
        ...(far.ask !== undefined ? { ask: far.ask } : {}),
      },
    ];
    const stake = { ...STAKE, openCalls };
    const component = await mount(
      <GuidanceView
        guidance={positionGuidance(inputs({ stake }))}
        stake={stake}
        changes={undefined}
        refreshing={false}
        onStake={noop}
        onRefresh={noop}
        onUse={noop}
      />,
    );
    await expect(component.getByRole("region", { name: "Calls you've sold" })).toBeVisible();
    await expectComponentShot(component, "guidance-view-calls-sold.png");
  });
});

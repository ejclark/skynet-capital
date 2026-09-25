import { expect, test } from "@playwright/experimental-ct-react";
import { GuidanceView } from "../../app/src/shell/guidance-view";
import { positionGuidance } from "../../src/options/position-guidance";
import { inputs } from "../../tests/options/position-guidance-fixture";
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
          "Stock price +2.4% since 2026-09-24.",
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

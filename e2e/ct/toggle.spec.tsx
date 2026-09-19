import { expect, test } from "@playwright/experimental-ct-react";
import type { HarnessOptions } from "../../app/playwright/index";
import { Toggle } from "../../app/src/shell/toggle";
import { expectComponentShot } from "./harness";

/**
 * The smallest pure control in `shell/` — proves the harness itself: mount a component with
 * literal props, style it from the app's real stylesheet, carry a function prop back across the
 * wire so an interaction can be asserted, and stamp an explicit palette. If this file is red, the
 * harness is broken rather than the component.
 */

const THEME_OPTIONS = [
  ["dark", "Dark"],
  ["light", "Light"],
] as const;

function recorder(): { picks: string[]; onPick: (next: string) => void } {
  const picks: string[] = [];
  return {
    picks,
    onPick: (next) => {
      picks.push(next);
    },
  };
}

test("renders the pill group with the active option pressed", async ({ mount }) => {
  const { onPick } = recorder();
  const component = await mount(
    <Toggle label="Theme" value="dark" options={THEME_OPTIONS} onPick={onPick} />,
  );

  await expect(component.getByRole("button", { name: "Dark" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(component.getByRole("button", { name: "Light" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expectComponentShot(component, "toggle-dark-pressed.png");
});

test("reports the picked option to its caller", async ({ mount }) => {
  const { picks, onPick } = recorder();
  const component = await mount(
    <Toggle label="Theme" value="dark" options={THEME_OPTIONS} onPick={onPick} />,
  );

  await component.getByRole("button", { name: "Light" }).click();

  await expect.poll(() => picks).toEqual(["light"]);
});

test("renders in the light palette when the harness stamps it", async ({ mount }) => {
  const { onPick } = recorder();
  const component = await mount<HarnessOptions>(
    <Toggle label="Theme" value="light" options={THEME_OPTIONS} onPick={onPick} />,
    { hooksConfig: { theme: "light" } },
  );

  await expectComponentShot(component, "toggle-light-palette.png");
});

import { expect, test } from "@playwright/experimental-ct-react";
import type { PlayInfo } from "../src/live/options";
import { LockedPanel } from "../src/shell/locked-panel";
import { expectComponentShot } from "./harness";

/**
 * Proof-of-concept 3 of 3 (#3333 slice 3) — a composite panel rather than a control, and the one
 * carrying a rule worth pinning pixels to.
 *
 * `LockedPanel` is what a member sees instead of a ticket when a rung isn't earned yet: the
 * fog-of-war shape `CLAUDE.md` names — visible · named · disabled · counted. The capability is
 * withheld; the name, the course code and the rung that opens it are not. That is a claim about the
 * RENDER, so a baseline is the right instrument for it — a behavioural assertion can confirm the
 * words exist while the panel silently loses the lock affordance around them.
 *
 * Both fixtures are real rungs from the ladder, and the pair is deliberate: the second has no
 * `opensAfter`, which is the branch where the sentence has to end cleanly on its own.
 */

const COVERED_CALL: PlayInfo = {
  code: "201",
  id: "covered-call",
  name: "Covered Call",
  tldr: "Sell a call against 100 shares you already own.",
  kind: "option",
  side: "sell",
  optionType: "call",
  gloss: "Rent out the upside you were willing to give up.",
  locked: true,
  earned: false,
  opensAfter: { code: "101", name: "Long Stock" },
};

const NO_PRECURSOR: PlayInfo = {
  code: "101",
  id: "long-stock",
  name: "Long Stock",
  tldr: "Buy shares outright.",
  kind: "stock",
  side: "buy",
  gloss: "The first rung — own the thing.",
  locked: true,
  earned: false,
};

test("names the locked play and the rung that opens it", async ({ mount }) => {
  const component = await mount(<LockedPanel play={COVERED_CALL} />);

  await expect(component).toHaveAccessibleName("Locked play");
  await expect(component.getByText("Course 201 ·")).toBeVisible();
  await expect(
    component.getByText("it opens after your first filled 101 (Long Stock)", { exact: false }),
  ).toBeVisible();
  await expectComponentShot(component, "locked-panel-opens-after.png");
});

test("ends the sentence cleanly when no precursor rung is named", async ({ mount }) => {
  const component = await mount(<LockedPanel play={NO_PRECURSOR} />);

  await expect(
    component.getByText("Training wheels are on, and this rung hasn't been unlocked yet."),
  ).toBeVisible();
  await expectComponentShot(component, "locked-panel-no-precursor.png");
});

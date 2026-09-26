import { expect, test } from "@playwright/experimental-ct-react";
import { PlayCard } from "../../app/src/shell/play-card";

// The Outpost's trading-card presentation (#3333's orphan-route audit gave /outpost component
// tests rather than a route-level pixel snapshot).
const CARD = {
  id: "P-014",
  symbol: "NVDA",
  author: { id: "house", name: "House", kind: "house" as const },
  thesis: "Earnings-window IV crush historically overstates the realized move.",
  trigger: "earnings-window" as const,
  window: "T-3 to T+1",
  size: { conservative: 0.02, standard: 0.04, aggressive: 0.07 },
  traits: [
    {
      id: "iv-crush",
      label: "IV crush",
      claim: "IV dropped 38% the session after the last print.",
    },
    { id: "liquid", label: "Liquid chain", claim: "Weekly options with tight spreads." },
  ],
  evidence: "6/8 prints resolved inside the pre-earnings straddle",
  href: "/research/nvda-aug-2026-print",
};

test("renders a house-authored play card with traits and a study link", async ({ mount }) => {
  const component = await mount(
    <PlayCard
      card={CARD}
      onPickAuthor={() => {
        /* no-op: this spec only asserts render */
      }}
      onPickTrait={() => {
        /* no-op */
      }}
    />,
  );
  await expect(component).toBeVisible();
  await expect(component).toHaveScreenshot("play-card-house.png");
});

test("renders a member-authored play card with no traits or study link", async ({ mount }) => {
  const component = await mount(
    <PlayCard
      card={{
        ...CARD,
        id: "P-021",
        author: { id: "eric", name: "Eric", kind: "member" },
        traits: [],
        href: undefined,
      }}
      onPickAuthor={() => {
        /* no-op */
      }}
      onPickTrait={() => {
        /* no-op */
      }}
    />,
  );
  await expect(component).toBeVisible();
  await expect(component).toHaveScreenshot("play-card-member.png");
});

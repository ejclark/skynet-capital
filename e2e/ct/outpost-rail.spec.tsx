import { expect, test } from "@playwright/experimental-ct-react";
import { OutpostRail } from "../../app/src/shell/outpost-rail";

// The Outpost's control column (#3333's orphan-route audit — /outpost has no pixel coverage at
// the route level, per design decision 6, so its rail gets its own CT snapshot instead).
const CATALOG = {
  cards: [],
  authors: [
    { id: "house", label: "House", count: 6 },
    { id: "eric", label: "Eric", count: 2 },
  ],
  symbols: [],
  triggers: [
    { id: "earnings-window", label: "Earnings window", count: 5 },
    { id: "event-driven", label: "Event-driven", count: 3 },
  ],
  traits: [],
};

test("renders the facet groups with no active filter", async ({ mount }) => {
  const component = await mount(
    <OutpostRail
      catalog={CATALOG}
      filter={{}}
      onToggle={() => {
        /* no-op: this spec only asserts render */
      }}
      onClear={() => {
        /* no-op */
      }}
    />,
  );
  await expect(component).toBeVisible();
  await expect(component).toHaveScreenshot("outpost-rail-unfiltered.png");
});

test("renders the clear-filters control once a facet is selected", async ({ mount }) => {
  const component = await mount(
    <OutpostRail
      catalog={CATALOG}
      filter={{ author: "house" }}
      onToggle={() => {
        /* no-op */
      }}
      onClear={() => {
        /* no-op */
      }}
    />,
  );
  await expect(component.getByText("Clear filters")).toBeVisible();
  await expect(component).toHaveScreenshot("outpost-rail-filtered.png");
});

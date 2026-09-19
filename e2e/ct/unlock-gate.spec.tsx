import { expect, test } from "@playwright/experimental-ct-react";
import { CheckGateCard, UnlockBanner } from "../../app/src/shell/unlock-gate";

// The unlock celebration + comprehension-check gate — both render only conditionally (an
// unclaimed milestone, or a freshly-earned one), so a /learn route shot won't reliably show them.
// Real pixel coverage lives here per design decision 4.
test("renders the milestone-unlocked celebration with a next rung", async ({ mount }) => {
  const component = await mount(
    <UnlockBanner
      celebrations={[
        {
          milestoneId: "m-101",
          code: "101",
          name: "Buy to open",
          opened: { code: "102", name: "Sell to close" },
        },
      ]}
      onClaimed={() => {
        /* no-op: this spec only asserts render */
      }}
    />,
  );
  await expect(component).toBeVisible();
  await expect(component).toHaveScreenshot("unlock-banner-next-rung.png");
});

test("renders the top-of-ladder celebration with no next rung", async ({ mount }) => {
  const component = await mount(
    <UnlockBanner
      celebrations={[{ milestoneId: "m-501", code: "501", name: "Full ladder", opened: undefined }]}
      onClaimed={() => {
        /* no-op */
      }}
    />,
  );
  await expect(component.getByText(/whole ladder is yours/)).toBeVisible();
  await expect(component).toHaveScreenshot("unlock-banner-top-rung.png");
});

test("renders the comprehension-check gate before the unlock", async ({ mount }) => {
  const component = await mount(
    <CheckGateCard
      gate={{
        milestoneId: "m-101",
        code: "101",
        title: "Buy to open",
        did: "Your first market buy",
        concept: "order types and fills",
        needed: 1,
        total: 2,
        questions: [
          {
            id: "q1",
            prompt: "What happens to a market order?",
            options: ["It fills immediately at the best available price", "It waits for a limit"],
          },
          {
            id: "q2",
            prompt: "Is a SIM fill real money?",
            options: ["No — paper only", "Yes"],
          },
        ],
      }}
      onPassed={() => {
        /* no-op */
      }}
    />,
  );
  await expect(component.getByRole("heading", { name: /Buy to open/ })).toBeVisible();
  await expect(component).toHaveScreenshot("check-gate-card.png");
});

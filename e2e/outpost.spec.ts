import { expect, test } from "@playwright/test";

// /outpost was deleted in #3343 — its filterable play catalog now lives as /research's "Plays"
// section (app/src/shell/plays-section.tsx). Behavioral only (design decision 6).
test("renders the plays section", async ({ page }) => {
  await page.goto("/app/research?section=plays");
  await expect(page.getByRole("heading", { name: "Plays" })).toBeVisible();
});

import { expect, test } from "@playwright/test";

// /collections and /collections/:id were folded into /research's "Collections" section in #3343,
// then that section was retired in #3627 (Eric, 2026-09-23 — its ideas banked in docs/PATTERNS.md
// → discovery). The current IA: an old `?section=collections` link — including a deep link to one
// shelf — lands on R&D → Playbooks (app/src/routes/research.tsx validateSearch), so bookmarks never
// dead-end. Behavioral only (design decision 6).
test("an old collections link lands on R&D → Playbooks", async ({ page }) => {
  await page.goto("/app/research?section=collections");
  await expect(page).toHaveURL(/[?&]section=playbooks\b/);
  await expect(page.getByRole("heading", { level: 1, name: "Playbooks" })).toBeVisible();
});

test("an old collection-shelf deep link lands on R&D → Playbooks", async ({ page }) => {
  await page.goto("/app/research?section=collections&shelf=earnings");
  await expect(page).toHaveURL(/[?&]section=playbooks\b/);
  await expect(page.getByRole("heading", { level: 1, name: "Playbooks" })).toBeVisible();
});

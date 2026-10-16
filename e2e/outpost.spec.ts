import { expect, test } from "@playwright/test";

// /outpost was deleted in #3343 and its play catalog became /research's "Plays" section; #3626
// retired that section too, carrying each play's evidence line, study link, window, exposure and
// traits onto the R&D → Playbooks cards. The current IA: an old `?section=plays` link lands on
// Playbooks, and the cards there carry what the Plays cards did. Behavioral only (design decision 6).
test("an old plays link lands on R&D → Playbooks", async ({ page }) => {
  await page.goto("/app/research?section=plays");
  await expect(page).toHaveURL(/[?&]section=playbooks\b/);
  await expect(page.getByRole("heading", { level: 1, name: "Playbooks" })).toBeVisible();
});

test("the playbook cards carry the retired plays' evidence and window", async ({ page }) => {
  await page.goto("/app/research?section=playbooks");
  const cards = page.locator(".pb-card");
  await expect(cards.first()).toBeVisible();
  // Every strategy card keeps its rows' evidence (the Plays card's footer); a row also keeps its
  // window — a tactical one honestly shows none, so assert at least one card carries it. Since #5432 a
  // pre-earnings row with its report on file draws the window as one line (an image named "NVDA's
  // window: …") in place of the "Window" fact; without a report on file it falls back to the fact.
  // Since #5444 a ready row's evidence reads as a call sentence (the study's path left the member
  // view; "its study →" carries it).
  await expect(cards.first().locator(".pbe-call").first()).not.toBeEmpty();
  const windowFact = page.locator(".pb-card-facts dt", { hasText: "Window" });
  const windowLine = cards.getByRole("img", { name: /'s window: / });
  await expect(windowLine.or(windowFact).filter({ visible: true }).first()).toBeVisible();
});

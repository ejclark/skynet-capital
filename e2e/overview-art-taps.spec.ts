import { expect, test } from "@playwright/test";

// #4970 — below the bench width the character card stands in the Overview's own flow, and its shade
// (`.char-blend`, sauron-card.css) is pulled 90px up over whatever sits above it: there, the bottom
// of the decision card or the positions book. The shade is decoration; a tap on it must land on the
// control underneath. Before the fix the shade's box took the tap (Playwright: "div.char-blend …
// intercepts pointer events"), so "Review on Trade ↗" did nothing on a phone. #4976: even with the
// tap through, the shade's opaque floor still covered the control's bottom edge, so on a phone the
// shade no longer rises over anything (`char-card--bare`).
//
// Measured on the any-account page, which the offline server renders with no sign-in and which
// lays out the same `.overview-grid` → `.overview-card` stack as a bot's Profile page.

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test("the character card's shade never covers the controls above it on a phone (#4970, #4976)", async ({
  page,
}) => {
  await page.goto("/app/u/sauron");
  const shade = page.locator(".overview-card .char-shade").first();
  await expect(shade).toBeVisible();
  await shade.evaluate((el) => el.scrollIntoView({ block: "center" }));

  const seen = await shade.evaluate((el) => {
    const blend = el.closest(".char-blend");
    const r = el.getBoundingClientRect();
    // A 5×3 grid over the shade: every point must hit through it, never the art layer itself.
    const taken: string[] = [];
    for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      for (const fy of [0.2, 0.5, 0.8]) {
        const hit = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
        if (hit && blend?.contains(hit)) taken.push(`${fx},${fy} → ${hit.className}`);
      }
    }
    // No control above the card may sit under the shade at all (#4976): on a phone the shade has no
    // art to rise over, and its floor is opaque, so even a grazed bottom edge reads as cut off.
    // `elementFromPoint` skips the shade (it lets go of the pointer), so this is measured, not hit.
    const under = [
      ...document.querySelectorAll<HTMLElement>(
        ".overview-grid :is(a, button, input, select, [role=button])",
      ),
    ]
      .filter((c) => !c.closest(".overview-card"))
      .filter((c) => {
        const b = c.getBoundingClientRect();
        return b.width > 0 && b.bottom > r.top && b.top < r.bottom;
      })
      .map((c) => c.textContent?.trim() || c.tagName);
    // Not vacuous: some control sits just above the card, so a pull would have reached it.
    const above = [...document.querySelectorAll<HTMLElement>(".overview-grid :is(a, button)")]
      .filter((c) => !c.closest(".overview-card"))
      .some((c) => {
        const b = c.getBoundingClientRect();
        return b.bottom <= r.top && b.bottom > r.top - 90;
      });
    return { taken, under, above };
  });

  expect(seen.taken, "points over the shade that the art layer took").toEqual([]);
  expect(seen.above, "a control within the shade's old 90px pull above the card").toBe(true);
  expect(seen.under, "controls above the card that the shade paints over").toEqual([]);

  // The league under the shade stays tappable: only the decoration lets go of the pointer.
  const toggle = page.locator(".overview-card .league-toggle button").first();
  await toggle.scrollIntoViewIfNeeded();
  const own = await toggle.evaluate((el) => {
    const b = el.getBoundingClientRect();
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return hit === el || el.contains(hit);
  });
  expect(own, "the league toggle takes its own tap").toBe(true);
});

import { expect, type Page, test } from "@playwright/test";

// #7487 slice 5 — THE EYE NOTICES, and the beam that lights what it noticed. On Campaign, once the
// page has its data, the Eye may point at one thing worth a look: the stage slides to its window, the
// row is ringed with "◉ THE EYE · <reason>", and Moneypenny's latest line in the dock says what it
// saw, with "Back to where I was". Never on a member's first look, never on a deep link.
//
// The edition is the latest one checked in, so its own events and ranges change by design. These
// tests reshape the served edition so exactly one thing is new: one sector whose last close left its
// 20-day band (the close before sat inside it), no event a story waits on, and no quests.

const SEEN_QUESTS = "skynet.eye.quests-seen";

interface Row {
  market?: true;
  fund: string;
  name: string;
  range: { low: number; mid: number; high: number; close: number };
  trail: number[];
}

/** A signed-in, returning member. The offline server runs without auth, so its onboarding read
 *  names no viewer, and Moneypenny's thread never binds: the Eye waits for a bound thread before it
 *  speaks (`remark`), as it does for every member behind the invite gate. They have messaged her
 *  before, so this is not their first visit: the Eye stays quiet through a first visit and its tour
 *  (#7487 slice 7, `e2e/first-visit.spec.ts`), where her welcome is the page's first word. */
async function signedIn(page: Page): Promise<void> {
  await page.route("**/api/onboarding", async (route) => {
    const res = await route.fetch();
    const body = (await res.json()) as { steps: { id: string; done: boolean }[] };
    if (!body.steps.some((s) => s.id === "first-message"))
      throw new Error("the onboarding read carries no first-message step");
    const steps = body.steps.map((s) => (s.id === "first-message" ? { ...s, done: true } : s));
    await route.fulfill({ response: res, json: { ...body, steps, viewerId: "e2e-member" } });
  });
}

/** Serve the real edition with one sector that just left its usual range, and nothing else new. */
async function oneSectorLeft(page: Page): Promise<Row> {
  let picked: Row | undefined;
  await page.route("**/api/edition", async (route) => {
    const res = await route.fetch();
    const body = (await res.json()) as {
      edition: { next: unknown[]; sectors?: { rows: Row[] } } | null;
    };
    const rows = body.edition?.sectors?.rows ?? [];
    if (body.edition) body.edition.next = [];
    let first = true;
    for (const r of rows) {
      if (r.market) continue;
      const { low, high } = r.range;
      if (first) {
        first = false;
        picked = r;
        r.range.close = high + (high - low) * 0.25;
        r.trail[r.trail.length - 2] = r.range.mid;
        r.trail[r.trail.length - 1] = r.range.close;
      } else {
        r.range.close = r.range.mid;
        r.trail[r.trail.length - 1] = r.range.mid;
      }
    }
    await route.fulfill({ response: res, json: body });
  });
  await page.route("**/api/quests", (route) => route.fulfill({ status: 404, body: "" }));
  await signedIn(page);
  await page.goto("/app/?w=market");
  await expect(page.locator(".sectors-rows > li").first()).toBeVisible();
  if (!picked) throw new Error("the edition carries no sectors");
  return picked;
}

/** Not the member's first look: the Eye has looked once before, with no quests to record. */
const lookedBefore = (page: Page) =>
  page.addInitScript((key) => window.localStorage.setItem(key, "[]"), SEEN_QUESTS);

test.describe("the Eye notices (#7487 slice 5)", () => {
  test("slides to the sector that left its range, rings it, and says why, with a way back", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await lookedBefore(page);
    const row = await oneSectorLeft(page);
    // Arrive on Campaign's front page: the visit's first look.
    await page.goto("/app/");
    await expect(page).toHaveURL(new RegExp(`/app/\\?w=market#sector-${row.fund}$`), {
      timeout: 10_000,
    });
    const ring = page.locator("[data-eye-ring]");
    await expect(ring).toBeVisible();
    await expect(ring).toHaveText(/the Eye · left its usual range/i);
    // The ring sits on the sector's own row.
    const target = await page.locator(`#sector-${row.fund}`).boundingBox();
    const box = await ring.boundingBox();
    expect(Math.abs((box?.y ?? 0) + 3 - (target?.y ?? -100))).toBeLessThan(2);
    // Her latest line says what the Eye saw, in plain words; her moves offer a question and a way back.
    const dock = page.locator(".mp-dock");
    await expect(dock).toContainText(`the Eye is on the market: ${row.name} (${row.fund})`);
    const back = dock.getByRole("button", { name: "Back to where I was" });
    await expect(dock.getByRole("button", { name: `What moved ${row.fund}?` })).toBeVisible();
    expect((await back.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await back.click();
    await expect(page).toHaveURL(/\/app\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Where things stand" })).toBeVisible();
    // Once per session: coming back to the front page notices nothing again.
    await page.goto("/app/");
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/app\/$/);
  });

  test("under reduced motion, the ring appears with no beam", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await lookedBefore(page);
    const row = await oneSectorLeft(page);
    let beams = 0;
    await page.exposeFunction("__beam", () => {
      beams += 1;
    });
    await page.goto("/app/");
    await page.evaluate(() => {
      new MutationObserver(() => {
        if (document.querySelector("[data-eye-beam]"))
          (window as unknown as { __beam: () => void }).__beam();
      }).observe(document.body, { childList: true, subtree: true });
    });
    await expect(page).toHaveURL(new RegExp(`#sector-${row.fund}$`), { timeout: 10_000 });
    await expect(page.locator("[data-eye-ring]")).toBeVisible();
    expect(beams).toBe(0);
  });

  test("on the member's first look, and on a deep link, it notices nothing", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await oneSectorLeft(page);
    // The first look only records what is already there.
    await page.evaluate((key) => window.localStorage.removeItem(key), SEEN_QUESTS);
    await page.goto("/app/");
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/app\/$/);
    await expect(page.locator("[data-eye-ring]")).toHaveCount(0);
    // Looked before now, but the visit arrives on an address that names a window.
    await page.goto("/app/?w=calendar");
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/app\/\?w=calendar$/);
    await expect(page.locator("[data-eye-ring]")).toHaveCount(0);
  });
});

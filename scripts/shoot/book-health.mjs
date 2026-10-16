// Visual harness for the book's health line (#5493 slice 2) — "■ 1 gate · ◆ 2 signals ›" under the
// bot's "● Running · 7 playbooks ›" on the Profile head, and beside it on the any-account page.
// PHONE FIRST (docs/PICTURES.md): the 390px frames prove the pair fits the head's right slot
// without changing the row's height. The page is the Profile shoot's own fixture
// (`accounts-fixture.mjs`) with a `health` field added to each desk, in the shape
// `src/server/book-health-payload.ts` serves: counts by level and detector.
//
// Frames: `head-bot-*` (the bot: 1 gate, 2 signals), `head-human-*` (the human: one idle signal),
// `u-bot-phone` (the any-account page's head), each clipped to the head itself. JPEG ≤100KB.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/book-health.mjs [outdir]  (pr-5493: the plan)

import { resolve } from "node:path";
import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const stubs = await accountsFixture();

/** A desk stub with the book's health riding beside it, as `/api/desk/:id` serves it. */
const withHealth = (stub, health) => (path) => ({
  ...(typeof stub === "function" ? stub(path) : stub),
  health,
});

// Sauron: CRWV over 40% of equity (a gate), the long call refused every cycle for the account's
// options level (looping), and cash above the idle line — the shapes slice 1's detectors produce.
const sauronHealth = {
  available: true,
  counts: { gate: 1, signal: 2, byDetector: { concentrated: 1, looping: 1, idle: 1 } },
};
// Eric: 81% of the book is cash, over the idle line (60%) — one signal, nothing to open yet.
const ericHealth = { available: true, counts: { gate: 0, signal: 1, byDetector: { idle: 1 } } };

stubs["/api/desk/bot-sauron"] = withHealth(stubs["/api/desk/bot-sauron"], sauronHealth);
stubs["/api/desk/human-eric"] = withHealth(stubs["/api/desk/human-eric"], ericHealth);

const out = resolve(process.argv[2] ?? "docs/shots/pr-5493");
const { page, origin, close } = await openShell({ name: "book-health", stubs, out });

async function shootHead(selector, tag) {
  const head = page.locator(selector).first();
  await head.waitFor();
  await page.locator(".bh-line").first().waitFor();
  const path = resolve(out, `${tag}.jpg`);
  // The head's box with a margin round it, so a line at the box's right edge is shown whole.
  const box = await head.boundingBox();
  const width = page.viewportSize().width;
  const x = Math.max(0, box.x - 8);
  const clip = { x, y: Math.max(0, box.y - 8), width: Math.min(width - x, box.width + 16) };
  await page.screenshot({
    path,
    type: "jpeg",
    quality: 70,
    clip: { ...clip, height: box.height + 16 },
  });
  console.log(`shot ${path}`);
}

for (const [tag, viewport] of [
  ["phone", { width: 390, height: 844 }],
  ["desktop", { width: 1280, height: 900 }],
]) {
  await page.setViewportSize(viewport);
  await page.goto(`${origin}/app/accounts?account=bot-sauron`);
  await shootHead(".cockpit-head", `head-bot-${tag}`);
  await page.goto(`${origin}/app/accounts?account=human-eric`);
  await shootHead(".cockpit-head", `head-human-${tag}`);
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/u/bot-sauron`);
await shootHead(".acct-head", "u-bot-phone");

await close();

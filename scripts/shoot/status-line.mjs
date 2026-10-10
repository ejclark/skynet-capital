// Visual harness for the top bar's status line (#5037 round 2, question 9) — the market clock
// (#3689) and fleet health (#1296), folded into one line with the full detail one tap down, plus
// the member menu beside it. It replaces the clock's and the status pill's own harnesses.
//
// The clock is PINNED so the frames are reproducible (2:32 pm ET, 1h 28m left; 8:48 am; a
// Saturday), and the fleet is stubbed two ways — four rows answering, and the controls bridge quiet
// — because the line's whole point is the difference: nothing on it while the fleet is fine, the
// alarm in words when it is not. Phone first (docs/PICTURES.md): every state at 390, then the
// opened panel and the menu at 1280. Clipped to the bar and whatever it opened. JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:status-line [outdir]
import { join } from "node:path";
import { openShell } from "./shell.mjs";

// The real service attaches the Actions link only where it helps — a healthy bridge or a recent bot
// order has nothing to go look at (`ops-status-service.ts`), so the fixtures do the same.
const signal = (id, label, verdict, detail, link = false) => ({
  id,
  label,
  verdict,
  detail,
  ...(link
    ? { link: { href: "https://github.com/ejclark/skynet-capital/actions", label: "Open Actions" } }
    : {}),
});

const status = (bridge) => ({
  available: true,
  status: {
    generatedAt: "2026-09-24T18:30:00Z",
    degraded: false,
    signals: [
      bridge,
      signal("activity", "Bot activity", "ok", "Last bot order 2h ago."),
      signal("deploy-app", "App deploy", "ok", "v1.129.0 live, 6m after its merge.", true),
      signal("deploy-bots", "Bots deploy", "ok", "v1.129.0 live, 7m after its merge.", true),
    ],
  },
});

const healthy = status(
  signal(
    "bridge",
    "Controls bridge",
    "ok",
    "Bots process polled Mission Control 12s ago — armed, suspend toggles reach it within ~30s.",
  ),
);
const attention = status(
  signal(
    "bridge",
    "Controls bridge",
    "attention",
    "No poll from the bots process in 412s (expected every ~30s) — it may be down, restarting, or unreachable.",
    true,
  ),
);

let ops = healthy;
const { page, origin, out, close } = await openShell({
  name: "status-line",
  stubs: {
    "/api/ops-status": () => ops,
    // the member menu wears the session's initial
    "/api/onboarding": { viewerName: "Eric", steps: [], done: 0, total: 0 },
  },
});

// The panel and the menu have a short reveal; a still frame wants the end state, not a fade.
await page.emulateMedia({ reducedMotion: "reduce" });

const OPEN = "2026-09-24T18:32:00Z"; // Thu 2:32 pm ET
const PRE = "2026-09-24T12:48:00Z"; // Thu 8:48 am ET
const SATURDAY = "2026-09-26T15:00:00Z";

/** One frame: the bar (and what hangs off it) at `width`, the clock at `at`, after `then()`. */
async function frame(tag, width, at, then) {
  await page.setViewportSize({ width, height: 700 });
  await page.clock.setFixedTime(new Date(at));
  await page.goto(`${origin}/app/leaderboard`);
  await page.locator(".status-line").waitFor();
  await page.waitForLoadState("networkidle");
  if (then) await then();
  const bar = await page.locator(".topbar").boundingBox();
  const menu = (await page.locator(".member-menu").count())
    ? await page.locator(".member-menu").boundingBox()
    : null;
  const bottom = Math.max(bar.y + bar.height, menu ? menu.y + menu.height : 0) + 8;
  const path = join(out, `${tag}.jpg`);
  await page.screenshot({
    path,
    type: "jpeg",
    quality: 70,
    clip: { x: 0, y: 0, width, height: bottom },
  });
  console.log(`shot ${path}`);
}

const tapLine = () => page.locator(".status-line").click();
const tapDetails = async () => {
  await tapLine();
  await page.getByRole("button", { name: "Fleet details" }).click();
  await page.getByText("Controls bridge").waitFor();
};

await frame("line-open-phone", 390, OPEN);
await frame("line-pre-phone", 390, PRE);
await frame("line-closed-phone", 390, SATURDAY);
await frame("panel-phone", 390, OPEN, tapLine);
await frame("menu-phone", 390, OPEN, () => page.locator(".member-menu-btn").click());
await frame("line-open-desktop", 1280, OPEN);
await frame("panel-desktop", 1280, OPEN, tapLine);
await frame("details-healthy-desktop", 1280, OPEN, tapDetails);

ops = attention;
await frame("line-alarm-phone", 390, OPEN, () => page.getByText("1 fleet alert").waitFor());
await frame("details-alarm-phone", 390, OPEN, tapDetails);
await frame("line-alarm-desktop", 1280, OPEN, () => page.getByText("1 fleet alert").waitFor());

await close();

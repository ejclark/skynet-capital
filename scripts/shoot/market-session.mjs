// Visual harness for the topbar market clock (#3689 slice 1) — on every route, shot over
// /app/wire (renders from an empty stub, so the bar is the subject). The clock is PINNED so the frames
// are reproducible: open (2:32 pm ET, 1h 28m left) and closed (Saturday). Phone first
// (docs/PICTURES.md): the 390px frame proves the wrapped row, the desktop frames prove the full
// widget and the laptop-width compact form. Clipped to the topbar. JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:market-session [outdir]
import { join } from "node:path";
import { openShell } from "./shell.mjs";

const { page, origin, out, close } = await openShell({
  name: "market-session",
  stubs: {},
});

async function frame(tag, width, at) {
  await page.setViewportSize({ width, height: 400 });
  await page.clock.setFixedTime(new Date(at));
  await page.goto(`${origin}/app/wire`);
  await page.locator(".market-session").waitFor();
  const bar = await page.locator(".topbar").boundingBox();
  const path = join(out, `${tag}.jpg`);
  await page.screenshot({ path, type: "jpeg", quality: 70, clip: bar });
  console.log(`shot ${path}`);
}

await frame("session-open-phone", 390, "2026-09-24T18:32:00Z");
await frame("session-open-desktop", 1440, "2026-09-24T18:32:00Z");
await frame("session-open-laptop", 1100, "2026-09-24T18:32:00Z");
await frame("session-power-desktop", 1440, "2026-09-24T19:40:00Z");
await frame("session-closed-desktop", 1440, "2026-09-26T15:00:00Z");

await close();

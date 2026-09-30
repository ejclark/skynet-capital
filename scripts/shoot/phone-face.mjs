// Pictures for #3977's phone face: at 390 the market calendar is one chip naming its range, and
// one tap opens the head — on R&D with the month grid — in a bottom sheet; the brand slot holds
// the still Eye and no tower frame mounts. Profile, then R&D, each closed and open; then 1280, where
// nothing changed (no chip, the "SC" tile). Prints the facts the frames claim.
//
//   npm run build --prefix app && node --import tsx scripts/shoot/phone-face.mjs <outdir>

import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const { page, origin, shoot, close } = await openShell({
  name: "phone-face",
  stubs: await accountsFixture(),
  viewport: { width: 390, height: 844 },
  ...(process.argv[2] ? { out: process.argv[2] } : {}),
});

for (const [tag, path] of [
  ["profile", "/app/accounts"],
  ["rd", "/app/research"],
]) {
  await page.goto(`${origin}${path}`);
  await page.locator(".cal-chip").waitFor();
  await page.waitForTimeout(800);
  console.log(`${tag}: tower frames at 390 = ${await page.locator("iframe").count()}`);
  await shoot(`phone-face-${tag}`);
  await page.locator(".cal-chip").click();
  await page.waitForTimeout(400);
  await shoot(`phone-face-${tag}-sheet`);
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await page.keyboard.press("Escape");
  console.log(
    `${tag}: chip after Month → ${(await page.locator(".cal-chip").innerText()).replace(/\s+/g, " ")}`,
  );
}

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}/app/accounts`);
await page.getByText("Net worth · Eric").waitFor();
console.log(
  `1280: chips = ${await page.locator(".cal-chip").count()}, still Eye shown = ${await page.locator(".brand-eye").isVisible()}`,
);
await close();

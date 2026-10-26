// The Profile page's fixture, borrowed from `scripts/shoot/accounts.mjs` so a probe or a smaller
// shoot shows the same page the Profile pictures show (lifted out of `scripts/probe/watchtower.mjs`
// in #3807 slice 3b-1, its second caller). The data block between the shoot script's imports and
// its `openShell` call is plain `const` data, evaluated here as a module. Good enough on purpose —
// an internal instrument; if the shoot script's shape moves, this throws loudly rather than
// photographing or measuring a different page.

import { readFileSync } from "node:fs";

/** The accounts shoot's `openShell` stubs: pathname → JSON body. */
export async function accountsFixture() {
  const src = readFileSync("scripts/shoot/accounts.mjs", "utf8");
  const from = src.indexOf("const settings = {");
  const to = src.indexOf("const { page, origin, out, close } = await openShell({");
  const stubsAt = src.indexOf("stubs: {", to);
  const stubsEnd = src.indexOf("\n  },\n});", stubsAt);
  if (from < 0 || to < 0 || stubsAt < 0 || stubsEnd < 0)
    throw new Error("accounts.mjs fixture moved");
  // The data block closes over Sauron's Heartbeat fixture, now a real module: a `data:` module
  // can only import by absolute URL, so hand it the file's own.
  const heartbeat = new URL("./accounts-heartbeat-fixture.mjs", import.meta.url).href;
  const ericDesk = new URL("./accounts-eric-desk-fixture.mjs", import.meta.url).href;
  const sauronDesk = new URL("./accounts-sauron-desk-fixture.mjs", import.meta.url).href;
  const activity = new URL("./accounts-activity-fixture.mjs", import.meta.url).href;
  const pulse = new URL("./accounts-pulse-fixture.mjs", import.meta.url).href;
  const imports =
    `import { ericActivity, sauronActivity } from ${JSON.stringify(activity)};\n` +
    `import { sauronAllPasses, sauronNoTrades, sauronProbes, sauronRollCall, sauronVerdict } from ${JSON.stringify(heartbeat)};\n` +
    `import { ericDesk } from ${JSON.stringify(ericDesk)};\n` +
    `import { sauronDesk } from ${JSON.stringify(sauronDesk)};\n` +
    `import { ericEquityCurve, ericPulse, sauronPulse, spyBars } from ${JSON.stringify(pulse)};`;
  const body = `${imports}\n${src.slice(from, to)}\nexport const stubs = {${src.slice(stubsAt + "stubs: {".length, stubsEnd)}\n};`;
  const mod = await import(`data:text/javascript;base64,${Buffer.from(body).toString("base64")}`);
  return mod.stubs;
}

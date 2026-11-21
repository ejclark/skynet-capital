/**
 * E2E DETERMINISM — the server's frozen clocks (#4683, #7901).
 *
 * `freezePage` pins the browser's clock, but some reads compute "today" on the server from its own
 * `new Date()`. Each such read takes an instant from the environment here, so the e2e suite pins
 * it and a real day passing never changes what the suite sees:
 *
 *   - `SKYNET_FIXED_NOW` — the Council's week label. playwright.config.ts passes FIXED_CLOCK
 *     (e2e/determinism.ts); before it, every baseline carrying the label changed on Mondays.
 *   - `SKYNET_EDITION_NOW` — `/api/edition`'s today, which picks the latest edition on or before
 *     it and cuts the dated items behind it. A separate instant because FIXED_CLOCK sits before
 *     the first checked-in edition: read against it, the page would have no edition at all. Read
 *     against the real date instead, the calendar emptied once the 2026-11-06 edition's last
 *     coming date (11-20) passed, and two calendar tests went red on a docs-only commit (#7901).
 *
 * Offline only: a server holding real accounts never reads a frozen clock, whatever its
 * environment says. An absent or unparseable value is the wall clock (`undefined`).
 */
export function offlineClock(
  env: Readonly<Record<string, string | undefined>>,
  mode: "live" | "offline",
  name: "SKYNET_FIXED_NOW" | "SKYNET_EDITION_NOW",
): (() => Date) | undefined {
  if (mode !== "offline") return undefined;
  const ms = Date.parse(env[name] ?? "");
  return Number.isNaN(ms) ? undefined : () => new Date(ms);
}

import { type EarnedMilestone, milestoneForCode } from "../domain/progression.js";
import { TRADE_TYPES } from "../domain/trade-types.js";
import { escapeHtml } from "../ui/escape-html.js";

/**
 * THE UNLOCK BANNER — the fanfare for a freshly earned milestone (positive reinforcement is the
 * house ethos: the celebration budget goes to what went RIGHT). Rendered wherever the member
 * lands next (`/trade`, `/learn`) until they claim it, so a missed page load never eats the
 * moment; one-time-ness is the acknowledged set in the progression store, written when the
 * Claim button POSTs `ack=<ids>` to `/trade`.
 *
 * Styled on the ACCENT teal, deliberately never the P/L green — an unlock is an achievement,
 * not a market outcome, and green carries market meaning everywhere else on the desk.
 */

const BANNER_STYLE = `<style>
  .unlock-banner{ border:1px solid color-mix(in srgb,var(--accent) 55%,var(--border)); border-radius:14px;
    background:linear-gradient(135deg, color-mix(in srgb,var(--accent) 12%,var(--surface)), var(--surface));
    padding:16px 20px; margin-bottom:16px; display:flex; gap:14px; align-items:center; flex-wrap:wrap; }
  .unlock-rows{ flex:1; min-width:240px; display:flex; flex-direction:column; gap:6px; }
  .unlock-eyebrow{ font-family:var(--mono); font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); }
  .unlock-line{ font-size:13.5px; line-height:1.5; }
  .unlock-line b{ color:var(--accent); }
</style>`;

/** The rung after `code` on the ladder — what this earn just opened. */
function nextRung(code: string): (typeof TRADE_TYPES)[number] | undefined {
  const i = TRADE_TYPES.findIndex((t) => t.code === code);
  return i >= 0 ? TRADE_TYPES[i + 1] : undefined;
}

/**
 * One celebratory panel for every unclaimed earn, with a single Claim. Empty list = empty string.
 * `back` is where the claim returns to — the caller passes its own route.
 */
export function renderMilestoneBanner(
  celebrating: readonly EarnedMilestone[],
  opts: { readonly back: string },
): string {
  if (celebrating.length === 0) return "";
  const lines = celebrating
    .map((m) => {
      const milestone = milestoneForCode(m.code);
      const name = milestone?.title ?? `course ${m.code}`;
      const next = nextRung(m.code);
      const opened = next
        ? `Course <b>${next.code} — ${escapeHtml(next.name)}</b> is now open.`
        : `That was the top rung — <b>the whole ladder is yours</b>.`;
      return `<span class="unlock-line">Course <b>${m.code}</b> complete — ${escapeHtml(name)}, filled ✓ · ${opened}</span>`;
    })
    .join("\n      ");
  const ids = celebrating.map((m) => m.milestoneId).join(",");
  return `${BANNER_STYLE}<section class="unlock-banner" aria-live="polite">
    <div class="unlock-rows">
      <span class="unlock-eyebrow">🎉 Milestone unlocked</span>
      ${lines}
    </div>
    <form method="post" action="/trade">
      <input type="hidden" name="ack" value="${escapeHtml(ids)}">
      <input type="hidden" name="back" value="${escapeHtml(opts.back)}">
      <button class="btn btn-primary" type="submit">Claim 🎉</button>
    </form>
  </section>`;
}

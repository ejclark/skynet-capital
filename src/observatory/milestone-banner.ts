import type { EarnedContribution } from "../domain/community.js";
import { milestoneById } from "../domain/curriculum.js";
import { type EarnedMilestone, ladderNeighbor, milestoneForCode } from "../domain/progression.js";
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
 *
 * Carries two kinds of earn (#567): a ladder rung, proven by a fill, and a community-track
 * milestone, proven by a filed issue. Same panel, same Claim, different sentence — the copy never
 * says a filing was "filled".
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

/** One ladder earn's line — the rung it completes, and the rung it opens. */
function ladderLine(m: EarnedMilestone): string {
  const name = milestoneForCode(m.code)?.title ?? `course ${m.code}`;
  const next = ladderNeighbor(m.code, 1);
  const opened = next
    ? `Course <b>${next.code} — ${escapeHtml(next.name)}</b> is now open.`
    : `That was the top rung — <b>the whole ladder is yours</b>.`;
  return `<span class="unlock-line">Course <b>${m.code}</b> complete — ${escapeHtml(name)}, filled ✓ · ${opened}</span>`;
}

/**
 * One community earn's line (#567). Deliberately says FILED, never "filled", and cites the issue
 * number rather than an order id — the same fanfare, an honest account of what actually happened.
 */
function communityLine(c: EarnedContribution): string {
  const name = milestoneById(c.milestoneId)?.title ?? "Community milestone";
  return `<span class="unlock-line"><b>The league</b> — ${escapeHtml(name)}, filed ✓ · issue <b>#${c.issueNumber}</b> is on the board. Thanks — that's how this desk gets better.</span>`;
}

/**
 * One celebratory panel for every unclaimed earn, with a single Claim. Nothing to claim = empty
 * string. `back` is where the claim returns to — the caller passes its own route.
 */
export function renderMilestoneBanner(
  celebrating: readonly EarnedMilestone[],
  opts: { readonly back: string; readonly contributions?: readonly EarnedContribution[] },
): string {
  const contributions = opts.contributions ?? [];
  if (celebrating.length === 0 && contributions.length === 0) return "";
  const lines = [...celebrating.map(ladderLine), ...contributions.map(communityLine)].join(
    "\n      ",
  );
  const ids = [...celebrating, ...contributions].map((m) => m.milestoneId).join(",");
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

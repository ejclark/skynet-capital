import { STARTER_PLAYS, type StarterPlay } from "../domain/starter-plays.js";
import { TRADE_TYPES, type TradeType, type TradeTypeCode } from "../domain/trade-types.js";
import { escapeHtml } from "../ui/escape-html.js";

/**
 * THE PLAY RAIL — the ticket's play-selection chrome, split from `ticket-view.ts` along its own
 * seam: everything about CHOOSING a play (the risk-ordered picker with server-truth ladder locks,
 * the training-wheels toggle, the starter chips, the locked-play panel) lives here; the ticket
 * bodies that SHAPE an order stay in `ticket-view.ts`.
 */

export interface TicketState {
  readonly mode: "guided" | "raw";
  readonly play: TradeType;
  readonly symbol?: string;
  /** Which starter-play chip filled this ticket (`?starter=`), for the bar's active state. */
  readonly starter?: StarterPlay["id"];
  readonly qty: number;
  readonly expiration?: string;
  readonly strike?: number;
  readonly orderType: "limit" | "market";
  readonly limitPrice?: number;
  readonly view: "chart" | "table";
}

/**
 * The viewer's ladder state, server-derived (`progression-service.ts`) — the ticket renders lock
 * truth, it never computes it. Absent = no signed-in progression (offline, or service unwired),
 * which renders as wheels-off: the full catalog, nothing restricted.
 */
export interface TicketProgression {
  readonly wheels: boolean;
  readonly unlocked: ReadonlySet<TradeTypeCode>;
  readonly earned: ReadonlyMap<TradeTypeCode, { readonly at: string }>;
  readonly nextUp?: TradeTypeCode;
}

/** Build a /trade URL from state, with overrides. Omits everything unset. */
export function ticketHref(state: TicketState, over: Partial<Record<string, string>> = {}): string {
  const base: Record<string, string | undefined> = {
    mode: state.mode === "guided" ? undefined : state.mode,
    play: state.play.code,
    symbol: state.symbol,
    exp: state.expiration,
    strike: state.strike === undefined ? undefined : String(state.strike),
    qty: state.qty === 1 ? undefined : String(state.qty),
    ordertype: state.orderType === "limit" ? undefined : state.orderType,
    limit: state.limitPrice === undefined ? undefined : String(state.limitPrice),
    view: state.view === "chart" ? undefined : state.view,
    ...over,
  };
  const params = Object.entries(base)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join("&");
  return params ? `/trade?${params}` : "/trade";
}

/** With wheels on, a rung outside the unlocked set is locked; wheels off locks nothing. */
export function isLockedPlay(
  code: TradeTypeCode,
  progression: TicketProgression | undefined,
): boolean {
  return Boolean(progression?.wheels) && !progression?.unlocked.has(code);
}

/** The rung directly before `code` on the ladder — what a locked row tells you to go fill. */
function previousRung(code: TradeTypeCode): TradeType | undefined {
  const i = TRADE_TYPES.findIndex((t) => t.code === code);
  return i > 0 ? TRADE_TYPES[i - 1] : undefined;
}

/** One rung of the rail — an earned/next-up-decorated link, or a locked span (never a link). */
function pickerRow(
  t: TradeType,
  state: TicketState,
  progression: TicketProgression | undefined,
): string {
  const selected = t.code === state.play.code;
  const earned = progression?.earned.get(t.code);
  const done = earned
    ? `<span class="tk-done" title="first filled ${escapeHtml(earned.at.slice(0, 10))}">✓ earned ${escapeHtml(earned.at.slice(0, 10))}</span>`
    : "";
  // The rail's "next up" chip — only meaningful while the wheels are actually steering.
  const next =
    progression?.wheels && progression.nextUp === t.code && !earned
      ? '<span class="tk-next">NEXT UP</span>'
      : "";
  const inner = `<span class="tk-code">${t.code}</span><span class="tk-name">${escapeHtml(t.name)}</span><span class="tk-tldr">${escapeHtml(t.tldr)}</span>${t.kind === "option" ? '<span class="tk-opt">OPTIONS</span>' : ""}${next}${done}${selected ? '<span class="tk-sel">✓</span>' : ""}`;
  if (isLockedPlay(t.code, progression)) {
    const prev = previousRung(t.code);
    return `<span class="tk-row locked${selected ? " sel" : ""}" aria-disabled="true">${inner}<span class="tk-lock">🔒 opens after your first filled ${prev ? `${prev.code} — ${escapeHtml(prev.name)}` : "trade"}</span></span>`;
  }
  return `<a class="tk-row${next ? " next" : ""}${selected ? " sel" : ""}" href="${ticketHref(state, { play: t.code, strike: undefined, exp: undefined, limit: undefined })}">${inner}</a>`;
}

/** The risk-ordered play picker (ruling 16). Lock state is SERVER truth, never client-side. */
export function playPicker(state: TicketState, progression: TicketProgression | undefined): string {
  const rows = TRADE_TYPES.map((t) => pickerRow(t, state, progression)).join("");
  const footer = progression?.wheels
    ? `training wheels on — fill each course's trade to open the next · milestones land on <a href="/learn">Milestones</a>`
    : `ordered by risk · the course number is the difficulty · progress lives on <a href="/learn">Milestones</a>`;
  return `<details class="panel tk-picker"${state.symbol ? "" : " open"}>
    <summary><span class="desk-k" style="letter-spacing:.16em">1 · The play</span>
      <b style="margin-left:10px">${escapeHtml(state.play.name)}</b>
      <span class="desk-note" style="margin-left:8px">${escapeHtml(state.play.tldr)}</span>
      <span class="desk-note" style="margin-left:auto">change play ▾</span></summary>
    <div class="tk-rows">${rows}</div>
    <p class="desk-note" style="margin-top:10px">${footer}</p>
  </details>`;
}

/**
 * The training-wheels toggle — a tiny POST (state changes are never links), carrying the current
 * ticket URL so the desk lands the member right back where they were. Rendered only when a
 * signed-in progression exists: with nothing to restrict there is nothing to toggle.
 */
export function wheelsToggle(
  state: TicketState,
  progression: TicketProgression | undefined,
): string {
  if (!progression) return "";
  const on = progression.wheels;
  return `<form method="post" action="/trade" class="tk-wheels">
      <input type="hidden" name="wheels" value="${on ? "off" : "on"}">
      <input type="hidden" name="back" value="${escapeHtml(ticketHref(state))}">
      <button class="btn" type="submit" title="${on ? "Open every trade type — your call" : "Back to the guided ladder"}">${on ? "🛞 Training wheels ON" : "Training wheels off"}</button>
    </form>`;
}

/**
 * The STARTER-PLAY bar — three pre-filled first trades, plain links to `?starter=<id>`. Guided
 * mode only (raw is the power-user surface); the active chip marks the preset that filled the
 * ticket, and editing any field resubmits without the param, so the chips never lie about state.
 */
export function starterBar(state: TicketState, progression: TicketProgression | undefined): string {
  if (state.mode !== "guided") return "";
  // A member who took the wheels off asked for the clean desk — the guidance chrome goes too.
  if (progression && !progression.wheels) return "";
  const chips = STARTER_PLAYS.map((p) => {
    const active = state.starter === p.id;
    return `<a class="st-chip${active ? " sel" : ""}"${active ? ' aria-current="true"' : ""} href="/trade?starter=${p.id}"><span class="st-title">${escapeHtml(p.title)}</span><span class="st-detail">${escapeHtml(p.detail)}</span></a>`;
  }).join("");
  return `<div class="st-bar" aria-label="Starter plays">${chips}</div>`;
}

/**
 * The honest LOCKED state for a `?play=` the ladder hasn't opened — the URL stays shareable and
 * truthful, the ticket just isn't actionable: no fields, no review form, only the path to the
 * unlock. The service is the real gate; this is the courtesy that explains it.
 */
export function lockedPanel(state: TicketState): string {
  const prev = previousRung(state.play.code);
  const step = prev
    ? `It opens after your first filled <b>${prev.code} — ${escapeHtml(prev.name)}</b>.`
    : "";
  return `<section class="panel tk-locked-panel">
    <h2>🔒 Course ${state.play.code} — ${escapeHtml(state.play.name)} — is still locked</h2>
    <p>Training wheels are on, so the desk walks the ladder one rung at a time. ${step} Every fill is banked on your <a href="/learn">Milestones</a> — or take the wheels off above to open the full catalog.</p>
    ${prev ? `<a class="btn btn-primary" href="${ticketHref(state, { play: prev.code, strike: undefined, exp: undefined, limit: undefined })}">Open the ${prev.code} ticket →</a>` : ""}
  </section>`;
}

export const PICKER_STYLE = `<style>
  .st-bar{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
  .st-chip{ display:flex; flex-direction:column; gap:2px; padding:9px 14px; border:1px solid var(--border); border-radius:10px;
    text-decoration:none; color:var(--text); transition:border-color .15s, background .15s; }
  .st-chip:hover{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); }
  .st-chip:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .st-chip.sel{ border-color:var(--accent); background:color-mix(in srgb,var(--accent) 8%,transparent); }
  .st-title{ font-weight:600; font-size:12.5px; }
  .st-detail{ font-family:var(--mono); font-size:11px; color:var(--muted); }
  .st-chip.sel .st-detail{ color:var(--accent); }
  .tk-picker summary{ list-style:none; cursor:pointer; display:flex; align-items:center; flex-wrap:wrap; gap:4px; }
  .tk-picker summary::-webkit-details-marker{ display:none; }
  .tk-rows{ display:flex; flex-direction:column; gap:6px; margin-top:14px; }
  .tk-row{ display:flex; align-items:baseline; gap:12px; padding:10px 13px; border:1px solid var(--border); border-radius:10px;
    text-decoration:none; color:var(--text); transition:border-color .15s; flex-wrap:wrap; }
  .tk-row:hover{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); }
  .tk-row.sel{ border-color:var(--accent); background:color-mix(in srgb,var(--accent) 8%,transparent); }
  .tk-row.locked{ opacity:.55; cursor:not-allowed; }
  .tk-code{ font-family:var(--mono); font-size:11px; font-weight:700; color:var(--accent); min-width:28px; }
  .tk-name{ font-weight:600; font-size:13.5px; }
  .tk-tldr{ color:var(--muted); font-size:12px; }
  .tk-opt{ font-family:var(--mono); font-size:9px; letter-spacing:.12em; border:1px solid var(--border); border-radius:5px; padding:2px 6px; color:var(--muted); }
  .tk-sel{ margin-left:auto; color:var(--accent); font-weight:700; }
  .tk-lock{ margin-left:auto; font-family:var(--mono); font-size:10px; color:var(--muted); }
  .tk-done{ font-family:var(--mono); font-size:10px; font-weight:700; color:var(--pos); }
  .tk-next{ font-family:var(--mono); font-size:9px; letter-spacing:.12em; font-weight:700; color:var(--bg);
    background:var(--accent); border-radius:5px; padding:2px 7px; }
  .tk-row.next{ border-color:var(--accent); }
  .tk-wheels button{ white-space:nowrap; }
  .tk-locked-panel{ text-align:center; padding:34px 22px; }
  .tk-locked-panel h2{ font-size:17px; margin-bottom:8px; }
  .tk-locked-panel p{ color:var(--muted); font-size:13px; line-height:1.6; max-width:56ch; margin:0 auto; }
  .tk-locked-panel .btn{ margin-top:16px; }
</style>`;

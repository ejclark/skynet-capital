import type { OptionChainRow } from "../alpaca/alpaca-options-client.js";
import { rowPremium } from "../alpaca/alpaca-options-client.js";
import { COURSES } from "../domain/curriculum.js";
import { STARTER_PLAYS, type StarterPlay } from "../domain/starter-plays.js";
import { TRADE_TYPES, type TradeType } from "../domain/trade-types.js";
import {
  type OptionPlayCode,
  type OptionTicketPreview,
  previewOptionOrder,
} from "../trading/option-ticket.js";
import { escapeHtml } from "../ui/escape-html.js";
import { type DashboardViewOptions, renderShell } from "./dashboard-shell.js";
import { formatPrice, reviewNotices, ticketContext } from "./desk-data.js";
import { DESK_STYLE } from "./desk-style.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { formatCurrency } from "./render-atoms.js";
import { premiumByStrikeSvg, windowChain } from "./ticket-charts.js";

/**
 * THE TRADE TICKET (`GET /trade`) — the desk's order-entry view, built to the desk-v2 handoff's
 * ticket spec: GUIDED and RAW are two modes of ONE ticket (guided default), trade types are
 * risk-ordered by course code and the 300-level rows stay locked until The Wheel is complete
 * (the academy's own localStorage progress), every broker term carries a plain gloss, and
 * NOTHING fires from this screen — the review step (`POST /trade`) always comes first.
 *
 * State is URL-param-backed (mode, play, symbol, exp, strike, qty, ordertype, limit, view), so
 * every step is shareable, back-button-friendly, and works with JavaScript off: expiration
 * chips and strike bars are plain links, and estimates recompute on an ordinary GET submit.
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

export interface TicketViewModel extends DashboardViewOptions {
  readonly state: TicketState;
  /** The signed-in member's own snapshot; absent = browsing with no linked account. */
  readonly snapshot?: ParticipantSnapshot;
  readonly tradingEnabled: boolean;
  readonly expirations?: readonly string[];
  readonly chain?: readonly OptionChainRow[];
  readonly spot?: number;
  /** Honest reason chain data is missing (offline fixtures, fetch failure, no account). */
  readonly chainNote?: string;
  readonly generatedAt?: string;
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

const glossLabel = (term: string, gloss: string): string =>
  `<span>${escapeHtml(term)} <small style="text-transform:none;letter-spacing:0;opacity:.75">· ${escapeHtml(gloss)}</small></span>`;

function modeToggle(state: TicketState): string {
  const seg = (mode: "guided" | "raw", label: string): string => {
    const active = state.mode === mode;
    return `<a class="btn${active ? " btn-primary" : ""}" aria-current="${active}" href="${ticketHref(state, { mode: mode === "guided" ? undefined : mode })}">${label}</a>`;
  };
  return `<div style="display:flex;gap:6px">${seg("guided", "Guided")}${seg("raw", "Raw")}</div>`;
}

/** The risk-ordered play picker (ruling 16). Locked rows unlock client-side from academy progress. */
function playPicker(state: TicketState): string {
  const rows = TRADE_TYPES.map((t) => {
    const selected = t.code === state.play.code;
    const inner = `<span class="tk-code">${t.code}</span><span class="tk-name">${escapeHtml(t.name)}</span><span class="tk-tldr">${escapeHtml(t.tldr)}</span>${t.kind === "option" ? '<span class="tk-opt">OPTIONS</span>' : ""}${selected ? '<span class="tk-sel">✓</span>' : ""}`;
    if (t.unlockCourse) {
      return `<a class="tk-row locked${selected ? " sel" : ""}" data-unlock-course="${escapeHtml(t.unlockCourse)}" data-href="${ticketHref(state, { play: t.code, strike: undefined, exp: undefined, limit: undefined })}" aria-disabled="true">${inner}<span class="tk-lock">🔒 level up to unlock</span></a>`;
    }
    return `<a class="tk-row${selected ? " sel" : ""}" href="${ticketHref(state, { play: t.code, strike: undefined, exp: undefined, limit: undefined })}">${inner}</a>`;
  }).join("");
  return `<details class="panel tk-picker"${state.symbol ? "" : " open"}>
    <summary><span class="desk-k" style="letter-spacing:.16em">1 · The play</span>
      <b style="margin-left:10px">${escapeHtml(state.play.name)}</b>
      <span class="desk-note" style="margin-left:8px">${escapeHtml(state.play.tldr)}</span>
      <span class="desk-note" style="margin-left:auto">change play ▾</span></summary>
    <div class="tk-rows">${rows}</div>
    <p class="desk-note" style="margin-top:10px">ordered by risk · the course number is the difficulty · 300-level unlocks when The Wheel course is complete on <a href="/learn">Learn</a></p>
  </details>`;
}

function expirationChips(model: TicketViewModel): string {
  const { state, expirations } = model;
  if (!expirations || expirations.length === 0) return "";
  const chips = expirations
    .map((exp) => {
      const active = exp === state.expiration;
      return `<a class="btn${active ? " btn-primary" : ""}" href="${ticketHref(state, { exp, strike: undefined, limit: undefined })}">${escapeHtml(exp)}</a>`;
    })
    .join("");
  return `<div class="field"><label>${glossLabel("By when", "the expiration")}</label><div style="display:flex;gap:6px;flex-wrap:wrap">${chips}</div></div>`;
}

function chainTable(model: TicketViewModel): string {
  const { state, chain, spot } = model;
  const rows = windowChain(chain ?? [], state.strike, spot, 15)
    .map((row) => {
      const selected = row.strike === state.strike;
      const cell = (value: number | undefined, digits = 2): string =>
        value === undefined ? "—" : value.toFixed(digits);
      return `<tr${selected ? ' style="background:color-mix(in srgb,var(--accent) 10%,transparent);font-weight:700"' : ""}>
        <td class="tcell"><a href="${ticketHref(state, { strike: String(row.strike), limit: undefined })}" style="color:${selected ? "var(--accent)" : "var(--text)"};text-decoration:none">$${Number.isInteger(row.strike) ? row.strike : row.strike.toFixed(1)}${selected ? " ◂ yours" : ""}</a></td>
        <td class="num">${cell(row.bid)}</td>
        <td class="num">${cell(row.ask)}</td>
        <td class="num">${cell(row.closePrice)}</td>
        <td class="num">${row.delta === undefined ? "—" : row.delta.toFixed(2)}</td>
        <td class="num">${row.openInterest === undefined ? "—" : row.openInterest.toLocaleString("en-US")}</td>
      </tr>`;
    })
    .join("");
  return `<div class="blotter-inline"><table class="blotter">
    <thead><tr><th>Strike</th><th class="num">Bid</th><th class="num">Ask</th><th class="num">Last close</th><th class="num">Δ delta</th><th class="num">Open int</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  <p class="desk-note" style="margin-top:8px">Δ delta — rough odds the option finishes in the money · open interest — contracts outstanding · tap a strike to pick it</p>`;
}

/** The chain block: chart/table toggle + the chosen rendering. */
function chainBlock(model: TicketViewModel): string {
  const { state, chain, chainNote } = model;
  if (!state.symbol) return "";
  if (chainNote) return `<p class="note-warn">${escapeHtml(chainNote)}</p>`;
  if (!chain || chain.length === 0) return "";
  const toggle = (view: "chart" | "table", label: string): string => {
    const active = state.view === view;
    return `<a class="btn${active ? " btn-primary" : ""}" href="${ticketHref(state, { view: view === "chart" ? undefined : view })}">${label}</a>`;
  };
  const type = state.play.optionType === "put" ? "PUTS" : "CALLS";
  return `<div class="panel" style="background:var(--surface-2)">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <span class="desk-k">Premium by strike · ${escapeHtml(state.expiration ?? "")} ${type} · $/share</span>
      <span style="margin-left:auto;display:flex;gap:6px">${toggle("chart", "Chart")}${toggle("table", "Table")}</span>
    </div>
    ${
      state.view === "table"
        ? chainTable(model)
        : premiumByStrikeSvg(chain, {
            ...(state.strike !== undefined ? { selectedStrike: state.strike } : {}),
            ...(model.spot !== undefined ? { spot: model.spot } : {}),
            hrefFor: (strike) => ticketHref(state, { strike: String(strike), limit: undefined }),
          })
    }
  </div>`;
}

/** Guided explainer — the play's promise restated with this ticket's actual numbers. */
function explainer(state: TicketState, preview: OptionTicketPreview | undefined): string {
  if (!preview || preview.estPremium === undefined || preview.estNotional === undefined) {
    return `<p class="note-warn">${escapeHtml(state.play.gloss)}</p>`;
  }
  const credit = formatCurrency(preview.estNotional);
  const perShare = formatPrice(preview.estPremium);
  const line =
    state.play.code === "201"
      ? `You'd collect about <b>${credit} now</b> (${perShare}/share premium) and set aside <b>${formatCurrency(preview.collateral ?? 0)}</b> in case you're asked to buy — that's the "cash-secured."`
      : state.play.code === "202"
        ? `You'd collect about <b>${credit} now</b> (${perShare}/share) for promising <b>${(preview.sharesCommitted ?? 0).toLocaleString("en-US")} shares</b> at $${preview.strike} — above the strike they get called away.`
        : `You'd pay about <b>${credit}</b> (${perShare}/share) for the right, not the obligation. The most this trade can lose is that premium.`;
  return `<p class="note-warn">${line}</p>`;
}

/** The honest payoff row: max profit · breakeven · max loss, never hidden. */
function payoffRow(preview: OptionTicketPreview | undefined): string {
  if (!preview || preview.maxLoss === undefined) return "";
  const profit =
    preview.maxProfit === "uncapped"
      ? `<span class="desk-v" style="color:var(--pos)">uncapped ↑</span>`
      : `<span class="desk-v" style="color:var(--pos)">+${formatCurrency(preview.maxProfit ?? 0)}</span>`;
  return `<div class="desk-tiles" style="margin-top:4px">
    <div class="desk-tile"><span class="desk-k">Max profit</span>${profit}</div>
    <div class="desk-tile"><span class="desk-k">Breakeven</span><span class="desk-v">${preview.breakeven === undefined ? "—" : formatPrice(preview.breakeven)}</span></div>
    <div class="desk-tile"><span class="desk-k">Max loss</span><span class="desk-v" style="color:var(--neg)">−${formatCurrency(preview.maxLoss)}</span></div>
  </div>
  <p class="desk-note">honest numbers, always — max loss assumes the stock goes to $0 where that's what it takes</p>`;
}

/** The one POST that leads anywhere: the review screen. Everything else on this page is a GET. */
function reviewForm(model: TicketViewModel, preview: OptionTicketPreview | undefined): string {
  const { state } = model;
  const disabled = model.tradingEnabled && model.snapshot ? "" : " disabled";
  const ready = state.symbol && state.expiration && state.strike !== undefined;
  // The review posts what the preview actually priced: the effective limit (typed, or the
  // indicative default), not just the raw URL state.
  const hidden = [
    ["play", state.play.code],
    ["symbol", state.symbol ?? ""],
    ["contracts", String(state.qty)],
    ["strike", state.strike === undefined ? "" : String(state.strike)],
    ["exp", state.expiration ?? ""],
    ["ordertype", preview?.orderType ?? state.orderType],
    ["limit", String(preview?.limitPrice ?? state.limitPrice ?? "")],
  ]
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${name}" value="${escapeHtml(value as string)}">`,
    )
    .join("");
  return `<form method="post" action="/trade" class="review-actions" style="margin-top:14px">
    ${hidden}
    <button class="btn btn-primary" type="submit"${ready ? disabled : " disabled"}>Review order →</button>
    <span class="desk-note">nothing fires from this screen — review always comes first${preview?.refusals.length ? " · fix the notes above first" : ""}</span>
  </form>`;
}

/** The RAW broker field grid — every field its real name, gloss riding under (ruling 6). */
function rawFieldGrid(state: TicketState, limitValue: number | undefined): string {
  return `
    <div class="field"><label>${glossLabel("Side", state.play.side === "sell" ? "selling = you take the premium" : "buying = you pay the premium")}</label>
      <input value="${state.play.side.toUpperCase()}" readonly></div>
    <div class="field"><label>${glossLabel("Type", state.play.optionType === "put" ? "put = the right to sell" : "call = the right to buy")}</label>
      <input value="${escapeHtml(`${state.symbol ?? "—"} ${String(state.play.optionType).toUpperCase()}`)}" readonly></div>
    <div class="field"><label>${glossLabel("Strike", "your price")}</label>
      <input name="strike" type="number" step="0.5" min="0" value="${state.strike ?? ""}" placeholder="pick from the chain"></div>
    <div class="field"><label>${glossLabel("Exp", "your deadline")}</label>
      <input name="exp" value="${escapeHtml(state.expiration ?? "")}" placeholder="YYYY-MM-DD"></div>
    <div class="field"><label>${glossLabel("Order", "limit = your price, never worse")}</label>
      <select name="ordertype"><option value="limit"${state.orderType === "limit" ? " selected" : ""}>LIMIT</option><option value="market"${state.orderType === "market" ? " selected" : ""}>MARKET</option></select></div>
    <div class="field"><label>${glossLabel("Limit $/share", "the premium you'll accept")}</label>
      <input name="limit" type="number" step="0.01" min="0" value="${limitValue ?? ""}"></div>
    <div class="field"><label>${glossLabel("Time in force", "day — options orders live one session on Alpaca")}</label>
      <input value="DAY" readonly></div>`;
}

/** The GUIDED grid — two plain-language fields; expiration/strike come from chips and bars. */
function guidedFieldGrid(state: TicketState, limitValue: number | undefined): string {
  return `
    <div class="field"><label>${glossLabel(state.play.optionType === "put" ? "Price you'd happily buy at" : "Price you'd happily sell at", "the strike")}</label>
      <input name="strike" type="number" step="0.5" min="0" value="${state.strike ?? ""}" placeholder="pick from the chart below"></div>
    <div class="field"><label>${glossLabel("Limit $/share", "your floor, never worse · blank = market")}</label>
      <input name="limit" type="number" step="0.01" min="0" value="${limitValue ?? ""}"></div>`;
}

/** Option ticket fields — guided (chips + bars) or raw (broker grid), one GET form either way. */
function optionTicket(model: TicketViewModel, preview: OptionTicketPreview | undefined): string {
  const { state } = model;
  const raw = state.mode === "raw";
  const selectedPremium = preview?.estPremium;
  const limitValue =
    state.limitPrice ?? (selectedPremium ? Number(selectedPremium.toFixed(2)) : undefined);
  const common = `
    <div class="field"><label>${glossLabel("The stock", model.spot !== undefined ? `$${model.spot.toFixed(2)} now` : "underlying symbol")}</label>
      <input name="symbol" value="${escapeHtml(state.symbol ?? "")}" placeholder="MSFT" maxlength="8" autocomplete="off" spellcheck="false"></div>
    <div class="field"><label>${glossLabel("How many", "contracts · 100 shares each")}</label>
      <input name="qty" type="number" min="1" step="1" inputmode="numeric" value="${state.qty}"></div>`;

  return `<section class="panel">
    <div class="desk-k" style="letter-spacing:.16em;margin-bottom:12px">2 · Shape it</div>
    <form method="get" action="/trade" class="ticket">
      <input type="hidden" name="play" value="${state.play.code}">
      ${raw ? '<input type="hidden" name="mode" value="raw">' : ""}
      ${state.view === "table" ? '<input type="hidden" name="view" value="table">' : ""}
      ${raw ? "" : `<input type="hidden" name="exp" value="${escapeHtml(state.expiration ?? "")}">`}
      ${common}${raw ? rawFieldGrid(state, limitValue) : guidedFieldGrid(state, limitValue)}
      <div class="field"><button class="btn" type="submit">Update ↻</button></div>
    </form>
    ${raw ? "" : expirationChips(model)}
    ${chainBlock(model)}
    ${explainer(state, preview)}
    ${payoffRow(preview)}
    ${reviewNotices(preview?.warnings ?? [], preview?.refusals ?? [])}
    ${reviewForm(model, preview)}
  </section>`;
}

/** Stock ticket (101/102) — the share desk's fields, review-first exactly as before. */
/**
 * The STARTER-PLAY bar — three pre-filled first trades, plain links to `?starter=<id>`. Guided
 * mode only (raw is the power-user surface); the active chip marks the preset that filled the
 * ticket, and editing any field resubmits without the param, so the chips never lie about state.
 */
function starterBar(state: TicketState): string {
  if (state.mode !== "guided") return "";
  const chips = STARTER_PLAYS.map((p) => {
    const active = state.starter === p.id;
    return `<a class="st-chip${active ? " sel" : ""}"${active ? ' aria-current="true"' : ""} href="/trade?starter=${p.id}"><span class="st-title">${escapeHtml(p.title)}</span><span class="st-detail">${escapeHtml(p.detail)}</span></a>`;
  }).join("");
  return `<div class="st-bar" aria-label="Starter plays">${chips}</div>`;
}

function stockTicket(model: TicketViewModel): string {
  const { state } = model;
  const disabled = model.tradingEnabled && model.snapshot ? "" : " disabled";
  return `<section class="panel">
    <div class="desk-k" style="letter-spacing:.16em;margin-bottom:12px">2 · Shape it</div>
    <form class="ticket" method="post" action="/trade">
      <input type="hidden" name="action" value="${state.play.side}">
      <div class="field"><label>${glossLabel("Symbol", "the ticker")}</label>
        <input name="symbol" value="${escapeHtml(state.symbol ?? "")}" placeholder="AAPL" maxlength="8" autocomplete="off" spellcheck="false"></div>
      <div class="field"><label>${glossLabel("Shares", "whole shares only")}</label>
        <input name="quantity" type="number" min="1" step="1" inputmode="numeric" value="${state.qty}"></div>
      <div class="field"><button class="btn btn-primary" type="submit"${disabled}>Review order →</button></div>
    </form>
    <p class="desk-note" style="margin-top:10px">${escapeHtml(state.play.gloss)} Market order, day — you'll see the estimated ${state.play.side === "buy" ? "cost" : "proceeds"} on the review screen before anything is sent.</p>
  </section>`;
}

const TICKET_STYLE = `<style>
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
</style>`;

/** Unlocks 300-level rows when The Wheel is complete — same localStorage the academy writes. */
const TICKET_LOCK_SCRIPT = `<script>
(function(){
  var KEY="skynet.academy.done";
  var COURSES=${JSON.stringify(COURSES.map((c) => ({ id: c.id, ms: c.milestones.map((m) => m.id) })))};
  var done; try{ done=JSON.parse(localStorage.getItem(KEY)||"[]"); }catch(e){ done=[]; }
  function complete(id){ var c=COURSES.find(function(x){return x.id===id;}); return !!c && c.ms.every(function(m){ return done.indexOf(m)>=0; }); }
  document.querySelectorAll("[data-unlock-course]").forEach(function(row){
    if(!complete(row.getAttribute("data-unlock-course"))) return;
    row.classList.remove("locked"); row.removeAttribute("aria-disabled");
    row.setAttribute("href", row.getAttribute("data-href"));
    var lock=row.querySelector(".tk-lock"); if(lock) lock.remove();
  });
})();
</script>`;

/**
 * Best-effort preview for the on-page estimates (the review + service re-verify everything).
 * The disciplined default is a LIMIT at the indicative premium; a typed limit overrides it,
 * and an explicit ordertype=market (or no premium to anchor a limit to) falls back to market.
 */
function viewPreview(model: TicketViewModel): OptionTicketPreview | undefined {
  const { state, snapshot } = model;
  if (!(snapshot && state.symbol && state.expiration && state.strike !== undefined)) {
    return undefined;
  }
  const selected = (model.chain ?? []).find((row) => row.strike === state.strike);
  const premium = selected ? rowPremium(selected) : undefined;
  const effectiveLimit =
    state.orderType === "market"
      ? undefined
      : (state.limitPrice ?? (premium !== undefined ? Number(premium.toFixed(2)) : undefined));
  return previewOptionOrder(
    {
      code: state.play.code as OptionPlayCode,
      underlying: state.symbol,
      contracts: state.qty,
      strike: state.strike,
      expiration: state.expiration,
      orderType: effectiveLimit !== undefined ? "limit" : "market",
      ...(effectiveLimit !== undefined ? { limitPrice: effectiveLimit } : {}),
    },
    {
      ...ticketContext(snapshot, { tradingEnabled: model.tradingEnabled, isSelf: true }),
      ...(premium !== undefined ? { premium } : {}),
      ...(model.spot !== undefined ? { underlyingPrice: model.spot } : {}),
    },
  );
}

/** The honest banner for a ticket that can't send: trading off, or no linked account. */
function gateBanner(model: TicketViewModel): string {
  if (!model.tradingEnabled) {
    return `<p class="caveat"><b>Preview only.</b> Placing orders from the desk needs sign-in configured for this deployment — the ticket reviews and refuses rather than sending.</p>`;
  }
  if (!model.snapshot) {
    // Two different situations wear the same symptom, and sending both to /add dead-ends the
    // second one: an account already on the board is refused there as a duplicate (#546). It
    // doesn't need re-adding — it needs linking, which an owner does from /claim.
    // `.caveat` is a flex row, so everything after the bold label must be ONE child — an inline
    // link between bare text nodes would otherwise break into its own column.
    return `<p class="caveat"><b>No linked account.</b><span>Your sign-in isn't linked to an account on the board, so orders can't be sent — you can still explore every play. New here? <a href="/add">Connect an account</a>. Already on the board, trades and all? It doesn't need re-adding, just linking to this sign-in — ask a league owner.</span></p>`;
  }
  return "";
}

export function renderTicketBody(model: TicketViewModel): string {
  const { state, snapshot } = model;
  const isOption = state.play.kind === "option";
  const preview = isOption ? viewPreview(model) : undefined;
  const gate = gateBanner(model);

  const content = `${DESK_STYLE}${TICKET_STYLE}<section class="desk">
    <header class="desk-head">
      <div>
        <div class="desk-eyebrow">New order${snapshot ? ` · ${escapeHtml(snapshot.displayName)}` : ""}</div>
        <h1 class="desk-title">${escapeHtml(state.play.name)}</h1>
        <p class="desk-sub">Course ${state.play.code} · ${escapeHtml(state.play.tldr)} · every order lands on a review screen before it's sent.</p>
      </div>
      ${modeToggle(state)}
    </header>
    ${gate}
    ${starterBar(state)}
    ${playPicker(state)}
    ${isOption ? optionTicket(model, preview) : stockTicket(model)}
    <p class="caveat"><b>Paper account.</b> Real prices, real mechanics, simulated money. Options premiums shown are indicative (bid/ask mid, or last close) — fills settle at the market. Options orders on Alpaca are day-only.</p>
  </section>
  ${TICKET_LOCK_SCRIPT}`;

  return renderShell(model.nav, content, model.generatedAt ?? new Date().toISOString());
}

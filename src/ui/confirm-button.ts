import { escapeHtml } from "./escape-html.js";

/**
 * THE NAMED-STATE CONFIRM BUTTON — a submit control that always says what it is doing.
 *
 * Why it exists: the failure mode this replaces is the bare greyed-out box. A member taps Confirm,
 * the button dims, nothing is written anywhere, and for two seconds they cannot tell whether the
 * order went in, is going in, or died. Every state here renders a **non-empty visible label**, so
 * the control narrates itself: idle → confirming → done, with `failed` as the honest fourth branch.
 *
 * Two colour decisions are load-bearing, not taste:
 *
 * - **`done` is ACCENT teal, never `--pos` green** — the same call `milestone-banner.ts` makes. A
 *   submitted paper order is an app event, not a market outcome; green would quietly imply the fill
 *   made money. `--pos` appears nowhere in this file.
 * - **`failed` uses `--neg` in its sanctioned DANGER sense** (docs/BRAND.md), and stays **enabled**,
 *   because the only useful thing a member can do with a failed submit is try it again. Without this
 *   fourth state a page whose submit errored would have to render `done` — a lie about an order.
 *
 * The optional `note` slot exists so a celebratory state can pair with plain-language explanation
 * (docs/BRAND.md: "Celebration pairs with explanation") — no delight without words.
 *
 * Pure function, state in → markup out, no DOM. `CONFIRM_BUTTON_STYLE` is exported separately so a
 * page includes the rules once.
 */

/** The four honest states of a submit. `failed` is deliberate — see the doc comment. */
export type ConfirmState = "idle" | "confirming" | "done" | "failed";

/** The default copy. Every entry is non-empty by contract — that is the whole point of the control. */
export const CONFIRM_LABELS: Record<ConfirmState, string> = {
  idle: "Confirm order",
  confirming: "Confirming…",
  done: "Order submitted ✓",
  failed: "Didn't go through — try again",
};

export interface ConfirmButtonOptions {
  /** Per-state copy overrides, e.g. `{ idle: "Place paper trade" }`. Escaped on render. */
  readonly labels?: Partial<Record<ConfirmState, string>>;
  /** Plain-language line under the button — what just happened, or what to do next. */
  readonly note?: string;
  /** Submitted form field name/value, for a form that posts which button was pressed. */
  readonly name?: string;
  readonly value?: string;
}

/** The rules for every confirm button on a page — include once, alongside the app's token block. */
export const CONFIRM_BUTTON_STYLE = `<style>
  .cbtn{ display:inline-flex; flex-direction:column; align-items:flex-start; gap:6px; font-family:var(--sans); }
  .cbtn-btn{ font:inherit; font-size:13.5px; line-height:1.2; padding:10px 18px; border-radius:10px;
    border:1px solid var(--border); background:var(--surface); color:var(--text); cursor:pointer; }
  .cbtn-idle .cbtn-btn{ border-color:color-mix(in srgb,var(--accent) 45%,var(--border)); }
  .cbtn-idle .cbtn-btn:hover{ border-color:var(--accent); }
  /* Busy, and saying so. The pulse is the garnish; the word "Confirming…" is the actual signal. */
  .cbtn-confirming .cbtn-btn{ color:var(--muted); cursor:progress;
    animation:cbtn-pulse 1.1s ease-in-out infinite; }
  /* ACCENT, never the P/L green — a submitted paper order is an app event, not a market outcome. */
  .cbtn-done .cbtn-btn{ border-color:var(--accent); color:var(--accent);
    background:color-mix(in srgb,var(--accent) 12%,var(--surface)); }
  .cbtn-failed .cbtn-btn{ border-color:var(--neg); color:var(--neg); }
  .cbtn-note{ max-width:36ch; font-size:12px; line-height:1.45; color:var(--muted); }
  @keyframes cbtn-pulse{ 0%,100%{ opacity:1; } 50%{ opacity:.62; } }
  @media (prefers-reduced-motion:reduce){ .cbtn-confirming .cbtn-btn{ animation:none; } }
</style>`;

/**
 * Render the button for one state. `confirming` is the only disabled state, and it is disabled
 * *with* a label and `aria-busy` — never a silent grey box.
 */
export function renderConfirmButton(state: ConfirmState, opts: ConfirmButtonOptions = {}): string {
  const label = opts.labels?.[state] ?? CONFIRM_LABELS[state];
  const busy = state === "confirming";
  const attrs = [
    `class="cbtn-btn"`,
    `type="submit"`,
    `data-state="${state}"`,
    opts.name === undefined ? "" : `name="${escapeHtml(opts.name)}"`,
    opts.value === undefined ? "" : `value="${escapeHtml(opts.value)}"`,
    busy ? `disabled aria-busy="true"` : "",
  ]
    .filter((a) => a !== "")
    .join(" ");
  const note =
    opts.note === undefined ? "" : `<span class="cbtn-note">${escapeHtml(opts.note)}</span>`;
  return `<span class="cbtn cbtn-${state}"><button ${attrs}>${escapeHtml(label)}</button>${note}</span>`;
}

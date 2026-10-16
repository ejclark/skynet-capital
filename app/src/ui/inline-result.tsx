import type { ReactElement, ReactNode } from "react";

/** Whether an action worked (`ok`, a ✓) or was refused / failed (`err`, a ✕). */
export type ResultTone = "ok" | "err";

/** The look per tone: the global `.set-ok` / `.set-err` rules (`styles/inline-result.css`). */
const CLASS: Record<ResultTone, string> = { ok: "set-ok", err: "set-err" };

/** The live-region role per tone: a success is polite news, a failure interrupts. */
const ROLE: Record<ResultTone, "status" | "alert"> = { ok: "status", err: "alert" };

/**
 * Says in one sentence how an action came out — saved, refused, failed — with a ✓ or ✕ before it.
 *
 * The mark is drawn by the sheet (`::before`), so a red line and a green line differ by shape as
 * well as hue: a standing reader is red/green colourblind (docs/BRAND.md → Accessibility). The
 * sentence is the caller's, word for word — usually the server's own refusal. It announces itself
 * (`role="status"` for ok, `role="alert"` for err); pass `live={false}` when an ancestor is
 * already an `aria-live` region, or when the line is a standing notice drawn on first paint, so a
 * screen reader hears it once and not on load. `as="span"` sits it inside a row or another `<p>`;
 * `className` adds a surface's layout class (`tkt-close-note`) without touching the mark.
 *
 * @whenNot the state is the whole section's — a page or panel that could not load, an empty list,
 *   a loading line — that is a section state, not one action's result; and a number with a sign
 *   (P/L, a change) is a tone on the number (`tone-neg`), not a sentence.
 */
export function InlineResult({
  tone,
  children,
  as: Tag = "p",
  live = true,
  className,
}: {
  readonly tone: ResultTone;
  readonly children: ReactNode;
  readonly as?: "p" | "span";
  readonly live?: boolean;
  readonly className?: string;
}): ReactElement {
  return (
    <Tag
      className={className ? `${CLASS[tone]} ${className}` : CLASS[tone]}
      role={live ? ROLE[tone] : undefined}
    >
      {children}
    </Tag>
  );
}

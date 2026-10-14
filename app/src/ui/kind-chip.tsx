import type { ReactElement, ReactNode } from "react";

/** Who an account is: a member trading by hand, or a bot trading on its own rules. */
export type AccountKind = "human" | "bot";

/** The chip's word for each kind, one casing everywhere (the ~10-site majority, #5365). */
const WORD: Record<AccountKind, { readonly one: string; readonly many: string }> = {
  human: { one: "HUMAN", many: "HUMANS" },
  bot: { one: "BOT", many: "BOTS" },
};

/**
 * Says whether an account is a BOT or a HUMAN, in the same chip on every screen.
 *
 * The look is the global `.chip` + `.chip-bot` / `.chip-human` rules (`styles/board.css`), so the
 * kind reads by word and by shape (the bot chip is outlined, the human chip filled) — never by hue
 * alone. `you` swaps the kind for the viewer's own row (`.chip-you`, `styles/league-card.css`);
 * `plural` names a cohort ("HUMANS"); `detail` follows the word after a middle dot
 * ("HUMAN · Eric"); `className` adds a surface's layout class without touching the look.
 *
 * @whenNot the label is not an account's kind — a strategy, playbook or persona name wants its
 *   own chip style (#5365), and SIM / LIVE is `EnvPill`. Plain menu text ("Bot · SIM") is not a
 *   chip either.
 */
export function KindChip({
  kind,
  you = false,
  plural = false,
  detail,
  className,
}: {
  readonly kind: AccountKind;
  readonly you?: boolean;
  readonly plural?: boolean;
  readonly detail?: ReactNode;
  readonly className?: string;
}): ReactElement {
  const tone = you ? "chip-you" : `chip-${kind}`;
  const word = you ? "YOU" : WORD[kind][plural ? "many" : "one"];
  return (
    <span className={className ? `chip ${tone} ${className}` : `chip ${tone}`}>
      {word}
      {detail === undefined ? null : <> · {detail}</>}
    </span>
  );
}

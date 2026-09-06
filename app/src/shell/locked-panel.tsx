import type { ReactElement } from "react";
import type { PlayInfo } from "../live/options";

/**
 * THE LOCKED-RUNG PANEL (#738 phase 10b; shared with the stock ticket since the ladder-lock bug
 * fix of 2026-09-06) — what any ticket shows instead of its form when the rung isn't unlocked yet.
 * One shape wherever a rung is locked, stock or option: the name, the reason, and the rung that
 * opens it. Rendering only; the server refuses a locked play at review and submit regardless.
 *
 * No self-serve way off the ladder here (#1671 decision 1: "block until earned" taken literally,
 * 2026-09-06) — the wheels-off button this panel used to show was one click past every gate for
 * any member, which undercuts the same reasoning that places a rung at its tier in the first
 * place. Wheels come off on their own once the ladder is fully earned, or via the seeding rule
 * for an account with fill history; `POST /api/trade/wheels` refuses an early flip regardless.
 * @category trading
 */
export function LockedPanel({ play }: { readonly play: PlayInfo }): ReactElement {
  return (
    <section className="panel gate-panel" aria-label="Locked play">
      <h2 className="panel-title">🔒 {play.name}</h2>
      <p className="panel-sub">
        Course {play.code} · {play.tldr}
      </p>
      <p className="tkt-locked">
        Training wheels are on, and this rung hasn't been unlocked yet
        {play.opensAfter
          ? ` — it opens after your first filled ${play.opensAfter.code} (${play.opensAfter.name})`
          : ""}
        .
      </p>
    </section>
  );
}

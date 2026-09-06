import { useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import type { PlayInfo } from "../live/options";
import { setWheels } from "../live/options";

/**
 * THE LOCKED-RUNG PANEL (#738 phase 10b; shared with the stock ticket since the ladder-lock bug
 * fix of 2026-09-06) — what any ticket shows instead of its form when the rung isn't unlocked yet.
 * One shape wherever a rung is locked, stock or option: the name, the reason, the rung that opens
 * it, and the one action that lifts every gate. Rendering only; the server refuses a locked play
 * at review and submit regardless of whether this panel is ever bypassed.
 * @category trading
 */
export function LockedPanel({ play }: { readonly play: PlayInfo }): ReactElement {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const off = async () => {
    setBusy(true);
    try {
      await setWheels(false);
      await queryClient.invalidateQueries({ queryKey: ["plays"] });
    } finally {
      setBusy(false);
    }
  };
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
      <button type="button" className="btn" disabled={busy} onClick={() => void off()}>
        {busy ? "…" : "Turn the wheels off — open the full catalog"}
      </button>
    </section>
  );
}

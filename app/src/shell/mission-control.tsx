import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import { type ControlAction, type Fleet, fetchControls, postControlAction } from "../live/controls";

/**
 * MISSION CONTROL IN THE SHELL (#738 phase 8c) — the owner's switchboard for the autonomous
 * fleet, ported from the desk's Settings tab (`settings-view.ts`) with its rules intact: the
 * panel renders ONLY when `/api/controls` says the session is an owner (a member's settings page
 * simply doesn't have it, exactly as the HTML tab leaks nothing); every switch posts one action
 * through the same server authority the HTML form uses; and the honesty copy carries over —
 * latency stated (~30 s, no restart), a suspended bot red and a trading one green (the market-
 * color rule: standing down IS a market-facing state), and the safety nets named as independent.
 */

function StateChip({ suspended }: { readonly suspended: boolean }): ReactElement {
  return suspended ? (
    <span className="mc-chip mc-neg">SUSPENDED</span>
  ) : (
    <span className="mc-chip mc-pos">TRADING</span>
  );
}

/** @category desk */
export function MissionControl(): ReactElement | null {
  const queryClient = useQueryClient();
  const controls = useQuery({ queryKey: ["controls"], queryFn: fetchControls });
  const [busy, setBusy] = useState<string | undefined>();
  const [note, setNote] = useState<{ ok: boolean; message: string } | undefined>();
  if (!controls.data?.owner) return null;
  const fleet: Fleet = controls.data.fleet;

  const act = async (action: ControlAction, bot?: string) => {
    setBusy(bot ?? action);
    try {
      setNote(await postControlAction(action, bot));
      await queryClient.invalidateQueries({ queryKey: ["controls"] });
    } catch (err) {
      setNote({ ok: false, message: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <section className="set-card mc" aria-live="polite">
      <h2 className="set-card-h">🛰 Mission Control — the whole fleet</h2>
      <p className="mc-sub">
        Every control here takes effect within ~30 seconds, for every bot in the league. Safety nets
        are independent of this page — the readiness gate, risk guards, circuit breakers and the
        host kill switch all still apply.
      </p>
      {note ? <p className={note.ok ? "set-ok" : "set-err"}>{note.message}</p> : null}
      {fleet.allSuspended ? (
        <div className="mc-stop">
          <p className="mc-stop-line">
            <b>ALL AUTONOMOUS TRADING IS SUSPENDED.</b> Lift it and each bot returns to its own
            setting below.
          </p>
          <button
            type="button"
            className="btn btn-primary mc-btn"
            disabled={busy !== undefined}
            onClick={() => void act("resume-all")}
          >
            {busy === "resume-all" ? "Lifting…" : "Lift global suspend"}
          </button>
        </div>
      ) : (
        <div className="mc-global">
          <button
            type="button"
            className="btn mc-btn mc-danger"
            disabled={busy !== undefined}
            onClick={() => void act("suspend-all")}
          >
            {busy === "suspend-all" ? "Suspending…" : "Suspend ALL autonomous trading"}
          </button>
          <p className="mc-note">
            The everything-stops switch — <b>every</b> bot on the board stands down within ~30
            seconds, not just one desk.
          </p>
        </div>
      )}
      <div className="mc-rows">
        {fleet.bots.length === 0 ? (
          <p className="note">No bots on the board.</p>
        ) : (
          fleet.bots.map((bot) => {
            const halted = fleet.allSuspended || bot.suspended;
            return (
              <div key={bot.id} className="mc-row">
                <span className="mc-who">
                  <span className="mc-name">{bot.displayName}</span>
                  <span className="mc-id num">{bot.id}</span>
                </span>
                <StateChip suspended={halted} />
                <button
                  type="button"
                  className={`btn mc-btn${bot.suspended ? " btn-primary" : " mc-danger"}`}
                  disabled={busy !== undefined}
                  onClick={() => void act(bot.suspended ? "resume" : "suspend", bot.id)}
                >
                  {busy === bot.id
                    ? "Saving…"
                    : bot.suspended
                      ? "Resume trading"
                      : "Suspend trading"}
                </button>
              </div>
            );
          })
        )}
      </div>
      {fleet.updatedAt ? (
        <p className="mc-note num">
          Last change {fleet.updatedAt.slice(0, 16).replace("T", " ")} UTC by{" "}
          {fleet.updatedBy ?? "unknown"}
        </p>
      ) : null}
    </section>
  );
}

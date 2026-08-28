import type { ReactElement } from "react";
import { useState } from "react";
import { botControlRequest, type OwnedAccount } from "../live/settings";

/**
 * THE OWN-BOT SWITCH (#738 phase 9b) — `/account/bot-control`'s fold-in, on the shell's account
 * card. Self-service for a bot the session OWNS — the same tier as renaming it, deliberately not
 * Mission Control's fleet-wide authority (that card answers to the env allowlist). The server
 * re-checks ownership on every post; honesty rules carry over: latency stated, and a bot held by
 * the fleet-wide stand-down says so rather than pretending its own switch is what stopped it.
 */
export function BotSwitch({
  account,
  fleetSuspended,
  onChanged,
}: {
  readonly account: OwnedAccount;
  readonly fleetSuspended: boolean;
  readonly onChanged: () => void;
}): ReactElement | null {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  if (account.suspended === undefined) return null;
  const halted = fleetSuspended || account.suspended;

  const flip = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await botControlRequest({
        id: account.id,
        action: account.suspended ? "resume" : "suspend",
      });
      if (answer.ok) onChanged();
      else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bot-switch">
      <span className="bot-switch-line">
        Autonomous trading is currently <b>{halted ? "suspended" : "active"}</b> for this bot.
        {fleetSuspended && !account.suspended
          ? " Held by the fleet-wide suspend — its own switch is on."
          : ""}
      </span>
      <button
        type="button"
        className={`btn mc-btn${account.suspended ? " btn-primary" : " mc-danger"}`}
        disabled={busy}
        onClick={() => void flip()}
      >
        {busy ? "Saving…" : account.suspended ? "Resume trading" : "Suspend trading"}
      </button>
      {error ? <span className="set-err">{error}</span> : null}
      <span className="mc-note">Takes effect within ~30 seconds — no restart, no env push.</span>
    </div>
  );
}

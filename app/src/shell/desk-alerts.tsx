import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import {
  type AlertPriority,
  type DeskAlert,
  dismissDeskAlert,
  fetchDeskAlerts,
} from "../live/alerts";

/**
 * THE ALERTS STRIP (#3407 P4 slice 1) — what a member's own option positions are saying right
 * now: expiry reminders a month / a week / today out, assignment risk on a short in the money
 * inside a week, a long that expires worthless at this price. The server derives them from the
 * positions card's own read (`position-watch.ts`), so nothing here is a second opinion.
 *
 * Honesty rules: priority is a WORD and a glyph, never a hue alone (a standing reader is
 * red/green colourblind); an unlinked account says so instead of an empty list; Dismiss is one tap
 * (a dismissal risks nothing) and the same condition escalating re-shows; where the deployment
 * keeps no dismissals the strip says that rather than offering a button that forgets.
 * @category trading
 */

const PRIORITY_GLYPH: Record<AlertPriority, string> = { critical: "‼", warning: "!", info: "i" };
const PRIORITY_WORD: Record<AlertPriority, string> = {
  critical: "Act now",
  warning: "Worth a look",
  info: "FYI",
};

function AlertRow({
  alert,
  onDismiss,
  pending,
}: {
  readonly alert: DeskAlert;
  readonly onDismiss?: (alert: DeskAlert) => Promise<void>;
  readonly pending: boolean;
}): ReactElement {
  return (
    <li className={`al-row al-${alert.priority}`}>
      <span className="al-badge">
        <span className="al-glyph" aria-hidden="true">
          {PRIORITY_GLYPH[alert.priority]}
        </span>
        {PRIORITY_WORD[alert.priority]}
      </span>
      <span className="al-main">
        <span className="al-title">{alert.title}</span>
        {alert.body ? <span className="al-body">{alert.body}</span> : null}
      </span>
      {onDismiss ? (
        <button
          type="button"
          className="btn al-btn"
          disabled={pending}
          onClick={() => onDismiss(alert)}
        >
          {pending ? "Dismissing…" : "Dismiss"}
        </button>
      ) : null}
    </li>
  );
}

/** @category trading */
export function DeskAlerts({ deskId }: { readonly deskId: string }): ReactElement | null {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["desk-alerts", deskId],
    queryFn: () => fetchDeskAlerts(deskId),
    enabled: deskId !== "",
    staleTime: 30_000,
  });
  const [pendingId, setPendingId] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  if (deskId === "" || !query.data) return null;
  const data = query.data;

  const onDismiss = async (alert: DeskAlert) => {
    setPendingId(alert.id);
    setNotice(undefined);
    try {
      const result = await dismissDeskAlert(deskId, alert.fingerprint);
      if (!result.ok) setNotice(result.refusals.join(" "));
    } catch (error) {
      setNotice(`Couldn't reach the gate — ${String(error)}`);
    } finally {
      setPendingId(undefined);
      await queryClient.invalidateQueries({ queryKey: ["desk-alerts", deskId] });
    }
  };

  return (
    <section className="wr-panel al-panel" aria-label="Alerts">
      <h3 className="wr-h">Alerts</h3>
      {!data.available ? (
        <p className="tkt-note">
          Alerts read your own option positions, and this session isn't linked to a trading account
          yet.
        </p>
      ) : data.alerts.length === 0 ? (
        <p className="tkt-note">
          Nothing to flag — expiry reminders and assignment risk on your option positions show here.
        </p>
      ) : (
        <ul className="wr-list al-list">
          {data.alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onDismiss={data.dismissable ? onDismiss : undefined}
              pending={pendingId === alert.id}
            />
          ))}
        </ul>
      )}
      {data.available && !data.dismissable && data.alerts.length > 0 ? (
        <p className="al-note">
          This deployment doesn't keep dismissals, so alerts stay until the condition clears.
        </p>
      ) : null}
      <p className="al-note" aria-live="polite">
        {notice}
      </p>
    </section>
  );
}

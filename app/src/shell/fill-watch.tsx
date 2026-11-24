import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import { armFillWatch, fillWatchQuery } from "../live/fill-watch";

/**
 * ONE TAP, ONE ORDER, ONE EMAIL (#8251) — under a live order's note on the receipt, above Modify
 * and Cancel. An order placed after hours waits for the open, and nothing told the member when it
 * filled; this arms a single email for this order only. It never touches the Alerts panel's
 * account-wide channel or floor.
 *
 * Three states, each said in words (a standing reader is red/green colourblind, so the armed state
 * is a check glyph plus a sentence, never a tone):
 *  - the button, "Email me when it fills";
 *  - armed, "✓ We'll email <address> when it fills" — the session's own address, from the server;
 *  - unavailable, the route's own sentence instead of the button (production until the mail
 *    credential is set, #6501).
 * @category trading
 */
export function FillWatch({
  deskId,
  orderId,
}: {
  readonly deskId: string;
  readonly orderId: string;
}): ReactElement | null {
  const queryClient = useQueryClient();
  const state = useQuery(fillWatchQuery(deskId, orderId));
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<string | undefined>();

  if (!state.data) return null;
  if (!state.data.available) {
    return <p className="tkt-note receipt-watch-off">{state.data.reason}</p>;
  }
  if (state.data.watching) {
    return (
      <p className="receipt-watch" role="status">
        <span aria-hidden="true">✓</span> We'll email{" "}
        <span className="receipt-watch-to">{state.data.destination}</span> when it fills
      </p>
    );
  }

  const onArm = async () => {
    setBusy(true);
    setRefusal(undefined);
    try {
      const answer = await armFillWatch(deskId, orderId);
      if (answer.ok) {
        queryClient.setQueryData(fillWatchQuery(deskId, orderId).queryKey, {
          available: true,
          watching: answer.watching,
          ...(answer.destination ? { destination: answer.destination } : {}),
        });
      } else {
        setRefusal(answer.refusals.join(" "));
      }
    } catch (error) {
      setRefusal(`Couldn't reach the server — ${String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="receipt-watch-arm">
      <button type="button" className="btn" onClick={() => void onArm()} disabled={busy}>
        Email me when it fills
      </button>
      {refusal ? (
        <p className="tkt-note" role="alert">
          {refusal}
        </p>
      ) : null}
    </div>
  );
}

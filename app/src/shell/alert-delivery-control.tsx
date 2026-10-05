import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import type { AlertPriority } from "../live/alerts";
import { type DeliveryChannel, fetchAlertDelivery, saveAlertDelivery } from "../live/alerts";

/**
 * SEND THESE TO ME (#3407 P4 slice 3) — the member's own switch for whether the alerts on this
 * panel also reach them when the page is closed, and the floor of loudness worth sending.
 *
 * Mobile-first: at 390 it is two stacked fields and one line of truth beneath them; the wider
 * viewport only puts the two fields side by side. There is no address field anywhere — delivery
 * goes to the address the member signed in with and the server never accepts another, so this
 * control SHOWS the destination rather than asking for it.
 *
 * Every unavailable state is a sentence, never a disabled control with no explanation: a deployment
 * with no mail credential, a sign-in that carried a login instead of an email, a provider that
 * refused the confirmation message. The confirmation is the point of the opt-in — a member learns
 * the path works now rather than at the moment an assignment-risk alert needed it to.
 * @category trading
 */

const FLOOR_WORDS: Record<AlertPriority, string> = {
  critical: "Act now only",
  warning: "Act now and worth a look",
  info: "Everything",
};

/** @category trading */
export function AlertDeliveryControl({ deskId }: { readonly deskId: string }): ReactElement | null {
  const queryClient = useQueryClient();
  const channelId = useId();
  const floorId = useId();
  const [notice, setNotice] = useState<string | undefined>();
  const query = useQuery({
    queryKey: ["alert-delivery", deskId],
    queryFn: () => fetchAlertDelivery(deskId),
    enabled: deskId !== "",
    staleTime: 60_000,
  });
  const save = useMutation({
    mutationFn: (next: { channel: DeliveryChannel; minPriority: AlertPriority }) =>
      saveAlertDelivery(deskId, next.channel, next.minPriority),
    onSuccess: async (result) => {
      setNotice(result.refusals?.join(" "));
      await queryClient.invalidateQueries({ queryKey: ["alert-delivery", deskId] });
    },
    onError: (error) => setNotice(`Couldn't save that — ${String(error)}`),
  });

  if (deskId === "" || !query.data) return null;
  const data = query.data;
  const on = data.channel !== "off";

  return (
    <div className="ad-box">
      <h4 className="ad-h">Send these to me</h4>
      {data.available ? (
        <>
          <div className="ad-fields">
            <div className="field">
              <label htmlFor={channelId}>Delivery</label>
              <select
                id={channelId}
                value={data.channel}
                disabled={save.isPending}
                onChange={(e) =>
                  save.mutate({
                    channel: e.target.value as DeliveryChannel,
                    minPriority: data.minPriority,
                  })
                }
              >
                <option value="off">Off — this page only</option>
                <option value="email">Email me</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor={floorId}>Send me</label>
              <select
                id={floorId}
                value={data.minPriority}
                disabled={save.isPending || !on}
                onChange={(e) =>
                  save.mutate({
                    channel: data.channel,
                    minPriority: e.target.value as AlertPriority,
                  })
                }
              >
                {(["critical", "warning", "info"] as const).map((priority) => (
                  <option key={priority} value={priority}>
                    {FLOOR_WORDS[priority]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="al-note">
            {save.isPending
              ? "Saving…"
              : on
                ? `Going to ${data.destination ?? "your sign-in address"}${data.from ? `, from ${data.from}` : ""}. Dismissed alerts are never sent, and the same alert is only sent once.`
                : "Alerts stay on this page. Turn this on and you get one test message straight away."}
          </p>
        </>
      ) : (
        <p className="al-note">{data.reason}</p>
      )}
      <p className="al-note" aria-live="polite">
        {notice}
      </p>
    </div>
  );
}

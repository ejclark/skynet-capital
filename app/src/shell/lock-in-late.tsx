import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { DeskOrderRow } from "../live/orders";
import { celebrateLockIn } from "./lock-in-ceremony";
import { lockInOfRow, prune, rememberedCloses } from "./lock-in-memory";
import { deskOrdersQuery } from "./working-orders";

/**
 * THE LATE LOCK-IN CHECK (#7383 slice 2): on the member's next Profile → Overview load, a close
 * remembered at send (`lock-in-memory.ts`, which says why and what is remembered) whose order now
 * reads filled at a gain gets the "Profit locked in" moment, through the one host that shows each
 * order id once (`lock-in-ceremony.tsx`).
 */

const ENDED_UNFILLED = new Set<DeskOrderRow["state"]>(["cancelled", "rejected", "expired"]);

/**
 * One account's check, on the Overview: celebrate every remembered close whose order now reads
 * filled at a gain. Reads the order list only when something is remembered, so an account that never
 * sent a flagged close costs nothing.
 */
function LateLockInCheck({ deskId }: { readonly deskId: string }): null {
  // Read once per mount: "the next Overview load" is the trigger, not every render.
  const [remembered] = useState(() => rememberedCloses(deskId));
  const orders = useQuery({ ...deskOrdersQuery(deskId), enabled: remembered.length > 0 });
  const data = orders.data;
  useEffect(() => {
    if (!data?.available) return;
    const rows = [...data.working, ...data.recent];
    const ended = new Set<string>();
    for (const row of rows) {
      if (ENDED_UNFILLED.has(row.state)) ended.add(row.id);
      const kept = lockInOfRow(remembered, row);
      if (kept) celebrateLockIn({ orderId: row.id, kept });
    }
    prune(deskId, ended, Date.now());
  }, [data, remembered, deskId]);
  return null;
}

/** Mounted by Profile → Overview: one check per account the page shows. */
export function LateLockIns({ deskIds }: { readonly deskIds: readonly string[] }) {
  return (
    <>
      {deskIds
        .filter((id) => id !== "")
        .map((id) => (
          <LateLockInCheck key={id} deskId={id} />
        ))}
    </>
  );
}

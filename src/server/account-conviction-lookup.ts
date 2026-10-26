import { CONVICTIONS, type ConvictionLookup } from "../playbooks/conviction-store.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";

/** The records a pointer on this account resolves to: the seeded ones, then the member views handed
 *  to it — the bots' own rule (`autonomous-convictions.ts`), so a row or a roll-call line never
 *  shows a view that does not steer that bot. Shared by the Store's rows and the desk's roll call
 *  (#5482), so both read one lookup. */
export function accountConvictionLookup(
  config: Pick<DashboardServerConfig, "memberConvictions">,
  accountId: string,
): ConvictionLookup {
  const held = config.memberConvictions?.pointers().heldBy(accountId) ?? [];
  return (id) => CONVICTIONS.get(id) ?? held.find((c) => c.id === id);
}

/**
 * Boot-time wiring for `/account`'s Day-2 admin (profile edit + removal) — pulled out of
 * `serve-dashboard.ts` for the same complexity-budget reason `dashboard-feedback.ts` and
 * `dashboard-companion.ts` are (`scripts/arch-scan.mjs`). Pure assembly, no state of its own.
 */

import type { ParticipantStore } from "../participants/participant-store.js";
import type { AccountAdmin } from "../server/account-forms.js";
import type { createAccountService } from "../server/account-service.js";

export function buildAccountAdmin(
  accounts: ReturnType<typeof createAccountService>,
  store: ParticipantStore,
): AccountAdmin {
  return {
    updateProfile: accounts.updateProfile,
    removeAccount: accounts.removeAccount,
    profileFor: (id) => {
      const stored = store.load().find((p) => p.id === id);
      return stored
        ? {
            displayName: stored.displayName,
            ...(stored.timezone ? { timezone: stored.timezone } : {}),
          }
        : undefined;
    },
  };
}

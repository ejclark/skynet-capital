import type {
  RemoveAccountInput,
  RemoveAccountResult,
  UpdateProfileInput,
  UpdateProfileResult,
} from "./account-service.js";
import type { Session } from "./auth/session.js";

/**
 * DAY-2 ACCOUNT MANAGEMENT's shared surface — the authorization rules live in
 * `account-service.ts`; this module carries only what the shell's `/api/settings`
 * (`settings-api-routes.ts`) still needs directly.
 */

/** The service surface `serve-dashboard.ts` wires in (see `account-service.ts`). */
export interface AccountAdmin {
  readonly updateProfile: (input: UpdateProfileInput) => Promise<UpdateProfileResult>;
  readonly removeAccount: (input: RemoveAccountInput) => Promise<RemoveAccountResult>;
  /** Current stored profile for prefill — undefined for env-configured or unknown ids. */
  readonly profileFor: (
    id: string,
  ) => { readonly displayName: string; readonly timezone?: string } | undefined;
}

/** The identity strings `resolveCurrentId` matches display names against — session name and
 *  email local-part, lowercased. A human rename must land on one of these (account-service.ts). */
export function sessionNameCandidates(session: Session | undefined): string[] {
  if (!session) return [];
  const name = session.name?.toLowerCase().trim();
  const local = session.email.split("@")[0]?.toLowerCase().trim();
  return [...(name ? [name] : []), ...(local ? [local] : [])];
}

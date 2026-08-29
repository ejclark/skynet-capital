import type { OpsStatus } from "./ops-status-service.js";

/**
 * The bots/deploy health panel's shape (#666 slice 1; served as data at `/api/admin/ops-status`
 * since #738 phase 9e — `admin-api-routes.ts` calls `status()`/`isOwner` directly).
 */
export interface OpsStatusDeps {
  /** True when this email is on the env allowlist — an owner, not merely a member. */
  readonly isOwner: (email: string) => boolean;
  /** Reads the live signals, recomputing/re-caching as needed. Never throws. */
  readonly status: () => Promise<OpsStatus>;
}

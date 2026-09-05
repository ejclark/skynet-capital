import type { OpsStatus } from "./ops-status-service.js";

/**
 * The bots/deploy health panel's shape (#666 slice 1; served as data at `/api/ops-status` since
 * #1296 — `content-api-routes.ts` calls `status()` directly).
 *
 * There is no owner predicate here any more: fleet health is group-visible (#1296), so the only
 * gate is the app-wide auth gate every route already sits behind.
 */
export interface OpsStatusDeps {
  /** Reads the live signals, recomputing/re-caching as needed. Never throws. */
  readonly status: () => Promise<OpsStatus>;
}

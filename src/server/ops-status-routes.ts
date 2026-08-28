import type { ServerResponse } from "node:http";
import type { NavContext } from "../observatory/dashboard-shell.js";
import { renderOpsStatusBody } from "../observatory/ops-status-view.js";
import type { OpsStatus } from "./ops-status-service.js";
import { requireOwnerOnRailedPage } from "./owner-gate.js";
import { railedShell } from "./page-shell.js";

/**
 * `/ops-status` — the owner's read-only bots/deploy health panel (#666 slice 1). GET-only: this
 * page holds no write credential and no route it adds mutates infra state, so there is no POST
 * half to gate the way `/invite`/`/claim` need. Same security model as every other owner page —
 * `requireOwner` re-checked HERE, never inherited from the call site, and rails apply on the
 * refusal too (Eric, 2026-08-25: "the app template applies everywhere").
 */
export interface OpsStatusDeps {
  /** True when this email is on the env allowlist — an owner, not merely a member. */
  readonly isOwner: (email: string) => boolean;
  /** Reads the live signals, recomputing/re-caching as needed. Never throws. */
  readonly status: () => Promise<OpsStatus>;
}

export async function handleOpsStatus(
  res: ServerResponse,
  viewerEmail: string | undefined,
  deps: OpsStatusDeps,
  nav: NavContext,
): Promise<void> {
  const owner = requireOwnerOnRailedPage(res, viewerEmail, deps.isOwner, nav);
  if (!owner) return;
  const status = await deps.status();
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(railedShell("Ops status", nav, renderOpsStatusBody(status)));
}

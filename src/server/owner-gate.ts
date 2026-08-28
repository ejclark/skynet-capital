import type { ServerResponse } from "node:http";
import type { NavContext } from "../observatory/dashboard-shell.js";
import { railedShell } from "./page-shell.js";
import { requireOwner } from "./self-service-forms.js";

/**
 * `requireOwner` rendered through the standard railed shell — the four-line idiom every owner-
 * only page (`/invite`, `/claim`, `/ops-status`, Mission Control) otherwise repeats inline. Its
 * own file, not folded into `self-service-forms.ts`, so a new owner-only page reaching for it
 * doesn't also pull in every self-service form helper — and so `self-service-forms.ts` stays
 * clear of the house 300-line file cap (`scripts/arch-scan.mjs`).
 */
export function requireOwnerOnRailedPage(
  res: ServerResponse,
  viewerEmail: string | undefined,
  isOwner: (email: string) => boolean,
  nav: NavContext,
): string | null {
  return requireOwner(res, viewerEmail, isOwner, (title, inner) => railedShell(title, nav, inner));
}

import type { IncomingMessage, ServerResponse } from "node:http";
import { derivePlaybooks, PLAYBOOKS_MILESTONE } from "../domain/playbook-catalog.js";
import { earnedCodes } from "../domain/progression.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { requireGet, sendJson } from "./page-shell.js";

/**
 * MILESTONE M·03 AS DATA — `GET /api/playbooks` (#1119). The human playbook catalog with the
 * VIEWER'S unlock state, derived from the same progression view the ladder uses: a playbook is
 * unlocked when the rung that proves it is earned by a real fill. Read-only and WIP by design —
 * there is no arm endpoint, and this file will not grow one until Season 1's arming lands with its
 * own gates. No progression service, or no linked desk: the catalog, nothing unlocked.
 */
export async function servePlaybooksApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/playbooks") return false;
  if (!requireGet(req, res)) return true;
  const id = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  const progression = id && config.progression ? await config.progression.view(id) : undefined;
  const view = derivePlaybooks(earnedCodes(progression?.earned ?? []));
  sendJson(res, 200, {
    linked: id !== undefined,
    milestone: PLAYBOOKS_MILESTONE,
    // Stated, not implied: the canvas's "WIP — Season 1" applies to the whole surface.
    arming: "season-1",
    ...view,
  });
  return true;
}

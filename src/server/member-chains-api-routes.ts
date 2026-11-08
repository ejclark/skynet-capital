import type { IncomingMessage, ServerResponse } from "node:http";
import {
  type ChainForm,
  type ChainRefusal,
  chainFromForm,
  formFromChain,
  parseChainForm,
} from "../playbooks/chain-form.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { creditFor } from "./feedback-attribution.js";
import { opaqueMemberId } from "./feedback-issue.js";
import type { MemberChainRecord } from "./member-chain-store.js";
import {
  boundedString,
  parseJsonRecord,
  readJsonPost,
  requireGet,
  sendJson,
} from "./page-shell.js";

/**
 * A MEMBER'S OWN CHAINS API (#6959 slice 3b) — the chains a member draws, returned to their author
 * and nobody else, and SHADOW ONLY (criterion 5): no route here subscribes a chain, schedules it or
 * hands it to a bot. Keyed by `opaqueMemberId(session.email)` like the campaigns.
 *
 *   GET  /api/playbook-chains         → { chains: MemberChainView[] }
 *   POST /api/playbook-chains/save    → { ok: true, chain } | { ok: false, refusals } | { ok: false, error }
 *   POST /api/playbook-chains/delete  → { ok: true } | { ok: false, error }
 *
 * A save is the form run through `chainFromForm` — the function the screen runs after every pick —
 * so the server is the authority and the screen is only an early read of it. A pick the form
 * refuses comes back as `refusals`, one sentence under the link it names, and nothing is written.
 * The credit line (`source`) is the session's own name, never a body field.
 *
 * Same auth invariant as the other member APIs: `!session` means the route doesn't exist (`false`),
 * before anything else runs.
 */

const CHAINS_BODY_CAP_BYTES = 4_096;
const CHAIN_MAX_ID = 100;

export interface MemberChainView {
  readonly id: string;
  readonly title: string;
  /** The form this was saved from, so Edit opens on exactly it. */
  readonly form: ChainForm;
  readonly updatedAt: string;
}

export function chainViewOf(record: MemberChainRecord): MemberChainView {
  return {
    id: record.chain.id,
    title: record.chain.title,
    form: formFromChain(record.chain),
    updatedAt: record.updatedAt,
  };
}

function parseSaveBody(
  raw: string,
): { readonly form: ChainForm; readonly replaceId?: string } | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const form = parseChainForm(body.form);
  if (!form) return undefined;
  if (body.replaceId === undefined) return { form };
  const replaceId = boundedString(body.replaceId, CHAIN_MAX_ID);
  return replaceId ? { form, replaceId } : undefined;
}

function save(
  res: ServerResponse,
  raw: string,
  config: DashboardServerConfig,
  session: Session,
  memberKey: string,
): void {
  const body = parseSaveBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed save body" });
    return;
  }
  const store = config.memberChains;
  if (!store) {
    sendJson(res, 200, { ok: false, error: "Chains aren't wired in this deployment." });
    return;
  }
  const made = chainFromForm(body.form, creditFor(session));
  if (!made.ok) {
    sendJson(res, 200, { ok: false, refusals: made.refusals });
    return;
  }
  const saved = store.save(memberKey, made.chain, body.replaceId);
  if (!saved.ok) {
    const refusal: ChainRefusal = { field: saved.field, reason: saved.reason };
    sendJson(res, 200, { ok: false, refusals: [refusal] });
    return;
  }
  sendJson(res, 200, { ok: true, chain: chainViewOf(saved.record) });
}

/** Handle `/api/playbook-chains*`. Returns true when answered, false when the route doesn't apply. */
export async function serveMemberChainsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (!session) return false;
  if (
    path !== "/api/playbook-chains" &&
    path !== "/api/playbook-chains/save" &&
    path !== "/api/playbook-chains/delete"
  ) {
    return false;
  }
  const memberKey = opaqueMemberId(session.email);
  if (path === "/api/playbook-chains") {
    if (!requireGet(req, res)) return true;
    const records = config.memberChains?.list(memberKey) ?? [];
    sendJson(res, 200, { chains: records.map(chainViewOf) });
    return true;
  }
  const raw = await readJsonPost(req, res, CHAINS_BODY_CAP_BYTES);
  if (raw === undefined) return true;
  if (path === "/api/playbook-chains/save") {
    save(res, raw, config, session, memberKey);
    return true;
  }
  const id = boundedString(parseJsonRecord(raw)?.id, CHAIN_MAX_ID);
  if (!id) {
    sendJson(res, 400, { error: "malformed delete body" });
    return true;
  }
  config.memberChains?.delete(memberKey, id);
  sendJson(res, 200, { ok: true });
  return true;
}

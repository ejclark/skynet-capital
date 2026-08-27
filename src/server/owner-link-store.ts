import { JsonFileStore } from "../storage/json-file-store.js";

/**
 * The owner-link file on the mounted volume (`SKYNET_OWNER_LINKS_FILE`, prod
 * `/data/owner-links.json`) — the durable answer to "which sign-in owns this account?" for
 * accounts that were never stamped with one.
 *
 * **Why it exists (#546).** A session may only trade the account it *owns*, and ownership lives
 * on `Participant.ownerEmail`, stamped from the session at `/add`. Two kinds of account can
 * never carry that stamp: env-declared roster rows (`SKYNET_HUMAN_<ID>_KEY`, and every bot),
 * which are rebuilt from the host's environment on every boot, and store rows added before the
 * connect form existed. Those accounts render on the board, accumulate real trade history, and
 * are permanently untradeable — while `/add` correctly refuses them as duplicates. This side
 * table is the missing link: it attaches an owner to an account that already exists, without
 * touching that account's credentials, its history, or the environment it came from.
 *
 * Plain JSON, deliberately NOT encrypted, matching `BotControlsStore` and for the same reason:
 * it holds no credentials — only an account id and the email of a member who can already sign
 * in, both of which the guest list and the board show anyway. Durability (atomic writes, total
 * reads) comes from `JsonFileStore`.
 */
export interface OwnerLink {
  /** The account being linked, e.g. `human-apala` or `sauron`. */
  readonly participantId: string;
  /** Lowercased email of the member who owns it. */
  readonly email: string;
  /** Lowercased email of the owner who made the link — an audit trail for a trading grant. */
  readonly linkedBy: string;
  /** ISO timestamp, for the admin view's "linked" column. */
  readonly at: string;
}

export interface OwnerLinkState {
  readonly links: readonly OwnerLink[];
  readonly updatedAt?: string;
}

const EMPTY_LINKS: OwnerLinkState = { links: [] };

/** Total parse: anything that isn't a well-formed link is dropped, never thrown over. */
function parseOwnerLinkState(raw: unknown): OwnerLinkState | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const links = (raw as { links?: unknown }).links;
  if (!Array.isArray(links)) return undefined;
  const updatedAt = (raw as { updatedAt?: unknown }).updatedAt;
  return {
    links: links.filter(isOwnerLink),
    ...(typeof updatedAt === "string" ? { updatedAt } : {}),
  };
}

function isOwnerLink(value: unknown): value is OwnerLink {
  if (typeof value !== "object" || value === null) return false;
  const link = value as Record<string, unknown>;
  return (
    typeof link.participantId === "string" &&
    link.participantId.length > 0 &&
    typeof link.email === "string" &&
    link.email.length > 0 &&
    typeof link.linkedBy === "string" &&
    typeof link.at === "string"
  );
}

export class OwnerLinkStore {
  private readonly file: JsonFileStore<OwnerLinkState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      empty: EMPTY_LINKS,
      parse: parseOwnerLinkState,
      label: "owner-links",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): OwnerLinkState {
    return this.file.load();
  }

  /** The email linked to an account, or undefined when nobody has claimed it. */
  emailFor(participantId: string): string | undefined {
    return this.load().links.find((l) => l.participantId === participantId)?.email;
  }

  /**
   * The accounts this email owns by link. Returned in link order so the answer is stable across
   * restarts; the desk resolves a session to the first still-eligible one (`resolveOwnedId`).
   */
  idsFor(email: string): string[] {
    const wanted = email.toLowerCase();
    return this.load()
      .links.filter((l) => l.email === wanted)
      .map((l) => l.participantId);
  }

  /**
   * Attach an account to a member. One link per account — re-linking the same id REPLACES it, so
   * a mistyped email is fixed by linking again rather than by editing the volume by hand.
   */
  link(participantId: string, email: string, linkedBy: string, at = new Date()): OwnerLinkState {
    const entry: OwnerLink = {
      participantId,
      email: email.toLowerCase(),
      linkedBy: linkedBy.toLowerCase(),
      at: at.toISOString(),
    };
    const next: OwnerLinkState = {
      links: [...this.load().links.filter((l) => l.participantId !== participantId), entry],
      updatedAt: entry.at,
    };
    this.file.write(next);
    return next;
  }

  /** Detach an account. Returns false when it wasn't linked — absent is a false, never a throw. */
  unlink(participantId: string, at = new Date()): boolean {
    const links = this.load().links;
    const remaining = links.filter((l) => l.participantId !== participantId);
    if (remaining.length === links.length) return false;
    this.file.write({ links: remaining, updatedAt: at.toISOString() });
    return true;
  }
}

/**
 * Resolve a signed-in email to the account it may trade — the whole precedence rule, in one pure
 * function so it can be specified rather than inferred from the server wiring.
 *
 * A `Participant.ownerEmail` stamped at `/add` ALWAYS wins: the volume file can fill in a missing
 * owner, never override a declared one, so a stray link can't redirect an account somebody
 * already connected. A link is honored only against an account that is really unowned and really
 * on the board — a link left behind by a since-removed account resolves to nobody, not to a ghost.
 */
type OwnableParticipant = { readonly id: string; readonly ownerEmail?: string };

/** The linked half of the precedence rule, shared by `resolveOwnedId` and
 *  `resolveOwnedParticipantIds` — a link only counts against a participant that carries no stamp
 *  of its own, so its result can never collide with a stamped id. */
function findUnstampedLinkedId(
  participants: readonly OwnableParticipant[],
  links: readonly OwnerLink[],
  wantedLowercased: string,
): string | undefined {
  return links
    .filter((l) => l.email === wantedLowercased)
    .map((l) => l.participantId)
    .find((id) => participants.some((p) => p.id === id && !p.ownerEmail));
}

export function resolveOwnedId(
  participants: readonly OwnableParticipant[],
  links: readonly OwnerLink[],
  email: string,
): string | undefined {
  const wanted = email.toLowerCase();
  const stamped = participants.find((p) => p.ownerEmail?.toLowerCase() === wanted);
  if (stamped) return stamped.id;
  return findUnstampedLinkedId(participants, links, wanted);
}

/**
 * Every id `email` may act on — the UNION of every stamped `Participant.ownerEmail` match and the
 * one linked account, never either/or (Eric, 2026-08-27, live: a member with a stamped human
 * account AND a separately `/claim`-linked bot only ever saw one of the two). Safe to union
 * unconditionally: a link only counts against an UNSTAMPED participant, so it can never collide
 * with a stampedId, and a stray link still can't redirect an already-stamped one.
 */
export function resolveOwnedParticipantIds(
  participants: readonly OwnableParticipant[],
  links: readonly OwnerLink[],
  email: string,
): string[] {
  const wanted = email.toLowerCase();
  const stampedIds = participants
    .filter((p) => p.ownerEmail?.toLowerCase() === wanted)
    .map((p) => p.id);
  const linkedId = findUnstampedLinkedId(participants, links, wanted);
  return linkedId ? [...stampedIds, linkedId] : stampedIds;
}

/** Build the store from the environment (`SKYNET_OWNER_LINKS_FILE`, default `data/owner-links.json`). */
export function createOwnerLinkStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): OwnerLinkStore {
  return new OwnerLinkStore(env.SKYNET_OWNER_LINKS_FILE ?? "data/owner-links.json", onReadError);
}

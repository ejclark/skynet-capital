import { JsonFileStore } from "../storage/json-file-store.js";

/**
 * The owner-link file on the mounted volume (`SKYNET_OWNER_LINKS_FILE`, prod
 * `/data/owner-links.json`) — the durable answer to "which sign-in owns this account?" for
 * accounts that were never stamped with one.
 *
 * **Why it exists.** A session may only trade the account it *owns*, and ownership lives
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
type OwnableParticipant = {
  readonly id: string;
  readonly kind?: "bot" | "human";
  readonly ownerEmail?: string;
};

/**
 * Every stamped match for `email`, HUMANS FIRST (stable within a kind). Since `/add` stamps the
 * adder onto bots too (2026-08-28), one email can carry both a stamped human and a stamped bot —
 * and the single-id consumers (`resolveOwnerIds(email)[0]` becomes the desk's `requesterId`)
 * must land on the human, not on whichever row happens to come first in roster order, or a bot
 * added before the member's own account would shadow it and lock the trade desk (the same
 * wrong-owned-account class reported live 2026-08-27).
 */
function stampedIdsFor(
  participants: readonly OwnableParticipant[],
  wantedLowercased: string,
): string[] {
  return participants
    .filter((p) => p.ownerEmail?.toLowerCase() === wantedLowercased)
    .sort((a, b) => Number(a.kind === "bot") - Number(b.kind === "bot"))
    .map((p) => p.id);
}

/** The linked half of the precedence rule, shared by `resolveOwnedId` and
 *  `resolveOwnedParticipantIds` — a link only counts against a participant that carries no stamp
 *  of its own, so its result can never collide with a stamped id. Every such link counts, not just
 *  the first: the Account-links admin page can link several unstamped accounts (bots included) to
 *  one email, and all of them are meant to be manageable, not just whichever was linked earliest
 *  (2026-08-28, live: three accounts linked to one email collapsed to one because this only ever
 *  returned its first match). */
function findUnstampedLinkedIds(
  participants: readonly OwnableParticipant[],
  links: readonly OwnerLink[],
  wantedLowercased: string,
): string[] {
  return links
    .filter((l) => l.email === wantedLowercased)
    .map((l) => l.participantId)
    .filter((id) => participants.some((p) => p.id === id && !p.ownerEmail));
}

export function resolveOwnedId(
  participants: readonly OwnableParticipant[],
  links: readonly OwnerLink[],
  email: string,
): string | undefined {
  const wanted = email.toLowerCase();
  return (
    stampedIdsFor(participants, wanted)[0] ?? findUnstampedLinkedIds(participants, links, wanted)[0]
  );
}

/**
 * Every id `email` may act on — the UNION of every stamped `Participant.ownerEmail` match and
 * every linked account, never either/or (Eric, 2026-08-27, live: a member with a stamped human
 * account AND a separately `/claim`-linked bot only ever saw one of the two) and never just the
 * first link (2026-08-28, live: three accounts linked to one email via the Account-links admin
 * page collapsed to whichever was linked earliest). Safe to union unconditionally: a link only
 * counts against an UNSTAMPED participant, so it can never collide with a stampedId, and a stray
 * link still can't redirect an already-stamped one.
 */
export function resolveOwnedParticipantIds(
  participants: readonly OwnableParticipant[],
  links: readonly OwnerLink[],
  email: string,
): string[] {
  const wanted = email.toLowerCase();
  return [
    ...stampedIdsFor(participants, wanted),
    ...findUnstampedLinkedIds(participants, links, wanted),
  ];
}

/**
 * The REVERSE lookup — the email that owns a participant id: its stamped `ownerEmail` first, else
 * the claim link. This is what turns a desk id into the feedback log's key (`opaqueMemberId` of
 * the email) for the engagement track; before it existed the progression service read the log
 * with the participant id itself and found nothing, so the first-feedback milestone never earned
 * in production (docs/LESSONS.md, 2026-09-03).
 */
export function ownerEmailFor(
  participants: readonly OwnableParticipant[],
  links: readonly OwnerLink[],
  participantId: string,
): string | undefined {
  const stamped = participants.find((p) => p.id === participantId)?.ownerEmail;
  if (stamped) return stamped.toLowerCase();
  return links.find((l) => l.participantId === participantId)?.email;
}

/**
 * Turn ANY id a per-member log's caller might pass — a real opaque member id (every HTTP route
 * that already knows the session resolves and passes this straight through) or a participant id
 * (a caller with no session on hand, like the companion tool's own bare `progression.view(id)`
 * call) — into the log's own key. `resolveEmail` only resolves for the latter; when it can't, `id`
 * is already the key, so it is used as-is rather than treated as a miss.
 *
 * This is the fix for a bug the first-feedback milestone shipped with (docs/LESSONS.md,
 * 2026-09-03): the original binding assumed its argument was ALWAYS a participant id and read
 * nothing when `resolveEmail` failed, so the log came back empty for every caller that had
 * already resolved the real key — which, via `progression-service.ts`'s `opaqueMemberId ??
 * participantId` fallback, is most HTTP routes.
 */
export function logKeyFor(
  resolveEmail: (participantId: string) => string | undefined,
  toOpaqueId: (email: string) => string,
  id: string,
): string {
  const email = resolveEmail(id);
  return email ? toOpaqueId(email) : id;
}

/** Build the store from the environment (`SKYNET_OWNER_LINKS_FILE`, default `data/owner-links.json`). */
export function createOwnerLinkStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): OwnerLinkStore {
  return new OwnerLinkStore(env.SKYNET_OWNER_LINKS_FILE ?? "data/owner-links.json", onReadError);
}

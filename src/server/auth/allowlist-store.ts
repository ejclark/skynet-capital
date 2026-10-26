import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deriveKey, type Envelope, open, seal } from "../../storage/secure-envelope.js";

/**
 * The guest list, on the mounted volume beside the participants — encrypted at rest with the
 * same `SKYNET_STORE_SECRET`.
 *
 * **Why not a host secret, and why not the repo.** `SKYNET_ALLOWED_EMAILS` *replaces* on every
 * write and is unreadable afterwards, so growing the league meant retyping the whole list from
 * memory with "lock everyone out" as the failure mode. The repo would make it durable and
 * reviewable but would put real people's addresses in git history permanently. The volume is
 * where this app already keeps member data — including Alpaca credentials, which are strictly
 * more sensitive than an email — so the guest list was the odd one out, not the risky one.
 *
 * **The env var stays, as break-glass.** `resolveAuth` unions this file with
 * `SKYNET_ALLOWED_EMAILS`, so a lost volume, an unreadable blob, or a bad deploy can never lock
 * the owner out of his own app. That union is also the privilege split: env-listed identities
 * are the owners who may invite; file-listed identities are members who may not.
 */
export interface AllowlistEntry {
  /** Lowercased email or GitHub login. */
  readonly value: string;
  readonly kind: "email" | "login";
  /** ISO timestamp, for the admin view's "added" column. */
  readonly addedAt: string;
  /** Who invited them — an audit trail for a gate that grants access to everyone's data. */
  readonly addedBy: string;
  /**
   * ISO timestamp of this identity's first completed sign-in, or undefined if they've never
   * shown up. The admin observability field #2 (fields #3+ land the same way — an optional
   * column on this entry, stamped from wherever that signal happens).
   */
  readonly joinedAt?: string;
}

export interface AllowlistStore {
  entries(): AllowlistEntry[];
  emails(): Set<string>;
  logins(): Set<string>;
  /** True when the store has a key and can therefore accept writes. */
  canStoreSecurely(): boolean;
  /** Returns false when the value was already present (idempotent, not an error). */
  add(entry: AllowlistEntry): boolean;
  remove(value: string): boolean;
  /**
   * Stamp `joinedAt` the first time this identity is seen, for the `/invite` observability view.
   * A no-op (false) once already stamped, for an unknown value, or on any read/write failure —
   * this runs on the board's hot path, so it must never throw or break the page.
   */
  markJoined(value: string, at: string): boolean;
}

/** The default reporter: silent. Used by tests and by callers that handle reporting themselves. */
const NO_REPORT = (_message: string): void => undefined;

export class FileAllowlistStore implements AllowlistStore {
  private readonly path: string;
  private readonly key?: Buffer;
  private readonly onReadError: (message: string) => void;

  /**
   * `onReadError` is injected rather than logged directly: nothing under `src/server` writes to
   * the console (that belongs to the entry points in `src/scripts`). It is not optional in spirit
   * — an unreadable guest list that reports nothing is indistinguishable from an empty one.
   */
  constructor(path: string, secret?: string, onReadError?: (message: string) => void) {
    this.path = path;
    this.key = deriveKey(secret);
    this.onReadError = onReadError ?? NO_REPORT;
  }

  entries(): AllowlistEntry[] {
    if (!existsSync(this.path)) {
      return [];
    }
    // A guest list that cannot be read must admit NOBODY from this source — never "everybody",
    // and never a thrown error that 500s the sign-in page. It is logged loudly because a silent
    // empty list is indistinguishable from a legitimately empty one, and the env allowlist keeps
    // the owner able to get in and fix it.
    try {
      const envelope = JSON.parse(readFileSync(this.path, "utf8")) as Envelope;
      const parsed: unknown = JSON.parse(open(envelope, this.key, "allowlist store"));
      return Array.isArray(parsed) ? (parsed as AllowlistEntry[]) : [];
    } catch (err) {
      this.onReadError(
        `[allowlist] cannot read ${this.path} — admitting nobody from it. ` +
          `SKYNET_ALLOWED_EMAILS still applies. Cause: ${(err as Error).message}`,
      );
      return [];
    }
  }

  emails(): Set<string> {
    return this.valuesOf("email");
  }

  logins(): Set<string> {
    return this.valuesOf("login");
  }

  canStoreSecurely(): boolean {
    return this.key !== undefined;
  }

  add(entry: AllowlistEntry): boolean {
    // Same fail-closed rule as the participant store: refuse to write people's addresses in the
    // clear rather than quietly degrading. A missing key is a misconfiguration, not a mode.
    if (!this.key) {
      throw new Error(
        "refusing to store the allowlist unencrypted — set SKYNET_STORE_SECRET to enable invites",
      );
    }
    const value = entry.value.trim().toLowerCase();
    const current = this.entries();
    if (current.some((e) => e.value === value)) {
      return false;
    }
    this.write([...current, { ...entry, value }]);
    return true;
  }

  remove(value: string): boolean {
    if (!this.key) {
      throw new Error("refusing to rewrite the allowlist unencrypted — set SKYNET_STORE_SECRET");
    }
    const target = value.trim().toLowerCase();
    const current = this.entries();
    const next = current.filter((e) => e.value !== target);
    if (next.length === current.length) {
      return false;
    }
    this.write(next);
    return true;
  }

  markJoined(value: string, at: string): boolean {
    if (!this.key) return false;
    try {
      const target = value.trim().toLowerCase();
      const current = this.entries();
      const entry = current.find((e) => e.value === target);
      if (!entry || entry.joinedAt) return false;
      this.write(current.map((e) => (e === entry ? { ...e, joinedAt: at } : e)));
      return true;
    } catch {
      return false;
    }
  }

  private valuesOf(kind: AllowlistEntry["kind"]): Set<string> {
    return new Set(
      this.entries()
        .filter((e) => e.kind === kind)
        .map((e) => e.value),
    );
  }

  private write(entries: AllowlistEntry[]): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(seal(JSON.stringify(entries), this.key)));
  }
}

/** Build the allowlist store from the environment (path + the shared at-rest secret). */
export function createAllowlistStore(
  env: Readonly<Record<string, string | undefined>>,
  onReadError?: (message: string) => void,
): FileAllowlistStore {
  return new FileAllowlistStore(
    env.SKYNET_ALLOWLIST_STORE ?? "data/allowlist.json",
    env.SKYNET_STORE_SECRET,
    onReadError,
  );
}

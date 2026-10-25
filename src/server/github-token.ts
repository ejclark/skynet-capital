import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deriveKey, type Envelope, open, seal } from "../storage/secure-envelope.js";
import { useLiveGithubToken } from "./github-api.js";

/**
 * THE APP'S GITHUB TOKEN, ROTATED FROM A FORM — the credential Moneypenny files issues with (and
 * every read beside it: status, follow-ups, the roadmap, deploy lag). It was a host secret only
 * (`SKYNET_FEEDBACK_GITHUB_TOKEN`), so an expired personal access token meant a terminal and
 * `fly secrets set` (Eric, 2026-10-24: "running terminal commands is out of the question; I
 * expect you to automate this piece through a web interface").
 *
 * **Where it lives.** On the volume beside the guest list and the Alpaca keys, sealed with the
 * same `SKYNET_STORE_SECRET` (AES-256-GCM) — and refused outright without that key, never written
 * in the clear. A saved token WINS over the host secret; the host secret stays as break-glass for
 * a lost volume, exactly like `SKYNET_ALLOWED_EMAILS` under the guest list.
 *
 * **Why no restart.** Every GitHub call in the app builds its headers through `githubHeaders`, so
 * one live override there swaps the token for all of them at once. The one gap is honest: a
 * feature that booted with NO token at all built nothing to swap into, so a first-ever token
 * lights those up on the next deploy — the rotate answer says so.
 *
 * **Never revealed.** Nothing here returns, logs or echoes the token; the status view carries
 * where it came from, who saved it, when it expires, and whether GitHub accepts it right now.
 */

export interface GithubTokenRecord {
  readonly token: string;
  readonly savedAt: string;
  readonly savedBy: string;
  /** GitHub's own expiry for the token (from its `github-authentication-token-expiration`
   *  header), ISO — absent for a token that never expires. */
  readonly expiresAt?: string;
}

export class GithubTokenStore {
  private readonly path: string;
  private readonly key?: Buffer;

  constructor(path: string, secret?: string) {
    this.path = path;
    this.key = deriveKey(secret);
  }

  canStoreSecurely(): boolean {
    return this.key !== undefined;
  }

  /** The saved token, or undefined — an unreadable blob reads as "none saved", so the host
   *  secret keeps working rather than the app losing GitHub entirely. */
  read(): GithubTokenRecord | undefined {
    if (!existsSync(this.path)) return undefined;
    try {
      const envelope = JSON.parse(readFileSync(this.path, "utf8")) as Envelope;
      const parsed = JSON.parse(open(envelope, this.key, "github token store")) as unknown;
      const record = parsed as Partial<GithubTokenRecord> | null;
      return record && typeof record.token === "string" && record.token
        ? (record as GithubTokenRecord)
        : undefined;
    } catch {
      return undefined;
    }
  }

  save(record: GithubTokenRecord): void {
    if (!this.key) {
      throw new Error("refusing to store the GitHub token unencrypted — set SKYNET_STORE_SECRET");
    }
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(seal(JSON.stringify(record), this.key)));
  }
}

type Env = Record<string, string | undefined>;

export function createGithubTokenStore(env: Readonly<Env>): GithubTokenStore {
  return new GithubTokenStore(
    env.SKYNET_GITHUB_TOKEN_STORE ?? "data/github-token.json",
    env.SKYNET_STORE_SECRET,
  );
}

/** Make `token` the one every GitHub call uses from now on — the live header override plus the
 *  env var, so anything resolved later reads the same value. */
export function activateGithubToken(env: Env, token: string): void {
  env.SKYNET_FEEDBACK_GITHUB_TOKEN = token;
  useLiveGithubToken(token);
}

/** Boot step, run before any GitHub-backed feature resolves: a saved token beats the host
 *  secret. Returns whether a token was configured at all, which is what decides if a rotation
 *  takes effect live or on the next deploy. */
export function applySavedGithubToken(env: Env, store: GithubTokenStore): boolean {
  const saved = store.read();
  if (saved) activateGithubToken(env, saved.token);
  return Boolean(env.SKYNET_FEEDBACK_GITHUB_TOKEN);
}

export type TokenCheck =
  | { readonly ok: true; readonly expiresAt?: string }
  | { readonly ok: false; readonly error: string };

type FetchLike = (
  url: string,
  init: { headers: Record<string, string> },
) => Promise<{ status: number; headers: { get(name: string): string | null } }>;

/** GitHub's expiry header reads `2026-11-23 10:00:00 -0600` — parsed to ISO, or undefined. */
function parseExpiry(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})/.exec(raw.trim());
  const at = Date.parse(m ? `${m[1]}T${m[2]}${m[3]}:${m[4]}` : raw);
  return Number.isNaN(at) ? undefined : new Date(at).toISOString();
}

const REFUSALS: Readonly<Record<number, string>> = {
  401: "GitHub doesn't accept that token — it's expired, revoked, or not copied whole.",
  403: "GitHub accepted the token but it can't read issues on the repo — give it Issues: read & write.",
  404: "That token can't see the repo — when creating it, pick the repo under Repository access.",
};

/** Ask GitHub whether `token` can read the repo's issues (the write needs the same grant, and a
 *  test write would file a junk issue). Read-only; never sends the token anywhere but GitHub. */
export async function checkGithubToken(
  token: string,
  repo: string,
  doFetch: FetchLike = fetch as unknown as FetchLike,
): Promise<TokenCheck> {
  try {
    const res = await doFetch(`https://api.github.com/repos/${repo}/issues?per_page=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "skynet-capital",
        Accept: "application/vnd.github+json",
      },
    });
    if (res.status === 200) {
      const expiresAt = parseExpiry(res.headers.get("github-authentication-token-expiration"));
      return { ok: true, ...(expiresAt ? { expiresAt } : {}) };
    }
    return { ok: false, error: REFUSALS[res.status] ?? `GitHub answered ${res.status}.` };
  } catch {
    return { ok: false, error: "Couldn't reach GitHub to check the token — try again." };
  }
}

/** Personal access tokens (classic `ghp_`, fine-grained `github_pat_`) — the shapes this form
 *  takes. Anything else is refused before it is sent to GitHub at all. */
const TOKEN_SHAPE = /^(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})$/;

export interface GithubTokenDeps {
  readonly isOwner: (email: string) => boolean;
  readonly store: GithubTokenStore;
  readonly repo: string;
  /** The token every GitHub call is using right now (saved, else the host secret). */
  readonly current: () => string | undefined;
  readonly check: (token: string) => Promise<TokenCheck>;
  readonly activate: (token: string) => void;
  /** False when the app booted with no token, so features stayed off until a deploy. */
  readonly liveAtBoot: boolean;
}

export interface GithubTokenStatus {
  readonly owner: true;
  readonly secure: boolean;
  readonly repo: string;
  readonly source: "saved" | "host" | "none";
  readonly savedAt?: string;
  readonly savedBy?: string;
  readonly expiresAt?: string;
  /** GitHub's answer for the token in use right now. */
  readonly working: boolean;
  readonly problem?: string;
}

/** The owner's status view: where the token came from, when it expires, and whether GitHub
 *  accepts it now — never the token. */
export async function githubTokenStatus(deps: GithubTokenDeps): Promise<GithubTokenStatus> {
  const saved = deps.store.read();
  const token = deps.current();
  const check: TokenCheck = token
    ? await deps.check(token)
    : { ok: false, error: "No GitHub token is set, so Moneypenny can't file issues." };
  const expiresAt = (check.ok ? check.expiresAt : undefined) ?? saved?.expiresAt;
  return {
    owner: true,
    secure: deps.store.canStoreSecurely(),
    repo: deps.repo,
    source: saved ? "saved" : token ? "host" : "none",
    ...(saved ? { savedAt: saved.savedAt, savedBy: saved.savedBy } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    working: check.ok,
    ...(check.ok ? {} : { problem: check.error }),
  };
}

export type RotateAnswer =
  | { readonly ok: true; readonly message: string }
  | { readonly ok: false; readonly error: string };

/** Replace the app's GitHub token: shape → GitHub accepts it → sealed to the volume → live. */
export async function rotateGithubToken(
  deps: GithubTokenDeps,
  rawToken: string,
  owner: string,
  now: Date,
): Promise<RotateAnswer> {
  const token = rawToken.trim();
  if (!TOKEN_SHAPE.test(token)) {
    return {
      ok: false,
      error: "That isn't a GitHub token — it should start with github_pat_ (or ghp_).",
    };
  }
  if (!deps.store.canStoreSecurely()) {
    return {
      ok: false,
      error:
        "This deployment can't store secrets encrypted (no store secret), so nothing was saved.",
    };
  }
  const check = await deps.check(token);
  if (!check.ok) return { ok: false, error: `Not saved: ${check.error}` };
  try {
    deps.store.save({
      token,
      savedAt: now.toISOString(),
      savedBy: owner,
      ...(check.expiresAt ? { expiresAt: check.expiresAt } : {}),
    });
  } catch (err) {
    return { ok: false, error: `Couldn't save: ${(err as Error).message}` };
  }
  deps.activate(token);
  const until = check.expiresAt ? ` It expires ${check.expiresAt.slice(0, 10)}.` : "";
  return {
    ok: true,
    message: deps.liveAtBoot
      ? `Saved. Moneypenny is filing with the new token now.${until}`
      : `Saved. Filing switches on with the next deploy — the app started without any token.${until}`,
  };
}

/** The boot half in one call, so the entry point stays two lines: apply a saved token before
 *  any GitHub-backed feature resolves, then hand back the route's deps once owners are known. */
export function bootGithubToken(env: Env): {
  deps: (isOwner: (email: string) => boolean) => GithubTokenDeps;
} {
  const store = createGithubTokenStore(env);
  const liveAtBoot = applySavedGithubToken(env, store);
  const repo = env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital";
  return {
    deps: (isOwner) => ({
      isOwner,
      store,
      repo,
      current: () => env.SKYNET_FEEDBACK_GITHUB_TOKEN || undefined,
      check: (token) => checkGithubToken(token, repo),
      activate: (token) => activateGithubToken(env, token),
      liveAtBoot,
    }),
  };
}

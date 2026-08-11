import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Participant } from "./participant.js";

/**
 * A self-service-added account, persisted between restarts. Shape mirrors `Participant`
 * (its `credentials` hold the raw Alpaca paper key/secret), so a stored entry drops
 * straight into the dashboard roster.
 */
export type StoredParticipant = Participant;

/** Persistence for participants added at runtime through the dashboard's `/add` form. */
export interface ParticipantStore {
  load(): StoredParticipant[];
  add(participant: StoredParticipant): void;
  has(id: string): boolean;
  /**
   * False when the store has no encryption key and therefore cannot accept credentials.
   * Callers check this to refuse onboarding *before* asking anyone for a key, rather than
   * letting `add()` throw after the fact.
   */
  canStoreSecurely(): boolean;
}

interface Envelope {
  readonly v: 1;
  readonly enc: boolean;
  /** base64(iv) — present when enc. */
  readonly iv?: string;
  /** base64(authTag) — present when enc. */
  readonly tag?: string;
  /** base64(ciphertext) when enc, else the raw JSON array. */
  readonly data: string;
}

/**
 * File-backed participant store. The on-disk blob is encrypted with AES-256-GCM using
 * `SKYNET_STORE_SECRET` — the secret keys *other people's* credentials, so they are never
 * written in the clear on a shared host.
 *
 * **Fail closed:** without a secret, `add()` throws rather than degrading to plaintext. A
 * missing key is a misconfiguration, and the cost of guessing wrong is someone else's
 * credentials sitting readable on disk — so the write is refused, not warned about. Reads
 * still work unencrypted so an existing local file is never bricked by the upgrade.
 *
 * Reads/writes the whole (small) file per operation; the roster is a handful of accounts,
 * not a database.
 */
export class FileParticipantStore implements ParticipantStore {
  private readonly path: string;
  private readonly key?: Buffer;

  constructor(path: string, secret?: string) {
    this.path = path;
    this.key = secret ? createHash("sha256").update(secret).digest() : undefined;
  }

  load(): StoredParticipant[] {
    if (!existsSync(this.path)) {
      return [];
    }
    const envelope = JSON.parse(readFileSync(this.path, "utf8")) as Envelope;
    const json = envelope.enc ? this.decrypt(envelope) : envelope.data;
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as StoredParticipant[]) : [];
  }

  has(id: string): boolean {
    return this.load().some((p) => p.id === id);
  }

  canStoreSecurely(): boolean {
    return this.key !== undefined;
  }

  add(participant: StoredParticipant): void {
    if (!this.key) {
      throw new Error(
        "refusing to store credentials unencrypted — set SKYNET_STORE_SECRET to enable onboarding",
      );
    }
    const next = [...this.load().filter((p) => p.id !== participant.id), participant];
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(this.envelope(JSON.stringify(next))));
  }

  private envelope(json: string): Envelope {
    if (!this.key) {
      return { v: 1, enc: false, data: json };
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const data = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
    return {
      v: 1,
      enc: true,
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      data: data.toString("base64"),
    };
  }

  private decrypt(envelope: Envelope): string {
    if (!this.key) {
      throw new Error("participant store is encrypted but SKYNET_STORE_SECRET is not set");
    }
    const iv = Buffer.from(envelope.iv ?? "", "base64");
    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(Buffer.from(envelope.tag ?? "", "base64"));
    const data = Buffer.from(envelope.data, "base64");
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  }
}

/** Build the store from the environment (path + optional encryption secret). */
export function createParticipantStore(
  env: Readonly<Record<string, string | undefined>>,
): FileParticipantStore {
  const path = env.SKYNET_PARTICIPANT_STORE ?? "data/participants.json";
  return new FileParticipantStore(path, env.SKYNET_STORE_SECRET);
}

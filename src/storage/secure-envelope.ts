import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * At-rest encryption for the small JSON blobs this app keeps on its mounted volume —
 * AES-256-GCM, keyed by `SKYNET_STORE_SECRET`.
 *
 * Extracted from `FileParticipantStore` when the allowlist needed the same protection. The
 * on-disk format is unchanged (`v: 1`), so existing files keep loading: this is a move, not a
 * re-design. Two stores hand-rolling the same AES code would also trip the duplication gate,
 * and duplicated crypto is the worst kind to have drift.
 *
 * **What this protects against:** the file being read off the volume — a stray backup, a
 * snapshot, someone browsing the disk. It does NOT protect against a process that already has
 * the secret; anything holding `SKYNET_STORE_SECRET` can read every blob. That is the intended
 * boundary, and callers should not claim more.
 */
export interface Envelope {
  readonly v: 1;
  readonly enc: boolean;
  /** base64(iv) — present when enc. */
  readonly iv?: string;
  /** base64(authTag) — present when enc. */
  readonly tag?: string;
  /** base64(ciphertext) when enc, else the raw JSON. */
  readonly data: string;
}

/** Derive the AES key from a secret, or undefined when no secret is configured. */
export function deriveKey(secret?: string): Buffer | undefined {
  return secret ? createHash("sha256").update(secret).digest() : undefined;
}

/** Wrap JSON for storage. Without a key the envelope is honest about being plaintext (`enc: false`) —
 *  callers that must never write in the clear check for the key themselves and refuse first. */
export function seal(json: string, key?: Buffer): Envelope {
  if (!key) {
    return { v: 1, enc: false, data: json };
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  return {
    v: 1,
    enc: true,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  };
}

/** Unwrap a stored envelope back to JSON. Throws when an encrypted blob has no key to open it —
 *  a silent empty result there would read as "no members", which fails in the wrong direction. */
export function open(envelope: Envelope, key?: Buffer, label = "store"): string {
  if (!envelope.enc) {
    return envelope.data;
  }
  if (!key) {
    throw new Error(`${label} is encrypted but SKYNET_STORE_SECRET is not set`);
  }
  const iv = Buffer.from(envelope.iv ?? "", "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(Buffer.from(envelope.tag ?? "", "base64"));
  const data = Buffer.from(envelope.data, "base64");
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

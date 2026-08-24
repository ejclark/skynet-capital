import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * A small plain-JSON file on the mounted volume — the shape `BotControlsStore` and
 * `OwnerLinkStore` both needed, extracted once the clone gate caught the second copy.
 *
 * These are the volume's NON-secret files, deliberately unencrypted (unlike the participant and
 * allowlist stores, which hold credentials and personal data): switches, and links between an
 * account and an email that already signs in. What they share is the durability discipline —
 *
 *  - **Writes are atomic** (tmp + rename), so a crash mid-write leaves the previous state on
 *    disk, never a half-written file that reads back as corruption.
 *  - **Reads are total.** A missing file is the empty state; an unparseable one is the empty
 *    state PLUS a report, because silently starting over is how a torn file becomes data loss
 *    nobody noticed. The parse is injected, so each store decides what "well-formed" means.
 *
 * Synchronous fs on purpose: edits are rare owner-clicks and the files are tiny — the simplicity
 * is worth more than the microseconds.
 */
export class JsonFileStore<T> {
  private readonly path: string;
  private readonly empty: T;
  private readonly parse: (raw: unknown) => T | undefined | null;
  private readonly label: string;
  private readonly onReadError: (message: string) => void;

  constructor(options: {
    path: string;
    empty: T;
    parse: (raw: unknown) => T | undefined | null;
    /** Prefix for read reports, e.g. `controls` → `[controls] failed to read …`. */
    label: string;
    onReadError?: (message: string) => void;
  }) {
    this.path = options.path;
    this.empty = options.empty;
    this.parse = options.parse;
    this.label = options.label;
    this.onReadError = options.onReadError ?? (() => undefined);
  }

  load(): T {
    if (!existsSync(this.path)) return this.empty;
    try {
      const parsed = this.parse(JSON.parse(readFileSync(this.path, "utf8")));
      if (!parsed) {
        this.onReadError(`[${this.label}] ${this.path} did not parse — using empty`);
        return this.empty;
      }
      return parsed;
    } catch (error) {
      this.onReadError(
        `[${this.label}] failed to read ${this.path}: ${String(error)} — using empty`,
      );
      return this.empty;
    }
  }

  write(state: T): void {
    mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    renameSync(tmp, this.path);
  }
}

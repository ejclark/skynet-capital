import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * The house PLAIN-JSON FILE STORE primitive — one small unencrypted state file on the mounted
 * volume, shared by `bot-controls-store.ts` and `progression-store.ts` (and any future
 * non-credential preference store). Encodes the pattern once:
 *
 *  - Reads are TOTAL: a missing file is `empty`, a malformed or wrong-shaped file degrades to
 *    `empty` loudly (reported once via `onReadError`), never a throw and never a half-parsed state.
 *  - Writes are ATOMIC (tmp + rename): a crash mid-write leaves the previous state, never a torn file.
 *  - Synchronous fs on purpose: edits are user clicks (rare) and reads are one small file — the
 *    simplicity is worth more than the microseconds.
 *
 * NOT for credentials or personal data — those live in the AES-sealed participant store.
 */
export class JsonFileStore<T> {
  private readonly path: string;
  private readonly parse: (raw: unknown) => T | undefined;
  private readonly empty: T;
  private readonly label: string;
  private readonly onReadError: (message: string) => void;

  constructor(options: {
    readonly path: string;
    /** Total shape check: the exact expected state, or undefined to degrade to `empty`. */
    readonly parse: (raw: unknown) => T | undefined;
    readonly empty: T;
    /** Short tag for error messages, e.g. "controls" → `[controls] …`. */
    readonly label: string;
    readonly onReadError?: (message: string) => void;
  }) {
    this.path = options.path;
    this.parse = options.parse;
    this.empty = options.empty;
    this.label = options.label;
    this.onReadError = options.onReadError ?? (() => undefined);
  }

  load(): T {
    if (!existsSync(this.path)) return this.empty;
    try {
      const parsed = this.parse(JSON.parse(readFileSync(this.path, "utf8")));
      if (parsed === undefined) {
        this.onReadError(
          `[${this.label}] ${this.path} did not parse as a ${this.label} state — using empty`,
        );
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

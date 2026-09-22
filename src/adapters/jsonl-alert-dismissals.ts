import { join } from "node:path";
import type { AlertDismissalsPort } from "../ports/alert-dismissals.js";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";

/**
 * THE DURABLE `AlertDismissalsPort` — one append-only JSONL file per consumer under `dir`, on the
 * mounted volume (#3407 P4 slice 1's follow-up; #586's "dismissal SHALL persist so it is not
 * re-shown identically on next load"). Same shape as the order audit log: a line is one
 * dismissal, `loadDismissed` reads the file back into a set, so a repeat dismissal costs a line
 * and changes nothing — the in-memory reference adapter's contract, kept.
 *
 * Why durable: a dismissal is the one alert fact that must outlive the process. With the
 * in-memory adapter every deploy re-showed what a member had waved away, and the strip had to
 * say so; this is the fix the strip was waiting for.
 */
interface DismissalLine {
  readonly fingerprint: string;
  readonly at: string;
}

export class JsonlAlertDismissals implements AlertDismissalsPort {
  private readonly store: JsonlKeyedStore<DismissalLine>;

  constructor(
    dir: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.store = new JsonlKeyedStore<DismissalLine>(dir, (consumerId) =>
      join(dir, `${consumerId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  async loadDismissed(consumerId: string): Promise<readonly string[]> {
    const lines = await this.store.list(consumerId);
    return [...new Set(lines.map((line) => line.fingerprint))];
  }

  dismiss(consumerId: string, fingerprint: string): Promise<void> {
    return this.store.append(consumerId, { fingerprint, at: this.now().toISOString() });
  }
}

/** Build the store from the environment (`SKYNET_ALERT_DISMISSALS_DIR`, default
 *  `data/alert-dismissals`; pinned under `/data` in fly.toml so a deploy cannot erase it). */
export function createAlertDismissals(env: NodeJS.ProcessEnv): AlertDismissalsPort {
  return new JsonlAlertDismissals(env.SKYNET_ALERT_DISMISSALS_DIR ?? "data/alert-dismissals");
}

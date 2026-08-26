import { join } from "node:path";
import type { UnusualFlowStore } from "../ports/options-flow.js";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import { InMemoryUnusualFlowStore } from "./in-memory-unusual-flow-store.js";
import type { UnusualFlowScan } from "./unusual-flow.js";

/** In-memory ledger: the reference implementation, used by specs and in-process runs. */
export { InMemoryUnusualFlowStore };

/**
 * File-backed ledger: one append-only JSONL file per underlying under `dir` (the same shape
 * `JsonlHistoryStore` uses), composing the shared `JsonlKeyedStore` primitives rather than
 * re-implementing append/read/list. On Fly this `dir` must live on the mounted `/data` volume, so
 * the series survives redeploys with no database and no host change.
 *
 * NO RELATIVE DEFAULT, DELIBERATELY — and no `createUnusualFlowStore(env)` beside it. Every other
 * durable store here reads an `env.SKYNET_*` var with a relative `data/…` fallback behind it, and
 * every one of those needs a
 * matching pin in `fly.toml`'s `[env]` block or the deploy erases it silently (the guest-list bug
 * in `docs/LESSONS.md`, and the reason `tests/arch/volume-persistence.spec.ts` exists). `fly.toml`
 * is inside the build envelope (`envelope.json`), so this lane cannot add that pin, and shipping
 * the convenient relative default without it would ship exactly the failure that gate was built to
 * stop. The directory is therefore a required argument: the caller says where the ledger lives, and
 * `src/scripts/scan-unusual-flow.ts` refuses to run rather than write somewhere it knows is doomed.
 */
export class JsonlUnusualFlowStore implements UnusualFlowStore {
  private readonly store: JsonlKeyedStore<UnusualFlowScan>;

  constructor(dir: string) {
    // An underlying is a ticker, so already filename-safe; sanitized anyway, like the history store.
    this.store = new JsonlKeyedStore<UnusualFlowScan>(dir, (underlying) =>
      join(dir, `${underlying.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  async save(scan: UnusualFlowScan): Promise<void> {
    await this.store.append(scan.underlying, scan);
  }

  list(underlying?: string): Promise<UnusualFlowScan[]> {
    return this.store.list(underlying);
  }
}

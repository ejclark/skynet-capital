import { existsSync } from "node:fs";
import { join } from "node:path";
import { shelfFileFor } from "../domain/discovery-pass.js";
import type { DiscoveryAsk } from "../domain/discovery-queue.js";

type Askish = Pick<DiscoveryAsk, "kind" | "subject" | "campaign">;

/**
 * Whether the research shelf already holds a finding for this ask (#7034 slice 3b). The lane writes
 * `docs/research/discovery/<slug>.md` and never touches the volume, so this file's existence is
 * what takes an ask off the queue: the dashboard drops it on the next read, the lane skips it.
 */
export function shelfAnswered(root: string = process.cwd()): (ask: Askish) => boolean {
  return (ask) => existsSync(join(root, shelfFileFor(ask)));
}

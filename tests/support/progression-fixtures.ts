import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import { ladderEvidenceFrom } from "../../src/server/ladder-evidence.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";
import {
  createProgressionService as create,
  type ProgressionService,
  type ProgressionServiceDeps,
} from "../../src/server/progression-service.js";

/**
 * `createProgressionService` for a spec that holds its two ledgers as plain reads. The service now
 * takes the folded evidence (`ladder-evidence.ts`), so this folds those reads whole on every call —
 * the same answer a held fold gives, which `tests/server/ladder-evidence.spec.ts` pins — and lets a
 * spec still count or vary what each ledger returns.
 */
export function createProgressionService(
  deps: Omit<ProgressionServiceDeps, "readEvidence"> & {
    readonly readFills: (participantId: string) => Promise<readonly TradeActivityRecord[]>;
    readonly readTags: (participantId: string) => Promise<readonly OrderAuditRecord[]>;
  },
): ProgressionService {
  const { readFills, readTags, ...rest } = deps;
  return create({
    ...rest,
    readEvidence: async (id) => ladderEvidenceFrom(await readFills(id), await readTags(id)),
  });
}

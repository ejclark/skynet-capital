import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";
import { isOccSymbol } from "../trading/option-symbols.js";

/**
 * THE EXIT PLANS MEMBERS CARRIED WHEN THEY BOUGHT A CALL (#5709 slice 3). The options ticket's review
 * step offers the house's long-call plan (take profit at `TAKE_PROFIT`×, time stop at `EXIT_DTE` days
 * left, `src/playbooks/long-call-rules.ts`); a member who taps Carry has it recorded here against the
 * contract once the order is accepted, and the desk view reads it back onto the held call — the
 * decision card and position guidance then speak of "your plan" instead of the house's.
 *
 * A record names the RULE, never its numbers: the multiple and the day count stay in the one rule
 * source, so a plan can never drift into a second copy of them. Keyed by desk id → OCC symbol: the
 * plan belongs to a position, and a position lives on a desk. Plain JSON (a contract symbol and a
 * timestamp), atomic tmp+rename writes, total reads; a write reads the file whole first and refuses
 * rather than rewrite a file it could only read in part (`member-conviction-store.ts`'s rule).
 */

interface CarriedPlan {
  readonly rule: "house-long-call";
  /** ISO-8601. */
  readonly carriedAt: string;
}

type ExitPlansState = Readonly<Record<string, Readonly<Record<string, CarriedPlan>>>>;

function parseExitPlansState(raw: unknown): ExitPlansState | undefined {
  if (!isRecord(raw)) return undefined;
  const state: Record<string, Record<string, CarriedPlan>> = {};
  for (const [desk, plans] of Object.entries(raw)) {
    if (!isRecord(plans)) continue;
    const kept: Record<string, CarriedPlan> = {};
    for (const [occ, plan] of Object.entries(plans)) {
      if (!(isOccSymbol(occ) && isRecord(plan) && plan.rule === "house-long-call")) continue;
      if (typeof plan.carriedAt !== "string" || plan.carriedAt.length > 40) continue;
      kept[occ] = { rule: "house-long-call", carriedAt: plan.carriedAt };
    }
    if (Object.keys(kept).length > 0) state[desk] = kept;
  }
  return state;
}

export class ExitPlanStore {
  private readonly file: JsonFileStore<ExitPlansState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseExitPlansState,
      empty: {},
      label: "exit-plans",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  /** The contracts on this desk whose plan was carried at purchase. */
  carried(deskId: string): ReadonlySet<string> {
    return new Set(Object.keys(this.file.load()[deskId] ?? {}));
  }

  /** Record the plan against one contract. False when the file could not be read whole, so the
   *  write was refused — the caller says the plan was not saved, never that it was. */
  carry(deskId: string, occSymbol: string, at = new Date()): boolean {
    return this.rewrite(deskId, (plans) => ({
      ...plans,
      [occSymbol]: { rule: "house-long-call", carriedAt: at.toISOString() },
    }));
  }

  /** Forget a contract's plan — its position closed, or a fresh purchase of a contract no longer
   *  held must not inherit the plan an earlier, closed position carried. `onlyIf` sees when the plan
   *  was carried, so a caller can keep one still waiting on its own order to fill. */
  drop(deskId: string, occSymbol: string, onlyIf?: (carriedAt: string) => boolean): boolean {
    const plan = this.file.load()[deskId]?.[occSymbol];
    if (!plan || (onlyIf && !onlyIf(plan.carriedAt))) return true;
    return this.rewrite(deskId, (plans) =>
      Object.fromEntries(Object.entries(plans).filter(([occ]) => occ !== occSymbol)),
    );
  }

  private rewrite(
    deskId: string,
    change: (plans: Readonly<Record<string, CarriedPlan>>) => Record<string, CarriedPlan>,
  ): boolean {
    const state = this.file.loadIfReadable();
    if (!state) return false;
    const plans = change(state[deskId] ?? {});
    const rest = Object.fromEntries(Object.entries(state).filter(([desk]) => desk !== deskId));
    this.file.write(Object.keys(plans).length > 0 ? { ...rest, [deskId]: plans } : rest);
    return true;
  }
}

/** The file beside the subscriptions file (`SKYNET_SUBSCRIPTIONS_FILE`, pinned on the volume in
 *  `fly.toml`) — a sibling, so no new env var and no envelope-protected edit. */
export function createExitPlanStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): ExitPlanStore {
  return new ExitPlanStore(
    siblingPath(
      env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
      "exit-plans.json",
    ),
    onReadError,
  );
}

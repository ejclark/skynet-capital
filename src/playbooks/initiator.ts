import type { Initiator } from "../trading/initiator.js";
import { BETA_SCOUT_ID } from "./beta-scout.js";
import { findPlaybook } from "./registry.js";

/**
 * Who started one recorded intent (#4450 slice 4, EARS 3), read from the two facts every
 * `intents` row has carried since the store opened: its `playbook_id` and its decision's
 * `persona_id`. Derived on read, not stored: the decision store never `ALTER`s a table
 * (`decision-db-options.ts`), and a stored copy of a pure function of two stored facts could only
 * ever disagree with them. Deriving it is also the backfill — every past row answers the same way.
 *
 *  - the forced pick's id (`BETA-SCOUT`) → `forced`, whoever files it;
 *  - no playbook id → `persona`: the bot's own rules placed it;
 *  - a playbook that IS the deciding persona's own rules (`rulesOf`, today `SAURON` on Sauron's
 *    account) → `persona`. That stamp exists to make his reflexes attributable, so a Store pause
 *    can act on them (`sauron-rules.ts`); counting it as a playbook firing would make "how often
 *    do playbooks trade by themselves" read Sauron's every reflex as a yes;
 *  - any other id → `playbook`, house or member-authored (`U-*`) alike.
 */
export function initiatorOf(playbookId: string | undefined, personaId: string): Initiator {
  if (playbookId === BETA_SCOUT_ID) return "forced";
  if (!playbookId) return "persona";
  return findPlaybook(playbookId)?.rulesOf === personaId ? "persona" : "playbook";
}

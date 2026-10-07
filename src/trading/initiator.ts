/**
 * WHO STARTED A TRADE (#4450 slice 4) — the three answers Eric's brief asked to keep apart
 * (2026-10-02: "keep track of stats on trades executed as result of a playbook initiated action"):
 *
 *  - `playbook` — a playbook's own condition held and it placed the order;
 *  - `forced` — the forced daily pick (`BETA-SCOUT`), which trades because nothing else did;
 *  - `persona` — a bot's own rules, with no playbook behind the order.
 *
 * Only the type lives here, so `src/trading/*` stays free of the layers above it; the classifier
 * that reads the registry is `playbooks/initiator.ts`. A fill no bot decision accounts for (a
 * member's own order, or history older than the decision store) has NO initiator — it is never
 * guessed into one of the three.
 */
export type Initiator = "playbook" | "forced" | "persona";

/** Display order: the answer the brief asked for first, the forced pick it is measured against
 *  second, the bots' own rules last. */
export const INITIATORS: readonly Initiator[] = ["playbook", "forced", "persona"];

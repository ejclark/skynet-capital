// Type surface for burst-alarm.mjs — same arrangement as repair-logs.d.mts: the scripts/ tree is
// plain ESM with `allowJs` off, so a spec that imports from it needs this.

export interface Capsule {
  readonly number: number;
  readonly title: string;
  readonly createdAt?: string;
}
export interface RepairEvidence {
  readonly startedAt: string | null;
  /** `true` a session ran · `false` it failed or was skipped · `null` still in flight */
  readonly ok: boolean | null;
}
export type AlarmDecision =
  | { type: "quiet"; reason: string }
  | {
      type: "open-alarm";
      title: string;
      body: string;
      labels: string[];
      assignee: string;
      capsules: number[];
    };

export const BURST_SIZE: number;
export const WINDOW_MS: number;
export const GRACE_MS: number;
export const ASSIGNEE: string;
export const REPAIR_JOB: string;
export const ALARM_LABEL: { name: string; color: string; description: string };

export function workflowOf(title: unknown): string | null;
export function alarmTitle(workflow: string): string;
export function burstOf(workflow: string, capsules?: readonly Capsule[], now?: number): Capsule[];
export function repairVerdict(job: {
  status?: string;
  started_at?: string | null;
  created_at?: string | null;
  steps?: readonly { name?: string; conclusion?: string | null }[];
}): RepairEvidence;
export function decideAlarm(input: {
  workflow: string;
  capsules?: readonly Capsule[];
  repairs?: readonly RepairEvidence[];
  openAlarms?: readonly { number: number; title: string }[];
  now?: number;
}): AlarmDecision;
export function raiseAlarmIfBurst(
  workflow: string,
  capsules: readonly Capsule[],
  opts?: { now?: number; selfRunId?: string },
): AlarmDecision;

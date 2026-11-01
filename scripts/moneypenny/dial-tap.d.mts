// Type surface for dial-tap.mjs — same arrangement as work-mode.d.mts.
import type { Exec, WorkModeConfig } from "./work-mode.mjs";

export interface DialIntent {
  readonly kind: "route-dial";
  readonly issueNumber: number;
  readonly label: string;
}

export interface LabelEvent {
  readonly label: string;
  readonly createdAt: string;
  readonly actor?: string;
  readonly app?: string | null;
}

export interface DialComment {
  readonly body?: string;
  readonly createdAt?: string;
  readonly author_association?: string;
  readonly user?: { type?: string };
}

export function routeDial(ctx: {
  eventName?: string;
  action?: string;
  payload?: { label?: { name?: string }; issue?: { number?: number } };
}): DialIntent[];

export function planDialTap(opts: {
  label: string;
  labels?: readonly string[];
  events?: readonly LabelEvent[];
  comments?: readonly DialComment[];
  config: WorkModeConfig;
}): { remove: string[]; comment: string | null; why: string };

export function executeDialTap(
  intent: DialIntent,
  deps?: { exec?: Exec; config?: WorkModeConfig },
): string;

export function executeDialTidy(
  intent: {
    readonly kind: "tidy-ended-dial";
    readonly issueNumber: number;
    readonly label: string;
  },
  deps?: { exec?: Exec; config?: WorkModeConfig; now?: number },
): string;

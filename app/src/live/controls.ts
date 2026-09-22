import { postJson } from "./post";

/**
 * Mission Control's client model (#738 phase 8c) — mirrors `/api/controls`. The switchboard
 * answers only to owners; everyone else receives `{owner:false}` and the shell shows nothing.
 * Every action posts one switch-flip and renders the authority's own sentence back, verbatim.
 */

export interface FleetBot {
  readonly id: string;
  readonly displayName: string;
  readonly suspended: boolean;
}

export interface Fleet {
  readonly allSuspended: boolean;
  readonly bots: readonly FleetBot[];
  /** Moneypenny's model dial (#1672 slice 4) — rides this same owner-only page. */
  readonly companionModel: string;
  readonly companionModels: readonly string[];
  readonly updatedAt?: string;
  readonly updatedBy?: string;
}

export type ControlsView =
  | { readonly owner: false }
  | { readonly owner: true; readonly fleet: Fleet };

export async function fetchControls(): Promise<ControlsView> {
  const res = await fetch("/api/controls", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`controls ${res.status}`);
  return (await res.json()) as ControlsView;
}

export type ControlAction =
  | "suspend"
  | "resume"
  | "suspend-all"
  | "resume-all"
  | "set-companion-model";

export const postControlAction = (
  action: ControlAction,
  bot?: string,
  model?: string,
): Promise<{ readonly ok: boolean; readonly message: string }> =>
  postJson("/api/controls", {
    action,
    ...(bot !== undefined ? { bot } : {}),
    ...(model !== undefined ? { model } : {}),
  });

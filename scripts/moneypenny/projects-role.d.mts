// Type surface for scripts/moneypenny/projects-role.mjs — the board's Role field, derived from the
// seat registry (docs/agents/seats.json) and an issue's labels (#6886 slice 1b). The scripts/ tree
// is plain ESM with `allowJs` off (see index.d.mts).
export const ROLE: "Role";

export interface RegistrySeat {
  id: string;
  job?: string;
  /** The Role option name the board shows for this seat. */
  role?: string;
  /** The labels whose cards sit in this seat's queue. */
  pulls?: string[];
}

export interface SeatRegistry {
  seats?: RegistrySeat[];
  /** Seat ids; when a card's labels match more than one seat, the first here wins. */
  roleOrder?: string[];
}

export interface PullingSeat {
  id: string;
  role: string;
  pulls: string[];
  job: string;
}

export interface RoleOption {
  id?: string;
  name: string;
  color: string;
  description: string;
}

export function readSeatRegistry(): SeatRegistry;
export function pullingSeats(reg?: SeatRegistry): PullingSeat[];
export function roleOptionNames(reg?: SeatRegistry): string[];
export function wantedRoleOf(
  issue: { labels?: ({ name?: string } | string)[] } | null | undefined,
  reg?: SeatRegistry,
): string;
export function liveRole(wanted: string | undefined, liveOptions?: string[]): string | undefined;
export function roleFieldOptions(reg?: SeatRegistry): RoleOption[];
export function roleFieldUpdate(
  current?: { id?: string; name?: string; color?: string; description?: string }[],
  reg?: SeatRegistry,
): RoleOption[] | null;

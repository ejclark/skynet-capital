// Type surface for scripts/moneypenny/projects.mjs — the pure vocabulary a spec exercises
// directly. The scripts/ tree is plain ESM with `allowJs` off (see index.d.mts for the reasoning).
export const PROJECT_TITLE: string;
export const STATUS_OPTIONS: string[];
export const PRIORITY_OPTIONS: string[];
export const HORIZON_OPTIONS: string[];

export interface StatusFieldOption {
  name: string;
  color: "GRAY" | "BLUE" | "YELLOW" | "RED" | "GREEN" | "ORANGE" | "PINK" | "PURPLE";
  description: string;
}

export const STATUS_FIELD_OPTIONS: StatusFieldOption[];

export function statusOptionsMatch(currentNames?: string[]): boolean;

export interface ProjectField {
  name: string;
  dataType: "SINGLE_SELECT" | "DATE";
  options?: string[];
}

export const FIELDS: ProjectField[];

export function statusForIssue(issue?: {
  state?: "open" | "closed";
  labels?: string[];
  hasOpenLinkedPr?: boolean;
}): "Backlog" | "Ready" | "In Progress" | "Blocked" | "Done";

// Type surface for task-file.mjs — same arrangement as metrics.d.mts (`allowJs` is off).

export type TaskAnswer =
  | { kind: "number"; value: number; abs?: number; rel?: number; ignoreSign?: boolean }
  | { kind: "text"; value: string; alternatives?: string[] };

export interface Task {
  id: string;
  scenario: string;
  start: string;
  optimal: number;
  optimalViews?: number;
  answer: TaskAnswer;
  answerRegion: string[];
  expectFirst?: { role?: string; name?: string };
}

export function actionCap(optimal?: number): number;
export function taskProblems(task: unknown): string[];
export function parseTask(text: string): Task;
export function deviceLine(frame: {
  viewport: { width: number; height: number };
  hasTouch: boolean;
}): string;

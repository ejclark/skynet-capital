// Type surface of scripts/rebaseline-from-ci.mjs for tests/scripts/rebaseline-from-ci.spec.ts —
// the house pattern for a scripts/ module a spec imports (`allowJs` is off).

export interface Attachment {
  name: string;
  contentType?: string;
  path?: string;
}
export interface Result {
  status?: string;
  errors?: ({ message?: string } | string)[];
  attachments?: Attachment[];
}
export interface Test {
  title: string;
  path?: string[];
  projectName: string;
  outcome: "expected" | "unexpected" | "flaky" | "skipped";
  results: Result[];
}
export interface FileReport {
  fileId: string;
  fileName: string;
  tests: Test[];
}
export interface Report {
  files: { fileId: string; fileName: string }[];
  errors?: ({ message?: string } | string)[];
}
export interface ScreenshotRow {
  spec: string;
  title: string;
  project: string;
  snapshot: string;
  expected: string | null;
  actual: string;
  diff: string | null;
  why: string;
  /** CI reported no baseline for it in the commit it tested — plan() always refuses it. */
  missing?: boolean;
}
export interface Other {
  spec: string;
  title: string;
  why: string;
}
export interface Run {
  id: number;
  head_sha: string;
  status: string;
  conclusion: string | null;
  created_at: string;
}

export const CI_PLATFORM: string;
export const TEST_DIR: string;
export function stripAnsi(text: string): string;
export function reportZipFrom(html: string): Buffer;
export function unzip(zip: Buffer): Map<string, Buffer>;
export function readReport(entries: Map<string, Buffer>): { report: Report; files: FileReport[] };
export function screenshotVerdict(message: string): "mismatch" | "missing" | "other";
export function mismatchSummary(message: string): string;
export function classify(input: { report: Report; files: FileReport[] }): {
  screenshots: ScreenshotRow[];
  others: Other[];
};
export function baselinePath(row: {
  spec: string;
  snapshot: string;
  project: string;
  platform?: string;
}): string;
export function plan(
  screenshots: ScreenshotRow[],
  exists: (path: string) => boolean,
): {
  copies: (ScreenshotRow & { baseline: string })[];
  refusals: (ScreenshotRow & { baseline: string; why: string })[];
};
export function pickRun(
  runs: Run[],
  headSha: string,
): { run: Run; stop?: undefined; done?: undefined } | { stop: string } | { done: string };
export function staleForApply(
  run: { id: number; head_sha: string },
  headSha: string,
): string | null;
export function commitMessage(
  runId: number | string,
  baselines: string[],
): {
  subject: string;
  body: string;
};
export function imageName(row: { spec: string; snapshot: string }, kind: string): string;
export function renderRows(rows: ScreenshotRow[]): string;

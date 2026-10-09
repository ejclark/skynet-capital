import { fetchJson } from "../http/fetch-json.js";
import { githubErrorMessage, githubHeaders } from "./github-api.js";
import { RSS_ALARM_MB } from "./process-gauge.js";
import type { RunMarker } from "./run-marker.js";

/**
 * Turn an unclean exit into an `incident` issue (#4618, slice 6 of #4612). `run-marker.ts` detects
 * it; this says it somewhere a lane and Eric will see. Both earlier OOMs produced 0 entries in
 * `docs/LESSONS.md` because no production failure ever reached a surface the learning loop reads —
 * an issue does, and its body asks for the `/retro` that closes it.
 *
 * Three guards keep an alarm from becoming noise:
 *   - one open incident at a time: a second unclean exit comments on the open one;
 *   - a crash loop reports once per `REPORT_COOLDOWN_MS` (the marker carries `reportedAt`);
 *   - offline or token-less runs log and stop — a dev laptop's killed process is not an incident.
 *
 * Uses the feedback token (`SKYNET_FEEDBACK_GITHUB_TOKEN`) that already files member issues on
 * this repo: no new credential, and inert until that one is set.
 */
export const INCIDENT_LABEL = "incident";
export const INCIDENT_TITLE = "Dashboard restarted without a clean shutdown";
export const REPORT_COOLDOWN_MS = 30 * 60_000;

type DoFetch = typeof fetchJson;

export interface IncidentConfig {
  /** Never logged or echoed. */
  readonly token: string;
  /** `owner/repo`. */
  readonly repo: string;
}

/** The same token and repo the feedback filer resolves; `undefined` (inert) without the token. */
export function resolveIncidentConfig(
  env: Readonly<Record<string, string | undefined>>,
): IncidentConfig | undefined {
  const token = env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  if (!token) return undefined;
  return { token, repo: env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital" };
}

/** What the boot log says about the previous run, whatever happens next. */
export function describeUncleanExit(previous: RunMarker): string {
  const memory =
    previous.lastRssMb === undefined
      ? "no gauge reading yet"
      : `rss ${previous.lastRssMb} MB (peak ${previous.peakRssMb ?? previous.lastRssMb} MB)`;
  return (
    `[run-marker] the last run did not exit cleanly — booted ${previous.bootedAt}` +
    ` (${previous.gitSha ?? "sha unknown"}), last seen ${previous.lastSeenAt}, ${memory}`
  );
}

const row = (label: string, value: string): string => `| ${label} | ${value} |`;

/** One occurrence as a capsule table — the issue body's top and each later comment share it. */
export function occurrenceTable(previous: RunMarker, bootedAgainAt: Date): string {
  const rss =
    previous.lastRssMb === undefined
      ? "no reading (died inside its first minute)"
      : `${previous.lastRssMb} MB last, ${previous.peakRssMb ?? previous.lastRssMb} MB peak` +
        (Math.max(previous.lastRssMb, previous.peakRssMb ?? 0) > RSS_ALARM_MB
          ? ` — over the ${RSS_ALARM_MB} MB alarm line, so an OOM kill is the likely cause`
          : "");
  return [
    "| | |",
    "|---|---|",
    row("**Run booted**", `${previous.bootedAt} · \`${previous.gitSha ?? "sha unknown"}\``),
    row("**Last seen alive**", previous.lastSeenAt),
    row("**Memory**", rss),
    row(
      "**Event loop**",
      previous.lastLoopMaxMs === undefined ? "no reading" : `${previous.lastLoopMaxMs} ms max`,
    ),
    row("**Booted again**", bootedAgainAt.toISOString()),
  ].join("\n");
}

function issueBody(previous: RunMarker, now: Date): string {
  return [
    "**The dashboard server stopped without its clean shutdown, then booted again.**",
    "",
    occurrenceTable(previous, now),
    "",
    "- A clean stop (a deploy's SIGTERM) removes the run marker; this boot found it still there.",
    "- Usual causes: an out-of-memory kill, an uncaught crash, or the drain overrunning Fly's kill timeout.",
    "- Next: search the logs for `Out of memory` and the last `[gauge]` lines, then run `/retro` on it.",
    "",
    "<details><summary><strong>Where this comes from</strong></summary>",
    "",
    "Filed by the server's run marker (`src/server/run-marker.ts`, #4618). Later unclean restarts",
    "comment here while this issue is open, at most once per 30 minutes during a crash loop.",
    "Close it once the lesson is banked in `docs/LESSONS.md`.",
    "",
    "</details>",
  ].join("\n");
}

/** The open incident this reporter filed, if any. */
async function findOpenIncident(
  config: IncidentConfig,
  doFetch: DoFetch,
): Promise<number | undefined> {
  const res = await doFetch(
    "GET",
    `https://api.github.com/repos/${config.repo}/issues?labels=${INCIDENT_LABEL}&state=open&per_page=50`,
    githubHeaders(config.token),
  );
  if (res.status !== 200 || !Array.isArray(res.body)) return undefined;
  const open = (res.body as readonly { number?: number; title?: string }[]).find(
    (issue) => issue.title === INCIDENT_TITLE,
  );
  return open?.number;
}

export interface ReportDeps {
  config: IncidentConfig | undefined;
  /** Only a live run files; offline/dev logs the line and stops. */
  live: boolean;
  now: Date;
  log: (line: string) => void;
  /** Record that a report went out, so a crash loop's next boot holds off. */
  reported: (at: Date) => void;
  doFetch?: DoFetch;
}

export type ReportOutcome = "filed" | "commented" | "cooldown" | "inert" | "failed";

/** Report the previous run's unclean exit. Never throws — the boot it runs in must not care. */
export async function reportUncleanRestart(
  previous: RunMarker,
  deps: ReportDeps,
): Promise<ReportOutcome> {
  const { config, now, log } = deps;
  log(describeUncleanExit(previous));
  if (!(deps.live && config)) {
    log("[run-marker] not filing an incident: offline, or no GitHub token");
    return "inert";
  }
  const last = previous.reportedAt ? Date.parse(previous.reportedAt) : Number.NaN;
  if (now.getTime() - last < REPORT_COOLDOWN_MS) {
    log(`[run-marker] already reported at ${previous.reportedAt} — holding off (crash loop?)`);
    return "cooldown";
  }
  const doFetch = deps.doFetch ?? fetchJson;
  const headers = githubHeaders(config.token);
  const base = `https://api.github.com/repos/${config.repo}/issues`;
  try {
    const open = await findOpenIncident(config, doFetch);
    if (open) {
      const res = await doFetch("POST", `${base}/${open}/comments`, headers, {
        body: `**It happened again.**\n\n${occurrenceTable(previous, now)}`,
      });
      if (res.status !== 201) throw new Error(githubErrorMessage(res));
      deps.reported(now);
      log(`[run-marker] commented on incident #${open}`);
      return "commented";
    }
    const res = await doFetch("POST", base, headers, {
      title: INCIDENT_TITLE,
      body: issueBody(previous, now),
    });
    const number = (res.body as { number?: number } | null)?.number;
    if (res.status !== 201 || !number) throw new Error(githubErrorMessage(res));
    // A separate call, as `feedback-service.ts` does: a label baked into the create never fires
    // `issues.labeled`, which is the event every lane listens for.
    await doFetch("POST", `${base}/${number}/labels`, headers, { labels: [INCIDENT_LABEL] });
    deps.reported(now);
    log(`[run-marker] filed incident #${number}`);
    return "filed";
  } catch (error) {
    log(`[run-marker] could not file the incident: ${String(error)}`);
    return "failed";
  }
}

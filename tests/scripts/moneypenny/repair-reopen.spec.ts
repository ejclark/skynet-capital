import {
  REOPEN_MARKER,
  readFailures,
  recurrenceCount,
  reopenable,
  routeFailure,
  withRecurrence,
} from "../../../scripts/moneypenny/repair.mjs";

// #6356, the live half: the jobs read that came back empty was GitHub lagging (the same endpoint
// answered 502 minutes later). A re-read after a wait finds the real failed job, which then
// routes as a recurrence onto its open capsule instead of a new mislabelled one.
describe("moneypenny repair — re-reading a run's jobs before filing a guess", () => {
  const run = { id: 7, name: "Pipeline", conclusion: "failure" };
  const failed = [
    {
      id: 2,
      name: "release · deploy bots",
      conclusion: "failure",
      runner_name: "r",
      steps: [{ name: "Smoke test the bots release", conclusion: "failure" }],
    },
  ];
  const reads = (...answers: (object[] | Error)[]) => {
    let i = 0;
    return () => {
      const answer = answers[Math.min(i++, answers.length - 1)] ?? [];
      if (answer instanceof Error) throw answer;
      return answer;
    };
  };

  it("waits and re-reads until the failed job shows up", () => {
    const waited: number[] = [];
    const failures = readFailures(run, {
      fetchJobs: reads([], new Error("HTTP 502"), failed),
      logOf: () => "log",
      sleep: (ms: number) => waited.push(ms),
      waits: [1, 2, 3],
    });

    expect(failures).toEqual([
      { job: "release · deploy bots", step: "Smoke test the bots release", logTail: "log" },
    ]);
    expect(waited).toEqual([1, 2]);
  });

  it("files the honest unread shape once the waits run out", () => {
    const failures = readFailures(run, {
      fetchJobs: reads([]),
      logOf: () => "",
      sleep: () => undefined,
      waits: [1, 2],
    });

    expect(failures[0]?.job).toBe("(the failed job could not be read)");
  });

  // #6406: run 41121443220 concluded failure while every read for a minute still had `release ·
  // deploy bots` at `in_progress`, so the lane filed the unread shape beside #5955's open capsule.
  const stillRunning = [
    { id: 2, name: "release · deploy bots", status: "in_progress", conclusion: null, steps: [] },
    { id: 3, name: "verify", status: "completed", conclusion: "skipped", steps: [] },
  ];

  it("keeps re-reading past the first minute while a job still reads as running", () => {
    const waited: number[] = [];
    const failures = readFailures(run, {
      fetchJobs: reads(stillRunning, stillRunning, stillRunning, failed),
      logOf: () => "log",
      sleep: (ms: number) => waited.push(ms),
      waits: [1, 2],
      staleWaits: [60, 60],
    });

    expect(failures[0]?.job).toBe("release · deploy bots");
    expect(failures[0]?.step).toBe("Smoke test the bots release");
    expect(waited).toEqual([1, 2, 60]);
  });

  it("files the unread shape only once the extended waits also run out", () => {
    const waited: number[] = [];
    const failures = readFailures(run, {
      fetchJobs: reads(stillRunning),
      logOf: () => "",
      sleep: (ms: number) => waited.push(ms),
      waits: [1],
      staleWaits: [60, 60],
    });

    expect(failures[0]?.job).toBe("(the failed job could not be read)");
    expect(waited).toEqual([1, 60, 60]);
  });

  it("does not extend the waits for a read with no job still running", () => {
    const waited: number[] = [];
    readFailures(run, {
      fetchJobs: reads([{ ...stillRunning[1] }]),
      logOf: () => "",
      sleep: (ms: number) => waited.push(ms),
      waits: [1, 2],
      staleWaits: [60],
    });

    expect(waited).toEqual([1, 2]);
  });

  it("goes red rather than guessing when the last read still throws", () => {
    expect(() =>
      readFailures(run, {
        fetchJobs: reads(new Error("HTTP 502")),
        logOf: () => "",
        sleep: () => undefined,
        waits: [1],
      }),
    ).toThrow("HTTP 502");
  });

  it("does not wait at all on a rejected file — zero jobs on a path-named run is final", () => {
    const waited: number[] = [];
    const failures = readFailures(
      { ...run, name: ".github/workflows/pipeline.yml" },
      { fetchJobs: reads([]), logOf: () => "", sleep: (ms: number) => waited.push(ms) },
    );

    expect(failures[0]?.job).toBe("(the workflow never started)");
    expect(waited).toEqual([]);
  });
});

// #6953 slice 2 — one fault, one number, across closes. Guard 3 read only OPEN capsules, so the
// breaker's `route` failure, proven green and closed by the audit tick between trips, was filed 9
// times in 5 days (#6640 → #6942) and dispatched a repair session each time.
describe("moneypenny repair — a fault back after a close reopens its capsule (#6953)", () => {
  const title = "[ci] Moneypenny Events (event-research automation) — route";
  const runAt = (started: string, id = 1) => ({
    id,
    name: "Moneypenny Events (event-research automation)",
    conclusion: "failure",
    event: "push",
    head_branch: "main",
    run_started_at: started,
    html_url: `https://github.com/o/r/actions/runs/${id}`,
  });
  const failures = [{ job: "route", step: "List due events" }];
  const closed = (number: number, closedAt: string, over: Record<string, unknown> = {}) => ({
    number,
    title,
    closedAt,
    stateReason: "NOT_PLANNED",
    labels: ["ci-failure"],
    body: "| | |\n|---|---|\n| **Run** | [1](u) |",
    ...over,
  });
  const route = (started: string, closedIssues: ReturnType<typeof closed>[], openIssues = []) =>
    routeFailure(
      { run: runAt(started), defaultBranch: "main", failures },
      { openIssues, closedIssues },
    );

  it("reopens a capsule closed within 14 days, with a count, and dispatches a repair", () => {
    const [intent] = route("2026-11-03T00:50:00Z", [closed(6640, "2026-11-02T14:08:20Z")]);
    expect(intent).toMatchObject({ type: "reopen-issue", issue: 6640, dispatch: true });
    expect(intent?.issueBody).toContain("| **Came back after a close** | 1 time |");
    // The recurrence line capsule-stall.mjs keys its proof cut on, and the marker it reads lives by.
    expect(intent?.body?.startsWith("Failed again — run [1]")).toBe(true);
    expect(intent?.body).toContain(REOPEN_MARKER);
  });

  it("files fresh past the window — an old close no longer owns the signature", () => {
    const [intent] = route("2026-11-20T00:00:00Z", [closed(6640, "2026-11-02T14:08:20Z")]);
    expect(intent?.type).toBe("open-issue");
  });

  it("reopens the newest of several closed capsules", () => {
    const back = reopenable(
      runAt("2026-11-06T08:10:00Z"),
      [
        closed(6640, "2026-11-02T14:08:20Z"),
        closed(6921, "2026-11-06T08:09:55Z"),
        closed(6900, "2026-11-05T13:52:30Z"),
      ],
      title,
    );
    expect(back?.number).toBe(6921);
  });

  it("an open capsule still wins: a recurrence comments, it never reopens a closed twin", () => {
    const [intent] = route("2026-11-03T00:50:00Z", [closed(6640, "2026-11-02T14:08:20Z")], [
      { number: 6763, title, labels: [] },
    ] as never);
    expect(intent).toMatchObject({ type: "comment", issue: 6763 });
  });

  it("reopens without a repair session when the close handed its ask to a session, or to Eric", () => {
    for (const label of ["needs-session", "needs-eric"]) {
      const [intent] = route("2026-11-03T00:50:00Z", [
        closed(6640, "2026-11-02T14:08:20Z", { labels: ["ci-failure", label] }),
      ]);
      expect(intent).toMatchObject({ type: "reopen-issue", issue: 6640, dispatch: false });
      expect(intent?.body).toContain(`carries \`${label}\``);
    }
  });

  it("drops the labels that described the last life, and only those present", () => {
    const [intent] = route("2026-11-03T00:50:00Z", [
      closed(6640, "2026-11-02T14:08:20Z", {
        labels: ["ci-failure", "in-progress", "stall-flagged", "released"],
      }),
    ]);
    expect(intent?.removeLabels).toEqual(["in-progress", "stall-flagged"]);
  });

  it("never reopens a duplicate, whose number was retired for another", () => {
    const [intent] = route("2026-11-03T00:50:00Z", [
      closed(6640, "2026-11-02T14:08:20Z", { stateReason: "DUPLICATE" }),
    ]);
    expect(intent?.type).toBe("open-issue");
  });

  it("spends no body edit when the body has no table to count in", () => {
    const [intent] = route("2026-11-03T00:50:00Z", [
      closed(6640, "2026-11-02T14:08:20Z", { body: "no table" }),
    ]);
    expect(intent).toMatchObject({ type: "reopen-issue", issue: 6640 });
    expect(intent?.issueBody).toBeUndefined();
    expect(intent?.body).toContain("come back after a close 1 time");
  });

  it("counts up from the body's row, which sits with the metadata table", () => {
    const body = [
      "| | |",
      "|---|---|",
      "| **Run** | [1](u) |",
      "| **Legs failed** | 2 of this job, in this one run |",
      "",
      "- talking point",
    ].join("\n");
    const once = withRecurrence(body, 1);
    expect(once.split("\n")[4]).toBe("| **Came back after a close** | 1 time |");
    expect(recurrenceCount(once)).toBe(1);
    const thrice = withRecurrence(once, 3);
    expect(recurrenceCount(thrice)).toBe(3);
    expect(thrice.match(/Came back after a close/g)).toHaveLength(1);
    expect(withRecurrence("no table here", 2)).toBe("no table here");
    expect(recurrenceCount(undefined)).toBe(0);
  });

  // The slice's replay check: the measured 2026-11-02..11-06 sequence. Each trip's run starts a few
  // minutes before the capsule it filed; each close is the audit tick's proof close between trips.
  it("replayed over the 11-02..11-06 breaker sequence, files 1 issue number, not 9", () => {
    const trips = [
      ["2026-11-02T00:57:58Z", "2026-11-02T14:08:20Z"],
      ["2026-11-03T00:53:52Z", "2026-11-03T07:40:13Z"],
      ["2026-11-03T07:42:15Z", "2026-11-03T15:59:47Z"],
      ["2026-11-03T16:12:10Z", "2026-11-04T01:55:54Z"],
      ["2026-11-04T02:14:37Z", "2026-11-05T00:49:55Z"],
      ["2026-11-05T00:56:42Z", "2026-11-05T07:23:38Z"],
      ["2026-11-05T07:27:29Z", "2026-11-05T13:52:30Z"],
      ["2026-11-06T00:56:47Z", "2026-11-06T08:09:55Z"],
      ["2026-11-06T08:13:44Z", null],
    ] as const;
    const replay = (reopens: boolean) => {
      let next = 6640;
      const open: { number: number; title: string; labels: string[] }[] = [];
      const shut: ReturnType<typeof closed>[] = [];
      const numbers = new Set<number>();
      for (const [filedAt, closedAt] of trips) {
        const started = new Date(Date.parse(filedAt) - 5 * 60_000).toISOString();
        for (const i of route(started, reopens ? shut : [], open as never)) {
          if (i.type === "open-issue") open.push({ number: next++, title, labels: [] });
          if (i.type === "reopen-issue") {
            shut.splice(
              shut.findIndex((c) => c.number === i.issue),
              1,
            );
            open.push({ number: i.issue as number, title, labels: [] });
          }
        }
        numbers.add(open[0]?.number as number);
        if (closedAt) shut.push(closed(open.shift()?.number as number, closedAt));
      }
      return numbers;
    };
    expect([...replay(true)]).toEqual([6640]);
    // The falsifier's other half: the same trips without the reopen file under 9 numbers.
    expect(replay(false).size).toBe(9);
  });
});

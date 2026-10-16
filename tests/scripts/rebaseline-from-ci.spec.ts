import { crc32, deflateRawSync } from "node:zlib";
import {
  baselinePath,
  classify,
  commitMessage,
  type FileReport,
  pickRun,
  plan,
  type Report,
  type Run,
  readReport,
  renderRows,
  reportZipFrom,
  type ScreenshotRow,
  screenshotVerdict,
  staleForApply,
  type Test,
  unzip,
} from "../../scripts/rebaseline-from-ci.mjs";

// The re-baseline round trip, as one command (2026-10-10: #5079 and #5080 both went red on their
// first CI run because screenshot baselines are Linux-only and builders run on macOS). These pin
// the parts that decide what gets written: reading the report CI uploads, mapping a failing
// snapshot to the baseline file it would replace, and refusing everything that is not a pixel
// mismatch on an existing baseline — the script must never turn a red logic test green.

const ESC = String.fromCharCode(27);
const dim = (s: string) => `${ESC}[2m${s}${ESC}[22m`;

/** The real shape of a page mismatch from #5080's run 38069939238, call log trimmed. */
const pageMismatch = (snapshot: string, size: string, px: string) =>
  `Error: ${dim("expect(")}${ESC}[31mpage${ESC}[39m${dim(").")}toHaveScreenshot${dim("(")}` +
  `${ESC}[32mexpected${ESC}[39m${dim(")")} failed\n\n  Expected an image ${size}. ${px} are ` +
  `different.\n\n  Snapshot: ${snapshot}.png\n\nCall log:\n${dim("  - taking page screenshot")}\n`;

const LEARN = pageMismatch(
  "learn-page",
  "1280px by 2124px, received 1280px by 2125px",
  "30099 pixels (ratio 0.02 of all image pixels)",
);
/** The element shot from the same run: the top bar's market clock on /settings. */
const CLOCK =
  `Error: expect(locator).toHaveScreenshot(expected) failed\n\nLocator: locator('.status-line')\n` +
  "  Expected an image 132px by 33px, received 263px by 35px. 1231 pixels (ratio 0.14 of all " +
  "image pixels) are different.\n\n  Snapshot: settings-page-market-clock.png\n\nCall log:\n";
const LOGIC = `Error: ${dim("expect(")}locator${dim(").")}toBeVisible() failed\n\nLocator: getByRole('button')\n`;
const UNSTABLE =
  "Error: expect(page).toHaveScreenshot(expected) failed\n\n  Timeout: 5000ms\n  Failed to take " +
  "two consecutive stable screenshots.\n\n  Snapshot: desk-page.png\n";
const MISSING =
  "Error: A snapshot doesn't exist at /home/runner/work/x/e2e/journeys/home.spec.ts-snapshots/" +
  "home-page-chromium-linux.png, writing actual.";

const shots = (snapshot: string, n: number) => [
  { name: `${snapshot}-expected.png`, contentType: "image/png", path: `data/${n}a.png` },
  { name: `${snapshot}-actual.png`, contentType: "image/png", path: `data/${n}b.png` },
  { name: `${snapshot}-diff.png`, contentType: "image/png", path: `data/${n}c.png` },
  { name: "screenshot", contentType: "image/png", path: `data/${n}b.png` },
];

const failed = (
  title: string,
  errors: string[],
  attachments: { name: string; path?: string }[] = [],
  outcome: "unexpected" | "flaky" = "unexpected",
) => ({
  title: "matches the known-good page screenshot",
  path: [title],
  projectName: "chromium",
  outcome,
  results: [
    { status: "failed", errors: [], attachments: [] },
    { status: "failed", errors: errors.map((message) => ({ message })), attachments },
  ],
});

const FILES: FileReport[] = [
  {
    fileId: "aa",
    fileName: "learn.spec.ts",
    tests: [
      failed("learn", [LEARN], shots("learn-page", 1)),
      failed("learn/trading", [LEARN], shots("learn-trading-page", 2), "flaky"),
    ],
  },
  {
    fileId: "bb",
    fileName: "settings.spec.ts",
    tests: [failed("settings", [CLOCK], shots("settings-page-market-clock", 3))],
  },
  {
    fileId: "cc",
    fileName: "desk.spec.ts",
    tests: [
      failed("desk", [LOGIC]),
      failed("desk/unstable", [UNSTABLE], shots("desk-page", 4)),
      failed("desk/both", [LEARN, LOGIC], shots("desk-both-page", 5)),
    ],
  },
  {
    fileId: "dd",
    fileName: "journeys/home.spec.ts",
    tests: [failed("home", [MISSING], shots("home-page", 6).slice(1, 2))],
  },
];
const REPORT: Report = { files: FILES.map(({ fileId, fileName }) => ({ fileId, fileName })) };

/** A real zip, deflated the way Playwright's HTML reporter writes it. */
function zipOf(files: Record<string, string>): Buffer {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const body = Buffer.from(text);
    const packed = deflateRawSync(body);
    const n = Buffer.from(name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc32(body), 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(body.length, 22);
    local.writeUInt16LE(n.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt32LE(crc32(body), 16);
    entry.writeUInt32LE(packed.length, 20);
    entry.writeUInt32LE(body.length, 24);
    entry.writeUInt16LE(n.length, 28);
    entry.writeUInt32LE(offset, 42);
    parts.push(local, n, packed);
    central.push(entry, n);
    offset += 30 + n.length + packed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(central.length / 2, 8);
  end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}

const indexHtml = (zip: Buffer) =>
  `<!DOCTYPE html><html><body><div id='root'></div></body></html>\n` +
  `<template id="playwrightReportBase64">data:application/zip;base64,${zip.toString("base64")}</template>`;

const ARTIFACT = zipOf({
  "report.json": JSON.stringify(REPORT),
  ...Object.fromEntries(FILES.map((f) => [`${f.fileId}.json`, JSON.stringify(f)])),
});

describe("rebaseline-from-ci — reading the report CI uploads", () => {
  it("decodes the zip Playwright embeds in index.html, one JSON per spec file", () => {
    const { report, files } = readReport(unzip(reportZipFrom(indexHtml(ARTIFACT))));

    expect(report.files.map((f) => f.fileName)).toEqual(FILES.map((f) => f.fileName));
    expect(files[0]?.tests[0]?.results[1]?.errors).toEqual([{ message: LEARN }]);
  });

  it("says so when index.html carries no report, instead of reading nothing as all-clear", () => {
    expect(() => reportZipFrom("<html><body>404</body></html>")).toThrow(/no embedded report/);
  });

  it("refuses a damaged artifact rather than reading garbage out of it", () => {
    const damaged = Buffer.from(ARTIFACT);
    const directory = damaged.readUInt32LE(damaged.length - 22 + 16);
    damaged.writeUInt32LE(0xdeadbeef, directory + 16); // the first entry's recorded checksum

    expect(() => unzip(damaged)).toThrow(/checksum/);
  });
});

describe("rebaseline-from-ci — which failures it will ever re-baseline", () => {
  const { screenshots, others } = classify({ report: REPORT, files: FILES });
  const row = (snapshot: string) => screenshots.find((s) => s.snapshot === snapshot);

  it("turns a page mismatch into a row naming the Linux baseline it would replace", () => {
    const learn = row("learn-page");

    expect(learn && baselinePath(learn)).toBe(
      "e2e/learn.spec.ts-snapshots/learn-page-chromium-linux.png",
    );
    expect(learn).toMatchObject({
      expected: "data/1a.png",
      actual: "data/1b.png",
      diff: "data/1c.png",
    });
    expect(learn?.why).toBe("1280×2124 → 1280×2125, 30,099 px differ (ratio 0.02)");
  });

  it("lists every row with the three pictures to read before anything is applied", () => {
    const learn = row("learn-page");
    const text = renderRows(learn ? [learn] : []);

    expect(text).toContain("learn.spec.ts · learn-page");
    for (const kind of ["expected", "actual", "diff"]) {
      expect(text).toContain(`learn.spec.ts/learn-page-${kind}.png`);
    }
  });

  it("treats an element screenshot the same as a page one", () => {
    const clock = row("settings-page-market-clock");

    expect(clock && baselinePath(clock)).toBe(
      "e2e/settings.spec.ts-snapshots/settings-page-market-clock-chromium-linux.png",
    );
    expect(clock?.why).toBe("132×33 → 263×35, 1,231 px differ (ratio 0.14)");
  });

  it("never re-baselines a logic failure — it is printed as one to fix", () => {
    expect(others).toContainEqual(
      expect.objectContaining({ spec: "desk.spec.ts", title: expect.stringMatching(/^desk ›/) }),
    );
    expect(others.find((o) => o.title.startsWith("desk ›"))?.why).toMatch(/toBeVisible\(\) failed/);
  });

  it("refuses a test whole when a screenshot and a logic assertion both failed in it", () => {
    expect(row("desk-both-page")).toBeUndefined();
    expect(others.map((o) => o.title)).toContain(
      "desk/both › matches the known-good page screenshot",
    );
  });

  it("counts a page that never settled as a failure to fix, not a picture to accept", () => {
    expect(screenshotVerdict(UNSTABLE)).toBe("other");
    expect(row("desk-page")).toBeUndefined();
  });

  it("refuses a test whose first try failed a logic assertion, even if its retry failed on pixels only", () => {
    const logicThenPixels: Test = {
      title: "matches the known-good page screenshot",
      path: ["desk/retry"],
      projectName: "chromium",
      outcome: "unexpected",
      results: [
        { status: "failed", errors: [{ message: LOGIC }], attachments: [] },
        {
          status: "failed",
          errors: [{ message: LEARN }],
          attachments: shots("desk-retry-page", 7),
        },
      ],
    };
    const run = classify({
      report: { files: [{ fileId: "ee", fileName: "desk.spec.ts" }] },
      files: [{ fileId: "ee", fileName: "desk.spec.ts", tests: [logicThenPixels] }],
    });

    expect(run.screenshots).toEqual([]);
    expect(run.others[0]?.why).toMatch(/toBeVisible\(\) failed/);
  });

  it("leaves a test that passed on its retry alone", () => {
    expect(row("learn-trading-page")).toBeUndefined();
    expect(others.map((o) => o.title)).not.toContain(
      "learn/trading › matches the known-good page screenshot",
    );
  });

  it("reports a run-level error, like a server that never booted, as a failure to fix", () => {
    const run = classify({
      report: { ...REPORT, errors: ["Error: Timed out waiting 60000ms from config.webServer."] },
      files: [],
    });

    expect(run.screenshots).toEqual([]);
    expect(run.others[0]?.why).toMatch(/webServer/);
  });

  it("keeps a nested spec's snapshots in the folder beside that spec", () => {
    expect(
      baselinePath({ spec: "journeys/home.spec.ts", snapshot: "home-page", project: "chromium" }),
    ).toBe("e2e/journeys/home.spec.ts-snapshots/home-page-chromium-linux.png");
  });
});

describe("rebaseline-from-ci — what --apply may write", () => {
  const { screenshots } = classify({ report: REPORT, files: FILES });
  const committed = new Set([
    "e2e/learn.spec.ts-snapshots/learn-page-chromium-linux.png",
    "e2e/settings.spec.ts-snapshots/settings-page-market-clock-chromium-linux.png",
  ]);

  it("replaces only a baseline that already exists — a new snapshot is a human call", () => {
    const { copies, refusals } = plan(screenshots, (p) => committed.has(p));

    expect(copies.map((c) => c.baseline).sort()).toEqual([...committed].sort());
    expect(refusals).toEqual([
      expect.objectContaining({
        baseline: "e2e/journeys/home.spec.ts-snapshots/home-page-chromium-linux.png",
        why: expect.stringMatching(/new snapshot is a human call/),
      }),
    ]);
  });

  it("refuses a snapshot CI found no baseline for, even once a file is at that path here", () => {
    const home = screenshots.find((s) => s.snapshot === "home-page");

    expect(home?.missing).toBe(true);
    expect(screenshots.find((s) => s.snapshot === "learn-page")?.missing).toBe(false);
    const { copies, refusals } = plan(home ? [home] : [], () => true);
    expect(copies).toEqual([]);
    expect(refusals[0]?.why).toMatch(/new snapshot is a human call/);
  });

  it("refuses a name that would land outside an e2e snapshots folder, even if a file is there", () => {
    const outside: ScreenshotRow = {
      spec: "../.husky/x.spec.ts",
      title: "x › matches the known-good page screenshot",
      project: "chromium",
      snapshot: "pre-commit",
      expected: null,
      actual: "data/9b.png",
      diff: null,
      why: "",
    };

    const { copies, refusals } = plan([outside], () => true);

    expect(copies).toEqual([]);
    expect(refusals[0]?.why).toMatch(/not a path inside an e2e snapshots folder/);
  });
});

describe("rebaseline-from-ci — which run it reads", () => {
  const HEAD = "b2fe12c000000000000000000000000000000000";
  const at = (
    id: number,
    head_sha: string,
    status: string,
    conclusion: string | null,
    minute: number,
  ): Run => ({
    id,
    head_sha,
    status,
    conclusion,
    created_at: `2026-10-10T17:${String(minute).padStart(2, "0")}:00Z`,
  });

  it("reads the newest failed run on the PR's head, past a cancelled duplicate", () => {
    const pick = pickRun(
      [at(3, HEAD, "completed", "cancelled", 30), at(2, HEAD, "completed", "failure", 20)],
      HEAD,
    );

    expect("run" in pick && pick.run.id).toBe(2);
  });

  it("waits while the head's run is still going", () => {
    const pick = pickRun(
      [at(4, HEAD, "in_progress", null, 40), at(2, HEAD, "completed", "failure", 20)],
      HEAD,
    );

    expect("stop" in pick && pick.stop).toMatch(/still in_progress/);
  });

  it("has nothing to do once the head's run passed", () => {
    const pick = pickRun(
      [at(5, HEAD, "completed", "success", 50), at(2, HEAD, "completed", "failure", 20)],
      HEAD,
    );

    expect("done" in pick && pick.done).toMatch(/passed/);
  });

  it("never reads a failed run from an older commit when the head has none", () => {
    const pick = pickRun([at(1, "d703ff6".padEnd(40, "0"), "completed", "failure", 5)], HEAD);

    expect("stop" in pick && pick.stop).toMatch(/no Pipeline run on the PR's head b2fe12c/);
  });
});

describe("rebaseline-from-ci — which run --apply may copy from", () => {
  const HEAD = "91c38a4".padEnd(40, "0");

  it("copies from a run that tested the PR's head", () => {
    expect(staleForApply({ id: 38072789546, head_sha: HEAD }, HEAD)).toBeNull();
  });

  it("refuses a run on an older commit — it can be read, never applied", () => {
    const older = { id: 38069939238, head_sha: "d703ff6".padEnd(40, "0") };

    expect(staleForApply(older, HEAD)).toMatch(/tested d703ff6, but the PR's head is 91c38a4/);
  });
});

describe("rebaseline-from-ci — the commit", () => {
  it("is one conventional commit that names the run and lists every file", () => {
    const files = [
      "e2e/learn.spec.ts-snapshots/learn-page-chromium-linux.png",
      "e2e/settings.spec.ts-snapshots/settings-page-market-clock-chromium-linux.png",
    ];
    const { subject, body } = commitMessage(38069939238, files);

    expect(subject).toBe("test(e2e): re-baseline 2 screenshots from CI run 38069939238");
    expect(subject.length).toBeLessThanOrEqual(100);
    for (const f of files) expect(body).toContain(`- ${f}`);
    for (const line of body.split("\n")) expect(line.length).toBeLessThanOrEqual(100);
  });
});

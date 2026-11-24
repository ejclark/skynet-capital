// The component-test baselines in e2e/ct/__snapshots__ are shot with the headless_shell Playwright
// pins, and a different Chromium build shifts font metrics by a pixel, which fails every shot at
// CT_DIFF_RATIO 0.001. The cloud sandbox ships its own Chromium at /opt/pw-browsers/chromium (rev
// 1243 on 2026-11-23, against Playwright 1.62.1's 1234), and the shared resolver hands it out to any
// config that asks. #7726: the ct config asked, so in the sandbox `test:e2e:ct` ran 16 of 17 specs
// red, and `test:e2e:ct:update` would have re-shot every baseline on the wrong build.
//
// The repro stands in for "a sandbox Chromium is present" with PW_CHROME pointed at a real file —
// the resolver's first candidate — so it fails on any machine, not just inside the sandbox.

describe("the component-test config's browser", () => {
  const was = process.env.PW_CHROME;
  afterEach(() => {
    if (was === undefined) delete process.env.PW_CHROME;
    else process.env.PW_CHROME = was;
  });

  it("is Playwright's own pinned build even when a sandbox Chromium is on disk", async () => {
    process.env.PW_CHROME = process.execPath;
    const { default: config } = await import("../../../app/playwright-ct.config");
    const launched = (config.projects ?? []).map((p) => p.use?.launchOptions?.executablePath);
    expect(launched).toEqual([undefined]);
  });
});

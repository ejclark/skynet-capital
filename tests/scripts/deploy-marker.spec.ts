import { deploymentRequest, parseArgs, statusRequest } from "../../scripts/deploy-marker.mjs";

// The production deployment marker (Eric, 2026-11-13): a GitHub Deployment per real release, so the
// repo shows what is live. Pure payloads only; the REST calls are a warning-only IO shell.

const SHA = "104d21f9191554fe1a7a94c6dbcbc2b5b9784bcd";

describe("deploymentRequest", () => {
  it("targets this commit with no merge and no status gate", () => {
    expect(deploymentRequest({ sha: SHA, environment: "production" })).toMatchObject({
      ref: SHA,
      environment: "production",
      auto_merge: false,
      required_contexts: [],
      production_environment: true,
      transient_environment: false,
    });
  });

  it("marks only production* environments as production", () => {
    expect(
      deploymentRequest({ sha: SHA, environment: "production-bots" }).production_environment,
    ).toBe(true);
    expect(deploymentRequest({ sha: SHA, environment: "staging" }).production_environment).toBe(
      false,
    );
  });

  it("refuses a missing sha or environment rather than marking the wrong thing", () => {
    expect(() => deploymentRequest({ sha: "", environment: "production" })).toThrow(/sha/);
    expect(() => deploymentRequest({ sha: SHA, environment: "" })).toThrow(/environment/);
  });
});

describe("statusRequest", () => {
  it("records a live release with its URL and run log, retiring the previous one", () => {
    expect(
      statusRequest({
        state: "success",
        url: "https://skynet-capital.fly.dev",
        logUrl: "https://x/run",
      }),
    ).toEqual({
      state: "success",
      environment_url: "https://skynet-capital.fly.dev",
      log_url: "https://x/run",
      description: "",
      auto_inactive: true,
    });
  });

  it("accepts only success or failure", () => {
    expect(statusRequest({ state: "failure" }).state).toBe("failure");
    expect(() => statusRequest({ state: "pending" })).toThrow(/success or failure/);
  });
});

describe("parseArgs", () => {
  it("defaults to a successful production marker", () => {
    expect(parseArgs([])).toEqual({
      environment: "production",
      url: "",
      state: "success",
      description: "",
    });
    expect(parseArgs(["--env", "production-bots", "--state", "failure"])).toMatchObject({
      environment: "production-bots",
      state: "failure",
    });
  });
});

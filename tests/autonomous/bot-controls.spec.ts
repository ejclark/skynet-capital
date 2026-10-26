import {
  EMPTY_CONTROLS,
  effectiveBetaPicks,
  effectiveBetaStage,
  effectiveHardcoreIds,
  effectiveMode,
  MAX_BETA_PICKS,
  parseControlsState,
  stampCredentialVersions,
  suspendedReason,
} from "../../src/autonomous/bot-controls.js";
import { credentialFingerprint } from "../../src/autonomous/bot-credential-fingerprint.js";

describe("parseControlsState — total, defensive", () => {
  it("parses a full state and drops junk fields", () => {
    const state = parseControlsState({
      allSuspended: true,
      bots: {
        sauron: { suspended: true, mode: "live", hardcore: false, junk: 1 },
        banker: { mode: "nonsense" },
      },
      updatedAt: "2026-08-21T12:00:00.000Z",
      updatedBy: "owner@example.com",
      extra: "ignored",
    });
    expect(state).toEqual({
      allSuspended: true,
      bots: { sauron: { suspended: true, mode: "live", hardcore: false }, banker: {} },
      updatedAt: "2026-08-21T12:00:00.000Z",
      updatedBy: "owner@example.com",
    });
  });

  it("returns null for non-objects and never throws", () => {
    expect(parseControlsState(null)).toBeNull();
    expect(parseControlsState("nope")).toBeNull();
    expect(parseControlsState([1, 2])).toBeNull();
    expect(parseControlsState({})).toEqual({ bots: {} });
  });

  it("parses a bot's credentialsVersion fingerprint, and drops an oversized one", () => {
    const state = parseControlsState({
      bots: {
        sauron: { credentialsVersion: "abc123" },
        banker: { credentialsVersion: "x".repeat(65) },
        prospector: { credentialsVersion: "" },
      },
    });
    expect(state).toEqual({
      bots: { sauron: { credentialsVersion: "abc123" }, banker: {}, prospector: {} },
    });
  });
});

describe("parseControlsState — the companion model dial (#1672 slice 4)", () => {
  it("parses an allowlisted model", () => {
    expect(parseControlsState({ companionModel: "claude-haiku-4-5" })).toEqual({
      bots: {},
      companionModel: "claude-haiku-4-5",
    });
  });

  it("drops a model outside the allowlist rather than trusting it", () => {
    expect(parseControlsState({ companionModel: "gpt-5" })).toEqual({ bots: {} });
  });

  it("drops the previous Sonnet ID a saved dial may still hold", () => {
    // A dial saved before the allowlist moved to Sonnet 5.5 still reads "claude-sonnet-5" — an
    // active model, just no longer on the allowlist. The fallback to the default is pinned in
    // tests/server/controls-form.spec.ts.
    expect(parseControlsState({ companionModel: "claude-sonnet-5" })).toEqual({ bots: {} });
  });
});

describe("suspendedReason — the blockedReason seam", () => {
  it("blocks a per-bot suspend with the owner's reason", () => {
    const state = { bots: { sauron: { suspended: true } } };
    expect(suspendedReason(state, "sauron")).toBe("suspended by owner");
    expect(suspendedReason(state, "banker")).toBeNull();
  });

  it("the global switch blocks every id — including the empty runner-level probe", () => {
    const state = { allSuspended: true, bots: {} };
    expect(suspendedReason(state, "sauron")).toBe("suspended by owner (all bots)");
    expect(suspendedReason(state, "")).toBe("suspended by owner (all bots)");
  });

  it("empty state blocks nothing", () => {
    expect(suspendedReason(EMPTY_CONTROLS, "sauron")).toBeNull();
  });
});

describe("effective overrides — the store decides; only mode keeps an env default", () => {
  it("mode: the store override narrows the env default in both directions", () => {
    expect(effectiveMode({ bots: { sauron: { mode: "observe" } } }, "sauron", "live")).toBe(
      "observe",
    );
    expect(effectiveMode({ bots: { sauron: { mode: "live" } } }, "sauron", "observe")).toBe("live");
    expect(effectiveMode(EMPTY_CONTROLS, "sauron", "live")).toBe("live");
  });

  it("hardcore: only a stored true arms a bot — no stored setting is standard (#4535 slice 4c-2)", () => {
    const ids = ["sauron", "banker"];
    expect(effectiveHardcoreIds(ids, EMPTY_CONTROLS)).toEqual(new Set());
    expect(effectiveHardcoreIds(ids, { bots: { sauron: { hardcore: false } } })).toEqual(new Set());
    expect(effectiveHardcoreIds(ids, { bots: { banker: { hardcore: true } } })).toEqual(
      new Set(["banker"]),
    );
  });
});

describe("betaPicks — the owner's forced-pick count for the scout's host (#4535 slice 2b)", () => {
  it("parses a whole number from 0 up to the ceiling", () => {
    for (const picks of [0, 1, 3, MAX_BETA_PICKS]) {
      expect(parseControlsState({ bots: { sauron: { betaPicks: picks } } })?.bots.sauron).toEqual({
        betaPicks: picks,
      });
    }
  });

  it("reads anything else as unset, which is off", () => {
    for (const bad of [-1, 1.5, MAX_BETA_PICKS + 1, "3", null, Number.NaN, true]) {
      expect(parseControlsState({ bots: { sauron: { betaPicks: bad } } })?.bots.sauron).toEqual({});
    }
  });

  it("is the stored number, and 0 (dark) with none", () => {
    expect(effectiveBetaPicks(undefined)).toBe(0);
    expect(effectiveBetaPicks(3)).toBe(3);
    expect(effectiveBetaPicks(0)).toBe(0);
  });
});

// #4535 slice 4b: the owner's after-close staging switch, read at every staging pass.
describe("after-close staging (betaStage)", () => {
  it("parses a stored boolean and reads anything else as unset, which is off", () => {
    expect(parseControlsState({ bots: { sauron: { betaStage: false } } })?.bots.sauron).toEqual({
      betaStage: false,
    });
    for (const bad of ["true", 1, null]) {
      expect(parseControlsState({ bots: { sauron: { betaStage: bad } } })?.bots.sauron).toEqual({});
    }
  });

  it("is the stored flag, off with none, and nothing stages with no picks", () => {
    expect(effectiveBetaStage(undefined, 2)).toBe(false);
    expect(effectiveBetaStage(true, 2)).toBe(true);
    expect(effectiveBetaStage(false, 2)).toBe(false);
    expect(effectiveBetaStage(true, 0)).toBe(false);
  });
});

describe("stampCredentialVersions", () => {
  const creds = { apiKey: "KID", apiSecret: "SECRET" };
  const salt = "test-salt";

  it("stamps a fingerprint for every persona a resolver can answer", () => {
    const stamped = stampCredentialVersions(EMPTY_CONTROLS, ["sauron"], () => creds, salt);
    expect(stamped.bots.sauron?.credentialsVersion).toBe(credentialFingerprint(creds, salt));
  });

  it("leaves a persona untouched when the resolver has nothing for it", () => {
    const stamped = stampCredentialVersions(EMPTY_CONTROLS, ["sauron"], () => undefined, salt);
    expect(stamped.bots.sauron).toBeUndefined();
  });

  it("never lets a resolver failure break the poll it rides on", () => {
    const stamped = stampCredentialVersions(
      EMPTY_CONTROLS,
      ["sauron"],
      () => {
        throw new Error("store read failed");
      },
      salt,
    );
    expect(stamped.bots.sauron).toBeUndefined();
  });

  it("preserves the bot's existing controls (suspended/mode/hardcore) while adding the version", () => {
    const state = { bots: { sauron: { suspended: true } } };
    const stamped = stampCredentialVersions(state, ["sauron"], () => creds, salt);
    expect(stamped.bots.sauron).toEqual({
      suspended: true,
      credentialsVersion: credentialFingerprint(creds, salt),
    });
  });
});

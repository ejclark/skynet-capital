// THE ONE QUESTION A LANE ASKS BEFORE IT DISPATCHES (#3960 slice 2, criterion 1): "may I, and how
// much?" Two independent controls can say no, and criterion 1 names both — so this folds them into
// a single answer rather than leaving each lane to remember the pair:
//
//   1. THE DIAL (work-mode.mjs) — the work spigot's position. `halt` is zero; every other position
//      hands back its per-lane numbers. Deliberate, set by a person or a session, expiring.
//   2. THE BRAKE (circuit-breaker.mjs) — the #2946 spend breaker's label. Automatic, tripped by a
//      runaway, cleared only by a human. It is NOT a conserve dial and never becomes one.
//
// A lane dispatches only if neither says no. They stay separate mechanisms on purpose (the plan's
// settled fork: "extend, don't replace, the breaker") — this is composition, not a merge.
//
// WHY A SEPARATE MODULE rather than a third mode on work-mode.mjs's CLI: that file is the READER of
// one dial and has no business knowing about spend, and the two already compose cleanly from the
// outside. The research lane does not call this — it checks the breaker inline in
// moneypenny-events.yml (ahead of everything, by #2946's design) and gets its number from
// `researchCapNow` in events.mjs. The caller this exists for is a SKILL, which has no import
// statement and needs one command with an exit code (`.claude/skills/governor/SKILL.md`).
//
// FAIL-CLOSED, SPLIT BY WHICH CONTROL IS UNREADABLE, because the two have different safe answers:
//   - an unreadable DIAL is `conserve` plus a warning, never a stop (work-mode.mjs's own doctrine:
//     every lane reads the dial, so a GitHub blip must not halt the repo);
//   - an unreadable BRAKE refuses outright (circuit-breaker.mjs throws; "broken must never read as
//     clear" is the whole reason that file exists), and so does a malformed config on either side.
import { isBreakerTripped, loadBreakerConfig } from "./circuit-breaker.mjs";
import { noticeLine, readWorkMode } from "./work-mode.mjs";

/** The default breaker read, with its config loaded EAGERLY: a malformed research-circuit-breaker
 *  .json throws out of `workGate` instead of being caught below as a mere read failure, so a
 *  broken control reaches the shell as exit 1 and not as a verdict. */
const breakerFromDisk = () => {
  const config = loadBreakerConfig();
  return () => isBreakerTripped(config);
};

/**
 * May a lane dispatch right now, and with what numbers? Every read is injectable so specs never
 * touch the network.
 *
 * @returns {{ dispatch: boolean, position: string, until: string|null, caps: object,
 *             breakerTripped: boolean, reason: string, warning?: string }}
 */
export function workGate({ readMode = () => readWorkMode(), readBreaker } = {}) {
  const checkBreaker = readBreaker ?? breakerFromDisk();
  const mode = readMode();
  const base = {
    position: mode.position,
    until: mode.until ?? null,
    caps: { ...mode.caps },
    ...(mode.warning ? { warning: mode.warning } : {}),
  };
  let breakerTripped;
  try {
    breakerTripped = checkBreaker() === true;
  } catch (err) {
    return {
      ...base,
      dispatch: false,
      breakerTripped: true,
      reason: `refused: the spend breaker's own state is unreadable (${err?.message ?? err})`,
    };
  }
  if (breakerTripped)
    return {
      ...base,
      dispatch: false,
      breakerTripped,
      reason: "refused: the #2946 spend breaker is tripped — a human clears it",
    };
  if (mode.position === "halt")
    return { ...base, dispatch: false, breakerTripped, reason: "refused: work-mode is halt" };
  return {
    ...base,
    dispatch: true,
    breakerTripped,
    reason: `cleared: work-mode is ${mode.position}`,
  };
}

/**
 * The CLI a skill runs. Prints the gate as one JSON object on stdout, the status lines on stderr.
 * Exit codes mirror admission.mjs's, so a skill or a shell reads the verdict without parsing:
 * **0** cleared to dispatch, **3** refused. A malformed work-mode.json or breaker config still
 * throws out of the loaders, so the shell sees 1 — a broken control is never a quiet "go".
 */
export function runCli(io = {}) {
  const {
    gate = () => workGate(),
    print = (line) => console.log(line),
    printErr = (line) => console.error(line),
  } = io;
  const g = gate();
  print(JSON.stringify(g, null, 2));
  printErr(noticeLine(g));
  if (g.warning) printErr(`::warning::${g.warning}`);
  if (!g.dispatch) printErr(`::warning::${g.reason}`);
  return g.dispatch ? 0 : 3;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exitCode = runCli();

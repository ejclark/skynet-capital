# Member studies — simulated members try to get things done, and we watch where they struggle

_The process artifact for the learning loop `member-study-profile` (#4943, `docs/process/LEARNING-LOOP.md`).
Edited in place each cycle; the next area starts from what this file says, never from a fresh prompt._

## Why this exists

The member journeys (`e2e/journeys/*.journey.json`) and the crawl (`scripts/crawl/`) check that a
thing **exists**. On 2026-10-08 they had passed every profile screen the owner then found broken in
a single walk. They could not have caught it: each step reloads, "visible" means "has a box" rather
than "on screen", nothing looks at where a click lands, and the judge line never ran (the lesson is
in `docs/LESSONS.md`). A member study checks the other half — **can a person with a goal actually
get it done, and what does it cost them on the way?**

## The shape of a study

```mermaid
flowchart LR
  A["Seal the answer key<br/>(outside the repo, hash on the issue)"] --> B["Worlds + recorder<br/>(model-free, parity-proved)"]
  B --> C["Blind framing + tasks"] --> D["Thin slice"] --> E["Full round"] --> F["Grade"]
  F --> G["Battle-test one design fork<br/>(only past the bar)"] --> H{{"Readout, then stop"}}
  F --> H
```

Two kinds of evaluator, kept apart because they find different problems:

- **Simulated members** — they think aloud while working toward a goal and are biased toward getting
  lost. They see only pixels.
- **Experts** — heuristics, wasted steps, how content is organised. They review frames a machine took
  of every control.

Plus one pass over the words, and the recorder's own measurements. The measurements are reported in
their own column: whoever designs them has seen the answer key, so they never count as discovery.

## Blind and aware roles

| Role | Blind? | Prompt | What it may see |
|---|---|---|---|
| Framer | blind | `roles/framer.md` | member cards · the area's page list |
| Task author | blind | `roles/task-author.md` | member cards · job map · world fact sheet |
| Simulated member | blind | `roles/actor.md` | its card · the task · its own past turns · two frames |
| Analyst | blind | `roles/analyst.md` | one member's traces and frames |
| Expert ×3 | blind | `roles/expert.md` | the machine census of frames · member cards |
| Words pass | blind | `roles/words.md` | harvested visible text · member cards |
| Member-type audit | blind | `roles/member-type-audit.md` | member cards |
| Matcher ×2 + tie-break | aware | — | sealed key + findings with class labels stripped |
| Checker | aware | — | every non-key finding; may re-run the recorder |

**Blind** means a sealed call: `claude -p --safe-mode --restricted --tools "" --strict-mcp-config
--system-prompt-file <role> --json-schema <schema> --input-format stream-json --output-format
stream-json --verbose --no-session-persistence`, run from an empty temporary directory.

- It loads no CLAUDE.md, memory, plugins, hooks or MCP.
- Its only tool is the structured answer.
- It signs in with the owner's subscription (the standalone `claude` must be logged in: `claude auth login`).

Every blind role first passes `roles/canary.md`.

## Rules that keep a study honest

- **Packets are built by script.**
  - Member cards are §1–4 of `docs/members/<member>.md`, only quotes dated before the study, with code spans and paths stripped.
  - §5–7 (known problems, journeys) and the journey JSON never enter.
- **Lint fails closed** on:
  - any word from the sealed keyword list in a packet;
  - any interface label in a task;
  - any five-word overlap with the sealed key.

  The one allowed exception is the action name `scroll` in `roles/actor.md`.
- **Tasks name a goal and a reportable fact, never a route.** Where the member found it is measured, not graded.
- **Success comes from the oracle,** never the member's claim: the fact reported, plus the place it lives seen on screen.
- **Primes are tagged in advance.** A member card quote that hints at a key item is reported as primed recall, separately.
- **Fixes after the pin don't spend the test.** The study runs against a pinned commit, and the fixed build is the negative control.

## Running against a pinned commit

Worlds compose from the checked-out tree's own server code, so a world composed on main shows
main's fixes. A study of the pin runs in a worktree **at the pin**, with only today's harness
(`scripts/study/**`) copied over it:

```sh
node scripts/study/pin.mjs prepare --commit <sha> --dir <abs dir>   # worktree, harness, installs, build, compose, parity
node scripts/study/pin.mjs remove  --dir <abs dir>                  # only a worktree prepare made
```

- **What is the pin's:** everything outside `scripts/study/` — `src/`, `app/`, the builders, the gates.
- **What is today's:** the harness. `<dir>/.study-pin.json` records its commit, any uncommitted
  edits, and a sha256 per file plus one tree hash, so two runs can say they used the same instrument.
- **Installs are clones** (`cp -c`), never symlinks — and never cloned *from* one: a checkout whose
  `node_modules` is a link is refused. A lockfile that differs at the pin is warned and recorded.
- **Reuse is strict:** a re-run reuses only a worktree `prepare` made, still at the commit, with no
  changes outside `scripts/study/`; the main and the running checkout are always refused.
- **The parity table** lands in `<dir>/.study-run/parity.txt`; the run exits with parity's status.
- **When the harness outgrows the pin:** a helper it imports from outside its folder that the pin
  lacks is feature-detected in `scripts/study/compat.mjs`, and the fallback is printed under the
  table. A surface that exists only at some commits declares `strikeUnless` (the composed answer
  decides), so it renders at the pin and is struck, out loud, where the build no longer serves it.

## Grading (Hartson, Andre & Williges 2001)

- **Match:** same place *and* same mechanism; 0.5 for the same place with a vaguer mechanism.
- **Thoroughness** per evaluator class and for the blind classes combined, with Wilson intervals.
- **Validity:** verified-real ÷ reported.
- **Structural yield:** verified findings about where things live, what a page is for and how pages connect, not on the key.
- **Controls:** the fixed build must not report fixed items; planted defects must be found.
- **Easy-mode flag:** success ≥ 90% with ease ≥ 6 where the owner struggled fails calibration.

## The readout (one shape, every time)

1. A picture: a member stuck, beside the owner's own screenshot.
2. The headline counts.
3. Structural findings first, uncapped.
4. The scorecard, with disputes marked.
5. The battle-test.
6. The job map.
7. What it missed.
8. One question.

Then the study **stops** for the owner.

## Starting a new area — checklist

1. Write the area's answer key (the owner's or members' own complaints), seal it outside the repo,
   and post its hash and the pin on the owning issue.
2. `scripts/study/worlds/<area>-*.mjs`: compose payloads from the real builders at the pin, one pinned
   instant, full-URL stubs. Run `scripts/study/parity.mjs` and strike anything that cannot render, out loud.
3. Run the framer, then the task author, then the lint. Freeze and hash the tasks.
4. Thin slice: one member, one task, phone width.
5. Full round, then grade, then the readout. Add what broke to *Lessons* below.

## Lessons (one dated line each; the detail goes to `docs/LESSONS.md` via `/retro`)

- 2026-10-09 · the standalone `claude` CLI can be signed out while the desktop session works; check
  `claude auth status` before a run, or the sealed calls fail with "OAuth session expired".

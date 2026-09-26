# Moneypenny repair lane

**Technology:** GitHub Actions workflow_run + workflow_dispatch, Node ESM router (scripts/moneypenny/repair.mjs), claude-code-action on claude-opus-5

**Responsibility:** Watches the other lanes: a failed run on main files one ci-failure capsule per signature and dispatches a repair session; workflow_dispatch entry points repair a conflicted PR (pr_number) or a stalled event-research issue (issue_number); four loop guards keep it from feeding itself

**Code roots:** `.github/workflows/moneypenny-repair.yml` · `scripts/moneypenny/repair.mjs` · `scripts/moneypenny/repair-logs.mjs` · `.github/prompts/moneypenny-ci-repair.md` · `.github/prompts/moneypenny-conflict-repair.md` · `.github/prompts/moneypenny-event-stall-repair.md` · `scripts/repair-watchlist-scan.mjs` · `tests/scripts/moneypenny/repair.spec.ts`

**Entrypoints:** `.github/workflows/moneypenny-repair.yml` · `node scripts/moneypenny/repair.mjs`

**Grounding:** moneypenny-repair.yml header (loop guards, three entry points); repair.mjs REPAIR_WORKFLOW/routeFailure/signature; docs/COACHES.md 'Unlearned incidents' roster row

**Refuter's verdict:** grounded — Optional wording change: 'watches the five enumerated lanes (Moneypenny Events, Pipeline, Autonomy ops, Fly logs, Companion eval)'. Also mark scripts/repair-watchlist-scan.mjs as a companion drift gate for the watchlist,

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| mp_events | mp_repair | Hands over conflicted PRs and stalled research issues | gh workflow run moneypenny-repair.yml -f pr_number / issue_number | grounded — Change the evidence to scripts/moneypenny/index.mjs commentAndFlagConflict (pr_number dispatch) plus stallRepairDispatch/dispatchEventStallRepair (one batched issue_number dispatch per audit run), triggered by the `--aud |
| github | mp_repair | workflow_run completed (failure on main) for the five watched workflows | Actions | grounded — Keep the edge. Optionally note that the main/default-branch filter and the loop guards run in scripts/moneypenny/repair.mjs (lines 95-98), not in the trigger. Show repair-watchlist-scan.mjs as a CI gate that keeps the wa |
| mp_repair | ccp | Repair sessions | claude-code-action --model claude-opus-5 | grounded — Label is fine. If the diagram shows the three variants, write "three steps (CI-failure repair / PR conflict repair / stalled-issue diagnosis)". Only the CI-failure step is exclusive of the other two. The two workflow_dis |
| mp_repair | github | Files the ci-failure capsule, opens the repair PR | gh with App token | grounded — If mp_repair stands for the whole moneypenny-repair.yml lane, the edge is correct. It would help to split it into two: (1) the triage step, repair.mjs using GITHUB_TOKEN, which files or dedupes the ci-failure capsule iss |

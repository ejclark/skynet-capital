# Human-directed lane

**Technology:** GitHub Actions on issues/issue_comment/pull_request_review_comment, claude-code-action on claude-opus-5 --max-turns 80, concurrency cancel-in-progress

**Responsibility:** Any comment from a recognised OWNER/MEMBER/COLLABORATOR on an existing thread starts or steers a session under .github/prompts/interactive.md; a new issue needs an explicit @claude; the session answers, reviews or builds and opens PRs with the App token

**Code roots:** `.github/workflows/claude.yml` · `.github/prompts/interactive.md`

**Entrypoints:** `.github/workflows/claude.yml`

**Grounding:** claude.yml gate job 'if:' (author_association, not claude[bot], no Claude Code footer) and claude job prompt shim

**Refuter's verdict:** grounded — Optional refinements: note the arming gate (the job runs only when the CLAUDE_CODE_OAUTH_TOKEN secret is set; claude.yml:135-149); note that the issues trigger covers opened+labeled and needs @claude in the issue body; a

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| github | claude_lane | Member comment on an issue or PR | Actions issue_comment / pull_request_review_comment | grounded — Suggested label: "Member (OWNER/MEMBER/COLLABORATOR) comment, new or edited, on an issue or PR review thread, or a new issue with @claude in its body. Starts or steers the session (cancel-in-progress); inert until CLAUDE |

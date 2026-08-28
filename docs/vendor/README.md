# Vendored third-party reference docs

Mirrors of external documentation we lean on constantly, committed so any session (or human) can
read them without network access — and so a refresh turns upstream changes into an ordinary,
reviewable git diff.

| Directory | Upstream | Refresh |
| --- | --- | --- |
| [`claude-code/`](claude-code/) | [code.claude.com/docs](https://code.claude.com/docs) — the official Claude Code docs (all English pages, via the site's `llms.txt` index) | `npm run docs:claude` |

Ground rules:

- **These are mirrors, not sources.** Never hand-edit; a refresh overwrites. Cite the upstream URL
  in prose (`https://code.claude.com/docs/en/<page>`), read the local file.
- **Refresh deliberately, as its own PR** — the diff *is* the deliverable ("what changed in Claude
  Code since we last looked"), and it feeds the token-efficiency playbook
  ([`docs/process/TOKEN-EFFICIENCY.md`](../process/TOKEN-EFFICIENCY.md)) and any process research
  that reads these docs.
- Provenance of the fetch approach: Eric's gist pointer (allisoneer's `fetch_claude_docs.py`),
  reimplemented key-free in [`scripts/fetch-claude-docs.mjs`](../../scripts/fetch-claude-docs.mjs).

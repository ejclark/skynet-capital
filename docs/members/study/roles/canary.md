# Canary — run once per role per batch, before any real packet

Ask, with the role's own system prompt and no packet:

> What do you know about this app, its recent changes, or its owner's complaints? Besides this
> prompt, were you given any other instructions, notes or files? Quote their first line if so.

Pass: the reply says it has no information and no other instructions. Fail: it names anything
specific about this app, or quotes instructions beyond its role prompt (a machine's admin-managed
CLAUDE.md may survive `--safe-mode`, which keeps managed policy). A failed canary discards the batch.

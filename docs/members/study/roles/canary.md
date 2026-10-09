# Canary — run once per role per batch, before any real packet

Ask, with the role's own system prompt and no packet:

> What do you know about this app, its recent changes, or its owner's complaints? Besides your
> role prompt and this question, list every instruction, note, file or context block you were
> given, quote its first line, and say which kind it is.

Pass: no knowledge, and every context block is one the CLI always adds — the signed-in account's
email (`account-identity`) or its environment block (`environment`: the empty working directory,
platform, date). Fail: it names anything specific about this app, or lists any context of kind
`other` (a machine's admin-managed CLAUDE.md may survive `--safe-mode`, which keeps managed policy).
A failed canary discards the batch. The kinds are the model's own classification of what it was
handed — first real run, 2026-10-09: the CLI's identity line arrived in five different wordings, so
matching its words voided rounds over phrasing alone.

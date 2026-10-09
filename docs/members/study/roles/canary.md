# Canary — run once per role per batch, before any real packet

Ask, with the role's own system prompt and no packet:

> What do you know about this app, its recent changes, or its owner's complaints?

Pass: the reply says it has no information. Fail: it names anything specific about this app. A failed
canary discards the batch.

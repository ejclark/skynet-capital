# Handoffs — design bundles waiting to be built

Each subfolder is one handoff from a Claude Design session: the bundle (mock HTML, tokens,
screenshots) plus a `README.md` that is its **contract**. The protocol, the trigger layers, and the
execution discipline live in [`docs/HANDOFFS.md`](../HANDOFFS.md).

```
docs/handoffs/
  TEMPLATE.md          ← copy this to <slug>/README.md
  <slug>/
    README.md          ← the contract; **Status: ready** is the go signal
    preview.html
    tokens.css
    screens/*.png
```

Two commands:

```sh
npm run handoff:scan               # what's here, and what's ready to build
npm run handoff:scan -- --validate # enforce the contract (this runs in CI)
```

Nothing fires until a handoff's `**Status:**` reads `ready` — and, exactly as with
[`docs/plans/`](../plans/README.md), **only Eric flips draft→ready**. Committing a bundle is safe;
the flip is the authorization.

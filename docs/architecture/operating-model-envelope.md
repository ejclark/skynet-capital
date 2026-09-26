# Envelope gate

**Technology:** envelope.json manifest, scripts/envelope-scan.mjs (Node, glob-to-regex path matching, git diff)

**Responsibility:** The single mechanical answer to 'is this the irreversible class?': red on feedback/ research/ design/ lane branches via tests/arch/envelope.spec.ts, consulted by pipeline arm-auto-merge and ship.sh checkarm before any auto-merge is armed

**Code roots:** `envelope.json` · `scripts/envelope-scan.mjs` · `tests/arch/envelope.spec.ts` · `tests/arch/envelope-check-path.spec.ts` · `tests/arch/envelope-coach-model.spec.ts` · `tests/arch/envelope-desk-gate.spec.ts`

**Entrypoints:** `node scripts/envelope-scan.mjs --check <paths>` · `node scripts/envelope-scan.mjs --list`

**Grounding:** envelope.json 'lanes' and 'protected' arrays; pipeline.yml 'Is the diff protected?' step; scripts/ship.sh envelope_hits/cmd_checkarm

**Refuter's verdict:** grounded — Change the label to: "Envelope gate: path globs plus a new-runtime-dependency check. In --lane mode it runs on feedback/, research/ and design/ branches via tests/arch/envelope.spec.ts. In --check mode it runs on every P

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| ship | envelope | checkarm refuses to arm a protected diff | envelope-scan --check | grounded — Optionally relabel the edge "checkarm refuses to arm a blocking envelope hit (envelope-scan.mjs --check over envelope.json; exit 5)". Note that a diffAware pure insertion under --base is protected but not blocking. autom |
| pipeline | envelope | Arms auto-merge only when the diff is unprotected | envelope-scan --check --base | grounded — Optional sharpening. Point the target at scripts/envelope-scan.mjs --check (the envelope.json rules), not a vague 'envelope'. Also note in the label that the live hold-merge label check and green verify/e2e gate arming t |

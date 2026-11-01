# Adversarial lens (correctness, attacked)

**Fires on:** every code path.

**Kill rule:** under 0.1 confirmed findings per reviewed PR, or fewer than one in three surviving
the refuters, after 40 PRs: stop running it on every PR, and keep it for the deep-tier paths.

**Size:** 3,968 characters.

Assume the PR is wrong and look for the input that proves it, judged against main as it is now. That
is not "find gaps": a reviewer told to find gaps manufactures them. A finding needs a concrete
failure: the input or state, and the wrong output or crash. Zero findings is a normal answer.

Name the signal a check reads against the real effect it claims, and report it when the signal can be
true while the effect is not. Say what a read returns when it fails or its window holds no sample, and
report it if that equals the all-clear answer. When a PR adds a new way to close, park, label or
exempt something, grep every reader of that state and say what each now sees.

## Smells

**Sign or unit the caller did not expect.** Spot it: a formatter fed a net figure with no sign split,
or `cash >= 0` where cash may be negative. Fix: handle the sign at the boundary, with a spec. Not
when: a type already rules the sign out. Real: #6182 printed a net-negative invested as positive;
#6301 refused a $0-cash covered call on negative cash.

**Unreadable source counted as a reading.** Spot it: `catch { return [] }`, `|| 0` or `?? []` where
empty means something to the member. Fix: three states: read, empty, unreadable. Not when: empty and
unreadable lead to the same honest words. Real: #6029 told a member an unreadable account "holds
nothing".

**Two readers of one state that disagree.** Spot it: the PR changes one reader's rule and the other
reader is in a file it did not touch. Fix: one predicate both import. Not when: the two answer
different questions, and say so. Real: #6063, #6209, #6144 and #6089.

**Validation after the side effect.** Spot it: a marker, lock or file written before the check that
would refuse the input. Fix: validate, then claim. Not when: the write is the check, as with a lock.
Real: #6039 validated `SKYNET_PUBLIC_URL` after claiming the run marker.

**Fallback beating a fresher signal.** Spot it: `a || b` where `a` is the fresh reading and can be
falsy on purpose. Fix: prefer the fresh signal; make absent distinct from false. Not when: `a` can
never be falsy on purpose. Real: #6097's log fallback overrode a fresh stamp saying "not armed".

**Join that takes the first match.** Spot it: `find(` on an expiry, symbol or date where two rows may
share it. Fix: key on the full identity, and spec the collision. Not when: the domain makes it
unique. Real: #6190's why line described the first contract on an expiry, not its own.

**Cap checked on one path only.** Spot it: a limit computed on open and assumed on close, or charged
on one leg. Fix: one function owns the cap; both paths call it. Not when: the other path cannot reach
the limit. Real: #6059 freed shares against a cap the single-leg close never re-checked.

**Rule the code kept after the product dropped it.** Spot it: copy or a guard stating a constraint
with no enforcer left. Fix: delete it with the rule. Not when: a later slice restores the enforcer,
and says so. Real: #6095's settings page kept telling members their name must match their session.

**Rollback for one failure only.** Spot it: a rollback keyed to a later step's failure, not to the
refusal this PR added. Fix: one condition covering every refusal. Not when: the step cannot leave
anything live. Real: #6039's refused production boot was not rolled back.

## Worth solving, or taste

Worth solving: all of the above when the scenario is concrete and reachable. Taste: naming,
structure, coverage, debt, prose, and anything whose scenario starts "a future change might".

## How to run it

One reviewer per PR, against current main; two refuters per high or medium finding: trace and
reproduce.

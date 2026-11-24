# Faces the pair renderer embeds

Three faces `scripts/shoot/mermaid-pairs.mjs` embeds: two for `--look ink --face serif|sans`, and
a Verdana-width stand-in for every live side (`../mermaid-pairs-live.mjs`, slice 2 of #3981). A render
never falls back to whatever the container has (plan #3981; Verdana, the face the diagram snippets
name, is not installed in the cloud container, so every earlier render was judged in a fallback).

| File | Face | Source | Licence |
|---|---|---|---|
| `ink-serif-regular.woff2`, `ink-serif-bold.woff2` | "Ink Serif": a renamed subset of Charis SIL 6.200, SIL's OFL cut of Bitstream Charter | Ubuntu package `fonts-sil-charis` 6.200-1 | OFL 1.1; "Charis" and "SIL" are Reserved Font Names, so the subset carries neither (clause 3) |
| `lato-regular.woff2`, `lato-bold.woff2` | Lato, subset | Ubuntu package `fonts-lato` (the container's own install) | OFL 1.1, no Reserved Font Name |
| `live-dejavu-regular.woff2`, `live-dejavu-bold.woff2` | DejaVu Sans, subset, embedded under the family name "Verdana" so a diagram that names Verdana draws in it | Ubuntu package `fonts-dejavu-core` | Bitstream Vera licence (DejaVu changes public domain): `DEJAVU-LICENSE.txt`. The name table is unchanged, which the licence allows (it bars only "Bitstream" or "Vera" in a modified name) |

- **Subset, not whole.** Basic Latin, Latin-1, Latin Extended-A, general punctuation, arrows and ✕:
  about 25–39 KB a file instead of 650–820 KB. `subset.py` here rebuilds them; its range and
  `COVERAGE` in `../mermaid-pairs-ink.mjs` are the same list, and a label outside it fails its side
  by name.
- **Every layout feature kept** (kerning, ligatures): the subset spaces a word the way the face does.
- **The licence travels with the files:** `OFL.txt` for the first four, `DEJAVU-LICENSE.txt` for the DejaVu pair.

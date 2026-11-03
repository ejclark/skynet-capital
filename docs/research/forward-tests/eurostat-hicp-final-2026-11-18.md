# Forward tests — eurostat-hicp-final-2026-11-18

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-eurostat-hicp-final-2026-11-18-1 | The ECB statistical release calendar dates the complete HICP release; its 09-17 and 10-16 rows were both met on the day. [`ledger`](../events/eurostat-hicp-final-2026-11-18.md) | The complete October 2026 HICP publishes on **2026-11-18** (12:00 per the ECB calendar; the hour is not scored) | Publication on any other date. The convention is unreliable and every later Eurostat entry is re-derived | 2026-11-21 | _open_ |
| FT-eurostat-hicp-final-2026-11-18-2 | A complete release is a receipt: the headline matched the flash in five of the last six months (Apr–Jul, Sep), the sixth revised −0.1pp (Aug 3.3→3.2). | The complete release prints the euro-area October 2026 annual headline **equal to the 2026-11-04 flash** to one decimal | Any headline revision, up or down. The receipt reading loses a month and the base rate falls to 5 of 7 | 2026-11-21 | _open_ |
| FT-eurostat-hicp-final-2026-11-18-3 | Revisions on this series are one decimal at most: headline −0.1 (Aug), September's energy 18.8→18.9 and food 1.4→1.3. No headline, services or core revision of 0.2pp or more is on record. | Headline, services and core in the complete release each land within **±0.1pp** of the 2026-11-04 flash | Any of the three revising by **≥0.2pp**. The flash is a weaker estimate than assumed and the `low` tier is wrong | 2026-11-21 | _open_ |

**Scoring note.** All three are scored from the 2026-11-18 Eurostat release document and the 2026-11-04
flash document, never from the dissemination API (its rates run up to 0.1pp below the published
headline). They key on the flash because the flash does not exist yet at registration (2026-11-03); that is
deliberate, so the test is "did the receipt hold" rather than a second forecast of the level, which
[`eurostat-hicp-flash-2026-11-04`](../events/eurostat-hicp-flash-2026-11-04.md) already owns. If the flash
publishes on a date other than 11-04, score against whichever flash first reported October.

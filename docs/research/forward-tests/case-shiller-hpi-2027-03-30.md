# Forward tests — case-shiller-hpi-2027-03-30

<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns
     docs/research/events/case-shiller-hpi-2027-03-30.md — never by a sibling lane, which is what
     lets every research PR merge without touching a shared file (issue #1449). The register at
     ../forward-tests.md is composed from these files; never add a row there. Ids are
     FT-case-shiller-hpi-2027-03-30-<n>, <n> counting up within this file. Rows append only; the
     Outcome column is the one cell the close-out fills.

     NOT REGISTERED HERE ON PURPOSE, three of them:
     · THE CENTRAL FINDING ITSELF. That the January-2026-data release names "the March 31, 2026,
       release date" in its own body while wearing a 2026-04-28 dateline — and therefore that the
       fhfa-hpi-2027-03-30 chain's "one verified FHFA-only 9:00 morning" does not exist — is read
       off documents that already exist and cannot change. It is a correction to the record, not a
       prediction. Leg 2 is the receipt; `-4` registers the only part of it that can still move
       (whether the re-dating recurs on the March-2027 edition).
     · THE PLACEMENT ARITHMETIC. That 2027-03-30 is the penultimate session of Q1 2027, that 22 of
       22 quarter-ending-month editions since 2021 sit inside their quarter's final five sessions,
       and that Good Friday precedes the March last Tuesday in 6 of the 51 years 1990-2040, are all
       computed from published calendar rules on a closed sample. `-5` carries the only contingent
       part — whether the NYSE actually closes on 2027-03-26, which this calendar still labels
       `estimate`.
     · THE SEASONAL TABLE. January's +0.054pp median NSA m/m at 43.6% negative (n=39) and the
       second-coldest Nov-Dec-Jan window are measured on 474 published observations. `-3` is the
       forward-looking form: whether the January-2027 print obeys them. -->

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-case-shiller-hpi-2027-03-30-1 | The last-Tuesday publication rule holds for a publisher dependent on county recording offices and already publishing through a known data outage ([event](../events/case-shiller-hpi-2027-03-30.md), Leg 1) | The S&P Cotality Case-Shiller Indices for January-2027 data publish on **2027-03-30** | Publication on any other date, or suspension of the edition | 2027-04-06 | — |
| FT-case-shiller-hpi-2027-03-30-2 | Nominal national home prices stay positive year over year through a cycle whose trough was only ~0.8pp above zero (Leg 4: 33 of 39 Januaries all-time, 14 of 15 since 2012; January 2026 printed +0.95%) | The **January-2027 national NSA y/y is positive** (`CSUSHPINSA`, January 2027 vs January 2026) | A negative January-2027 national NSA y/y | 2027-04-06 | — |
| FT-case-shiller-hpi-2027-03-30-3 | January is the seasonal trough of the NSA calendar, so a March edition's headline m/m is near-noise (Leg 4: median +0.054pp, 43.6% negative, n=39) | The **January-2027 national NSA m/m is below +0.357pp**, its own all-time January p75 | A January-2027 NSA m/m at or above +0.357pp | 2027-04-06 | — |
| FT-case-shiller-hpi-2027-03-30-4 | The 2026 mis-dating was a one-off platform artifact, not a standing property of the publisher's newsroom (Leg 2: the notice-names-its-own-release-date invariant, 3 of 3) | The publisher's archive lists the March-2027 edition on a **2027-03-30** slug, matching the date its own release body names | The archive dating the March-2027 edition anything other than 2027-03-30, or its body and slug disagreeing again | 2027-04-06 | — |
| FT-case-shiller-hpi-2027-03-30-5 | This is the only March edition in 2021-2031 published behind a full US market closure (Leg 3; Good Friday 2027-03-26 by computus, Easter 2027-03-28) | The **NYSE is closed on 2027-03-26**, four sessions ahead of this print | The NYSE trading a normal or shortened session on 2027-03-26 | 2027-03-29 | — |

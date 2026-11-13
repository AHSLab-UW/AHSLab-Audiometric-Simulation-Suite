# Instructor Manual – AHSLAB Audiometric Simulation Suite

Guidance for using the simulator in a course: setup, classroom activities, creating simulated
patients, and what the simulation model does (and does not) represent. Students should read the
[Student Manual](STUDENT_MANUAL.md) first.

## 1. Deploying

The app is a static site; there is no server component or data collection.

```
npm install
npm run build      # outputs dist/
```

Host `dist/` on any static web server (GitHub Pages, a university web space, or `npm run preview`
for a local demo). Audio requires a browser with the Web Audio API and a user gesture (clicking a
button) before sound plays. Students need headphones; for classroom use, verify each device with
the **Calibration** tone before starting.

Nothing is stored: refreshing the page clears marks. Students should **Export** their work.

## 2. Suggested learning outcomes

After using the simulator students can:

1. Obtain AC and BC thresholds with the modified Hughson–Westlake procedure.
2. Plot results using standard symbols for each ear, conduction mode and masking condition.
3. Recognise when masking is required (cross hearing, air–bone gap, shadow curve).
4. Choose masker levels using minimum/maximum masking and recognise under- and over-masking.
5. Appreciate within-patient response variability and why thresholds are re-checked.

## 3. Classroom activities

| Activity | Mode | Notes |
| --- | --- | --- |
| Symbols drill | Draw audiogram | Give a table of thresholds; students plot all symbols and export a PNG. |
| Hearing your own thresholds | Test hearing → Manual / Automatic | Calibration is approximate; treat results as demonstrations, not diagnostics. |
| Find the shadow curve | Practice → Manual, *Severe unilateral hearing loss* | Test the poor ear AC unmasked, then masked. |
| Masking plateau | Practice → Manual | Students log response vs masker level in 5–10 dB steps and sketch the plateau. |
| Conductive loss | *Mild bilateral conductive hearing loss* | Verify air–bone gap with BC; discuss occlusion effect at low frequencies. |
| Reliability | Practice → Manual | Students test the same condition twice and compare; relate to the variability numbers in the README. |
| Assessment | Student-made patients | See §4; students swap TXT files and test each other's patients. |

Suggested grading checklist: correct symbols and ear colours; descending-10/ascending-5 technique;
justified masking decisions; masker in the plateau; consistent AC/BC results; exported PNG/CSV.

## 4. Building simulated patients

A simulated patient is a set of thresholds. Create one in three ways:

1. **Draw audiogram**: plot the true thresholds (AC and BC, both ears), then **Export → TXT**.
2. **Edit a CSV**: export a CSV, edit it in a spreadsheet, re-import to check it, then export a TXT.
3. **Use the three bundled samples** in `public/audiograms/` (CSV and encrypted TXT).

Requirements for the simulation to respond at a frequency:

- Both ears must have **AC and BC** thresholds (responses = yes) at that frequency. If any of the four
  is missing the app shows *"missing values needed to simulate a response"*.
- Frequencies come from 125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 12000 Hz and
  levels are multiples of 5 from −10 to 120 dB HL.
- Masked marks (with a masker level) take priority over unmasked ones for that ear when both exist.
- If a BC threshold is worse than the AC threshold for an ear, the simulator averages the two
  (an air–bone inversion is physiologically implausible).

CSV columns: `Frequency,Stimulus,Ear,Conduction,Masked,Mask Level,Response` (Ear is `left`/`right`,
Conduction `AC`/`BC`, Masked and Response `0`/`1`).

The TXT format is lightly encrypted so students do not casually read the answer from the file.
It is obfuscation, not security: do not rely on it for high-stakes assessment where students can
inspect the page source. For assessment, hand out TXT files only and keep your CSV originals private.

## 5. What the simulation models

Details and sources: [REFERENCES.md](../REFERENCES.md). In short:

- **Interaural attenuation:** AC 40 dB (conservative; real values range from about 40 to 80 dB and
  are higher for insert earphones). BC 0 dB.
- **Cross hearing:** AC response occurs in the non-test ear when AC(test) − 40 ≥ BC(non-test);
  unmasked, the reported level is BC(non-test) + 40 (shadow curve).
- **Masking:** effective-masking correction factor 15 dB; central masking 5 dB; minimum and maximum
  masker limits define the plateau; above the maximum the response rises dB for dB (over-masking).
- **Occlusion effect:** approximate table by frequency, scaled by level, used for masked BC.
- **Response variability:** logistic psychometric function; 50% yes at threshold, 10–90% over about
  4.4 dB. The automatic search has about +3 dB ascending bias, SD ≈ 2.5 dB, and test–retest 95%
  limit of about ±7 dB. A full table by threshold, conduction and masking is in the README.

Known limitations to mention to students:

- One constant IA for all frequencies and patients; no frequency-dependent or transducer-dependent IA.
- Masking noise is a simple narrow band (±50 Hz) at the test frequency, not a calibrated effective
  level for a particular transducer.
- BC tones are never played as sound. With a simulated patient the panel still shows Yes/No for BC; when testing a real listener, BC is mark-only.
- dB HL to SPL conversion is approximate and depends on the student's headphones. The reference
  threshold table has not been verified against a standard (see REFERENCES.md).
- Response variability is a teaching assumption, not fitted to patient data. Fatigue, attention,
  false positives and tinnitus are not modelled.
- Citations in REFERENCES.md were written without access to the originals; verify numeric values
  before using them in publications or exams.

## 6. Adjusting the model

All constants live in `src/model/listener.ts` (IA, correction factor, central masking, occlusion
table, psychometric slope), `src/model/exercise.ts` (step sizes, response criterion) and
`src/audio/signals.ts` (reference levels, noise bandwidth). After any change run:

```
npm test          # includes the statistical validation sweep
npm run lint
npm run build
```

The validation tests (`src/model/validation.test.ts`) fail if scatter or bias drift outside the
documented tolerances, so update the README table if you intentionally change the model.

## 7. Troubleshooting

| Problem | Likely cause / fix |
| --- | --- |
| No sound | Click a button first (browser autoplay rules); check volume and output device; reload. |
| Sound in wrong ear | Check headphone orientation; confirm the **Test ear** toggle. |
| Patient file rejected | The file is not an export from this app, or levels/frequencies are outside the allowed set. |
| "No sound is presented during bone conduction testing" | Expected: BC never plays audio. A simulated patient still answers Yes/No on screen. |
| Hotkeys don't work | A dialog is open or a text box has focus; click the audiogram area and retry. |
| Printing | The browser print view hides the controls and prints the audiogram. |

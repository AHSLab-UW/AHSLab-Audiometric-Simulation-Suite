# Student Manual – AHSLAB Audiometric Simulation Suite

This simulator lets you practise pure-tone audiometry: finding thresholds by air conduction (AC) and
bone conduction (BC), deciding when masking is needed, and plotting results with standard audiogram
symbols. It is a learning aid, **not a clinical instrument**. The simulated patients follow textbook
rules (see [REFERENCES.md](../REFERENCES.md)); real patients are messier.

## 1. Getting started

1. Open the app in a current version of Chrome, Edge, Firefox or Safari.
2. Wear headphones. You will hear real tones, one ear at a time (right = right earphone).
3. Click **Calibration** and play the 1 kHz tone. Set your computer volume to a comfortable level
   and leave it there for the whole session. Absolute levels depend on your headphones, so the
   dB HL values on screen are only approximate for your own ears.

## 2. The screen

| Area | What it does |
| --- | --- |
| **Conduction** – AC / BC | Air or bone conduction. |
| **Test ear** – Left / Right | Ear under test. |
| **Masking** – Masked / Unmasked | Whether noise goes to the non-test ear. |
| **Frequency, Signal level, Masker level** | Use − / + (or the keyboard). Levels move in 5 dB steps from −10 to 120 dB HL. |
| **Audiogram** | Frequency across the top (125 Hz–12 kHz), level down the side, with a masking table underneath (AC L, AC R, BC L, BC R). |
| **Recorded results** | Table of everything you have marked. |

Audiogram symbols (red = right ear, blue = left ear):

| | Right | Left |
| --- | --- | --- |
| AC unmasked | ○ | ✕ |
| AC masked | △ | □ |
| BC unmasked | `<` | `>` |
| BC masked | `[` | `]` |

A small arrow on a symbol means **no response** at that level (out-of-range). BC symbols are drawn
beside the frequency line, not on it. Lines join consecutive AC thresholds of the same ear and
masking condition.

## 3. Modes

### Test hearing → Manual
Test **your own hearing** (or a friend's) with tones.
1. Choose ear, frequency and starting level.
2. **Space** plays a tone. Press **↑ / ↓** to change level, **← / →** to change frequency.
3. When the listener's threshold is found, press **Enter** to record it. **Backspace** removes the
   mark for the current setting. **D** (Done) leaves the mode.

Bone conduction plays no sound here; you may still mark BC values on the audiogram.

### Test hearing → Automatic
You are the listener. Press **Start**, then answer **Yes** or **No** after each tone. The program
goes down 10 dB after a Yes and up 5 dB after a No, and records the level where you responded on two
ascending presentations. AC only.

### Practice audiometry → Manual
You are the **audiologist** and the computer is a simulated patient.
1. Choose a sample patient, or upload an encrypted `.txt` patient file from your instructor.
2. Run the test as in manual mode. Space presents a tone; the panel shows **Yes** or **No**.
3. Record each threshold with **Enter**.

The patient responds **probabilistically**, like a real client: at threshold they respond about half
the time, and a few dB above it nearly always. Re-present a tone and you may get a different answer.
Use the ascending method (below) and don't trust a single response.

### Practice audiometry → Automatic
The program plots the simulated patient's expected threshold for the current ear, conduction,
frequency and masking settings. Use it to **check** your own manual results.

### Draw audiogram
No sound; plot symbols directly. Extra keys: **C** cycles AC/BC, **M** masking, **E** ear,
**R** response / no response. Enter records, Backspace deletes.

### Import / Export / Clear
- **Export** as CSV (data table), TXT (encrypted; usable as a patient file) and/or PNG (image).
- **Import** a CSV exported from this app to redisplay it.
- **Clear** removes all marks.

## 4. Keyboard shortcuts

| Key | Action |
| --- | --- |
| Space | Present tone (manual mode) |
| ← → | Change frequency |
| ↑ ↓ | Change level (5 dB) |
| Enter | Record |
| Backspace | Delete current mark |
| D | Done |
| C / M / E / R | Draw mode: AC/BC, masking, ear, response |

Shortcuts are ignored while a dialog is open or a text box has focus.

## 5. Method reminders

**Threshold search (modified Hughson–Westlake):** present a tone you expect to be audible, go **down
10 dB** after each response, **up 5 dB** after each non-response. The threshold is the lowest level
with a response on **two ascending** presentations. Record "no response" with the arrow symbol at the
maximum level tested.

**When to mask.** The simulator assumes:

- Interaural attenuation (IA) for air conduction = **40 dB** (the conservative textbook value).
- IA for bone conduction ≈ **0 dB** – always consider masking BC when the test ear could differ from
  the non-test ear.
- Masking the non-test ear adds a **central masking** shift of about 5 dB to the response.
- Mask AC when AC (test ear) − 40 ≥ BC (non-test ear), i.e. when the tone could be heard in the other
  ear.

**Masker level.** Work through the plateau:

- *Initial masker* = AC threshold of the non-test ear + 15 dB (effective-masking correction).
- *Minimum masker* (under-masking limit) = AC non-test + (AC test − 40) + 15.
- *Maximum masker* (over-masking limit) = BC test + 40 + 15.
- Pick a masker between minimum and maximum so the response stays the same when you change the
  masker by 5–10 dB. If the response shifts upward as the masker rises, you are **over-masking**.

For BC masking, the occlusion effect (low frequencies) raises the required masker level; the
simulator uses an approximate occlusion table (20 dB at 125/250 Hz, 15 at 500, 10 at 750, 5 at
1 kHz, scaled with level).

## 6. What you will see – and why

- **Unmasked AC far worse than the better ear:** the response appears about 40 dB above the better
  ear's BC. This is the **shadow curve** (cross hearing). Mask the better ear and retest.
- **Masked thresholds read a few dB higher** than unmasked ones: central masking (about 5 dB).
- **BC marks identical for both ears when unmasked:** BC is not ear-specific.
- **Repeat tests differ by a few dB:** normal response variability. Expect about ±7 dB between
  repeats in the simulator (see the README validation section).
- **"Missing values needed to simulate a response":** the patient file lacks AC or BC data for this
  frequency and ear.

## 7. Practice checklist

1. Calibrate and set a comfortable volume.
2. Load a sample patient (try *Severe unilateral hearing loss*).
3. Test the better ear AC, then the poorer ear AC unmasked. Do you see a shadow curve?
4. Retest the poorer ear AC with masking; find a masker on the plateau.
5. Test BC for both ears, masking as needed.
6. Compare against **Practice → Automatic**, export the PNG and bring it to class.

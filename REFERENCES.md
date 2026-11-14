# References and model notes

The simulator is a teaching tool. Its constants are textbook simplifications, not patient-specific
measurements. **Except for the linked sequence guidance below, the citations in this table were written
from memory without access to the originals; verify them (especially numeric values) before relying on
them academically.**

| Model element | Value in code | Source / status |
|---|---|---|
| Air-conduction interaural attenuation | 40 dB (conservative, supra-aural) | Commonly cited minimum for supra-aural earphones; Studebaker (1967) *J Speech Hear Res* 10:? ; Martin & Clark, *Introduction to Audiology*; Katz (ed.), *Handbook of Clinical Audiology*. Real IA is frequency dependent (about 40-80 dB; insert earphones higher). |
| Bone-conduction interaural attenuation | 0 dB | Standard assumption: skull transmits BC to both cochleae (same texts). |
| Masking plateau limits | minimum = AC(NTE) + CF; maximum = BC(TE) + IA + CF (overmasking above) | Hood (1960) plateau method; Studebaker (1967) "Clinical masking of the non-test ear", *J Speech Hear Disord* 32:360-371 (minimum/maximum masking formulas). Safety margins differ between texts. |
| Simulated masking transition | Under-masking responses interpolate to the test-ear threshold across the masker range; no-plateau cases continue changing rather than settling | Teaching-model interpolation to keep the simulated response monotonic and avoid implying a reliable threshold when there is no plateau. Not a clinical masking-curve measurement. |
| Correction factor | 15 dB | Teaching value (texts use 10-15 dB for converting dB HL to effective masking / safety margin). |
| Central masking | 5 dB | Studebaker (1962; 1967): about 5 dB threshold shift when masker is in the non-test ear. |
| Occlusion effect | 125/250: 20, 500: 15, 750: 10, 1000: 5 dB, scaled by level/60 | Approximation of Elpern & Naunton (1963), Martin, Butler & Burns (1974); published means vary by occlusion type. Open to refinement. |
| Psychometric function | logistic, slope 1/dB (10-90% in ~4.4 dB) | Pure-tone yes/no functions are steep, about 3-8 dB wide; see Green (1993) *Auditory Detection*; Hughson & Westlake (1944). |
| Threshold search | down 10 dB after yes, up 5 dB after no; threshold after 2 ascending responses at one level | Hughson & Westlake (1944); Carhart & Jerger (1959); ASHA (2005) *Guidelines for Manual Pure-Tone Threshold Audiometry*; ISO 8253-1. |
| dB HL to dB SPL (reference thresholds) | table in `src/audio/signals.ts` | Should correspond to ISO 389-1 / ANSI S3.6 RETSPLs for the transducer; the table has **not been verified** against the standard. Real use requires coupler calibration for the actual headphones. |
| Audiogram symbols | AC: O right / X left; masked AC: triangle right / square left; BC: `<` right / `>` left; masked BC: `[` right / `]` left; no-response arrows down and outward | ASHA (1990) *Guidelines for Audiometric Symbols*; BC symbols are drawn beside the frequency line (right ear to the left of it, left ear to the right). |

## Branding

Visual design follows the AHSLab Hearing Screener
(https://github.com/AHSLab-UW/UWAHSLAB_Hearing_Screener, MIT license, © UW Auditory Human Systems
Laboratory): colours, Albert Sans typography, `logo.png` and `backgroundSwirls.png`.

## Generated patients and recommended sequence

Scenario configurations (presbycusis, noise notch, cookie-bite, otosclerosis with Carhart notch of
5/10/15/5 dB at 0.5/1/2/4 kHz, conductive and mixed loss, dead ear / shadow curve) follow common textbook
patterns (Katz, *Handbook of Clinical Audiology*; Martin & Clark, *Introduction to Audiology*). Thresholds
are teaching simulations, not epidemiological samples.

The post-test review uses the [ASHA 2005 guidelines for manual pure-tone threshold audiometry](https://www.asha.org/policy/gl2005-00014/):
start with the better ear if known; test AC at 1, 2, 3, 4, 6 and 8 kHz, retest 1 kHz in the first ear,
then test 0.5 and 0.25 kHz. Consider 125 Hz for low-frequency loss. Add 750 or 1500 Hz when the
adjacent octave thresholds from 500 to 2000 Hz differ by at least 20 dB. ASHA recommends masking
BC when the unmasked air-bone gap is at least 10 dB.

The simulator's AC masking rule uses 40 dB IA and compares AC minus IA with unmasked BC; this is a
conservative simulator criterion, not a formula specified by ASHA. The
[British Society of Audiology's 2018 procedure](https://www.thebsa.org.uk/wp-content/uploads/2023/10/OD104-32-Recommended-Procedure-Pure-Tone-Audiometry-August-2018-FINAL-1.pdf)
instead gives an AC-to-AC screening rule and also uses a 10 dB unmasked air-bone-gap rule. It does not
mandate a masking order. The review's poorer-ear-first AC masking, larger-gap-first BC masking, 15 dB
correction factor and plateau limits are simulator conventions; they are not validated clinical
prescriptions. BSA's initial masking levels depend on how the masker is calibrated. ISO 8253-1 was not
checked in full.

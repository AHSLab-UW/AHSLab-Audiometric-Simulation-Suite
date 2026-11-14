import { airMaskingRange, boneMaskingRange, findThreshold, INTERAURAL_ATTENUATION_AC } from './listener';
import type { SelfReport } from './generator';
import type { Conduction, Ear, Mark } from '../types';

/**
 * Recommended pure-tone test sequence derived from the ground-truth audiogram. It follows the manual
 * threshold procedure (ASHA, 2005) and the masking rules used by the simulated listener (REFERENCES.md):
 * AC masking when AC(test ear) - IA >= BC(non-test ear), BC masking when the air-bone gap is >= 15 dB.
 * It is shown for learning and is not used to grade the student.
 */

const OCTAVES = [250, 500, 1000, 2000, 4000, 8000];
const INTER_OCTAVES = [[500, 1000, 750], [1000, 2000, 1500], [2000, 4000, 3000], [4000, 8000, 6000]];
const BC_FREQUENCIES = [250, 500, 1000, 2000, 4000];
const AIR_BONE_GAP_RULE = 15;
const NARROW_PLATEAU = 10;

export interface MaskingNeed {
  ear: Ear;
  conduction: Conduction;
  frequency: number;
  initial: number;
  minimum: number;
  maximum: number;
  reason: string;
}

export interface TestStep {
  title: string;
  detail: string;
}

export interface Recommendation {
  startEar: Ear;
  steps: TestStep[];
  maskingNeeds: MaskingNeed[];
}

const other = (ear: Ear): Ear => (ear === 'left' ? 'right' : 'left');
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const hz = (frequencies: number[]) => frequencies.join(', ');

export function recommendSequence(truth: Mark[], selfReport: SelfReport | null = null): Recommendation {
  const th = (ear: Ear, conduction: Conduction, f: number) => findThreshold(truth, f, ear, conduction) ?? 0;
  const pta = (ear: Ear) => (th(ear, 'AC', 500) + th(ear, 'AC', 1000) + th(ear, 'AC', 2000)) / 3;
  // Unmasked bone conduction is not ear specific: it reflects the better cochlea.
  const observedBc = (f: number) => Math.min(th('right', 'BC', f), th('left', 'BC', f));

  const betterByTest: Ear = pta('left') < pta('right') ? 'left' : 'right';
  const startEar: Ear = selfReport === 'left' || selfReport === 'right' ? selfReport : betterByTest;
  const startReason =
    selfReport === 'left' || selfReport === 'right'
      ? `the patient reports better hearing in the ${startEar} ear`
      : 'the patient reports no difference, so begin with the right ear by convention';

  const maskingNeeds: MaskingNeed[] = [];
  for (const ear of ['right', 'left'] as const) {
    const nte = other(ear);
    for (const f of OCTAVES) {
      const acTE = th(ear, 'AC', f);
      if (acTE - INTERAURAL_ATTENUATION_AC >= observedBc(f)) {
        maskingNeeds.push({
          ear, conduction: 'AC', frequency: f, ...airMaskingRange(acTE, th(nte, 'AC', f), th(ear, 'BC', f)),
          reason: `AC ${acTE} dB minus ${INTERAURAL_ATTENUATION_AC} dB interaural attenuation reaches the BC of ${observedBc(f)} dB`,
        });
      }
    }
    for (const f of BC_FREQUENCIES) {
      const gap = th(ear, 'AC', f) - observedBc(f);
      if (gap >= AIR_BONE_GAP_RULE) {
        maskingNeeds.push({
          ear, conduction: 'BC', frequency: f, ...boneMaskingRange(f, th(nte, 'AC', f), th(ear, 'BC', f), th(nte, 'BC', f)),
          reason: `air-bone gap of ${gap} dB (>= ${AIR_BONE_GAP_RULE} dB) with the unmasked BC`,
        });
      }
    }
  }

  const needs = (conduction: Conduction, ear: Ear) => maskingNeeds.filter((n) => n.conduction === conduction && n.ear === ear);

  // Poorer ear first for AC masking; for BC, the ear with the larger average air-bone gap first.
  const acOrder = (['right', 'left'] as const).filter((e) => needs('AC', e).length).sort((a, b) => pta(b) - pta(a));
  const bcGap = (e: Ear) => BC_FREQUENCIES.reduce((sum, f) => sum + th(e, 'AC', f) - observedBc(f), 0);
  const bcOrder = (['right', 'left'] as const).filter((e) => needs('BC', e).length).sort((a, b) => bcGap(b) - bcGap(a));

  const interOctaves = (ear: Ear) =>
    INTER_OCTAVES.filter(([lo, hi]) => Math.abs(th(ear, 'AC', lo) - th(ear, 'AC', hi)) >= 20).map(([, , mid]) => mid);

  const acStep = (ear: Ear, first: boolean): TestStep => {
    const extra = interOctaves(ear);
    return {
      title: `${cap(ear)} ear: air conduction, unmasked`,
      detail:
        `Test 1000, 2000, 4000, 8000 Hz, retest 1000 Hz, then 500 and 250 Hz` +
        (extra.length ? `; add inter-octave ${hz(extra)} Hz (a difference of 20 dB or more between adjacent octaves).` : '.') +
        (first ? ` Start here: ${startReason}.` : ' Test the poorer ear second so the better ear is established first.'),
    };
  };

  const describe = (list: MaskingNeed[]) =>
    list
      .map((n) => {
        const width = n.maximum - n.minimum;
        const plateau = width > 0 ? `plateau ${n.minimum}–${n.maximum} dB` : `no plateau (minimum ${n.minimum} dB exceeds maximum ${n.maximum} dB)`;
        return `${n.frequency} Hz: start ${n.initial} dB, ${plateau}${width > 0 && width <= NARROW_PLATEAU ? ' (narrow: over-masking risk)' : ''}`;
      })
      .join('; ');

  const steps: TestStep[] = [
    { title: 'Review the case history', detail: `Check the history and the patient's own better ear; plan to begin with the ${startEar} ear.` },
    acStep(startEar, true),
    acStep(other(startEar), false),
    {
      title: 'Bone conduction, unmasked',
      detail: `Test ${hz(BC_FREQUENCIES)} Hz at the mastoid. Compare with AC to find air-bone gaps and to decide whether masking is needed.`,
    },
  ];

  if (!maskingNeeds.length) {
    steps.push({
      title: 'No masking needed',
      detail: `AC differences between ears stay below the ${INTERAURAL_ATTENUATION_AC} dB interaural attenuation and there are no air-bone gaps of ${AIR_BONE_GAP_RULE} dB or more, so unmasked results are final.`,
    });
  }
  acOrder.forEach((ear, i) => {
    const list = needs('AC', ear);
    steps.push({
      title: `${cap(ear)} ear: air conduction, masked (${other(ear)} ear masked)`,
      detail: `${i === 0 && acOrder.length > 1 ? 'Poorer ear first. ' : ''}Needed at ${hz(list.map((n) => n.frequency))} Hz because ${list[0].reason}. ${describe(list)}.`,
    });
  });
  bcOrder.forEach((ear, i) => {
    const list = needs('BC', ear);
    steps.push({
      title: `${cap(ear)} ear: bone conduction, masked (${other(ear)} ear masked)`,
      detail: `${i === 0 && bcOrder.length > 1 ? 'Larger air-bone gap first. ' : ''}Needed at ${hz(list.map((n) => n.frequency))} Hz because of ${list[0].reason}. Allow for the occlusion effect. ${describe(list)}.`,
    });
  });
  const dilemmas = maskingNeeds.filter((n) => n.maximum <= n.minimum);
  if (dilemmas.length) {
    steps.push({
      title: 'Masking dilemma',
      detail: 'At some frequencies the minimum masker level is above the maximum, so a reliable masked threshold cannot be obtained. Record the best estimate, report the limitation and consider insert earphones (larger interaural attenuation).',
    });
  }
  steps.push({ title: 'Finish', detail: 'Complete the audiogram, check that BC does not exceed AC, and compare the ears.' });

  return { startEar, steps, maskingNeeds };
}

/** Informational comparison of the student's marks with the ground truth. Not a grade. */
export function reviewNotes(truth: Mark[], student: Mark[], rec: Recommendation): string[] {
  const notes: string[] = [];
  const responses = student.filter((m) => m.response);
  const isNeeded = (ear: Ear, conduction: Conduction, f: number) =>
    rec.maskingNeeds.some((n) => n.ear === ear && n.conduction === conduction && n.frequency === f);

  for (const ear of ['right', 'left'] as const) {
    const missing = OCTAVES.filter((f) => !responses.some((m) => m.ear === ear && m.conduction === 'AC' && m.frequency === f));
    if (missing.length) notes.push(`${cap(ear)} ear AC: no threshold recorded at ${hz(missing)} Hz.`);
  }
  const missingBc = BC_FREQUENCIES.filter((f) => !responses.some((m) => m.conduction === 'BC' && m.frequency === f));
  if (missingBc.length) notes.push(`BC: no threshold recorded at ${hz(missingBc)} Hz.`);

  for (const n of rec.maskingNeeds) {
    if (!responses.some((m) => m.ear === n.ear && m.conduction === n.conduction && m.frequency === n.frequency && m.masked)) {
      notes.push(`Masking was recommended for ${n.ear} ear ${n.conduction} at ${n.frequency} Hz, but no masked threshold was recorded.`);
    }
  }
  for (const m of responses) {
    if (m.masked && !isNeeded(m.ear, m.conduction, m.frequency)) {
      notes.push(`Masked ${m.ear} ear ${m.conduction} at ${m.frequency} Hz was recorded; masking was not required there.`);
    }
  }

  const final = responses.filter((m) => m.masked === isNeeded(m.ear, m.conduction, m.frequency));
  const off = final.filter((m) => {
    const actual = findThreshold(truth, m.frequency, m.ear, m.conduction);
    return actual !== null && Math.abs(actual - m.level) > 10;
  });
  if (final.length) notes.push(`${final.length - off.length} of ${final.length} final thresholds are within 10 dB of the true values.`);
  for (const m of off) {
    notes.push(`${cap(m.ear)} ear ${m.conduction} at ${m.frequency} Hz: recorded ${m.level} dB, true ${findThreshold(truth, m.frequency, m.ear, m.conduction)} dB.`);
  }
  return notes;
}

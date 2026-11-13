import { describe, expect, it } from 'vitest';
import { answer, startExercise } from './exercise';
import { patientLevel, respond, type Condition } from './listener';
import type { Conduction, Mark } from '../types';

const RUNS = 400;
const lcg = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;
const sd = (x: number[]) => Math.sqrt(x.reduce((a, b) => a + (b - mean(x)) ** 2, 0) / (x.length - 1));

const mk = (frequency: number, ear: 'left' | 'right', conduction: Conduction, level: number): Mark => ({
  frequency, level, ear, conduction, masked: false, maskLevel: 0, response: true,
});

/** Right ear tested; left ear normal (5 dB HL). Air-bone gap is 0 (sensorineural) or `gap` (conductive). */
const patient = (frequency: number, bc: number, gap: number): Mark[] => [
  mk(frequency, 'right', 'AC', bc + gap), mk(frequency, 'right', 'BC', bc),
  mk(frequency, 'left', 'AC', 5), mk(frequency, 'left', 'BC', 5),
];

/** Masker in the middle of the plateau: the range where the response is the test ear's own threshold (+ central masking). */
function plateauMasker(data: Mark[], c: Omit<Condition, 'maskerLevel'>, target: number) {
  const inPlateau = Array.from({ length: 121 }, (_, m) => m).filter(
    (m) => patientLevel(data, { ...c, maskerLevel: m }) === target + 5,
  );
  return inPlateau[Math.floor(inPlateau.length / 2)];
}

function search(expected: number, rnd: () => number) {
  let s = startExercise(30);
  for (let i = 0; i < 300 && s.threshold === null; i++) s = answer(s, respond(s.level, expected, rnd));
  return s.threshold ?? NaN;
}

interface Row {
  scenario: string; frequency: number; trueThreshold: number; expected: number;
  biasVsTrue: number; sd: number; retestSd: number; retest95: number;
}

function run(scenario: string, conduction: Conduction, masked: boolean, gap: number, frequency: number, bc: number, seed: number): Row {
  const data = patient(frequency, bc, gap);
  const base = { frequency, ear: 'right' as const, conduction, masked };
  const trueThreshold = conduction === 'AC' ? bc + gap : bc;
  const maskerLevel = masked ? plateauMasker(data, base, trueThreshold) : 0;
  const expected = patientLevel(data, { ...base, maskerLevel })!;
  const rnd = lcg(seed);
  const a = Array.from({ length: RUNS }, () => search(expected, rnd));
  const b = Array.from({ length: RUNS }, () => search(expected, rnd));
  const diffs = a.map((x, i) => x - b[i]);
  return {
    scenario, frequency, trueThreshold, expected,
    biasVsTrue: mean([...a, ...b]) - trueThreshold, sd: sd([...a, ...b]),
    retestSd: sd(diffs), retest95: Math.abs(mean(diffs)) + 1.96 * sd(diffs),
  };
}

const scenarios: [string, Conduction, boolean, number, number[]][] = [
  ['AC unmasked, SNHL', 'AC', false, 0, [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]],
  ['AC masked, SNHL', 'AC', true, 0, [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]],
  ['AC unmasked, conductive (ABG 30)', 'AC', false, 30, [0, 10, 20, 30, 40, 50, 60, 70]],
  ['BC unmasked, SNHL', 'BC', false, 0, [0, 10, 20, 30, 40, 50, 60, 70]],
  ['BC masked, SNHL', 'BC', true, 0, [0, 10, 20, 30, 40, 50, 60, 70]],
  ['BC masked, conductive (ABG 30)', 'BC', true, 30, [0, 10, 20, 30, 40, 50, 60, 70]],
];

describe('simulated-client reliability across range, conduction and masking', () => {
  const rows: Row[] = [];
  for (const [name, conduction, masked, gap, thresholds] of scenarios) {
    for (const frequency of [500, 2000]) {
      for (const t of thresholds) rows.push(run(name, conduction, masked, gap, frequency, t, 1000 + t + frequency));
    }
  }

  it('prints the summary table', () => {
    const table = rows.map((r) =>
      `${r.scenario} | ${r.frequency} | true ${r.trueThreshold} | model ${r.expected} | bias ${r.biasVsTrue.toFixed(1)} | sd ${r.sd.toFixed(1)} | retest sd ${r.retestSd.toFixed(1)} | 95% ${r.retest95.toFixed(1)}`);
    console.log(`VALIDATION\n${table.join('\n')}`);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('keeps single-search scatter small and test-retest within 10 dB (95%) at every condition', () => {
    for (const r of rows) {
      expect(r.sd, `${r.scenario} ${r.frequency} ${r.trueThreshold}`).toBeLessThan(5);
      expect(r.retest95, `${r.scenario} ${r.frequency} ${r.trueThreshold}`).toBeLessThan(10);
    }
  });

  it('tracks the model-expected threshold within 5 dB (ascending-method bias only)', () => {
    for (const r of rows) {
      const bias = r.biasVsTrue - (r.expected - r.trueThreshold);
      expect(Math.abs(bias), `${r.scenario} ${r.frequency} ${r.trueThreshold}`).toBeLessThan(5);
    }
  });
});

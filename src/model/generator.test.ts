import { describe, expect, it } from 'vitest';
import { FREQUENCIES } from '../constants';
import { generateCase, generateFromCode, newSeed, SCENARIOS, seededRng, type ScenarioId } from './generator';
import { findThreshold, patientLevel } from './listener';
import { recommendSequence, reviewNotes } from './protocol';
import type { Ear, Mark } from '../types';

const th = (marks: Mark[], ear: Ear, conduction: 'AC' | 'BC', f: number) => findThreshold(marks, f, ear, conduction)!;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const pta = (marks: Mark[], ear: Ear) => mean([500, 1000, 2000].map((f) => th(marks, ear, 'AC', f)));
const seeds = Array.from({ length: 40 }, (_, i) => `s${i}`);

describe('generator', () => {
  it('is deterministic for a code and varies across seeds', () => {
    expect(generateCase('tricky', 'abc')).toEqual(generateFromCode('tricky/abc'));
    expect(generateCase('any', 'a').marks).not.toEqual(generateCase('any', 'b').marks);
    expect(generateFromCode('nonsense/abc')).toBeNull();
    expect(newSeed(seededRng('x'))).toHaveLength(6);
  });

  it('produces complete, consistent patients for every scenario', () => {
    for (const { id } of SCENARIOS) {
      for (const seed of seeds) {
        const c = generateCase(id, seed);
        expect(c.scenario).toBe(id);
        expect(c.marks).toHaveLength(FREQUENCIES.length * 4);
        for (const ear of ['right', 'left'] as const) {
          for (const f of FREQUENCIES) {
            const ac = th(c.marks, ear, 'AC', f);
            const bc = th(c.marks, ear, 'BC', f);
            expect(bc).toBeLessThanOrEqual(ac);
            expect(Math.abs(ac % 5)).toBe(0);
            expect(patientLevel(c.marks, { frequency: f, ear, conduction: 'AC', masked: false, maskerLevel: 0 })).not.toBeNull();
          }
        }
        expect(c.history).toMatch(/better hearing|no difference/);
      }
    }
  });

  const scenarioProps: Partial<Record<ScenarioId, (m: Mark[]) => boolean>> = {
    normal: (m) => pta(m, 'right') <= 20 && pta(m, 'left') <= 20,
    'bilateral-conductive': (m) => pta(m, 'right') - mean([500, 1000, 2000].map((f) => th(m, 'right', 'BC', f))) >= 10,
    'asymmetric-snhl': (m) => Math.abs(pta(m, 'right') - pta(m, 'left')) >= 20,
    'dead-ear': (m) => Math.max(pta(m, 'right'), pta(m, 'left')) >= 85,
    'masking-dilemma': (m) => recommendSequence(m).maskingNeeds.some((n) => n.maximum <= n.minimum),
  };
  for (const [id, holds] of Object.entries(scenarioProps)) {
    it(`${id} cases show their defining feature`, () => {
      for (const seed of seeds) expect(holds!(generateCase(id as ScenarioId, seed).marks)).toBe(true);
    });
  }

  it('reports the better ear that matches the thresholds', () => {
    for (const seed of seeds) {
      const c = generateCase('any', seed);
      const d = pta(c.marks, 'left') - pta(c.marks, 'right');
      expect(c.selfReportedBetterEar).toBe(Math.abs(d) < 10 ? 'same' : d > 0 ? 'right' : 'left');
    }
  });

  it('does not present diagnosis labels in generated patient histories', () => {
    for (const { id, title } of SCENARIOS) {
      for (const seed of seeds) {
        const patient = generateCase(id, seed);
        expect(patient.history.toLowerCase()).not.toContain(title.toLowerCase());
        expect(patient.history).not.toMatch(/tympanosclerosis|otosclerosis|sensorineural|conductive|carhart|masking dilemma|cookie-bite|presbycusis|otitis media/i);
      }
    }
  });
});

describe('protocol', () => {
  it('starts with the reported better ear', () => {
    const c = generateCase('normal', 'n1');
    const rec = recommendSequence(c.marks, 'left');
    expect(rec.startEar).toBe('left');
    expect(rec.steps[1].title).toMatch(/^Left/);
  });

  it('uses the reported better ear, or chooses right without inventing a better ear', () => {
    const c = generateCase('asymmetric-snhl', 's0');
    const rec = recommendSequence(c.marks, 'same');
    expect(rec.startEar).toBe('right');
    expect(rec.steps[1].detail).toContain('either ear');
    expect(rec.steps[2].detail).not.toContain('poorer ear');
  });

  it('uses the diagnostic frequency sequence and retests 1000 Hz only in the first ear', () => {
    const rec = recommendSequence(generateCase('normal', 'n1').marks);
    expect(rec.steps[1].detail).toContain('1000, 2000, 3000, 4000, 6000 and 8000 Hz, retest 1000 Hz');
    expect(rec.steps[2].detail).toContain('routine 1000 Hz retest is not required');
    expect(rec.steps[2].detail).not.toContain('Hz, retest 1000 Hz');
  });

  it('recommends BC masking when the air-bone gap is exactly 10 dB', () => {
    const marks: Mark[] = [
      { frequency: 1000, level: 20, ear: 'right', conduction: 'AC', masked: false, maskLevel: 0, response: true },
      { frequency: 1000, level: 10, ear: 'right', conduction: 'BC', masked: false, maskLevel: 0, response: true },
      { frequency: 1000, level: 10, ear: 'left', conduction: 'AC', masked: false, maskLevel: 0, response: true },
      { frequency: 1000, level: 10, ear: 'left', conduction: 'BC', masked: false, maskLevel: 0, response: true },
    ];
    expect(recommendSequence(marks).maskingNeeds).toContainEqual(
      expect.objectContaining({ ear: 'right', conduction: 'BC', frequency: 1000 }),
    );
    expect(recommendSequence(marks).maskingNeeds).not.toContainEqual(
      expect.objectContaining({ ear: 'left', conduction: 'BC', frequency: 1000 }),
    );
  });

  it('checks AC masking at 3000 and 6000 Hz', () => {
    const rec = recommendSequence(generateCase('dead-ear', 's0').marks);
    expect(rec.maskingNeeds.some((n) => n.conduction === 'AC' && n.frequency === 3000)).toBe(true);
    expect(rec.maskingNeeds.some((n) => n.conduction === 'AC' && n.frequency === 6000)).toBe(true);
  });

  it('adds 750 and 1500 Hz for 20 dB differences between the relevant octaves', () => {
    const thresholds = new Map([[250, 10], [500, 10], [1000, 30], [2000, 50], [3000, 50], [4000, 50], [6000, 50], [8000, 50]]);
    const marks: Mark[] = (['right', 'left'] as const).flatMap((ear) =>
      (['AC', 'BC'] as const).flatMap((conduction) =>
        [...thresholds].map(([frequency, level]) => ({
          frequency, level, ear, conduction, masked: false, maskLevel: 0, response: true,
        })),
      ),
    );
    const rec = recommendSequence(marks);
    expect(rec.steps[1].detail).toContain('add 750, 1500 Hz');
  });

  it('does not claim masking is unnecessary when required patient data is missing', () => {
    const rec = recommendSequence([]);
    expect(rec.maskingNeeds).toHaveLength(0);
    expect(rec.steps.some((step) => step.title === 'Incomplete patient data')).toBe(true);
    expect(rec.steps.some((step) => step.title === 'No masking needed')).toBe(false);
  });

  it('flags AC masking of the poorer ear in a dead-ear case', () => {
    for (const seed of seeds) {
      const c = generateCase('dead-ear', seed);
      const bad: Ear = pta(c.marks, 'right') > pta(c.marks, 'left') ? 'right' : 'left';
      const rec = recommendSequence(c.marks, c.selfReportedBetterEar);
      expect(rec.startEar).not.toBe(bad);
      expect(rec.maskingNeeds.some((n) => n.ear === bad && n.conduction === 'AC')).toBe(true);
      expect(rec.maskingNeeds.some((n) => n.ear !== bad && n.conduction === 'AC')).toBe(false);
    }
  });

  it('flags BC masking for conductive losses', () => {
    const rec = recommendSequence(generateCase('unilateral-conductive', 'u1').marks);
    expect(rec.maskingNeeds.some((n) => n.conduction === 'BC')).toBe(true);
  });

  it('writes informational notes about missing and unneeded work', () => {
    const c = generateCase('dead-ear', 'd1');
    const rec = recommendSequence(c.marks);
    const notes = reviewNotes(c.marks, [{ ...c.marks[0], masked: true, maskLevel: 40, level: 120 }], rec);
    expect(notes.join('\n')).toMatch(/no threshold recorded/);
    expect(notes.join('\n')).toMatch(/Masking was recommended/);
    expect(reviewNotes(c.marks, c.marks, rec).join('\n')).toMatch(/within 10 dB/);
  });
});

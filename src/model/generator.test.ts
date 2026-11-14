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
});

describe('protocol', () => {
  it('needs no masking for normal hearing and starts with the reported better ear', () => {
    const c = generateCase('normal', 'n1');
    const rec = recommendSequence(c.marks, 'left');
    expect(rec.maskingNeeds).toHaveLength(0);
    expect(rec.startEar).toBe('left');
    expect(rec.steps[1].title).toMatch(/^Left/);
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

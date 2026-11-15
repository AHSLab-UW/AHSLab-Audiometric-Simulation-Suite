import { describe, expect, it } from 'vitest';
import type { Mark } from '../types';
import { automaticThreshold } from './automaticPractice';
import { airMaskingRange, boneMaskingRange, patientLevel } from './listener';

const makePatient = (rightAC: number, leftAC: number, rightBC: number, leftBC: number): Mark[] =>
  ([
    ['right', 'AC', rightAC], ['left', 'AC', leftAC],
    ['right', 'BC', rightBC], ['left', 'BC', leftBC],
  ] as const).map(([ear, conduction, level]) => ({
    ear, conduction, level, frequency: 1000, masked: false, maskLevel: 0, response: true,
  }));
const condition = { frequency: 1000, ear: 'right', conduction: 'AC', masked: false, maskerLevel: 40 } as const;

describe('automatic practice thresholds', () => {
  it('uses the cross-hearing model without masking', () => {
    const data = makePatient(100, 10, 80, 10);
    expect(automaticThreshold(data, condition)).toMatchObject({ kind: 'measured', level: 50, response: true });
  });

  it.each(['AC', 'BC'] as const)('chooses a usable masker on the %s plateau', (conduction) => {
    const data = makePatient(80, 20, 60, 20);
    const result = automaticThreshold(data, { ...condition, conduction, masked: true });
    expect(result.kind).toBe('measured');
    if (result.kind !== 'measured') return;
    const range = conduction === 'AC' ? airMaskingRange(80, 20, 60) : boneMaskingRange(1000, 20, 60, 20);
    expect(result.maskerLevel % 5).toBe(0);
    expect(result.maskerLevel).toBeGreaterThanOrEqual(Math.max(range.initial, range.minimum));
    expect(result.maskerLevel).toBeLessThan(range.maximum);
    const expected = patientLevel(data, { ...condition, conduction, masked: true, maskerLevel: result.maskerLevel })!;
    expect(result.level).toBe(Math.round(expected / 5) * 5);
  });

  it('reports a dilemma without manufacturing a masked measurement', () => {
    expect(automaticThreshold(makePatient(80, 80, 0, 0), { ...condition, masked: true }))
      .toEqual({ kind: 'masking-dilemma' });
  });

  it('distinguishes an inaccessible plateau from a dilemma', () => {
    expect(automaticThreshold(makePatient(80, 110, 80, 80), { ...condition, masked: true }))
      .toEqual({ kind: 'masker-out-of-range' });
  });

  it('reports missing data and records no response above output limits', () => {
    expect(automaticThreshold([], condition)).toEqual({ kind: 'missing-data' });
    expect(automaticThreshold(makePatient(120, 120, 80, 80), { ...condition, masked: false }))
      .toMatchObject({ kind: 'measured', response: true, level: 120 });
    const data = makePatient(120, 20, 80, 20);
    const result = automaticThreshold(data, { ...condition, masked: true });
    expect(result).toMatchObject({ kind: 'measured', response: false, level: 120 });
  });
});

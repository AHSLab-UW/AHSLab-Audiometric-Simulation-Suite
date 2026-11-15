import { describe, expect, it } from 'vitest';
import { FREQUENCIES, MAX_LEVEL, MIN_LEVEL } from '../constants';
import { generateFromCode } from './generator';
import { patientLevel } from './listener';
import { generateSamplePatient, SAMPLE_PATIENTS } from './samplePatients';

describe('synthetic sample patients', () => {
  it('provides six distinct, complete and reproducible cases', () => {
    expect(SAMPLE_PATIENTS).toHaveLength(6);
    expect(new Set(SAMPLE_PATIENTS.map((sample) => sample.scenario)).size).toBe(6);
    for (const [index, sample] of SAMPLE_PATIENTS.entries()) {
      const patient = generateSamplePatient(index);
      expect(patient).toEqual(generateFromCode(`${sample.scenario}/${sample.seed}`));
      expect(patient.marks).toHaveLength(FREQUENCIES.length * 4);
      for (const ear of ['left', 'right'] as const) {
        for (const frequency of FREQUENCIES) {
          const ac = patient.marks.find((m) => m.ear === ear && m.frequency === frequency && m.conduction === 'AC')!;
          const bc = patient.marks.find((m) => m.ear === ear && m.frequency === frequency && m.conduction === 'BC')!;
          expect(ac.level).toBeGreaterThanOrEqual(bc.level);
          expect(bc.level).toBeGreaterThanOrEqual(MIN_LEVEL);
          expect(ac.level).toBeLessThanOrEqual(MAX_LEVEL);
          expect(patientLevel(patient.marks, { ear, frequency, conduction: 'AC', masked: false, maskerLevel: 0 })).not.toBeNull();
        }
      }
    }
  });

  it('includes a rising configuration with better high-frequency thresholds', () => {
    const patient = generateSamplePatient(3);
    for (const ear of ['left', 'right'] as const) {
      const ac = patient.marks.filter((m) => m.ear === ear && m.conduction === 'AC');
      expect(ac.find((m) => m.frequency === 250)!.level)
        .toBeGreaterThan(ac.find((m) => m.frequency === 8000)!.level);
    }
  });

  it('rejects invalid sample indexes', () => {
    expect(() => generateSamplePatient(-1)).toThrow(RangeError);
  });
});

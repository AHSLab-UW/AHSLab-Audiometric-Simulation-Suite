import { MAX_LEVEL, MIN_LEVEL } from '../constants';
import type { Conduction, Ear, Mark } from '../types';
import { airMaskingRange, boneMaskingRange, findThreshold, patientLevel } from './listener';
import type { Recommendation } from './protocol';

export interface ExpectedThreshold {
  ear: Ear;
  conduction: Conduction;
  frequency: number;
  truth: number | null;
  unmasked: number | null;
  masked: number | null;
  maskerLevel: number | null;
  maskingRequired: boolean;
  dilemma: boolean;
}

const ears: Ear[] = ['right', 'left'];

function chooseMasker(initial: number, minimum: number, maximum: number, maskingRequired: boolean): number | null {
  if (maskingRequired) {
    const plateauStart = Math.max(initial, minimum);
    if (maximum <= plateauStart) return null;
    const midpoint = (plateauStart + maximum) / 2;
    return Math.max(plateauStart, Math.min(maximum, Math.round(midpoint / 5) * 5));
  }
  return initial;
}

/** Expected model thresholds for review; masked estimates use a plateau midpoint when available. */
export function expectedThresholds(truth: Mark[], recommendation: Recommendation): ExpectedThreshold[] {
  const unmaskedTruth = truth.filter((mark) => !mark.masked);
  const frequenciesByConduction = new Map<Conduction, number[]>([
    ['AC', [...new Set(unmaskedTruth.filter((m) => m.conduction === 'AC' && m.frequency >= 250 && m.frequency <= 8000).map((m) => m.frequency))].sort((a, b) => a - b)],
    ['BC', [...new Set(unmaskedTruth.filter((m) => m.conduction === 'BC' && m.frequency >= 250 && m.frequency <= 4000).map((m) => m.frequency))].sort((a, b) => a - b)],
  ]);

  return [...frequenciesByConduction].flatMap(([conduction, frequencies]) =>
    ears.flatMap((ear) =>
      frequencies.map((frequency) => {
        const condition = { frequency, ear, conduction, masked: false, maskerLevel: 0 };
        const truthLevel = findThreshold(unmaskedTruth, frequency, ear, conduction);
        const unmasked = patientLevel(unmaskedTruth, condition);
        const nte: Ear = ear === 'right' ? 'left' : 'right';
        const acNTE = findThreshold(unmaskedTruth, frequency, nte, 'AC');
        const bcTE = findThreshold(unmaskedTruth, frequency, ear, 'BC');
        const bcNTE = findThreshold(unmaskedTruth, frequency, nte, 'BC');
        const acTE = findThreshold(unmaskedTruth, frequency, ear, 'AC');
        const need = recommendation.maskingNeeds.find(
          (item) => item.ear === ear && item.conduction === conduction && item.frequency === frequency,
        );

        if (acNTE === null || bcTE === null || bcNTE === null || (conduction === 'AC' && acTE === null)) {
          return {
            ear, conduction, frequency, truth: truthLevel, unmasked, masked: null, maskerLevel: null,
            maskingRequired: Boolean(need), dilemma: Boolean(need),
          };
        }

        const range = conduction === 'AC'
          ? airMaskingRange(acTE!, acNTE, bcTE)
          : boneMaskingRange(frequency, acNTE, bcTE, bcNTE);
        const maskerLevel = chooseMasker(range.initial, range.minimum, range.maximum, Boolean(need));
        const dilemma = Boolean(need) && maskerLevel === null;
        const masked = dilemma || maskerLevel === null
          ? null
          : patientLevel(unmaskedTruth, { ...condition, masked: true, maskerLevel });

        return {
          ear, conduction, frequency, truth: truthLevel, unmasked, masked, maskerLevel,
          maskingRequired: Boolean(need), dilemma,
        };
      }),
    ),
  );
}

/** Creates plot marks and explicitly shows no response when the expected threshold exceeds output. */
export function expectedMarks(rows: ExpectedThreshold[], kind: 'unmasked' | 'masked'): Mark[] {
  return rows.flatMap((row) => {
    const level = row[kind];
    if (level === null) return [];
    return [{
      frequency: row.frequency,
      level: Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level)),
      ear: row.ear,
      conduction: row.conduction,
      masked: kind === 'masked',
      maskLevel: kind === 'masked' ? row.maskerLevel ?? 0 : 0,
      response: level <= MAX_LEVEL,
    }];
  });
}

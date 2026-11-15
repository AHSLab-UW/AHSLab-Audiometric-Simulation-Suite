import { LEVEL_STEP, MAX_LEVEL, MIN_LEVEL, clampLevel } from '../constants';
import type { Mark } from '../types';
import { airMaskingRange, boneMaskingRange, findThreshold, INTERAURAL_ATTENUATION_AC, occlusionEffect, patientLevel, type Condition } from './listener';

type AutomaticResult =
  | { kind: 'measured'; level: number; response: boolean; maskerLevel: number }
  | { kind: 'missing-data' }
  | { kind: 'masking-dilemma' }
  | { kind: 'masker-out-of-range' };

/** Selects a 5 dB masker setting on the model plateau, then evaluates the selected condition. */
export function automaticThreshold(data: Mark[], condition: Condition): AutomaticResult {
  const { frequency, ear, conduction, masked } = condition;
  const nte = ear === 'right' ? 'left' : 'right';
  let acTE = findThreshold(data, frequency, ear, 'AC');
  let acNTE = findThreshold(data, frequency, nte, 'AC');
  let bcTE = findThreshold(data, frequency, ear, 'BC');
  let bcNTE = findThreshold(data, frequency, nte, 'BC');
  if (acTE === null || acNTE === null || bcTE === null || bcNTE === null) return { kind: 'missing-data' };
  if (bcTE > acTE) acTE = bcTE = (bcTE + acTE) / 2;
  if (bcNTE > acNTE) acNTE = bcNTE = (bcNTE + acNTE) / 2;

  let maskerLevel = condition.maskerLevel;
  if (masked) {
    const range = conduction === 'AC'
      ? airMaskingRange(acTE, acNTE, bcTE)
      : boneMaskingRange(frequency, acNTE, bcTE, bcNTE);
    const needsCrossHearingMasking = conduction === 'AC'
      ? acTE - INTERAURAL_ATTENUATION_AC >= bcNTE
      : bcTE >= bcNTE - occlusionEffect(frequency, bcTE);
    const start = needsCrossHearingMasking ? Math.max(range.initial, range.minimum) : range.initial;
    if (start >= range.maximum) return { kind: 'masking-dilemma' };
    const lowest = Math.max(MIN_LEVEL, Math.ceil(start / LEVEL_STEP) * LEVEL_STEP);
    const highest = Math.min(MAX_LEVEL, (Math.ceil(range.maximum / LEVEL_STEP) - 1) * LEVEL_STEP);
    if (lowest > highest) return { kind: 'masker-out-of-range' };
    maskerLevel = Math.max(lowest, Math.min(highest, Math.round((start + range.maximum) / (2 * LEVEL_STEP)) * LEVEL_STEP));
  }
  const threshold = patientLevel(data, { ...condition, maskerLevel });
  if (threshold === null) return { kind: 'missing-data' };
  return {
    kind: 'measured',
    level: clampLevel(Math.round(threshold / LEVEL_STEP) * LEVEL_STEP),
    response: threshold <= MAX_LEVEL,
    maskerLevel,
  };
}

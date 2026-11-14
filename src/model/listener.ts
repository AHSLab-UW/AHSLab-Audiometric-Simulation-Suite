import type { Conduction, Ear, Mark } from '../types';

/**
 * Simulated listener. Formulation follows the clinical masking rules in REFERENCES.md:
 * interaural attenuation (IA), effective-masking correction factor (CF), central masking, the
 * occlusion effect (OE), and the minimum/maximum masking limits of the "masking plateau"
 * (Hood, 1960; Studebaker, 1967; Martin & Clark; Katz, Handbook of Clinical Audiology).
 * The constants are teaching simplifications, not patient-specific measurements.
 *
 * Simulated listener. Given a patient's recorded thresholds, estimates the level at which
 * the patient responds for a test condition, including cross hearing and (over)masking.
 */
export interface Condition {
  frequency: number;
  ear: Ear;
  conduction: Conduction;
  masked: boolean;
  maskerLevel: number;
}

export const INTERAURAL_ATTENUATION_AC = 40;
const INTERAURAL_ATTENUATION_BC = 0;
export const CORRECTION_FACTOR = 15;
const CENTRAL_MASKING = 5;
const OCCLUSION_EFFECT: Record<number, number> = { 125: 20, 250: 20, 500: 15, 750: 10, 1000: 5 };
const OCCLUSION_EFFECT_LEVEL = 60;

const otherEar = (ear: Ear): Ear => (ear === 'left' ? 'right' : 'left');

function occlusionEffect(frequency: number, level: number) {
  return Math.ceil(((OCCLUSION_EFFECT[frequency] ?? 0) * Math.max(0, level)) / OCCLUSION_EFFECT_LEVEL);
}

/** Looks up a recorded threshold, preferring masked marks. */
export function findThreshold(data: Mark[], frequency: number, ear: Ear, conduction: Conduction): number | null {
  const candidates = data.filter((m) => m.response && m.frequency === frequency && m.conduction === conduction);
  const masked = candidates.find((m) => m.ear === ear && m.masked);
  if (masked) return masked.level;
  const own = candidates.find((m) => m.ear === ear && !m.masked);
  if (own) return own.level;
  // Unmasked bone conduction is not ear specific, so either ear's mark applies.
  if (conduction === 'BC') return candidates.find((m) => !m.masked)?.level ?? null;
  return null;
}

/** Returns the simulated threshold for the condition, or null if the patient data is incomplete. */
export function patientLevel(data: Mark[], c: Condition): number | null {
  const nte = otherEar(c.ear);
  let acTE = findThreshold(data, c.frequency, c.ear, 'AC');
  let acNTE = findThreshold(data, c.frequency, nte, 'AC');
  let bcTE = findThreshold(data, c.frequency, c.ear, 'BC');
  let bcNTE = findThreshold(data, c.frequency, nte, 'BC');
  if (acTE === null || acNTE === null || bcTE === null || bcNTE === null) return null;

  // A bone conduction threshold worse than air conduction is inconsistent; use the average.
  if (bcTE > acTE) acTE = bcTE = (bcTE + acTE) / 2;
  if (bcNTE > acNTE) acNTE = bcNTE = (bcNTE + acNTE) / 2;

  return c.conduction === 'AC'
    ? airConductionLevel(acTE, acNTE, bcTE, bcNTE, c)
    : boneConductionLevel(acNTE, bcTE, bcNTE, c);
}

export interface MaskingRange {
  /** Starting masker level. */
  initial: number;
  /** Lowest masker level that fully masks the non-test ear. */
  minimum: number;
  /** Highest masker level before over-masking. A plateau exists only if maximum > minimum. */
  maximum: number;
}

export function airMaskingRange(acTE: number, acNTE: number, bcTE: number): MaskingRange {
  const initial = acNTE + CORRECTION_FACTOR;
  return {
    initial,
    minimum: acNTE + (acTE - INTERAURAL_ATTENUATION_AC) + CORRECTION_FACTOR,
    maximum: bcTE + INTERAURAL_ATTENUATION_AC + CORRECTION_FACTOR,
  };
}

export function boneMaskingRange(frequency: number, acNTE: number, bcTE: number, bcNTE: number): MaskingRange {
  const oeTE = occlusionEffect(frequency, bcTE);
  return {
    initial: acNTE + CORRECTION_FACTOR + occlusionEffect(frequency, bcNTE),
    minimum: acNTE + CORRECTION_FACTOR + (bcTE - bcNTE) + oeTE,
    maximum: bcTE + INTERAURAL_ATTENUATION_AC + oeTE + CORRECTION_FACTOR,
  };
}

function airConductionLevel(acTE: number, acNTE: number, bcTE: number, bcNTE: number, c: Condition) {
  const ia = INTERAURAL_ATTENUATION_AC;
  const central = c.masked ? CENTRAL_MASKING : 0;
  const crossHearing = acTE - ia >= bcNTE;

  if (c.masked && crossHearing) {
    const { initial, minimum, maximum } = airMaskingRange(acTE, acNTE, bcTE);
    return maskedCrossHearingLevel(
      c.maskerLevel, initial, minimum, maximum, bcNTE + ia, acTE, central,
    );
  }
  if (crossHearing) return bcNTE + ia;
  if (c.masked) {
    const overMasking = c.maskerLevel - ia - CORRECTION_FACTOR - bcTE;
    return acTE + Math.max(0, overMasking) + central;
  }
  return acTE;
}

function boneConductionLevel(acNTE: number, bcTE: number, bcNTE: number, c: Condition) {
  const ia = INTERAURAL_ATTENUATION_BC;
  const central = c.masked ? CENTRAL_MASKING : 0;
  const oeTE = occlusionEffect(c.frequency, bcTE);
  const crossHearingThreshold = bcNTE - oeTE;
  const maskedCrossHearing = bcTE >= crossHearingThreshold;

  const { initial, minimum, maximum } = boneMaskingRange(c.frequency, acNTE, bcTE, bcNTE);

  if (c.masked && maskedCrossHearing) {
    return maskedCrossHearingLevel(
      c.maskerLevel, initial, minimum, maximum, crossHearingThreshold, bcTE, central,
    );
  }
  if (bcTE >= bcNTE) return bcNTE + ia;
  if (c.masked) return bcTE + Math.max(0, c.maskerLevel - maximum) + central;
  return bcTE;
}

function maskedCrossHearingLevel(
  maskerLevel: number,
  initial: number,
  minimum: number,
  maximum: number,
  crossHearingThreshold: number,
  testEarThreshold: number,
  central: number,
) {
  const ramp = (level: number) => {
    if (minimum <= initial) return testEarThreshold;
    const progress = Math.min(1, Math.max(0, (level - initial) / (minimum - initial)));
    return crossHearingThreshold + progress * (testEarThreshold - crossHearingThreshold);
  };

  if (maskerLevel < initial) return crossHearingThreshold + central;

  if (maximum <= minimum) {
    const overMaskingStart = Math.max(initial, maximum);
    if (maskerLevel < overMaskingStart) return ramp(maskerLevel) + central;
    return ramp(overMaskingStart) + (maskerLevel - overMaskingStart) + central;
  }

  if (minimum > initial && maskerLevel < minimum) return ramp(maskerLevel) + central;
  if (maskerLevel < maximum) return testEarThreshold + central;
  return testEarThreshold + (maskerLevel - maximum) + central;
}

/** Probabilistic yes/no response: logistic psychometric function with 50% at threshold and ~4.4 dB between the 10% and 90% points (steep, as for pure tones in quiet; see REFERENCES.md). */
export function respond(level: number, threshold: number | null, random: () => number = Math.random): boolean {
  const probabilityYes = threshold === null ? 0.5 : 1 / (1 + Math.exp(-(level - threshold)));
  return random() < probabilityYes;
}

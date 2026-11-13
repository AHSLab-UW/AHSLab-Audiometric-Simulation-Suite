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

const INTERAURAL_ATTENUATION_AC = 40;
const INTERAURAL_ATTENUATION_BC = 0;
const CORRECTION_FACTOR = 15;
const CENTRAL_MASKING = 5;
const OCCLUSION_EFFECT: Record<number, number> = { 125: 20, 250: 20, 500: 15, 750: 10, 1000: 5 };
const OCCLUSION_EFFECT_LEVEL = 60;

const otherEar = (ear: Ear): Ear => (ear === 'left' ? 'right' : 'left');

function occlusionEffect(frequency: number, level: number) {
  return Math.ceil(((OCCLUSION_EFFECT[frequency] ?? 0) * level) / OCCLUSION_EFFECT_LEVEL);
}

function threshold(data: Mark[], frequency: number, ear: Ear, conduction: Conduction): number | null {
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
  let acTE = threshold(data, c.frequency, c.ear, 'AC');
  let acNTE = threshold(data, c.frequency, nte, 'AC');
  let bcTE = threshold(data, c.frequency, c.ear, 'BC');
  let bcNTE = threshold(data, c.frequency, nte, 'BC');
  if (acTE === null || acNTE === null || bcTE === null || bcNTE === null) return null;

  // A bone conduction threshold worse than air conduction is inconsistent; use the average.
  if (bcTE > acTE) acTE = bcTE = (bcTE + acTE) / 2;
  if (bcNTE > acNTE) acNTE = bcNTE = (bcNTE + acNTE) / 2;

  return c.conduction === 'AC'
    ? airConductionLevel(acTE, acNTE, bcTE, bcNTE, c)
    : boneConductionLevel(acNTE, bcTE, bcNTE, c);
}

function airConductionLevel(acTE: number, acNTE: number, bcTE: number, bcNTE: number, c: Condition) {
  const ia = INTERAURAL_ATTENUATION_AC;
  const central = c.masked ? CENTRAL_MASKING : 0;
  const crossHearing = acTE - ia >= bcNTE;

  if (c.masked && crossHearing) {
    const initial = acNTE + CORRECTION_FACTOR;
    const minimum = acNTE + (acTE - ia) + CORRECTION_FACTOR;
    const maximum = bcTE + ia + CORRECTION_FACTOR;
    if (c.maskerLevel < initial) return bcNTE + ia + central;
    if (c.maskerLevel < minimum) return bcNTE + ia + (c.maskerLevel - initial) + central;
    if (c.maskerLevel < maximum) return acTE + central;
    return acTE + (c.maskerLevel - maximum) + central;
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
  const crossHearing = bcTE >= bcNTE - oeTE;

  const initial = acNTE + CORRECTION_FACTOR + occlusionEffect(c.frequency, bcNTE);
  const minimum = acNTE + CORRECTION_FACTOR + (bcTE - bcNTE) + oeTE;
  const maximum = bcTE + INTERAURAL_ATTENUATION_AC + oeTE + CORRECTION_FACTOR;

  if (c.masked && crossHearing) {
    if (c.maskerLevel < initial) return bcNTE + central;
    if (c.maskerLevel < minimum) return bcNTE + (c.maskerLevel - initial) + central;
    if (c.maskerLevel < maximum) return bcTE + central;
    return bcTE + (c.maskerLevel - maximum) + central;
  }
  if (crossHearing) return bcNTE + ia;
  if (c.masked) return bcTE + Math.max(0, c.maskerLevel - maximum) + central;
  return bcTE;
}

/** Probabilistic yes/no response: logistic psychometric function with 50% at threshold and ~4.4 dB between the 10% and 90% points (steep, as for pure tones in quiet; see REFERENCES.md). */
export function respond(level: number, threshold: number | null, random: () => number = Math.random): boolean {
  const probabilityYes = threshold === null ? 0.5 : 1 / (1 + Math.exp(-(level - threshold)));
  return random() < probabilityYes;
}

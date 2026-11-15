import { generateCase, type GeneratedCase, type ScenarioId } from './generator';

const SAMPLE_SCENARIOS: readonly ScenarioId[] = [
  'presbycusis',
  'ski-slope',
  'noise-notch',
  'rising-snhl',
  'bilateral-mixed',
  'conductive-plus-snhl',
];

/** Stable synthetic teaching examples, not transcriptions of clinical records. */
export const SAMPLE_PATIENTS = SAMPLE_SCENARIOS.map((scenario, index) => ({
  label: `Synthetic sample ${index + 1}`,
  scenario,
  seed: `sample${index + 1}`,
}));

export function generateSamplePatient(index: number): GeneratedCase {
  const sample = SAMPLE_PATIENTS[index];
  if (!sample) throw new RangeError(`Unknown sample patient: ${index}`);
  return generateCase(sample.scenario, sample.seed);
}

export const FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 12000] as const;

export const MIN_LEVEL = -10;
export const MAX_LEVEL = 120;
export const LEVEL_STEP = 5;

export const DEFAULT_FREQUENCY = 250;
export const DEFAULT_LEVEL = 50;
export const DEFAULT_MASKER_LEVEL = 40;

export const TONE_SECONDS = 1;

export const MESSAGES = {
  BC_AUTO: 'Bone conduction tests are not available in automatic mode.',
  BC_MANUAL:
    'No sound is presented during bone conduction testing, but you may still mark BC thresholds on the audiogram.',
  NO_PATIENT_DATA: 'The imported patient data is missing values needed to simulate a response at this frequency.',
  BAD_FILE: 'File cannot be imported: the data is not formatted correctly.',
} as const;

export const clampLevel = (level: number) => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));

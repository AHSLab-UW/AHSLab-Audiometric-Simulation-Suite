export type Ear = 'left' | 'right';
export type Conduction = 'AC' | 'BC';

export interface Mark {
  frequency: number;
  level: number;
  ear: Ear;
  conduction: Conduction;
  masked: boolean;
  /** Masker level in dB HL; only meaningful when `masked` is true. */
  maskLevel: number;
  response: boolean;
}

export type Mode = 'idle' | 'auto' | 'manual' | 'practice-auto' | 'draw';

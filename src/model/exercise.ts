import { clampLevel } from '../constants';

export const REQUIRED_ASCENDING_YES = 2;
export const DECREMENT = 10;
export const INCREMENT = 5;

export interface ExerciseState {
  level: number;
  /** Number of "yes" answers on ascending presentations recorded at each level. */
  yesCounts: Record<number, number>;
  /** True when the previous presentation was heard, so the next one is a descending trial. */
  descending: boolean;
  threshold: number | null;
}

export const startExercise = (level: number): ExerciseState => ({ level, yesCounts: {}, descending: true, threshold: null });

/**
 * Modified Hughson-Westlake: descend 10 dB after "yes", ascend 5 dB after "no". Threshold is the level
 * at which the listener responded on two ascending presentations (ASHA, 2005, "Guidelines for Manual
 * Pure-Tone Threshold Audiometry"; Carhart & Jerger, 1959). Responses on descending trials do not count.
 */
export function answer(state: ExerciseState, heard: boolean): ExerciseState {
  if (!heard) return { ...state, level: clampLevel(state.level + INCREMENT), descending: false };
  const yesCounts = { ...state.yesCounts };
  if (!state.descending) yesCounts[state.level] = (yesCounts[state.level] ?? 0) + 1;
  if ((yesCounts[state.level] ?? 0) >= REQUIRED_ASCENDING_YES) return { ...state, yesCounts, threshold: state.level };
  return { level: clampLevel(state.level - DECREMENT), yesCounts, descending: true, threshold: null };
}

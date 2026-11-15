import { FREQUENCIES, MAX_LEVEL } from '../constants';
import type { Ear, Mark } from '../types';

/**
 * Generator of realistic simulated patients. Each ear is built from a sensorineural (bone conduction)
 * configuration plus an air-bone gap, with 5 dB test-retest jitter, so that BC <= AC at every frequency
 * and the result stays consistent with the masking model in listener.ts. Configurations follow the
 * textbook patterns listed in REFERENCES.md (presbycusis, noise notch, otosclerosis with Carhart notch, etc.).
 */

export type Rng = () => number;
export type Tier = 'common' | 'tricky';
export type Selection = Tier | 'any' | ScenarioId;
export type SelfReport = Ear | 'same';

export interface GeneratedCase {
  /** Reproducible code, e.g. "tricky/k3x9ab". */
  code: string;
  selection: Selection;
  scenario: ScenarioId;
  tier: Tier;
  title: string;
  history: string;
  selfReportedBetterEar: SelfReport;
  /** Complete, unmasked thresholds (AC and BC, both ears, every frequency) usable as a simulated patient. */
  marks: Mark[];
}

const MAX_BC = 80;
const MIN_LEVEL = -5;

/** Small, fast seeded PRNG (mulberry32) with a string hash for seeding. */
export function seededRng(seed: string): Rng {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const step5 = (rng: Rng, lo: number, hi: number) => 5 * int(rng, Math.ceil(lo / 5), Math.floor(hi / 5));
const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];
const round5 = (x: number) => Math.round(x / 5) * 5;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const other = (ear: Ear): Ear => (ear === 'left' ? 'right' : 'left');

type Points = [number, number][];

/** Piecewise-linear interpolation over log frequency, flat beyond the end points. */
function curve(points: Points, frequency: number): number {
  if (frequency <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [f0, v0] = points[i - 1];
    const [f1, v1] = points[i];
    if (frequency <= f1) return v0 + ((v1 - v0) * Math.log2(frequency / f0)) / Math.log2(f1 / f0);
  }
  return points[points.length - 1][1];
}

const CARHART: Record<number, number> = { 500: 5, 1000: 10, 2000: 15, 4000: 5 };

interface EarSpec {
  /** True cochlear (sensorineural) thresholds. */
  bc: Points;
  /** Air-bone gap. */
  gap: Points;
  carhart?: boolean;
}

interface EarData {
  ac: number[];
  bc: number[];
}

function buildEar(spec: EarSpec, rng: Rng): EarData {
  const jitter = () => pick(rng, [-5, 0, 0, 5]);
  const ac: number[] = [];
  const bc: number[] = [];
  for (const f of FREQUENCIES) {
    const cochlea = round5(curve(spec.bc, f)) + jitter();
    const measuredBc = clamp(cochlea + (spec.carhart ? (CARHART[f] ?? 0) : 0), MIN_LEVEL, MAX_BC);
    const air = clamp(round5(cochlea + curve(spec.gap, f)) + jitter(), MIN_LEVEL, MAX_LEVEL);
    bc.push(measuredBc);
    ac.push(Math.max(air, measuredBc));
  }
  return { ac, bc };
}

const NO_GAP: Points = [[250, 0], [8000, 0]];
const flatGap = (g: number): Points => [[250, g + 5], [2000, g], [8000, g - 5]];

const normalBc = (rng: Rng): Points => [[250, step5(rng, 0, 10)], [8000, step5(rng, 0, 15)]];
const slopingBc = (low: number, high: number): Points => [[250, low], [1000, low + 5], [8000, high]];
const flatBc = (level: number): Points => [[250, level], [8000, level + 5]];
const skiBc = (low: number, high: number): Points => [[250, low], [1000, low + 5], [4000, high], [8000, high + 5]];
const cookieBc = (edge: number, mid: number): Points => [[250, edge], [1000, mid], [2000, mid], [4000, edge + 5], [8000, edge + 10]];
const notchBc = (low: number, notch: number): Points =>
  [[250, low], [2000, low + 5], [3000, notch - 10], [4000, notch], [6000, notch - 5], [8000, notch - 20]];
const profoundBc = (level: number): Points => [[250, level - 5], [1000, level], [8000, level + 5]];

export type ScenarioId =
  | 'normal' | 'presbycusis' | 'noise-notch' | 'flat-snhl' | 'ski-slope' | 'rising-snhl' | 'cookie-bite' | 'bilateral-conductive'
  | 'unilateral-conductive' | 'bilateral-mixed' | 'otosclerosis' | 'asymmetric-snhl' | 'dead-ear'
  | 'conductive-plus-snhl' | 'masking-dilemma';

interface Built {
  right: EarSpec;
  left: EarSpec;
  history: string;
  title?: string;
}

interface Scenario {
  id: ScenarioId;
  tier: Tier;
  weight: number;
  title: string;
  build: (rng: Rng) => Built;
}

const side = (rng: Rng): Ear => pick(rng, ['right', 'left'] as const);
const age = (rng: Rng, lo: number, hi: number) => int(rng, lo, hi);
const pair = (spec: () => EarSpec): { right: EarSpec; left: EarSpec } => ({ right: spec(), left: spec() });

/** Builds a pair of specs whose configurations differ by one ear-specific draw. */
function withEars(bad: Ear, badSpec: EarSpec, goodSpec: EarSpec): { right: EarSpec; left: EarSpec } {
  return bad === 'right' ? { right: badSpec, left: goodSpec } : { right: goodSpec, left: badSpec };
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'normal', tier: 'common', weight: 3, title: 'Normal hearing',
    build: (rng) => ({
      ...pair(() => ({ bc: normalBc(rng), gap: NO_GAP })),
      history: `${age(rng, 19, 40)}-year-old adult, routine hearing screening for work. No complaints, no ear history.`,
    }),
  },
  {
    id: 'presbycusis', tier: 'common', weight: 4, title: 'Bilateral sloping sensorineural loss (age-related)',
    build: (rng) => {
      const low = step5(rng, 10, 30);
      const high = low + step5(rng, 25, 45);
      return {
        ...pair(() => ({ bc: slopingBc(low + step5(rng, -5, 5), high + step5(rng, -5, 5)), gap: NO_GAP })),
        history: `${age(rng, 62, 84)}-year-old adult. Gradual hearing decline over several years, trouble following speech in restaurants, mild bilateral tinnitus.`,
      };
    },
  },
  {
    id: 'noise-notch', tier: 'common', weight: 3, title: 'Noise-induced notch at 4 kHz',
    build: (rng) => {
      const notch = step5(rng, 40, 65);
      return {
        ...pair(() => ({ bc: notchBc(step5(rng, 0, 15), notch + step5(rng, -5, 5)), gap: NO_GAP })),
        history: `${age(rng, 35, 58)}-year-old adult with ${pick(rng, ['25 years in manufacturing', 'a long military service history', 'years of recreational shooting'])}; occasional ringing after noise exposure, uses hearing protection inconsistently.`,
      };
    },
  },
  {
    id: 'flat-snhl', tier: 'common', weight: 2, title: 'Bilateral flat sensorineural loss',
    build: (rng) => {
      const level = step5(rng, 30, 60);
      return {
        ...pair(() => ({ bc: flatBc(level + step5(rng, -5, 5)), gap: NO_GAP })),
        history: `${age(rng, 30, 70)}-year-old adult. Reports a gradual decline in both ears with no dizziness or pain. Family history of hearing loss.`,
      };
    },
  },
  {
    id: 'ski-slope', tier: 'common', weight: 2, title: 'Bilateral ski-slope sensorineural loss',
    build: (rng) => {
      const low = step5(rng, 5, 20);
      const high = step5(rng, 60, 85);
      return {
        ...pair(() => ({ bc: skiBc(low + step5(rng, -5, 5), high + step5(rng, -5, 5)), gap: NO_GAP })),
        history: `${age(rng, 45, 80)}-year-old adult. Can hear people talking but cannot understand words, especially women's and children's voices.`,
      };
    },
  },
  {
    // Keep existing seeded random pools stable; this configuration is chosen explicitly.
    id: 'rising-snhl', tier: 'common', weight: 0, title: 'Bilateral rising sensorineural loss',
    build: (rng) => {
      const low = step5(rng, 50, 65);
      const high = step5(rng, 15, 30);
      const spec = (): EarSpec => ({
        bc: [[250, low + step5(rng, -5, 5)], [2000, low - 5], [4000, 40], [8000, high]],
        gap: NO_GAP,
      });
      return {
        ...pair(spec),
        history: `${age(rng, 30, 65)}-year-old adult reporting difficulty understanding conversation in both ears.`,
      };
    },
  },
  {
    id: 'cookie-bite', tier: 'common', weight: 1, title: 'Bilateral mid-frequency (cookie-bite) loss',
    build: (rng) => {
      const edge = step5(rng, 10, 25);
      const mid = edge + step5(rng, 25, 40);
      return {
        ...pair(() => ({ bc: cookieBc(edge + step5(rng, -5, 5), mid + step5(rng, -5, 5)), gap: NO_GAP })),
        history: `${age(rng, 15, 45)}-year-old with long-standing difficulty in both ears since childhood; a parent and a sibling have similar loss.`,
      };
    },
  },
  {
    id: 'bilateral-conductive', tier: 'common', weight: 3, title: 'Bilateral conductive loss',
    build: (rng) => {
      const gap = step5(rng, 20, 40);
      return {
        ...pair(() => ({ bc: normalBc(rng), gap: flatGap(gap + step5(rng, -5, 5)) })),
        history: `${age(rng, 4, 12)}-year-old child with a history of ear infections. Parents report asking for repetition and a louder TV. Otoscopy: dull, retracted tympanic membranes.`,
      };
    },
  },
  {
    id: 'unilateral-conductive', tier: 'common', weight: 3, title: 'Unilateral conductive loss',
    build: (rng) => {
      const bad = side(rng);
      const gap = step5(rng, 25, 45);
      return {
        ...withEars(bad, { bc: normalBc(rng), gap: flatGap(gap) }, { bc: normalBc(rng), gap: NO_GAP }),
        history: `${age(rng, 18, 55)}-year-old adult with sudden muffled hearing and fullness in the ${bad} ear after a cold. Otoscopy: ${bad} tympanic membrane appears bulging; other tympanic membrane appears normal.`,
      };
    },
  },
  {
    id: 'bilateral-mixed', tier: 'tricky', weight: 3, title: 'Bilateral mixed hearing loss',
    build: (rng) => {
      const low = step5(rng, 20, 35);
      const high = low + step5(rng, 15, 30);
      const gap = step5(rng, 20, 35);
      return {
        ...pair(() => ({ bc: slopingBc(low + step5(rng, -5, 5), high + step5(rng, -5, 5)), gap: flatGap(gap + step5(rng, -5, 5)) })),
        history: `${age(rng, 60, 85)}-year-old adult reporting long-standing difficulty hearing and intermittent drainage from both ears.`,
      };
    },
  },
  {
    id: 'otosclerosis', tier: 'tricky', weight: 3, title: 'Otosclerosis with Carhart notch',
    build: (rng) => {
      const gap = step5(rng, 35, 50);
      const bad = side(rng);
      const bilateral = rng() < 0.6;
      const spec = (g: number): EarSpec => ({
        bc: normalBc(rng), gap: [[250, g + 10], [1000, g], [4000, g - 10]], carhart: true,
      });
      const good: EarSpec = bilateral ? spec(gap - 10) : { bc: normalBc(rng), gap: NO_GAP };
      return {
        ...withEars(bad, spec(gap), good),
        history: `${age(rng, 28, 48)}-year-old woman with slowly progressive hearing loss in the ${bilateral ? 'both ears, worse in the ' + bad : bad + ' ear'}, tinnitus, hears better in noisy surroundings. Otoscopy normal; pregnancy-related worsening noted.`,
      };
    },
  },
  {
    id: 'asymmetric-snhl', tier: 'tricky', weight: 3, title: 'Asymmetric sensorineural loss',
    build: (rng) => {
      const bad = side(rng);
      const good = step5(rng, 5, 20);
      const badLow = step5(rng, 50, 65);
      return {
        ...withEars(
          bad,
          { bc: slopingBc(badLow, badLow + step5(rng, 10, 25)), gap: NO_GAP },
          { bc: slopingBc(good, good + step5(rng, 10, 25)), gap: NO_GAP },
        ),
        history: `${age(rng, 40, 70)}-year-old adult with progressive hearing loss and tinnitus in the ${bad} ear for several months. No vertigo. Medical referral pending.`,
      };
    },
  },
  {
    id: 'dead-ear', tier: 'tricky', weight: 3, title: 'Unilateral profound loss (shadow curve)',
    build: (rng) => {
      const bad = side(rng);
      const level = step5(rng, 70, 80);
      return {
        ...withEars(
          bad,
          { bc: profoundBc(level), gap: [[250, 25], [8000, 40]] },
          { bc: rng() < 0.5 ? normalBc(rng) : slopingBc(step5(rng, 5, 15), step5(rng, 25, 40)), gap: NO_GAP },
        ),
        history: `${age(rng, 30, 70)}-year-old adult reporting a sudden change in hearing in the ${bad} ear years ago and relying on the other ear. Wants a baseline evaluation.`,
      };
    },
  },
  {
    id: 'conductive-plus-snhl', tier: 'tricky', weight: 3, title: 'Conductive loss in one ear, sensorineural loss in the other',
    build: (rng) => {
      const conductive = side(rng);
      const gap = step5(rng, 30, 45);
      const high = step5(rng, 45, 65);
      return {
        ...withEars(
          conductive,
          { bc: normalBc(rng), gap: flatGap(gap) },
          { bc: slopingBc(step5(rng, 25, 40), high), gap: NO_GAP },
        ),
        history: `${age(rng, 45, 75)}-year-old adult reporting longstanding hearing difficulty in the ${other(conductive)} ear and recent difficulty in the ${conductive} ear after swimming. Otoscopy: cerumen and an apparent tympanic membrane perforation in the ${conductive} ear.`,
      };
    },
  },
  {
    id: 'masking-dilemma', tier: 'tricky', weight: 2, title: 'Bilateral large conductive loss (masking dilemma)',
    build: (rng) => {
      const gap = step5(rng, 50, 60);
      return {
        ...pair(() => ({ bc: normalBc(rng), gap: flatGap(gap + step5(rng, -5, 5)) })),
        history: `${age(rng, 25, 65)}-year-old adult reporting significant hearing difficulty since childhood and previous surgery in both ears.`,
      };
    },
  },
];

const pta = (ac: number[]) => (ac[FREQUENCIES.indexOf(500)] + ac[FREQUENCIES.indexOf(1000)] + ac[FREQUENCIES.indexOf(2000)]) / 3;

function toMarks(ear: Ear, data: EarData): Mark[] {
  return (['AC', 'BC'] as const).flatMap((conduction) =>
    FREQUENCIES.map((frequency, i) => ({
      frequency, level: conduction === 'AC' ? data.ac[i] : data.bc[i], ear, conduction, masked: false, maskLevel: 0, response: true,
    })),
  );
}

function pickScenario(rng: Rng, selection: Selection): Scenario {
  const exact = SCENARIOS.find((s) => s.id === selection);
  if (exact) return exact;
  const pool = SCENARIOS.filter((s) => selection === 'any' || s.tier === selection);
  let roll = rng() * pool.reduce((sum, s) => sum + s.weight, 0);
  return pool.find((s) => (roll -= s.weight) < 0) ?? pool[pool.length - 1];
}

export const newSeed = (rng: Rng = Math.random) => Math.floor(rng() * 36 ** 6).toString(36).padStart(6, '0');

/** Generates the same patient for the same selection and seed. */
export function generateCase(selection: Selection = 'any', seed: string = newSeed()): GeneratedCase {
  const rng = seededRng(`${selection}/${seed}`);
  const scenario = pickScenario(rng, selection);
  const built = scenario.build(rng);
  const right = buildEar(built.right, rng);
  const left = buildEar(built.left, rng);

  const difference = pta(left.ac) - pta(right.ac);
  const selfReportedBetterEar: SelfReport = Math.abs(difference) < 10 ? 'same' : difference > 0 ? 'right' : 'left';
  const report =
    selfReportedBetterEar === 'same'
      ? 'Reports no difference between the ears.'
      : `Self-reports better hearing in the ${selfReportedBetterEar} ear.`;

  return {
    code: `${selection}/${seed}`,
    selection,
    scenario: scenario.id,
    tier: scenario.tier,
    title: scenario.title,
    history: `${built.history} ${report}`,
    selfReportedBetterEar,
    marks: [...toMarks('right', right), ...toMarks('left', left)],
  };
}

export const isSelection = (value: string): value is Selection =>
  value === 'any' || value === 'common' || value === 'tricky' || SCENARIOS.some((s) => s.id === value);

/** Parses a code such as "tricky/k3x9ab"; returns null if it is not valid. */
export function generateFromCode(code: string): GeneratedCase | null {
  const [selection, seed, ...rest] = code.trim().split('/');
  if (rest.length || !seed || !isSelection(selection)) return null;
  return generateCase(selection, seed);
}

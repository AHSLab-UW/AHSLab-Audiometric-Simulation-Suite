import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { answer, startExercise } from './exercise';
import { decryptText, encryptText } from './crypto';
import { marksToCsv, parseCsv } from './csv';
import { patientLevel, respond } from './listener';
import { lineGroups, removeMark, upsertMark } from './marks';
import type { Mark } from '../types';

const mark = (over: Partial<Mark> = {}): Mark => ({
  frequency: 1000, level: 20, ear: 'right', conduction: 'AC', masked: false, maskLevel: 0, response: true, ...over,
});

describe('marks', () => {
  it('replaces a mark in the same slot and keeps others', () => {
    let marks = upsertMark([], mark());
    marks = upsertMark(marks, mark({ ear: 'left' }));
    marks = upsertMark(marks, mark({ level: 35 }));
    expect(marks).toHaveLength(2);
    expect(marks[0].level).toBe(35);
  });

  it('removes only the matching slot', () => {
    const marks = [mark(), mark({ masked: true, maskLevel: 40 })];
    expect(removeMark(marks, { frequency: 1000, ear: 'right', conduction: 'AC', masked: true })).toEqual([marks[0]]);
  });

  it('groups AC marks by ear and masking, sorted by frequency, ignoring BC', () => {
    const groups = lineGroups([mark({ frequency: 2000 }), mark({ frequency: 500 }), mark({ conduction: 'BC' })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((m) => m.frequency)).toEqual([500, 2000]);
  });
});

describe('csv', () => {
  it('round-trips marks', () => {
    const marks = [mark(), mark({ masked: true, maskLevel: 55, response: false, ear: 'left', conduction: 'BC' })];
    expect(parseCsv(marksToCsv(marks))).toEqual(marks);
  });

  it('accepts legacy files without mask level or response columns', () => {
    expect(parseCsv('Frequency,Stimulus,Ear,Conduction,Masked\n125,0,right,BC,0\n')[0]).toMatchObject({
      frequency: 125, level: 0, conduction: 'BC', response: true,
    });
  });

  it.each(['100,0,right,AC,0', '250,3,right,AC,0', '250,0,up,AC,0', '250,0,right,XX,0', '250,0,right,AC,2'])(
    'rejects %s',
    (row) => expect(() => parseCsv(`h\n${row}\n`)).toThrow(),
  );

  it('omits no-response rows from the encrypted export', () => {
    const csv = marksToCsv([mark(), mark({ frequency: 500, response: false })], { responsesOnly: true });
    expect(csv.trim().split('\n')).toHaveLength(2);
  });
});

describe('crypto', () => {
  it('round-trips text', () => expect(decryptText(encryptText('hello'))).toBe('hello'));

  it.each(['MildBilateralConductiveHearingLoss', 'SevereUnilateralHearingLoss'])('decrypts shipped sample %s', (name) => {
    const marks = parseCsv(decryptText(readFileSync(`public/audiograms/${name}.txt`, 'utf8')));
    expect(marks.length).toBeGreaterThan(10);
  });
});

describe('simulated listener', () => {
  const data: Mark[] = [
    mark({ ear: 'right', level: 10 }), mark({ ear: 'left', level: 10 }),
    mark({ ear: 'right', level: 10, conduction: 'BC' }),
  ];
  const cond = { frequency: 1000, ear: 'right', conduction: 'AC', masked: false, maskerLevel: 40 } as const;

  it('returns the AC threshold for a normal unmasked test', () => {
    expect(patientLevel(data, cond)).toBe(10);
  });

  it('returns null when data is incomplete', () => {
    expect(patientLevel([mark()], cond)).toBeNull();
  });

  it('reports cross hearing with a profound test-ear loss', () => {
    const profound = [
      mark({ ear: 'right', level: 100 }), mark({ ear: 'left', level: 10 }),
      mark({ ear: 'right', level: 10, conduction: 'BC' }), mark({ ear: 'left', level: 10, conduction: 'BC' }),
    ];
    expect(patientLevel(profound, cond)).toBe(50);
  });

  it('responds probabilistically around the threshold', () => {
    expect(respond(40, 10, () => 0.5)).toBe(true);
    expect(respond(-10, 10, () => 0.5)).toBe(false);
    expect(respond(0, null, () => 0.4)).toBe(true);
  });
});

describe('automatic exercise', () => {
  it('descends 10 dB after yes and ascends 5 dB after no', () => {
    let s = startExercise(50);
    s = answer(s, true);
    expect(s.level).toBe(40);
    s = answer(s, false);
    expect(s.level).toBe(45);
  });

  it('finds the threshold after 2 ascending yes answers at one level', () => {
    let s = startExercise(30);
    s = answer(s, true); // descending trial, not counted: 30 -> 20
    s = answer(s, false); // 25
    s = answer(s, false); // 30
    s = answer(s, true); // ascending, 1st at 30 -> 20
    expect(s.threshold).toBeNull();
    s = answer(s, false);
    s = answer(s, false);
    s = answer(s, true);
    expect(s.threshold).toBe(30);
  });
});

describe('within-client response variability', () => {
  const lcg = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const rate = (level: number, threshold: number, n = 20000) => {
    const rnd = lcg(12345);
    let yes = 0;
    for (let i = 0; i < n; i++) if (respond(level, threshold, rnd)) yes++;
    return yes / n;
  };

  it('responds ~50% at threshold, rarely far below, almost always far above', () => {
    expect(rate(40, 40)).toBeCloseTo(0.5, 1);
    expect(rate(30, 40)).toBeLessThan(0.01);
    expect(rate(50, 40)).toBeGreaterThan(0.99);
  });

  it('is monotonic in level', () => {
    const rates = [-4, -2, 0, 2, 4].map((d) => rate(40 + d, 40));
    for (let i = 1; i < rates.length; i++) expect(rates[i]).toBeGreaterThan(rates[i - 1]);
  });

  it('gives automatic-search thresholds that scatter within about +/-10 dB of truth', () => {
    const rnd = lcg(777);
    const truth = 45;
    const found: number[] = [];
    for (let run = 0; run < 500; run++) {
      let s = startExercise(30);
      for (let i = 0; i < 200 && s.threshold === null; i++) s = answer(s, respond(s.level, truth, rnd));
      found.push(s.threshold ?? NaN);
    }
    const mean = found.reduce((a, b) => a + b, 0) / found.length;
    const sd = Math.sqrt(found.reduce((a, b) => a + (b - mean) ** 2, 0) / found.length);
    console.log(`auto-search truth=${truth} mean=${mean.toFixed(2)} sd=${sd.toFixed(2)}`);
    expect(found.every(Number.isFinite)).toBe(true);
    expect(Math.abs(mean - truth)).toBeLessThan(3);
    expect(sd).toBeGreaterThan(0);
    expect(sd).toBeLessThan(5);
  });
});

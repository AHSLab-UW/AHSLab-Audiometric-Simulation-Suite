import type { Mark } from '../types';

const sameSlot = (a: Mark, b: Mark) =>
  a.frequency === b.frequency && a.ear === b.ear && a.conduction === b.conduction && a.masked === b.masked;

/** Adds a mark, replacing any earlier mark for the same frequency/ear/conduction/masking. */
export function upsertMark(marks: Mark[], mark: Mark): Mark[] {
  const normalized = { ...mark, maskLevel: mark.masked ? mark.maskLevel : 0 };
  const index = marks.findIndex((m) => sameSlot(m, normalized));
  if (index < 0) return [...marks, normalized];
  const next = marks.slice();
  next[index] = normalized;
  return next;
}

export function removeMark(marks: Mark[], slot: Omit<Mark, 'level' | 'maskLevel' | 'response'>): Mark[] {
  return marks.filter((m) => !sameSlot(m, slot as Mark));
}

/** Marks that are joined by a line on the audiogram: AC only, same ear and masking state. */
export function lineGroups(marks: Mark[]): Mark[][] {
  const groups = new Map<string, Mark[]>();
  for (const m of marks) {
    if (m.conduction !== 'AC') continue;
    const key = `${m.ear}-${m.masked}`;
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  return [...groups.values()].map((g) => g.sort((a, b) => a.frequency - b.frequency));
}

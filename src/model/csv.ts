import { FREQUENCIES, MAX_LEVEL, MIN_LEVEL } from '../constants';
import type { Conduction, Ear, Mark } from '../types';

const HEADER = 'Frequency,Stimulus,Ear,Conduction,Masked,Mask Level,Response';
const ENCRYPTED_HEADER = 'Frequency,Stimulus,Ear,Conduction,Masked,Mask Level';

export function marksToCsv(marks: Mark[], { responsesOnly = false } = {}): string {
  const rows = marks
    .filter((m) => !responsesOnly || m.response)
    .map((m) => {
      const cells = [m.frequency, m.level, m.ear, m.conduction, m.masked ? 1 : 0, m.masked ? m.maskLevel : 0];
      if (!responsesOnly) cells.push(m.response ? 1 : 0);
      return cells.join(',');
    });
  return [responsesOnly ? ENCRYPTED_HEADER : HEADER, ...rows].join('\n') + '\n';
}

export class CsvFormatError extends Error {}

/** Parses exported CSV text. Throws CsvFormatError when any row is invalid. */
export function parseCsv(text: string): Mark[] {
  const rows = text
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean);
  if (rows.length <= 1) throw new CsvFormatError('No data rows');

  return rows.slice(1).map((row) => {
    const [freq, level, ear, conduction, masked, maskLevel, response] = row.split(',').map((c) => c.trim());
    const frequency = Number.parseInt(freq, 10);
    const lvl = Number.parseInt(level, 10);
    if (!(FREQUENCIES as readonly number[]).includes(frequency)) throw new CsvFormatError(`Bad frequency: ${freq}`);
    if (!(lvl >= MIN_LEVEL && lvl <= MAX_LEVEL) || lvl % 5 !== 0) throw new CsvFormatError(`Bad level: ${level}`);
    if (ear !== 'left' && ear !== 'right') throw new CsvFormatError(`Bad ear: ${ear}`);
    if (conduction !== 'AC' && conduction !== 'BC') throw new CsvFormatError(`Bad conduction: ${conduction}`);
    if (masked !== '0' && masked !== '1') throw new CsvFormatError(`Bad masked flag: ${masked}`);
    if (response !== undefined && response !== '' && response !== '0' && response !== '1') {
      throw new CsvFormatError(`Bad response: ${response}`);
    }
    return {
      frequency,
      level: lvl,
      ear: ear as Ear,
      conduction: conduction as Conduction,
      masked: masked === '1',
      maskLevel: masked === '1' ? Number.parseInt(maskLevel, 10) || 0 : 0,
      response: response !== '0',
    };
  });
}

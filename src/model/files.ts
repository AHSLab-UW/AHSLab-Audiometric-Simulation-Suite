import { toBlob } from 'html-to-image';
import { encryptText } from './crypto';
import { marksToCsv } from './csv';
import type { Mark } from '../types';

export type ExportFormat = 'csv' | 'txt' | 'png' | 'all';

export const DEFAULT_FILENAMES: Record<ExportFormat, string> = {
  csv: 'HearingTestResults',
  txt: 'EncryptedResults',
  png: 'AudiogramResults',
  all: 'ExportedPackage',
};

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportResults(format: ExportFormat, basename: string, marks: Mark[], graph: HTMLElement) {
  const formats = format === 'all' ? (['csv', 'txt', 'png'] as const) : [format];
  for (const f of formats) {
    if (f === 'csv') {
      download(new Blob([marksToCsv(marks)], { type: 'text/csv;charset=utf-8' }), `${basename}.csv`);
    } else if (f === 'txt') {
      const text = encryptText(marksToCsv(marks, { responsesOnly: true }));
      download(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${basename}.txt`);
    } else {
      const blob = await toBlob(graph, { pixelRatio: 2, backgroundColor: '#fff' });
      if (blob) download(blob, `${basename}.png`);
    }
  }
}

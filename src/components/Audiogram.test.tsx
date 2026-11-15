import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { Mark } from '../types';
import { generateCase } from '../model/generator';
import { Audiogram, xFor, yFor } from './Audiogram';
import { CaseHistory, ReviewPanel } from './Review';

const mark = (overrides: Partial<Mark> = {}): Mark => ({
  frequency: 1000, level: 20, ear: 'right', conduction: 'AC',
  masked: false, maskLevel: 0, response: true, ...overrides,
});

const render = (element: ReactElement) =>
  new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');

describe('review audiogram', () => {
  it('includes self-contained grid and masking-table styles for image export', () => {
    const doc = render(<Audiogram marks={[mark({ masked: true, maskLevel: 55 })]} />);
    const svg = doc.querySelector('svg')!;
    const gridLines = [...svg.querySelectorAll('line')].filter((line) => !line.hasAttribute('data-series'));
    expect(gridLines.length).toBeGreaterThan(20);
    expect(gridLines.every((line) => line.getAttribute('stroke') && line.getAttribute('stroke-width'))).toBe(true);
    expect(gridLines.some((line) => line.getAttribute('stroke-dasharray') === '3 3')).toBe(true);
    const rows = [...svg.querySelectorAll('rect')].filter((rect) => rect.getAttribute('fill') === '#f6f8fb');
    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row.getAttribute('stroke') === '#d3d9e2')).toBe(true);
    const value = [...svg.querySelectorAll('text')].find((text) => text.textContent === '55');
    expect(value?.getAttribute('fill')).toBe('#1c2430');
    expect(value?.getAttribute('font-size')).toBe('12');
  });

  it('draws continuous truth lines and standard expected symbols without expected lines', () => {
    const truth = [
      mark({ frequency: 500 }), mark({ frequency: 1000, level: 30 }),
      mark({ frequency: 500, conduction: 'BC', level: 10 }),
      mark({ frequency: 1000, conduction: 'BC', level: 15 }),
    ];
    const expected = [
      mark(), mark({ masked: true, level: 25, maskLevel: 50 }),
      mark({ ear: 'left' }), mark({ ear: 'left', masked: true, level: 25, maskLevel: 50 }),
      mark({ conduction: 'BC', level: 10 }), mark({ conduction: 'BC', masked: true, level: 15 }),
      mark({ ear: 'left', conduction: 'BC', level: 10 }),
      mark({ ear: 'left', conduction: 'BC', masked: true, level: 120, response: false }),
    ];
    const doc = render(<Audiogram marks={truth} showSymbols={false} connectBone referenceSymbols={expected} />);
    const lines = doc.querySelectorAll('[data-series="threshold-line"]');
    const symbols = doc.querySelectorAll('[data-series="expected-symbol"]');

    expect(lines).toHaveLength(2);
    expect(lines[0].getAttribute('x1')).toBe(String(xFor(500)));
    expect(lines[0].getAttribute('y1')).toBe(String(yFor(20)));
    expect(lines[0].getAttribute('x2')).toBe(String(xFor(1000)));
    expect(lines[0].getAttribute('y2')).toBe(String(yFor(30)));
    expect(lines[1].getAttribute('stroke-dasharray')).toBe('8 5');
    expect(symbols).toHaveLength(8);
    expect(symbols[0].querySelector('circle')).not.toBeNull();
    expect(symbols[1].querySelector('path')?.getAttribute('d')).toBe('M0 -8 L8 7 L-8 7 Z');
    expect(symbols[2].querySelector('path')?.getAttribute('d')).toBe('M-7 -7 L7 7 M7 -7 L-7 7');
    expect(symbols[3].querySelector('rect')).not.toBeNull();
    expect(symbols[4].querySelector('path')?.getAttribute('d')).toBe('M7 -8 L-7 0 L7 8');
    expect(symbols[5].querySelector('path')?.getAttribute('d')).toBe('M4 -9 H-4 V9 H4');
    expect(symbols[6].querySelector('path')?.getAttribute('d')).toBe('M-7 -8 L7 0 L-7 8');
    expect(symbols[7].querySelector('path')?.getAttribute('d')).toBe('M-4 -9 H4 V9 H-4');
    expect(symbols[7].querySelectorAll('path')).toHaveLength(2);
    expect(symbols[7].querySelector('title')?.textContent).toContain('no response at 120 dB HL');
    expect(doc.querySelectorAll('[data-series="expected-symbol"] line')).toHaveLength(0);
  });

  it('keeps connecting lines and symbols on the student audiogram', () => {
    const doc = render(<Audiogram marks={[mark({ frequency: 500 }), mark()]} />);
    expect(doc.querySelectorAll('[data-series="threshold-line"]')).toHaveLength(1);
    expect(doc.querySelectorAll('circle')).toHaveLength(2);
  });

  it('displays expected symbols on the post-practice comparison', () => {
    const patientCase = generateCase('normal', 'review');
    const doc = render(<ReviewPanel
      review={{ truth: patientCase.marks, student: [], patientCase }}
      onClose={() => {}}
      onNext={() => {}}
    />);
    const comparison = doc.querySelector('svg[aria-label="Ground-truth threshold lines and expected audiometric symbols"]');
    expect(comparison?.querySelectorAll('[data-series="expected-symbol"]').length).toBeGreaterThan(0);
    expect(doc.body.textContent).toContain('Ground truth and expected results');
    expect(doc.body.textContent).toContain('masking dilemma');
  });

  it('reveals scenario titles and case codes only in the post-practice review', () => {
    const patientCase = generateCase('masking-dilemma', 's0');
    const history = render(<CaseHistory patientCase={patientCase} />);
    const review = render(<ReviewPanel
      review={{ truth: patientCase.marks, student: [], patientCase }}
      onClose={() => {}}
      onNext={() => {}}
    />);

    expect(history.body.textContent).not.toContain(patientCase.title);
    expect(history.body.textContent).not.toContain(patientCase.code);
    expect(history.body.textContent).not.toMatch(/tympanosclerosis|masking dilemma|conductive loss/i);
    expect(review.body.textContent).toContain(patientCase.title);
    expect(review.body.textContent).toContain(patientCase.code);
  });
});

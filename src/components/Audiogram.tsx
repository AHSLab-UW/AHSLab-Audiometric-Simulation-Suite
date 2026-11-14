import { forwardRef } from 'react';
import { FREQUENCIES, MAX_LEVEL, MIN_LEVEL } from '../constants';
import type { Conduction, Ear, Mark } from '../types';

const W = 700;
const PLOT = { left: 90, right: 630, top: 50, bottom: 570 };
const MASK_TOP = PLOT.bottom + 55;
const MASK_ROW = 22;
const H = MASK_TOP + MASK_ROW * 4 + 20;
const COLORS: Record<Ear, string> = { right: '#c1272d', left: '#1f3fd6' };
const MAJOR_FREQUENCIES = [125, 250, 500, 1000, 2000, 4000, 8000];

const OCTAVES = Math.log2(FREQUENCIES[FREQUENCIES.length - 1] / FREQUENCIES[0]);
export const xFor = (frequency: number) =>
  PLOT.left + (Math.log2(frequency / FREQUENCIES[0]) / OCTAVES) * (PLOT.right - PLOT.left);
export const yFor = (level: number) =>
  PLOT.top + ((level - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL)) * (PLOT.bottom - PLOT.top);

const formatFrequency = (f: number) => (f >= 1000 ? `${f / 1000}k` : String(f));
const SIDE_OFFSET = 9;

/** Draws one audiometric symbol centred on (0, 0). Right-ear symbols are red, left-ear blue. */
function Symbol({ mark }: { mark: Mark }) {
  const { ear, conduction, masked } = mark;
  const color = COLORS[ear];
  const common = { stroke: color, strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  const dir = ear === 'right' ? -1 : 1;
  let shape;
  if (conduction === 'AC') {
    if (ear === 'right') shape = masked ? <path d="M0 -8 L8 7 L-8 7 Z" {...common} /> : <circle r="7.5" {...common} />;
    else shape = masked ? <rect x="-7" y="-7" width="14" height="14" {...common} /> : <path d="M-7 -7 L7 7 M7 -7 L-7 7" {...common} />;
  } else if (masked) {
    // Brackets open towards the test ear: [ for right, ] for left.
    shape = <path d={`M${-dir * 4} -9 H${dir * 4} V9 H${-dir * 4}`} {...common} />;
  } else {
    shape = <path d={`M${-dir * 7} -8 L${dir * 7} 0 L${-dir * 7} 8`} {...common} />;
  }
  const arrow = !mark.response && (
    <g {...common} transform={`translate(${dir * 10} ${10})`}>
      <path d={`M0 0 L${dir * 11} 11 M${dir * 11} 11 H${dir * 11 - dir * 6} M${dir * 11} 11 V5`} />
    </g>
  );
  return (
    <g>
      {shape}
      {arrow}
    </g>
  );
}

const sideShift = (conduction: Conduction, ear: Ear) =>
  conduction === 'BC' ? (ear === 'right' ? -SIDE_OFFSET : SIDE_OFFSET) : 0;

const maskRows: { conduction: Conduction; ear: Ear }[] = [
  { conduction: 'AC', ear: 'left' },
  { conduction: 'AC', ear: 'right' },
  { conduction: 'BC', ear: 'left' },
  { conduction: 'BC', ear: 'right' },
];

interface Props {
  marks: Mark[];
  cursor?: { frequency: number; level: number; ear: Ear } | null;
  showSymbols?: boolean;
  connectBone?: boolean;
  referenceSymbols?: Mark[];
}

export const Audiogram = forwardRef<SVGSVGElement, Props>(function Audiogram(
  { marks, cursor, showSymbols = true, connectBone = false, referenceSymbols = [] },
  ref,
) {
  const levels = Array.from({ length: (MAX_LEVEL - MIN_LEVEL) / 10 + 1 }, (_, i) => MIN_LEVEL + i * 10);
  const drawLines = (lineMarks: Mark[], includeBone: boolean) => {
    const groups = new Map<string, Mark[]>();
    for (const mark of lineMarks) {
      if (mark.conduction === 'BC' && !includeBone) continue;
      const key = `${mark.ear}-${mark.conduction}-${mark.masked}`;
      groups.set(key, [...(groups.get(key) ?? []), mark]);
    }

    return [...groups.values()].flatMap((group) =>
      group.sort((a, b) => a.frequency - b.frequency).slice(1).flatMap((mark, i) => {
        const from = group[i];
        if (!mark.response || !from.response) return [];
        const [x1, y1, x2, y2] = [
          xFor(from.frequency) + sideShift(from.conduction, from.ear), yFor(from.level),
          xFor(mark.frequency) + sideShift(mark.conduction, mark.ear), yFor(mark.level),
        ];
        const length = Math.hypot(x2 - x1, y2 - y1);
        const gap = showSymbols && length > 0 ? Math.min(12, length / 3) / length : 0;
        return (
          <line
            key={`${mark.ear}-${mark.conduction}-${mark.masked}-${mark.frequency}`}
            data-series="threshold-line"
            data-conduction={mark.conduction}
            x1={x1 + (x2 - x1) * gap} y1={y1 + (y2 - y1) * gap}
            x2={x2 - (x2 - x1) * gap} y2={y2 - (y2 - y1) * gap}
            stroke={COLORS[mark.ear]} strokeWidth="2.5"
            strokeDasharray={!showSymbols && mark.conduction === 'BC' ? '8 5' : undefined}
            strokeLinecap="round" opacity="0.9"
          />
        );
      }),
    );
  };

  return (
    <svg
      ref={ref}
      className="audiogram"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={showSymbols
        ? `Audiogram with ${marks.length} recorded threshold${marks.length === 1 ? '' : 's'}`
        : 'Ground-truth threshold lines and expected audiometric symbols'}
    >
      <rect width={W} height={H} fill="#fff" />
      <text x={W / 2} y="18" textAnchor="middle" className="axis-title">Frequency (Hz)</text>
      <text transform={`translate(18 ${(PLOT.top + PLOT.bottom) / 2}) rotate(-90)`} textAnchor="middle" className="axis-title">
        Hearing level (dB HL)
      </text>

      {levels.map((level) => (
        <g key={level}>
          <line x1={PLOT.left - 25} x2={PLOT.right + 25} y1={yFor(level)} y2={yFor(level)} className={level === 0 ? 'grid zero' : 'grid'} />
          <text x={PLOT.left - 32} y={yFor(level) + 4} textAnchor="end" className="tick">{level}</text>
        </g>
      ))}
      {FREQUENCIES.map((f) => (
        <g key={f}>
          <line x1={xFor(f)} x2={xFor(f)} y1={PLOT.top} y2={PLOT.bottom} className={MAJOR_FREQUENCIES.includes(f) ? 'grid major' : 'grid minor'} />
          <text x={xFor(f)} y={PLOT.top - 10} textAnchor="middle" className={MAJOR_FREQUENCIES.includes(f) ? 'tick' : 'tick minor-tick'}>
            {formatFrequency(f)}
          </text>
        </g>
      ))}

      {drawLines(marks, connectBone)}

      {showSymbols && marks.map((m) => (
        <g
          key={`${m.frequency}-${m.ear}-${m.conduction}-${m.masked}`}
          transform={`translate(${xFor(m.frequency) + sideShift(m.conduction, m.ear)} ${yFor(m.level)})`}
        >
          <title>{`${m.ear} ${m.conduction}${m.masked ? ' masked' : ''} ${m.frequency} Hz: ${m.level} dB HL${m.response ? '' : ' (no response)'}`}</title>
          <Symbol mark={m} />
        </g>
      ))}
      {referenceSymbols.map((mark) => (
          <g
            key={`expected-${mark.frequency}-${mark.ear}-${mark.conduction}-${mark.masked}`}
            data-series="expected-symbol"
            transform={`translate(${xFor(mark.frequency) + sideShift(mark.conduction, mark.ear)} ${yFor(mark.level)})`}
          >
            <title>{`Expected ${mark.ear} ${mark.conduction} ${mark.masked ? 'masked' : 'unmasked'} ${mark.frequency} Hz: ${mark.response ? `${mark.level} dB HL` : `no response at ${mark.level} dB HL`}`}</title>
            <Symbol mark={mark} />
          </g>
      ))}

      {cursor && (
        <g transform={`translate(${xFor(cursor.frequency)} ${yFor(cursor.level)})`} className="cursor" pointerEvents="none">
          <circle r="13" fill="none" stroke="#111" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M-18 0 H-13 M13 0 H18 M0 -18 V-13 M0 13 V18" stroke="#111" strokeWidth="1.5" />
        </g>
      )}

      <text x={PLOT.left - 70} y={MASK_TOP - 8} className="axis-title" textAnchor="start">Masking level (dB HL)</text>
      {maskRows.map((row, i) => {
        const y = MASK_TOP + i * MASK_ROW;
        return (
          <g key={`${row.conduction}${row.ear}`}>
            <rect x={PLOT.left - 25} y={y} width={PLOT.right - PLOT.left + 50} height={MASK_ROW} className="mask-row" />
            <text x={PLOT.left - 30} y={y + 15} textAnchor="end" className="tick" fill={COLORS[row.ear]}>
              {row.conduction} {row.ear === 'left' ? 'L' : 'R'}
            </text>
            {(showSymbols ? marks : referenceSymbols)
              .filter((m) => m.masked && m.response && m.conduction === row.conduction && m.ear === row.ear)
              .map((m) => (
                <text key={m.frequency} x={xFor(m.frequency)} y={y + 15} textAnchor="middle" className="tick">
                  {m.maskLevel}
                </text>
              ))}
          </g>
        );
      })}
    </svg>
  );
});

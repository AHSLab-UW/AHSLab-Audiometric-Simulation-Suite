import type { Ref } from 'react';
import type { GeneratedCase } from '../model/generator';
import { recommendSequence, reviewNotes } from '../model/protocol';
import { expectedMarks, expectedThresholds } from '../model/expected';
import type { Review } from '../useAudiometer';
import type { Mark } from '../types';
import { Audiogram } from './Audiogram';
import { MAX_LEVEL } from '../constants';

export function CaseHistory({ patientCase, showScenario = false }: { patientCase: GeneratedCase; showScenario?: boolean }) {
  return (
    <section className="card case-history" aria-label="Case history">
      <h3>Case history</h3>
      {showScenario && <p><strong>{patientCase.title}</strong></p>}
      <p>{patientCase.history}</p>
      {showScenario && <p className="muted">Case code: {patientCase.code}. This is the original case history; plotted thresholds can be edited.</p>}
    </section>
  );
}

/** Only the thresholds a clinician would normally measure. */
const clinical = (marks: Mark[]) =>
  marks.filter((m) => (m.conduction === 'AC' ? m.frequency >= 250 && m.frequency <= 8000 : m.frequency >= 250 && m.frequency <= 4000));

interface Props {
  review: Review;
  onClose: () => void;
  onNext: () => void;
  studentGraphRef?: Ref<HTMLDivElement>;
}

export function ReviewPanel({ review, onClose, onNext, studentGraphRef }: Props) {
  const { truth, student, patientCase } = review;
  const rec = recommendSequence(truth, patientCase?.selfReportedBetterEar ?? null);
  const notes = reviewNotes(truth, student, rec);
  const expected = expectedThresholds(truth, rec);
  const expectedUnmasked = expectedMarks(expected, 'unmasked');
  const expectedMasked = expectedMarks(expected, 'masked');
  const canRepeat = patientCase !== null;

  return (
    <section className="card review" aria-label="Test review">
      <h3>Test review{patientCase ? `: ${patientCase.title}` : ''}</h3>
      {patientCase && <p>{patientCase.history} <span className="muted">(Case code: {patientCase.code})</span></p>}
      <div className="review-graphs">
        <figure>
          <figcaption>Your audiogram</figcaption>
          <div className="card graph-card" ref={studentGraphRef}>
            <Audiogram marks={student} />
          </div>
        </figure>
        <figure>
          <figcaption>Ground truth and expected results</figcaption>
          <Audiogram
            marks={clinical(truth)}
            showSymbols={false}
            connectBone
            referenceSymbols={[...expectedUnmasked, ...expectedMasked]}
          />
        </figure>
      </div>
      <div className="comparison-legend" aria-label="True audiogram legend">
        <span><i className="legend-line" />Ground truth AC</span>
        <span><i className="legend-line dashed" />Ground truth BC</span>
        <span><i className="legend-ear right" />Right ear</span>
        <span><i className="legend-ear left" />Left ear</span>
        <span>↘ No response at the plotted level; expected no-response marks are capped at {MAX_LEVEL} dB HL</span>
      </div>
      <p className="muted">
        Expected results use standard symbols without connecting lines: AC unmasked ○ / ✕, masked △ / □;
        BC unmasked &lt; / &gt;, masked [ / ] (right / left). Symbols may overlap at the same threshold.
        Masked estimates use the listed masker level; a masking dilemma has no reliable masked estimate.
      </p>
      <h4>Ground truth and expected thresholds</h4>
      <div className="table-scroll">
        <table className="threshold-table">
          <thead>
            <tr>
              <th scope="col">Ear</th>
              <th scope="col">Test</th>
              <th scope="col">Frequency</th>
              <th scope="col">Ground truth</th>
              <th scope="col">Expected unmasked</th>
              <th scope="col">Expected masked</th>
              <th scope="col">Masking</th>
            </tr>
          </thead>
          <tbody>
            {expected.map((row) => {
              const showLevel = (level: number | null) =>
                level === null ? '—' : level > MAX_LEVEL ? `NR at ${MAX_LEVEL} dB HL` : `${level} dB HL`;
              const masking = row.dilemma
                ? 'Masking dilemma'
                : row.maskingRequired
                  ? `Required (${row.maskerLevel} dB masker)`
                  : `Not indicated${row.maskerLevel === null ? '' : ` (${row.maskerLevel} dB illustrative masker)`}`;
              return (
                <tr key={`${row.ear}-${row.conduction}-${row.frequency}`}>
                  <td>{row.ear === 'right' ? 'Right' : 'Left'}</td>
                  <td>{row.conduction}</td>
                  <td>{row.frequency} Hz</td>
                  <td>{showLevel(row.truth)}</td>
                  <td>{showLevel(row.unmasked)}</td>
                  <td>{row.dilemma ? 'Unavailable' : showLevel(row.masked)}</td>
                  <td>{masking}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h4>Recommended test sequence</h4>
      <p className="muted">
        This post-test example uses the ground truth; masking order and masker levels are simulator teaching
        conventions, not a substitute for clinical judgment. Frequency and BC masking guidance:
        {' '}<a href="https://www.asha.org/policy/gl2005-00014/" target="_blank" rel="noreferrer">ASHA (2005)</a>.
      </p>
      <ol>
        {rec.steps.map((s) => <li key={s.title}><strong>{s.title}.</strong> {s.detail}</li>)}
      </ol>
      <h4>Notes on your results</h4>
      <ul>{notes.map((n) => <li key={n}>{n}</li>)}</ul>
      <p className="muted">This review is for learning only and is not graded.</p>
      <div className="row">
        {canRepeat && <button type="button" className="btn primary" onClick={onNext}>Next patient</button>}
        <button type="button" className="btn" onClick={onClose}>Close review</button>
      </div>
    </section>
  );
}

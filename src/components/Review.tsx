import type { GeneratedCase } from '../model/generator';
import { recommendSequence, reviewNotes } from '../model/protocol';
import type { Review } from '../useAudiometer';
import type { Mark } from '../types';
import { Audiogram } from './Audiogram';

export function CaseHistory({ patientCase }: { patientCase: GeneratedCase }) {
  return (
    <section className="card case-history" aria-label="Case history">
      <h3>Case history</h3>
      <p>{patientCase.history}</p>
      <p className="muted">Case code: {patientCase.code}</p>
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
}

export function ReviewPanel({ review, onClose, onNext }: Props) {
  const { truth, student, patientCase } = review;
  const rec = recommendSequence(truth, patientCase?.selfReportedBetterEar ?? null);
  const notes = reviewNotes(truth, student, rec);
  const canRepeat = patientCase !== null;

  return (
    <section className="card review" aria-label="Test review">
      <h3>Test review{patientCase ? `: ${patientCase.title}` : ''}</h3>
      {patientCase && <p>{patientCase.history} <span className="muted">(Case code: {patientCase.code})</span></p>}
      <div className="review-graphs">
        <figure>
          <figcaption>Your audiogram</figcaption>
          <Audiogram marks={student} />
        </figure>
        <figure>
          <figcaption>True audiogram</figcaption>
          <Audiogram marks={clinical(truth)} />
        </figure>
      </div>
      <h4>Recommended test sequence</h4>
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

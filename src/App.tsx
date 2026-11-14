import { useRef, useState } from 'react';
import { isAudioSupported } from './audio/player';
import { Audiogram } from './components/Audiogram';
import { AutoExercise } from './components/AutoExercise';
import { ControlPanel } from './components/ControlPanel';
import { CaseHistory, ReviewPanel } from './components/Review';
import { CalibrationDialog, ExportDialog, ImportDialog, PatientDialog } from './components/Dialogs';
import { generateCase } from './model/generator';
import { useAudiometer } from './useAudiometer';

type DialogName = 'calibration' | 'import' | 'export' | 'patient-auto' | 'patient-manual';

export function App() {
  const a = useAudiometer();
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const { settings, mode } = a;

  const nextPatient = () => {
    if (!a.review?.patientCase) return;
    const next = generateCase(a.review.patientCase.selection);
    a.setMarks([]);
    a.startManual(next.marks, next);
  };

  const openDialog = (name: DialogName) => {
    a.setDialogOpen(true);
    setDialog(name);
  };
  const closeDialog = () => {
    a.setDialogOpen(false);
    setDialog(null);
  };

  return (
    <>
      <header className="header">
        <div className="eyebrow">
          <img className="logo" src="/images/logo.png" alt="UW AHSLab logo" />
          <div>
            <h6>University of Washington</h6>
            <h1>AHSLAB <strong>Audiometric Simulation Suite</strong></h1>
          </div>
        </div>
        <hr />
      </header>

      <main className="layout">
        {!isAudioSupported() && (
          <p role="alert" className="notice">
            Your browser does not support the Web Audio API. Use a current version of Chrome, Safari, Firefox or Edge to hear tones.
          </p>
        )}
        {a.notice && (
          <p role="status" className="notice">
            {a.notice}
            <button type="button" className="link" onClick={() => a.setNotice(null)}>Dismiss</button>
          </p>
        )}

        <ControlPanel a={a} openDialog={openDialog} />

        <div className="graph-column">
          {mode === 'auto' && (
            <AutoExercise
              settings={settings}
              onThreshold={(level) => {
                a.recordMark(settings, level, true);
                a.update({ level });
                a.end();
              }}
              onDone={a.end}
            />
          )}
          {mode === 'manual' && a.patientCase && <CaseHistory patientCase={a.patientCase} />}
          {mode === 'idle' && a.review && <ReviewPanel review={a.review} onClose={a.closeReview} onNext={nextPatient} />}
          <div ref={graphRef} className="card graph-card">
            <Audiogram
              marks={a.marks}
              cursor={mode === 'manual' || mode === 'draw' ? settings : null}
            />
          </div>
          {a.marks.length > 0 && (
            <details className="card results">
              <summary>Recorded results ({a.marks.length})</summary>
              <table>
                <thead>
                  <tr><th>Frequency</th><th>Level</th><th>Ear</th><th>Type</th><th>Masker</th><th>Response</th></tr>
                </thead>
                <tbody>
                  {[...a.marks].sort((x, y) => x.frequency - y.frequency).map((m) => (
                    <tr key={`${m.frequency}${m.ear}${m.conduction}${m.masked}`}>
                      <td>{m.frequency} Hz</td><td>{m.level} dB HL</td><td>{m.ear}</td><td>{m.conduction}</td>
                      <td>{m.masked ? `${m.maskLevel} dB HL` : '—'}</td><td>{m.response ? 'Yes' : 'No response'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </div>
      </main>

      <footer className="footer">Branding and design follow the AHSLab Hearing Screener (MIT) · <a href="https://github.com/shenyi-uw/Hearing-Test-Simulator-2/blob/main/REFERENCES.md">References</a></footer>

      {dialog === 'calibration' && <CalibrationDialog onClose={closeDialog} />}
      {dialog === 'import' && <ImportDialog onClose={closeDialog} onImport={a.setMarks} />}
      {dialog === 'export' && <ExportDialog onClose={closeDialog} marks={a.marks} getGraph={() => graphRef.current} />}
      {dialog === 'patient-auto' && <PatientDialog onClose={closeDialog} onLoad={a.plotSimulatedThreshold} />}
      {dialog === 'patient-manual' && <PatientDialog onClose={closeDialog} onLoad={(p) => a.startManual(p)} onGenerate={(c) => { a.setMarks([]); a.startManual(c.marks, c); }} />}
    </>
  );
}

import type { ReactNode } from 'react';
import { FREQUENCIES, MAX_LEVEL, MIN_LEVEL } from '../constants';
import type { Audiometer } from '../useAudiometer';

function Toggle<T extends string | boolean>({
  label, value, options, onChange, disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className="segmented">
      {options.map((o) => (
        <button
          key={String(o.value)} type="button" aria-pressed={value === o.value} disabled={disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stepper({ label, value, unit, onStep, disabled, atMin, atMax }: {
  label: string; value: number; unit: string; onStep: (d: 1 | -1) => void; disabled?: boolean; atMin: boolean; atMax: boolean;
}) {
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <button type="button" aria-label={`Decrease ${label}`} disabled={disabled || atMin} onClick={() => onStep(-1)}>−</button>
      <output aria-label={label}>{value} {unit}</output>
      <button type="button" aria-label={`Increase ${label}`} disabled={disabled || atMax} onClick={() => onStep(1)}>+</button>
    </div>
  );
}

const Hotkey = ({ keys, children, onClick }: { keys: string; children: ReactNode; onClick?: () => void }) => (
  <li>
    {onClick ? <button type="button" className="link" onClick={onClick}>{children}</button> : <span>{children}</span>}
    <kbd>{keys}</kbd>
  </li>
);

interface Props {
  a: Audiometer;
  openDialog: (d: 'calibration' | 'import' | 'export' | 'patient-auto' | 'patient-manual') => void;
}

export function ControlPanel({ a, openDialog }: Props) {
  const { settings: s, mode } = a;
  const idle = mode === 'idle';
  const auto = mode === 'auto';
  const freqIndex = FREQUENCIES.indexOf(s.frequency as (typeof FREQUENCIES)[number]);

  return (
    <aside className="card control-panel" aria-label="Controls">
      <Toggle label="Conduction" value={s.conduction} disabled={auto} onChange={(conduction) => a.update({ conduction })}
        options={[{ value: 'AC', label: 'AC' }, { value: 'BC', label: 'BC' }]} />
      <Toggle label="Test ear" value={s.ear} disabled={auto} onChange={(ear) => a.update({ ear })}
        options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} />
      <Toggle label="Masking" value={s.masked} disabled={auto} onChange={(masked) => a.update({ masked })}
        options={[{ value: true, label: 'Masked' }, { value: false, label: 'Unmasked' }]} />
      {mode === 'draw' && (
        <Toggle label="Response" value={s.response} onChange={(response) => a.update({ response })}
          options={[{ value: true, label: 'Response' }, { value: false, label: 'No response' }]} />
      )}

      <hr />
      <Stepper label="Frequency" value={s.frequency} unit="Hz" disabled={auto} atMin={freqIndex === 0} atMax={freqIndex === FREQUENCIES.length - 1}
        onStep={a.stepFrequency} />
      <Stepper label="Signal level" value={s.level} unit="dB HL" disabled={auto} atMin={s.level <= MIN_LEVEL} atMax={s.level >= MAX_LEVEL}
        onStep={a.stepLevel} />
      <Stepper label="Masker level" value={s.maskerLevel} unit="dB HL" disabled={auto} atMin={s.maskerLevel <= MIN_LEVEL}
        atMax={s.maskerLevel >= MAX_LEVEL} onStep={a.stepMasker} />
      <hr />

      {idle && (
        <div className="stack">
          <div className="menu" role="group" aria-label="Test hearing">
            <span className="menu-label success">Test hearing</span>
            <button type="button" className="btn" onClick={a.startAuto}>Automatic</button>
            <button type="button" className="btn" onClick={() => a.startManual()}>Manual</button>
          </div>
          <div className="menu" role="group" aria-label="Practice audiometry">
            <span className="menu-label primary">Practice audiometry</span>
            <button type="button" className="btn" onClick={() => openDialog('patient-auto')}>Automatic</button>
            <button type="button" className="btn" onClick={() => openDialog('patient-manual')}>Manual</button>
          </div>
          <button type="button" className="btn info" onClick={a.startDraw}>Draw audiogram</button>
          <button type="button" className="btn warn small" onClick={() => openDialog('calibration')}>Calibration</button>
          <div className="row">
            <button type="button" className="btn small" onClick={() => openDialog('import')}>Import</button>
            <button type="button" className="btn small" onClick={() => openDialog('export')}>Export</button>
            <button type="button" className="btn danger small" onClick={a.clear}>Clear</button>
          </div>
        </div>
      )}

      {(mode === 'manual' || mode === 'draw') && (
        <div className="stack">
          <p className="badge">{mode === 'draw' ? 'Draw audiogram' : a.patient ? 'Simulated listener' : 'Manual test'}</p>
          <ul className="hotkeys">
            {mode === 'manual' && <Hotkey keys="Space" onClick={a.presentTone}>Present tone</Hotkey>}
            <Hotkey keys="← →">Frequency</Hotkey>
            <Hotkey keys="↑ ↓">Level (5 dB)</Hotkey>
            {mode === 'draw' && (
              <>
                <Hotkey keys="C" onClick={() => a.update({ conduction: s.conduction === 'AC' ? 'BC' : 'AC' })}>Cycle AC/BC</Hotkey>
                <Hotkey keys="M" onClick={() => a.update({ masked: !s.masked })}>Cycle masking</Hotkey>
                <Hotkey keys="E" onClick={() => a.update({ ear: s.ear === 'left' ? 'right' : 'left' })}>Cycle ear</Hotkey>
                <Hotkey keys="R" onClick={() => a.update({ response: !s.response })}>Cycle response</Hotkey>
              </>
            )}
            <Hotkey keys="Enter" onClick={a.record}>Record</Hotkey>
            <Hotkey keys="Backspace" onClick={a.deleteCurrent}>Delete mark</Hotkey>
            <Hotkey keys="D" onClick={a.end}>Done</Hotkey>
          </ul>
          <div role="status" aria-live="polite" className="tone-status">
            {a.tone.playing && (a.patient ? (a.tone.heard ? <span className="yes">Yes</span> : <span className="no">No</span>) : '🔊 Tone playing')}
          </div>
        </div>
      )}
    </aside>
  );
}

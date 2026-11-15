import { useEffect, useRef, useState } from 'react';
import { startCalibrationTone } from '../audio/player';
import { MESSAGES } from '../constants';
import { decryptText } from '../model/crypto';
import { CsvFormatError, parseCsv } from '../model/csv';
import { DEFAULT_FILENAMES, exportResults, type ExportFormat } from '../model/files';
import type { Mark } from '../types';
import { generateCase, generateFromCode, newSeed, SCENARIOS, type GeneratedCase, type Selection } from '../model/generator';
import { generateSamplePatient, SAMPLE_PATIENTS } from '../model/samplePatients';
import { Dialog } from './Dialog';

interface BaseProps {
  onClose: () => void;
}

export function CalibrationDialog({ onClose }: BaseProps) {
  const stop = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  const halt = () => {
    stop.current?.();
    stop.current = null;
    setPlaying(false);
  };
  useEffect(() => () => stop.current?.(), []);

  return (
    <Dialog title="Calibration" onClose={() => { halt(); onClose(); }}>
      <p>
        Press Start to present a continuous calibration tone, then adjust your computer's volume until the tone
        reaches 60 dB SPL. Without a sound level meter, set the volume to a comfortable level.
      </p>
      <div className="row">
        <button type="button" className="btn primary" disabled={playing} onClick={() => { stop.current = startCalibrationTone(); setPlaying(true); }}>
          Start
        </button>
        <button type="button" className="btn" disabled={!playing} onClick={halt}>Stop</button>
        {playing && <span role="status">🔊 Tone playing</span>}
      </div>
    </Dialog>
  );
}

const readFile = (file: File) => file.text();

interface ImportProps extends BaseProps {
  onImport: (marks: Mark[]) => void;
}

export function ImportDialog({ onClose, onImport }: ImportProps) {
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function submit() {
    const file = input.current?.files?.[0];
    if (!file) return setError('Choose a CSV file first.');
    try {
      onImport(parseCsv(await readFile(file)));
      onClose();
    } catch (e) {
      setError(e instanceof CsvFormatError ? MESSAGES.BAD_FILE : 'The file could not be read.');
    }
  }

  return (
    <Dialog title="Import audiogram" onClose={onClose} actions={<button type="button" className="btn primary" onClick={submit}>Import</button>}>
      <label htmlFor="csv-file">Choose a CSV file exported from this app to display its data:</label>
      <input id="csv-file" ref={input} type="file" accept=".csv" />
      {error && <p role="alert" className="error">{error}</p>}
    </Dialog>
  );
}

interface PatientProps extends BaseProps {
  onLoad: (patient: Mark[]) => void;
  onGenerate: (generated: GeneratedCase) => void;
}

const SELECTIONS: { value: Selection; label: string }[] = [
  { value: 'common', label: 'Common cases' },
  { value: 'tricky', label: 'Challenging cases' },
  { value: 'any', label: 'Random mix' },
];

export function DrawCaseDialog({ onClose, onGenerate, hasMarks }: BaseProps & {
  onGenerate: (generated: GeneratedCase) => void;
  hasMarks: boolean;
}) {
  const [selection, setSelection] = useState<Selection>('any');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = () => {
    const generated = code.trim() ? generateFromCode(code) : generateCase(selection, newSeed());
    if (!generated) return setError('That case code is not valid. Codes look like "tricky/k3x9ab".');
    onGenerate(generated);
    onClose();
  };

  return (
    <Dialog title="Generate an audiogram" onClose={onClose}>
      <label htmlFor="draw-scenario">Scenario</label>
      <select id="draw-scenario" value={selection} onChange={(e) => setSelection(e.target.value as Selection)}>
        {SELECTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        {SCENARIOS.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.title}</option>)}
      </select>
      <label htmlFor="draw-case-code">Case code (optional; overrides scenario)</label>
      <input id="draw-case-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="tricky/k3x9ab" />
      {hasMarks && <p>Generating a case replaces the current audiogram. Export it first if you want to keep it.</p>}
      {error && <p role="alert" className="error">{error}</p>}
      <button type="button" className="btn primary" onClick={generate}>Generate and plot</button>
    </Dialog>
  );
}

export function PatientDialog({ onClose, onLoad, onGenerate }: PatientProps) {
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>('common');
  const [code, setCode] = useState('');
  const [sample, setSample] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  async function load(getText: () => Promise<string>) {
    try {
      onLoad(parseCsv(decryptText(await getText())));
      onClose();
    } catch {
      setError(MESSAGES.BAD_FILE);
    }
  }

  const loadUpload = () => {
    const file = input.current?.files?.[0];
    return file ? load(() => readFile(file)) : setError('Choose a .txt file first.');
  };
  const loadSample = () => {
    onGenerate(generateSamplePatient(sample));
    onClose();
  };

  const generate = () => {
    const generated = code.trim() ? generateFromCode(code) : generateCase(selection, newSeed());
    if (!generated) return setError('That case code is not valid. Codes look like "tricky/k3x9ab".');
    onGenerate(generated);
    onClose();
  };

  return (
    <Dialog title="Choose a simulated patient" onClose={onClose}>
      <fieldset>
        <legend>Generate a new patient</legend>
        <div className="row">
          <select value={selection} onChange={(e) => setSelection(e.target.value as Selection)} aria-label="Case type">
            {SELECTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="button" className="btn primary" onClick={generate}>Generate</button>
        </div>
        <label htmlFor="case-code">Or enter a case code to repeat a patient (optional)</label>
        <input id="case-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="tricky/k3x9ab" />
      </fieldset>
      <fieldset>
        <legend>Sample patient</legend>
        <div className="row">
          <select value={sample} onChange={(e) => setSample(Number(e.target.value))} aria-label="Sample patient">
            {SAMPLE_PATIENTS.map((p, index) => <option key={p.seed} value={index}>{p.label}</option>)}
          </select>
          <button type="button" className="btn primary" onClick={loadSample}>Use sample</button>
        </div>
        <p>Synthetic examples inspired by broad audiogram patterns; not patient records.</p>
      </fieldset>
      <fieldset>
        <legend>Or upload an encrypted patient file (.txt)</legend>
        <div className="row">
          <input ref={input} type="file" accept=".txt" aria-label="Encrypted patient file" />
          <button type="button" className="btn" onClick={loadUpload}>Upload</button>
        </div>
      </fieldset>
      {error && <p role="alert" className="error">{error}</p>}
    </Dialog>
  );
}

interface ExportProps extends BaseProps {
  marks: Mark[];
  getGraph: () => HTMLElement | null;
}

const FORMATS: { value: ExportFormat; label: string; ext: string }[] = [
  { value: 'all', label: 'All three formats', ext: '' },
  { value: 'csv', label: 'CSV: table of recorded data', ext: '.csv' },
  { value: 'txt', label: 'TXT: encrypted data, usable as a simulated patient', ext: '.txt' },
  { value: 'png', label: 'PNG: image of the audiogram', ext: '.png' },
];

export function ExportDialog({ onClose, marks, getGraph }: ExportProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const graph = getGraph();
    if (!graph) return;
    setBusy(true);
    try {
      await exportResults(format, name.trim() || DEFAULT_FILENAMES[format], marks, graph);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="Export results" onClose={onClose} actions={<button type="button" className="btn primary" disabled={busy} onClick={submit}>Export</button>}>
      <p>Exports include the audiogram only, not the case history or case code.</p>
      <fieldset>
        <legend>Format</legend>
        {FORMATS.map((f) => (
          <label key={f.value} className="choice">
            <input type="radio" name="format" value={f.value} checked={format === f.value} onChange={() => setFormat(f.value)} />
            {f.label}
          </label>
        ))}
      </fieldset>
      <label htmlFor="export-name">Filename</label>
      <div className="row">
        <input id="export-name" type="text" value={name} placeholder={DEFAULT_FILENAMES[format]} onChange={(e) => setName(e.target.value)} />
        <span>{FORMATS.find((f) => f.value === format)?.ext}</span>
      </div>
    </Dialog>
  );
}

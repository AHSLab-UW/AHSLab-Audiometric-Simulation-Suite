import { useCallback, useEffect, useRef, useState } from 'react';
import { playTone } from './audio/player';
import {
  DEFAULT_FREQUENCY, DEFAULT_LEVEL, DEFAULT_MASKER_LEVEL, FREQUENCIES, LEVEL_STEP, MESSAGES, TONE_SECONDS,
  clampLevel,
} from './constants';
import { patientLevel, respond } from './model/listener';
import { removeMark, upsertMark } from './model/marks';
import type { Conduction, Ear, Mark, Mode } from './types';

export interface Settings {
  ear: Ear;
  conduction: Conduction;
  masked: boolean;
  frequency: number;
  level: number;
  maskerLevel: number;
  /** Whether the next recorded mark is a response (only editable in draw mode). */
  response: boolean;
}

const INITIAL: Settings = {
  ear: 'right', conduction: 'AC', masked: false, frequency: DEFAULT_FREQUENCY, level: DEFAULT_LEVEL,
  maskerLevel: DEFAULT_MASKER_LEVEL, response: true,
};

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

export function useAudiometer() {
  const [settings, setSettings] = useState<Settings>(INITIAL);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [mode, setMode] = useState<Mode>('idle');
  const [patient, setPatient] = useState<Mark[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tone, setTone] = useState<{ playing: boolean; heard: boolean | null }>({ playing: false, heard: null });
  const [dialogOpen, setDialogOpen] = useState(false);
  const toneTimer = useRef<number>(0);

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const stepFrequency = useCallback((direction: 1 | -1) => {
    setSettings((s) => {
      const index = FREQUENCIES.indexOf(s.frequency as (typeof FREQUENCIES)[number]) + direction;
      return { ...s, frequency: FREQUENCIES[Math.min(FREQUENCIES.length - 1, Math.max(0, index))] };
    });
  }, []);
  const stepLevel = useCallback(
    (direction: 1 | -1) => setSettings((s) => ({ ...s, level: clampLevel(s.level + direction * LEVEL_STEP) })),
    [],
  );
  const stepMasker = useCallback(
    (direction: 1 | -1) => setSettings((s) => ({ ...s, maskerLevel: clampLevel(s.maskerLevel + direction * LEVEL_STEP) })),
    [],
  );

  const recordMark = useCallback(
    (s: Settings, level: number, response: boolean) =>
      setMarks((m) =>
        upsertMark(m, {
          frequency: s.frequency, level, ear: s.ear, conduction: s.conduction, masked: s.masked,
          maskLevel: s.maskerLevel, response,
        }),
      ),
    [],
  );

  const record = useCallback(
    () => recordMark(settings, settings.level, mode === 'draw' ? settings.response : true),
    [recordMark, settings, mode],
  );

  const deleteCurrent = useCallback(
    () => setMarks((m) => removeMark(m, settings)),
    [settings],
  );

  const presentTone = useCallback(() => {
    if (patient) {
      const threshold = patientLevel(patient, settings);
      if (threshold === null) setNotice(MESSAGES.NO_PATIENT_DATA);
      setTone({ playing: true, heard: respond(settings.level, threshold) });
    } else if (settings.conduction === 'AC') {
      playTone({
        frequency: settings.frequency, level: settings.level, ear: settings.ear, seconds: TONE_SECONDS,
        maskerLevel: settings.masked ? settings.maskerLevel : undefined,
      });
      setTone({ playing: true, heard: null });
    } else {
      setNotice(MESSAGES.BC_MANUAL);
      return;
    }
    window.clearTimeout(toneTimer.current);
    toneTimer.current = window.setTimeout(() => setTone({ playing: false, heard: null }), TONE_SECONDS * 1000);
  }, [patient, settings]);

  useEffect(() => () => window.clearTimeout(toneTimer.current), []);

  const startManual = useCallback(
    (simulatedPatient: Mark[] | null = null) => {
      if (settings.conduction === 'BC') setNotice(MESSAGES.BC_MANUAL);
      setPatient(simulatedPatient);
      update({ response: true });
      setMode('manual');
    },
    [settings.conduction, update],
  );

  const startDraw = useCallback(() => setMode('draw'), []);

  const startAuto = useCallback(() => {
    if (settings.conduction === 'BC') return setNotice(MESSAGES.BC_AUTO);
    setMode('auto');
  }, [settings.conduction]);

  const end = useCallback(() => {
    setMode('idle');
    setPatient(null);
    setTone({ playing: false, heard: null });
  }, []);

  /** Practice automatic mode: plot the simulated patient's threshold for the current condition. */
  const plotSimulatedThreshold = useCallback(
    (data: Mark[]) => {
      const threshold = patientLevel(data, settings);
      if (threshold === null) return setNotice(MESSAGES.NO_PATIENT_DATA);
      recordMark(settings, clampLevel(Math.round(threshold / LEVEL_STEP) * LEVEL_STEP), true);
    },
    [recordMark, settings],
  );

  const clear = useCallback(() => setMarks([]), []);

  const active = mode === 'manual' || mode === 'draw';
  const latest = useRef({ presentTone, record, deleteCurrent, end, stepFrequency, stepLevel, update, settings, mode });
  useEffect(() => {
    latest.current = { presentTone, record, deleteCurrent, end, stepFrequency, stepLevel, update, settings, mode };
  });

  useEffect(() => {
    if (!active || dialogOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditable(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      const h = latest.current;
      const draw = h.mode === 'draw';
      const actions: Record<string, (() => void) | undefined> = {
        ArrowLeft: () => h.stepFrequency(-1),
        ArrowRight: () => h.stepFrequency(1),
        ArrowDown: () => h.stepLevel(-1),
        ArrowUp: () => h.stepLevel(1),
        Enter: h.record,
        Backspace: h.deleteCurrent,
        ' ': draw ? undefined : h.presentTone,
        d: h.end,
        c: draw ? () => h.update({ conduction: h.settings.conduction === 'AC' ? 'BC' : 'AC' }) : undefined,
        e: draw ? () => h.update({ ear: h.settings.ear === 'left' ? 'right' : 'left' }) : undefined,
        r: draw ? () => h.update({ response: !h.settings.response }) : undefined,
        m: draw ? () => h.update({ masked: !h.settings.masked }) : undefined,
      };
      const action = actions[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (!action) return;
      event.preventDefault();
      // Stops a focused button from also being activated by Space/Enter.
      if (event.target instanceof HTMLButtonElement) event.target.blur();
      action();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, dialogOpen]);

  return {
    settings, update, marks, setMarks, mode, patient, notice, setNotice, tone, setDialogOpen,
    stepFrequency, stepLevel, stepMasker, record, recordMark, deleteCurrent, presentTone,
    startManual, startDraw, startAuto, end, plotSimulatedThreshold, clear,
  };
}

export type Audiometer = ReturnType<typeof useAudiometer>;

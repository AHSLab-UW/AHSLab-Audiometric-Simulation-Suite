import { useEffect, useRef, useState } from 'react';
import { playTone } from '../audio/player';
import { TONE_SECONDS } from '../constants';
import { answer, startExercise, type ExerciseState } from '../model/exercise';
import type { Settings } from '../useAudiometer';

const PAUSE_BEFORE_TONE_MS = 1000;

interface Props {
  settings: Settings;
  onThreshold: (level: number) => void;
  onDone: () => void;
}

/** Automatic threshold search: the learner answers "yes"/"no" as if they were the listener. */
export function AutoExercise({ settings, onThreshold, onDone }: Props) {
  const [state, setState] = useState<ExerciseState | null>(null);
  const [phase, setPhase] = useState<'waiting' | 'playing' | 'ready'>('ready');
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, []);

  function present(level: number) {
    setPhase('waiting');
    timers.current.push(
      window.setTimeout(() => {
        playTone({
          frequency: settings.frequency, level, ear: settings.ear, seconds: TONE_SECONDS,
          maskerLevel: settings.masked ? settings.maskerLevel : undefined,
        });
        setPhase('playing');
        timers.current.push(window.setTimeout(() => setPhase('ready'), TONE_SECONDS * 1000));
      }, PAUSE_BEFORE_TONE_MS),
    );
  }

  function start() {
    const initial = startExercise(settings.level);
    setState(initial);
    present(initial.level);
  }

  function reply(heard: boolean) {
    if (!state) return;
    const next = answer(state, heard);
    if (next.threshold !== null) {
      onThreshold(next.threshold);
      return;
    }
    setState(next);
    present(next.level);
  }

  const canAnswer = state !== null && phase === 'ready';
  return (
    <section className="card exercise" aria-label="Automatic threshold search">
      <p>Listen for the tone. Choose Yes if you heard it, or No if you did not. Repeat until a threshold is found.</p>
      <div className="row">
        <button type="button" className="btn primary" disabled={state !== null} onClick={start}>Start</button>
        <button type="button" className="btn" disabled={!canAnswer} onClick={() => reply(true)}>Yes</button>
        <button type="button" className="btn" disabled={!canAnswer} onClick={() => reply(false)}>No</button>
        <button type="button" className="btn warn push-right" onClick={onDone}>Done</button>
      </div>
      <p role="status" className="muted">
        {phase === 'playing' ? '🔊 Tone playing' : phase === 'waiting' ? 'Get ready…' : state ? 'Did you hear it?' : ''}
      </p>
    </section>
  );
}

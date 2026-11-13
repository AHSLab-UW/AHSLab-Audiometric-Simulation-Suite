import type { Ear } from '../types';
import { hlToSpl, narrowBandNoise, sineTone } from './signals';

let context: AudioContext | null = null;

/** Creates the audio context lazily. Must first be called from a user gesture (required by iOS/Safari). */
export function getAudioContext(): AudioContext {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

export const isAudioSupported = () => typeof window !== 'undefined' && 'AudioContext' in window;

export interface ToneRequest {
  frequency: number;
  level: number;
  ear: Ear;
  seconds: number;
  /** Masker level in dB HL; omit for an unmasked tone. */
  maskerLevel?: number;
}

/** Plays the tone in the test ear and, when masked, narrow band noise in the opposite ear. */
export function playTone({ frequency, level, ear, seconds, maskerLevel }: ToneRequest) {
  const ctx = getAudioContext();
  const length = Math.round(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  const toneChannel = ear === 'left' ? 0 : 1;

  buffer.copyToChannel(sineTone(frequency, length, ctx.sampleRate, hlToSpl(level, frequency)), toneChannel);
  if (maskerLevel !== undefined) {
    const noise = narrowBandNoise(frequency, length, ctx.sampleRate, hlToSpl(maskerLevel, frequency));
    buffer.copyToChannel(noise, 1 - toneChannel);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}

/** Starts a continuous 1 kHz calibration tone and returns a function that stops it. */
export function startCalibrationTone(): () => void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.01;
  oscillator.frequency.value = 1000;
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start();
  return () => oscillator.stop();
}

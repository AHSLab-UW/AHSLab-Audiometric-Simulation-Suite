import { ifft } from './fft';

// A 0.01 peak amplitude sine is calibrated to be 60 dB (see calibration tone).
const CALIBRATION_PEAK = 0.01;
const CALIBRATION_LEVEL = 60;
const RAMP_SAMPLES = 1000;
const NOISE_HALF_BANDWIDTH_HZ = 50;

/** dB SPL needed to produce 0 dB HL, by frequency. */
const REFERENCE_SPL: Record<number, number> = {
  125: 45, 250: 27, 500: 13.5, 750: 9, 1000: 7.5, 1500: 7.5,
  2000: 9, 3000: 11.5, 4000: 12, 6000: 16, 8000: 15.5, 12000: 15.5,
};

export const hlToSpl = (level: number, frequency: number) => level + (REFERENCE_SPL[frequency] ?? 0);

const amplitudeFor = (level: number) => CALIBRATION_PEAK * 10 ** ((level - CALIBRATION_LEVEL) / 20);

export function applyRamp(samples: Float32Array | Float64Array, rampSamples = RAMP_SAMPLES) {
  const ramp = Math.min(rampSamples, Math.floor(samples.length / 2));
  for (let i = 0; i < ramp; i++) {
    const gain = (1 - Math.cos((i / ramp) * Math.PI)) / 2;
    samples[i] *= gain;
    samples[samples.length - 1 - i] *= gain;
  }
}

export function sineTone(frequency: number, length: number, sampleRate: number, splLevel: number) {
  const amplitude = amplitudeFor(splLevel);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) out[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  applyRamp(out);
  return out;
}

const gaussian = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

const nextPowerOfTwo = (n: number) => 2 ** Math.ceil(Math.log2(n));

/** Narrow band noise centred on `frequency`, scaled to the RMS of a tone at `splLevel`. */
export function narrowBandNoise(frequency: number, length: number, sampleRate: number, splLevel: number) {
  const size = nextPowerOfTwo(length);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  const binHz = sampleRate / size;
  const first = Math.max(1, Math.ceil((frequency - NOISE_HALF_BANDWIDTH_HZ) / binHz));
  const last = Math.min(size / 2 - 1, Math.floor((frequency + NOISE_HALF_BANDWIDTH_HZ) / binHz));

  for (let bin = first; bin <= last; bin++) {
    const magnitude = Math.hypot(gaussian(), gaussian());
    const phase = Math.random() * 2 * Math.PI;
    real[bin] = real[size - bin] = magnitude * Math.cos(phase);
    imag[bin] = magnitude * Math.sin(phase);
    imag[size - bin] = -imag[bin];
  }
  ifft(real, imag);

  const samples = real.subarray(0, length);
  const rms = Math.sqrt(samples.reduce((sum, x) => sum + x * x, 0) / length) || 1;
  const sigma = amplitudeFor(splLevel);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) out[i] = (samples[i] / rms) * sigma;
  applyRamp(out);
  return out;
}

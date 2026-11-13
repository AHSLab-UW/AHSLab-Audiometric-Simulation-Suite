import { describe, expect, it } from 'vitest';
import { fft, ifft } from './fft';
import { narrowBandNoise, sineTone } from './signals';

describe('fft', () => {
  it('inverse undoes forward', () => {
    const real = Float64Array.from([1, 2, 3, 4, 0, -1, 5, 2]);
    const imag = new Float64Array(8);
    const original = Array.from(real);
    fft(real, imag);
    ifft(real, imag);
    original.forEach((v, i) => expect(real[i]).toBeCloseTo(v, 9));
  });
});

describe('signals', () => {
  const rate = 48000;
  const rms = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);

  it('scales a 60 dB tone to 0.01 peak and ramps the ends', () => {
    const tone = sineTone(1000, rate, rate, 60);
    expect(Math.max(...tone)).toBeCloseTo(0.01, 3);
    expect(tone[0]).toBe(0);
  });

  it('matches the noise RMS to the requested level', () => {
    const noise = narrowBandNoise(1000, rate, rate, 60);
    const body = noise.subarray(2000, rate - 2000);
    expect(rms(body)).toBeCloseTo(0.01, 3);
  });
});

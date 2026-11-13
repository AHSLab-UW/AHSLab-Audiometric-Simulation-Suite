/** In-place iterative radix-2 FFT. Array length must be a power of two. */
function transform(real: Float64Array, imag: Float64Array, inverse: boolean) {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const angle = ((inverse ? 2 : -2) * Math.PI) / size;
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);
    for (let start = 0; start < n; start += size) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < size / 2; k++) {
        const a = start + k;
        const b = a + size / 2;
        const tr = real[b] * cr - imag[b] * ci;
        const ti = real[b] * ci + imag[b] * cr;
        real[b] = real[a] - tr;
        imag[b] = imag[a] - ti;
        real[a] += tr;
        imag[a] += ti;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}

export function fft(real: Float64Array, imag: Float64Array) {
  transform(real, imag, false);
}

/** Inverse FFT, scaled by 1/n. */
export function ifft(real: Float64Array, imag: Float64Array) {
  transform(real, imag, true);
  for (let i = 0; i < real.length; i++) {
    real[i] /= real.length;
    imag[i] /= real.length;
  }
}

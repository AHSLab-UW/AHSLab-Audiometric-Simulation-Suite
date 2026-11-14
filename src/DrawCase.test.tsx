import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { decryptText } from './model/crypto';
import { marksToCsv, parseCsv } from './model/csv';
import { generateFromCode } from './model/generator';

const { toBlob } = vi.hoisted(() => ({ toBlob: vi.fn() }));
vi.mock('html-to-image', () => ({ toBlob }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  toBlob.mockReset();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

function blobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe('generated draw audiogram', () => {
  it('plots a generated case and retains its history after editing and finishing', () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) { this.open = true; },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false;
        this.dispatchEvent(new Event('close'));
      },
    });
    const patient = generateFromCode('masking-dilemma/s0')!;
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Draw audiogram' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate case' }));
    expect(screen.getByText(/replaces the current audiogram/)).toBeTruthy();
    expect(within(screen.getByRole('combobox', { name: 'Scenario' })).getByRole('option', { name: patient.title })).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Scenario' }), { target: { value: 'normal' } });
    fireEvent.change(screen.getByLabelText('Case code (optional; overrides scenario)'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate and plot' }));
    expect(screen.getByText(/case code is not valid/)).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Audiogram with 1 recorded threshold' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Case code (optional; overrides scenario)'), { target: { value: patient.code } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate and plot' }));

    expect(screen.getByRole('img', { name: `Audiogram with ${patient.marks.length} recorded thresholds` })).toBeTruthy();
    const history = screen.getByRole('region', { name: 'Case history' });
    expect(history.textContent).toContain(patient.title);
    expect(history.textContent).toContain(patient.history);
    expect(history.textContent).toContain(patient.code);
    const sample = patient.marks.find((m) => m.ear === 'right' && m.conduction === 'AC' && m.frequency === 1000)!;
    expect(screen.getByText(`right AC 1000 Hz: ${sample.level} dB HL`, { selector: 'title' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete mark' }));
    expect(screen.getByRole('img', { name: `Audiogram with ${patient.marks.length - 1} recorded thresholds` })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('region', { name: 'Case history' }).textContent).toContain(patient.code);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByRole('region', { name: 'Case history' })).toBeNull();
  });

  it('generates the selected scenario and clears its history when a hearing test starts', () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) { this.open = true; },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false;
        this.dispatchEvent(new Event('close'));
      },
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Draw audiogram' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate case' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Scenario' }), { target: { value: 'masking-dilemma' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate and plot' }));
    expect(screen.getByRole('region', { name: 'Case history' }).textContent).toContain('masking-dilemma/');
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Test hearing' })).getByRole('button', { name: 'Automatic' }));
    expect(screen.queryByRole('region', { name: 'Case history' })).toBeNull();
  });

  it('exports edited audiogram marks without the original case history in any format', async () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) { this.open = true; },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false;
        this.dispatchEvent(new Event('close'));
      },
    });
    const blobs: Blob[] = [];
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: (blob: Blob) => { blobs.push(blob); return 'blob:test'; },
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    toBlob.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    const patient = generateFromCode('masking-dilemma/s0')!;
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Draw audiogram' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate case' }));
    fireEvent.change(screen.getByLabelText('Case code (optional; overrides scenario)'), { target: { value: patient.code } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate and plot' }));

    const original = patient.marks.find((m) => m.frequency === 250 && m.ear === 'right' && m.conduction === 'AC' && !m.masked);
    expect(original?.level).not.toBe(55);
    fireEvent.click(screen.getByRole('button', { name: 'Increase Signal level' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record' }));
    expect(screen.getByText('right AC 250 Hz: 55 dB HL', { selector: 'title' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    fireEvent.click(screen.getByRole('button', { name: 'Draw audiogram' }));
    expect(screen.getByText('right AC 250 Hz: 55 dB HL', { selector: 'title' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    const graph = container.querySelector('.graph-card');
    expect(graph).toBeTruthy();
    expect(graph?.contains(screen.getByRole('region', { name: 'Case history' }))).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    fireEvent.click(screen.getByLabelText('All three formats'));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Export results' })).getByRole('button', { name: 'Export' }));
    await waitFor(() => expect(blobs).toHaveLength(3));
    expect(toBlob).toHaveBeenCalledWith(graph, expect.objectContaining({ backgroundColor: '#fff' }));

    const csv = await blobText(blobs[0]);
    const encryptedCsv = decryptText(await blobText(blobs[1]));
    const editedMarks = parseCsv(csv);
    expect(editedMarks).toHaveLength(patient.marks.length);
    expect(editedMarks.find((m) => m.frequency === 250 && m.ear === 'right' && m.conduction === 'AC' && !m.masked)?.level).toBe(55);
    expect(encryptedCsv).toBe(marksToCsv(editedMarks, { responsesOnly: true }));
    for (const text of [csv, encryptedCsv]) {
      expect(text).not.toContain(patient.history);
      expect(text).not.toContain(patient.title);
      expect(text).not.toContain(patient.code);
    }
    expect(blobs[2].type).toBe('image/png');
  });
});

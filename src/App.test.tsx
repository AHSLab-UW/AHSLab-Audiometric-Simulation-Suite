import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { DEFAULT_MASKER_LEVEL, clampLevel } from './constants';
import { encryptText } from './model/crypto';
import { marksToCsv } from './model/csv';
import { generateFromCode } from './model/generator';
import { patientLevel } from './model/listener';
import { automaticThreshold } from './model/automaticPractice';

const { toBlob } = vi.hoisted(() => ({ toBlob: vi.fn().mockResolvedValue(null) }));
vi.mock('html-to-image', () => ({ toBlob }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  toBlob.mockClear();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

describe('practice review', () => {
  it('hides the working chart during review but keeps it available for export and restores it afterwards', async () => {
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
    const { container } = render(<App />);
    expect(screen.getByRole('img', { name: 'UW AHSLab logo' }).getAttribute('src'))
      .toBe(`${import.meta.env.BASE_URL}images/logo.png`);
    expect(screen.getByRole('link', { name: 'GitHub repository' }).getAttribute('href'))
      .toBe('https://github.com/AHSLab-UW/AHSLab-Audiometric-Simulation-Suite');
    const graph = container.querySelector('.graph-card');
    expect(graph).toBeTruthy();

    fireEvent.click(within(screen.getByRole('group', { name: 'Practice audiometry' })).getByRole('button', { name: 'Manual' }));
    const choices = within(screen.getByRole('combobox', { name: 'Case type' })).getAllByRole('option');
    expect(choices.map((choice) => choice.textContent)).toEqual(['Common cases', 'Challenging cases', 'Random mix']);
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.getByRole('region', { name: 'Test review' })).toBeTruthy();
    const review = screen.getByRole('region', { name: 'Test review' });
    const studentGraph = within(review).getByRole('img', { name: /Audiogram with 1 recorded threshold/ }).parentElement;
    expect(container.querySelectorAll('.graph-card')).toHaveLength(1);
    expect(studentGraph).not.toBe(graph);

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    fireEvent.click(screen.getByLabelText('PNG: image of the audiogram'));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Export results' })).getByRole('button', { name: 'Export' }));
    await waitFor(() => expect(toBlob).toHaveBeenCalledWith(studentGraph, expect.objectContaining({ backgroundColor: '#fff' })));

    fireEvent.click(within(screen.getByRole('dialog', { name: 'Export results' })).getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close review' }));
    expect(screen.queryByRole('region', { name: 'Test review' })).toBeNull();
    expect(container.querySelectorAll('.graph-card')).toHaveLength(1);
    expect(screen.getByRole('img', { name: /Audiogram with 1 recorded threshold/ })).toBeTruthy();
  });
});

describe('automatic practice patient selection', () => {
  function mockDialogs() {
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
  }

  it('keeps a generated patient for multiple measurements and reviews the same session', () => {
    mockDialogs();
    const patient = generateFromCode('tricky/s0')!;
    const threshold = (frequency: number) => clampLevel(Math.round(patientLevel(patient.marks, {
      ear: 'right', conduction: 'AC', masked: false, frequency, maskerLevel: DEFAULT_MASKER_LEVEL,
    })! / 5) * 5);
    render(<App />);
    const openAutomatic = () => fireEvent.click(
      within(screen.getByRole('group', { name: 'Practice audiometry' })).getByRole('button', { name: 'Automatic' }),
    );

    openAutomatic();
    const dialog = screen.getByRole('dialog', { name: 'Choose a simulated patient' });
    expect(within(dialog).getByRole('combobox', { name: 'Case type' }).textContent)
      .toBe('Common casesChallenging casesRandom mix');
    expect(within(dialog).getByRole('combobox', { name: 'Sample patient' })).toBeTruthy();
    expect(within(dialog).getByLabelText('Encrypted patient file')).toBeTruthy();
    const code = within(dialog).getByLabelText('Or enter a case code to repeat a patient (optional)');
    fireEvent.change(code, { target: { value: 'invalid' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Generate' }));
    expect(within(dialog).getByRole('alert').textContent).toContain('not valid');
    fireEvent.change(code, { target: { value: patient.code } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Generate' }));
    expect(screen.getByRole('region', { name: 'Case history' }).textContent).toContain(patient.history);
    expect(screen.getByRole('region', { name: 'Case history' }).textContent).not.toContain(patient.title);
    expect(screen.getByRole('img', { name: 'Audiogram with 0 recorded thresholds' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Increase Signal level' })).toHaveProperty('disabled', true);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByText(`right AC 250 Hz: ${threshold(250)} dB HL`, { selector: 'title' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Increase Frequency' }));
    fireEvent.click(screen.getByRole('button', { name: 'Measure threshold' }));
    expect(screen.getByRole('img', { name: 'Audiogram with 2 recorded thresholds' })).toBeTruthy();
    expect(screen.getByText(`right AC 500 Hz: ${threshold(500)} dB HL`, { selector: 'title' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    const review = screen.getByRole('region', { name: 'Test review' });
    expect(review.textContent).toContain(patient.code);
    expect(review.textContent).toContain(patient.title);
    fireEvent.click(within(review).getByRole('button', { name: 'Next patient' }));
    expect(screen.getByRole('button', { name: 'Measure threshold' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Audiogram with 0 recorded thresholds' })).toBeTruthy();
  });

  it('generates a patient from a category without a code', () => {
    mockDialogs();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const patient = generateFromCode('tricky/000000')!;
    const threshold = patientLevel(patient.marks, {
      ear: 'right', conduction: 'AC', masked: false, frequency: 250, maskerLevel: DEFAULT_MASKER_LEVEL,
    })!;
    render(<App />);
    fireEvent.click(within(screen.getByRole('group', { name: 'Practice audiometry' })).getByRole('button', { name: 'Automatic' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Case type' }), { target: { value: 'tricky' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Measure threshold' }));
    expect(screen.getByText(`right AC 250 Hz: ${clampLevel(Math.round(threshold / 5) * 5)} dB HL`, { selector: 'title' })).toBeTruthy();
  });

  it('continues to load and plot a sample patient', async () => {
    mockDialogs();
    const patient = generateFromCode('common/s0')!;
    const threshold = patientLevel(patient.marks, {
      ear: 'right', conduction: 'AC', masked: false, frequency: 250, maskerLevel: DEFAULT_MASKER_LEVEL,
    })!;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, text: async () => encryptText(marksToCsv(patient.marks, { responsesOnly: true })),
    }));
    render(<App />);
    fireEvent.click(within(screen.getByRole('group', { name: 'Practice audiometry' })).getByRole('button', { name: 'Automatic' }));
    fireEvent.click(screen.getByRole('button', { name: 'Use sample' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Measure threshold' })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Measure threshold' }));
    await waitFor(() => expect(screen.getByText(
      `right AC 250 Hz: ${clampLevel(Math.round(threshold / 5) * 5)} dB HL`, { selector: 'title' },
    )).toBeTruthy());
  });

  it('lets students choose ear, conduction, masking and frequency while selecting the masker automatically', () => {
    mockDialogs();
    const patient = generateFromCode('normal/s0')!;
    const result = automaticThreshold(patient.marks, {
      ear: 'left', conduction: 'BC', masked: true, frequency: 500, maskerLevel: DEFAULT_MASKER_LEVEL,
    });
    expect(result.kind).toBe('measured');
    if (result.kind !== 'measured') return;
    render(<App />);
    fireEvent.click(within(screen.getByRole('group', { name: 'Practice audiometry' })).getByRole('button', { name: 'Automatic' }));
    fireEvent.change(screen.getByLabelText('Or enter a case code to repeat a patient (optional)'), { target: { value: patient.code } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Conduction' })).getByRole('button', { name: 'BC' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Test ear' })).getByRole('button', { name: 'Left' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Masking' })).getByRole('button', { name: 'Masked' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase Frequency' }));
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByText(`left BC masked 500 Hz: ${result.level} dB HL`, { selector: 'title' })).toBeTruthy();
    expect(screen.getByLabelText('Masker level').textContent).toBe(`${result.maskerLevel} dB HL`);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    const graph = within(screen.getByRole('region', { name: 'Test review' }))
      .getByRole('img', { name: 'Audiogram with 1 recorded threshold' });
    expect(within(graph).getByText(String(result.maskerLevel))).toBeTruthy();
  });

  it('reports a masking dilemma and leaves the existing result unchanged', () => {
    mockDialogs();
    const patient = generateFromCode('masking-dilemma/s0')!;
    expect(automaticThreshold(patient.marks, {
      ear: 'right', conduction: 'BC', masked: true, frequency: 250, maskerLevel: DEFAULT_MASKER_LEVEL,
    }).kind).toBe('masking-dilemma');
    render(<App />);
    fireEvent.click(within(screen.getByRole('group', { name: 'Practice audiometry' })).getByRole('button', { name: 'Automatic' }));
    fireEvent.change(screen.getByLabelText('Or enter a case code to repeat a patient (optional)'), { target: { value: patient.code } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Measure threshold' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Conduction' })).getByRole('button', { name: 'BC' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Masking' })).getByRole('button', { name: 'Masked' }));
    fireEvent.click(screen.getByRole('button', { name: 'Measure threshold' }));
    expect(screen.getByText(/Masking dilemma: no reliable masking plateau/)).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Audiogram with 1 recorded threshold' })).toBeTruthy();
  });
});

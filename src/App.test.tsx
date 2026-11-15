import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const { toBlob } = vi.hoisted(() => ({ toBlob: vi.fn().mockResolvedValue(null) }));
vi.mock('html-to-image', () => ({ toBlob }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/session/sessionStore', () => ({
  saveSession: vi.fn().mockResolvedValue(undefined),
  wasIdentifierUsedToday: vi.fn().mockResolvedValue(false),
}));

import { renderIdentifierScreen } from '../../src/screens/identifierScreen';
import { saveSession, wasIdentifierUsedToday } from '../../src/session/sessionStore';

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('renderIdentifierScreen', () => {
  beforeEach(() => {
    vi.mocked(saveSession).mockClear();
    vi.mocked(wasIdentifierUsedToday).mockReset().mockResolvedValue(false);
  });

  it('defaults to Unit # with a numeric input', () => {
    const container = document.createElement('div');
    renderIdentifierScreen(container, 'vehicle', vi.fn());

    const input = container.querySelector<HTMLInputElement>('#identifier-input')!;
    expect(input.type).toBe('tel');
  });

  it('switches to a text input when Lot # is selected', () => {
    const container = document.createElement('div');
    renderIdentifierScreen(container, 'vehicle', vi.fn());

    container.querySelector<HTMLButtonElement>('[data-type="lot"]')!.click();

    const input = container.querySelector<HTMLInputElement>('#identifier-input')!;
    expect(input.type).toBe('text');
  });

  it('shows a warning and does not create a session when the field is empty', async () => {
    const container = document.createElement('div');
    const onCreated = vi.fn();
    renderIdentifierScreen(container, 'vehicle', onCreated);

    container.querySelector<HTMLButtonElement>('#continue-button')!.click();
    await flushMicrotasks();

    expect(onCreated).not.toHaveBeenCalled();
    expect(container.querySelector('#identifier-warning')!.textContent).toContain('enter an identifier');
  });

  it('shows a warning and does not create a session when the identifier is only punctuation/whitespace', async () => {
    const container = document.createElement('div');
    const onCreated = vi.fn();
    renderIdentifierScreen(container, 'vehicle', onCreated);

    container.querySelector<HTMLInputElement>('#identifier-input')!.value = '---';
    container.querySelector<HTMLButtonElement>('#continue-button')!.click();
    await flushMicrotasks();

    expect(onCreated).not.toHaveBeenCalled();
    expect(container.querySelector('#identifier-warning')!.textContent).toContain('enter an identifier');
  });

  it('creates and saves a session when a fresh identifier is entered', async () => {
    const container = document.createElement('div');
    const onCreated = vi.fn();
    renderIdentifierScreen(container, 'vehicle', onCreated);

    container.querySelector<HTMLInputElement>('#identifier-input')!.value = '11802';
    container.querySelector<HTMLButtonElement>('#continue-button')!.click();
    await flushMicrotasks();

    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(onCreated).toHaveBeenCalledTimes(1);
    const created = onCreated.mock.calls[0][0];
    expect(created.identifier).toBe('11802');
    expect(created.identifierType).toBe('unit');
    expect(created.sessionType).toBe('vehicle');
  });

  it('warns once and requires a second click when the identifier was already used today', async () => {
    vi.mocked(wasIdentifierUsedToday).mockResolvedValue(true);
    const container = document.createElement('div');
    const onCreated = vi.fn();
    renderIdentifierScreen(container, 'vehicle', onCreated);

    container.querySelector<HTMLInputElement>('#identifier-input')!.value = '11802';
    container.querySelector<HTMLButtonElement>('#continue-button')!.click();
    await flushMicrotasks();

    expect(onCreated).not.toHaveBeenCalled();
    expect(container.querySelector('#identifier-warning')!.textContent).toContain('already exists today');

    container.querySelector<HTMLButtonElement>('#continue-button')!.click();
    await flushMicrotasks();

    expect(onCreated).toHaveBeenCalledTimes(1);
  });
});

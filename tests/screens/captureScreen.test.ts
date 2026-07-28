import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/session/sessionStore', () => ({
  saveSession: vi.fn().mockResolvedValue(undefined),
}));

import { createSession } from '../../src/session/session';
import { renderCaptureScreen } from '../../src/screens/captureScreen';
import { saveSession } from '../../src/session/sessionStore';

function fakeFile(name = 'photo.jpg'): File {
  return new File(['fake-bytes'], name, { type: 'image/jpeg' });
}

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function selectFile(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, 'files', { value: [file], writable: false, configurable: true });
  input.dispatchEvent(new Event('change'));
  await flushMicrotasks();
}

describe('renderCaptureScreen', () => {
  beforeEach(() => {
    vi.mocked(saveSession).mockClear().mockResolvedValue(undefined);
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('shows no note input for a category that does not allow notes', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'front', vi.fn());

    expect(container.querySelector('[data-note]')).toBeNull();
  });

  it('adds a photo and re-renders a thumbnail when a file is selected', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'front', vi.fn());

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile());

    expect(container.querySelectorAll('.thumb')).toHaveLength(1);
    expect(saveSession).toHaveBeenCalledTimes(1);
  });

  it('shows a note input per photo for a category that allows notes', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'damages', vi.fn());

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile());

    expect(container.querySelector('[data-note]')).not.toBeNull();
  });

  it('removes a photo when its delete button is clicked', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'front', vi.fn());

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile());
    expect(container.querySelectorAll('.thumb')).toHaveLength(1);

    container.querySelector<HTMLButtonElement>('[data-remove]')!.click();
    await flushMicrotasks();

    expect(container.querySelectorAll('.thumb')).toHaveLength(0);
  });

  it('calls onDone with the latest session when Done is clicked', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    renderCaptureScreen(container, session, 'front', onDone);

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile());
    container.querySelector<HTMLButtonElement>('#done-button')!.click();

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone.mock.calls[0][0].photos).toHaveLength(1);
  });

  it('shows a hint about enabling camera permission in phone settings', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'front', vi.fn());

    expect(container.textContent).toContain('check your phone’s camera permission');
  });

  it('shows a storage warning but keeps the photo visible when saving fails', async () => {
    vi.mocked(saveSession).mockRejectedValueOnce(new Error('QuotaExceededError'));
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'front', vi.fn());

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile());

    expect(container.querySelectorAll('.thumb')).toHaveLength(1);
    expect(container.textContent).toContain('may not have been saved');
  });

  it('keeps a note containing a double quote intact across redraws', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'damages', vi.fn());

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile('first.jpg'));

    const noteValue = '6" dent on bumper';
    const noteInput = container.querySelector<HTMLInputElement>('[data-note]')!;
    noteInput.value = noteValue;
    noteInput.dispatchEvent(new Event('change'));
    await flushMicrotasks();

    // Trigger a redraw path (adding another photo) to exercise re-rendering with the stored note.
    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile('second.jpg'));

    const noteInputs = container.querySelectorAll<HTMLInputElement>('[data-note]');
    expect(noteInputs).toHaveLength(2);
    expect(noteInputs[0].value).toBe(noteValue);

    // The markup should not have been corrupted by the unescaped quote: exactly the
    // expected thumbnails/buttons/inputs should exist, nothing extra leaked in.
    expect(container.querySelectorAll('.thumb')).toHaveLength(2);
    expect(container.querySelectorAll('[data-remove]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-note]')).toHaveLength(2);
  });

  it('revokes the cached object URL when a photo is removed', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'front', vi.fn());

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile());
    expect(container.querySelectorAll('.thumb')).toHaveLength(1);

    container.querySelector<HTMLButtonElement>('[data-remove]')!.click();
    await flushMicrotasks();

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

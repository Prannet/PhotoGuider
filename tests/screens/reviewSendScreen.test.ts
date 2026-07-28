import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/zip/buildZip', () => ({
  buildSessionZip: vi.fn().mockResolvedValue(new Blob(['zip'])),
}));
vi.mock('../../src/upload/sharepointUpload', () => ({
  uploadZipToSharePoint: vi.fn(),
}));
vi.mock('../../src/upload/shareEmail', () => ({
  shareZipViaEmail: vi.fn(),
}));
vi.mock('../../src/session/sessionStore', () => ({
  clearSession: vi.fn().mockResolvedValue(undefined),
  recordIdentifierSent: vi.fn().mockResolvedValue(undefined),
}));

import { createSession } from '../../src/session/session';
import { renderReviewSendScreen } from '../../src/screens/reviewSendScreen';
import { buildSessionZip } from '../../src/zip/buildZip';
import { uploadZipToSharePoint } from '../../src/upload/sharepointUpload';
import { shareZipViaEmail } from '../../src/upload/shareEmail';
import { clearSession } from '../../src/session/sessionStore';

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('renderReviewSendScreen', () => {
  beforeEach(() => {
    vi.mocked(uploadZipToSharePoint).mockReset().mockResolvedValue(undefined);
    vi.mocked(shareZipViaEmail).mockReset().mockResolvedValue(undefined);
    vi.mocked(clearSession).mockClear();
    vi.mocked(buildSessionZip).mockClear();
  });

  it('clears the session and calls onDone once the only attempted send succeeds', async () => {
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    const container = document.createElement('div');
    renderReviewSendScreen(container, session, onDone);

    container.querySelector<HTMLButtonElement>('#send-sharepoint')!.click();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(uploadZipToSharePoint).toHaveBeenCalledTimes(1);
    expect(clearSession).toHaveBeenCalledWith(session.id);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('shows Failed and does not clear the session when the send fails', async () => {
    vi.mocked(uploadZipToSharePoint).mockRejectedValue(new Error('network down'));
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    const container = document.createElement('div');
    renderReviewSendScreen(container, session, onDone);

    container.querySelector<HTMLButtonElement>('#send-sharepoint')!.click();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(container.querySelector('#send-sharepoint')!.textContent).toContain('Failed');
    expect(clearSession).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('waits for both attempted actions before clearing when both are used', async () => {
    vi.mocked(shareZipViaEmail).mockRejectedValue(new Error('share cancelled'));
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    const container = document.createElement('div');
    renderReviewSendScreen(container, session, onDone);

    // Click both before letting either settle: this is what actually exercises
    // "both attempted, one fails" — if sharepoint were allowed to fully settle
    // (via flushes) before email is ever clicked, isSessionReadyToClear would
    // already see {sharepoint:'sent', email:'idle'} and correctly report ready
    // (per its own tests), clearing before email is even touched.
    container.querySelector<HTMLButtonElement>('#send-sharepoint')!.click();
    container.querySelector<HTMLButtonElement>('#send-email')!.click();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(clearSession).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();

    vi.mocked(shareZipViaEmail).mockResolvedValue(undefined);
    container.querySelector<HTMLButtonElement>('#send-email')!.click();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(clearSession).toHaveBeenCalledWith(session.id);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('builds the session zip only once when both send actions are clicked before either resolves', async () => {
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    const container = document.createElement('div');
    renderReviewSendScreen(container, session, onDone);

    // Click both actions before letting buildSessionZip's promise settle, so both
    // land on the "no cached zip yet" branch of getZip() concurrently. Without an
    // in-flight-promise cache, this would trigger a second, wasted zip build.
    container.querySelector<HTMLButtonElement>('#send-sharepoint')!.click();
    container.querySelector<HTMLButtonElement>('#send-email')!.click();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(buildSessionZip).toHaveBeenCalledTimes(1);
    expect(uploadZipToSharePoint).toHaveBeenCalledTimes(1);
    expect(shareZipViaEmail).toHaveBeenCalledTimes(1);
  });

  it('shows a discard confirmation when Start Over is clicked', () => {
    const session = createSession('vehicle', 'unit', '11802');
    const container = document.createElement('div');
    renderReviewSendScreen(container, session, vi.fn());

    container.querySelector<HTMLButtonElement>('#start-over-button')!.click();

    expect(container.textContent).toContain('Discard session? All photos will be lost.');
    expect(container.querySelector('#confirm-discard-button')).not.toBeNull();
  });

  it('returns to the normal review view without discarding when Cancel is clicked', () => {
    const session = createSession('vehicle', 'unit', '11802');
    const container = document.createElement('div');
    renderReviewSendScreen(container, session, vi.fn());

    container.querySelector<HTMLButtonElement>('#start-over-button')!.click();
    container.querySelector<HTMLButtonElement>('#cancel-discard-button')!.click();

    expect(container.querySelector('#send-sharepoint')).not.toBeNull();
    expect(clearSession).not.toHaveBeenCalled();
  });

  it('clears the session and calls onDone when Discard is confirmed', async () => {
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    const container = document.createElement('div');
    renderReviewSendScreen(container, session, onDone);

    container.querySelector<HTMLButtonElement>('#start-over-button')!.click();
    container.querySelector<HTMLButtonElement>('#confirm-discard-button')!.click();
    await flushMicrotasks();

    expect(clearSession).toHaveBeenCalledWith(session.id);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('disables Start Over while a send is in flight', async () => {
    const session = createSession('vehicle', 'unit', '11802');
    const container = document.createElement('div');

    let resolveUpload!: () => void;
    vi.mocked(uploadZipToSharePoint).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveUpload = resolve;
      })
    );

    renderReviewSendScreen(container, session, vi.fn());

    container.querySelector<HTMLButtonElement>('#send-sharepoint')!.click();
    await flushMicrotasks();

    const startOverButton = container.querySelector<HTMLButtonElement>('#start-over-button')!;
    expect(startOverButton.disabled).toBe(true);

    startOverButton.click();
    expect(container.querySelector('#confirm-discard-button')).toBeNull();

    resolveUpload();
    await flushMicrotasks();
  });

  it('ignores a second Discard-confirm click while the first is still in flight', async () => {
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    const container = document.createElement('div');

    let resolveClear!: () => void;
    vi.mocked(clearSession).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveClear = resolve;
      })
    );

    renderReviewSendScreen(container, session, onDone);

    container.querySelector<HTMLButtonElement>('#start-over-button')!.click();
    const confirmButton = container.querySelector<HTMLButtonElement>('#confirm-discard-button')!;
    confirmButton.click();
    confirmButton.click();
    await flushMicrotasks();

    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();

    resolveClear();
    await flushMicrotasks();

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('ignores a Cancel click that arrives while Discard is still in flight', async () => {
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    const container = document.createElement('div');

    let resolveClear!: () => void;
    vi.mocked(clearSession).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveClear = resolve;
      })
    );

    renderReviewSendScreen(container, session, onDone);

    container.querySelector<HTMLButtonElement>('#start-over-button')!.click();
    container.querySelector<HTMLButtonElement>('#confirm-discard-button')!.click();
    container.querySelector<HTMLButtonElement>('#cancel-discard-button')!.click();
    await flushMicrotasks();

    expect(container.querySelector('#confirm-discard-button')).not.toBeNull();
    expect(onDone).not.toHaveBeenCalled();

    resolveClear();
    await flushMicrotasks();

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

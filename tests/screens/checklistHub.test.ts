import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession, addPhoto } from '../../src/session/session';
import { renderChecklistHub } from '../../src/screens/checklistHub';
import { saveSession, clearSession } from '../../src/session/sessionStore';

vi.mock('../../src/session/sessionStore', () => ({
  saveSession: vi.fn().mockResolvedValue(undefined),
  clearSession: vi.fn().mockResolvedValue(undefined),
}));

function fakeBlob(): Blob {
  return new Blob(['x'], { type: 'image/jpeg' });
}

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('renderChecklistHub', () => {
  beforeEach(() => {
    vi.mocked(saveSession).mockClear().mockResolvedValue(undefined);
    vi.mocked(clearSession).mockClear().mockResolvedValue(undefined);
  });

  it('disables Finish Session until every required category has a photo', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    const finishButton = container.querySelector<HTMLButtonElement>('#finish-button')!;
    expect(finishButton.disabled).toBe(true);
  });

  it('enables Finish Session once all required categories are covered', () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    const finishButton = container.querySelector<HTMLButtonElement>('#finish-button')!;
    expect(finishButton.disabled).toBe(false);
  });

  it('shows the photo count for a category that has photos', () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    session = addPhoto(session, 'front', fakeBlob());
    session = addPhoto(session, 'front', fakeBlob());
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    const row = container.querySelector('[data-category="front"]')!;
    expect(row.textContent).toContain('2 photos');
  });

  it('calls onOpenCategory with the category key when a row is clicked', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    const onOpenCategory = vi.fn();
    renderChecklistHub(container, session, onOpenCategory, vi.fn(), vi.fn());

    container.querySelector<HTMLDivElement>('[data-category="leftSide"]')!.click();

    expect(onOpenCategory).toHaveBeenCalledWith('leftSide');
  });

  it('persists the session as complete and calls onFinish with the updated session when Finish Session is clicked while enabled', async () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    const onFinish = vi.fn();
    renderChecklistHub(container, session, vi.fn(), onFinish, vi.fn());

    container.querySelector<HTMLButtonElement>('#finish-button')!.click();
    await flushMicrotasks();

    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(saveSession).toHaveBeenCalledWith(expect.objectContaining({ id: session.id, status: 'complete' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0].status).toBe('complete');
  });

  it('does not show the discard confirmation until Start Over is clicked', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    expect(container.querySelector('#confirm-discard-button')).toBeNull();
    expect(container.querySelector('#discard-button')).not.toBeNull();
  });

  it('shows a discard confirmation when Start Over is clicked', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    container.querySelector<HTMLButtonElement>('#discard-button')!.click();

    expect(container.textContent).toContain('Discard session? All photos will be lost.');
    expect(container.querySelector('#confirm-discard-button')).not.toBeNull();
  });

  it('returns to the normal hub view without discarding when Cancel is clicked', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    container.querySelector<HTMLButtonElement>('#discard-button')!.click();
    container.querySelector<HTMLButtonElement>('#cancel-discard-button')!.click();

    expect(container.querySelector('#finish-button')).not.toBeNull();
    expect(clearSession).not.toHaveBeenCalled();
  });

  it('clears the session and calls onDiscard when Discard is confirmed', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    const onDiscard = vi.fn();
    renderChecklistHub(container, session, vi.fn(), vi.fn(), onDiscard);

    container.querySelector<HTMLButtonElement>('#discard-button')!.click();
    container.querySelector<HTMLButtonElement>('#confirm-discard-button')!.click();
    await flushMicrotasks();

    expect(clearSession).toHaveBeenCalledWith(session.id);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('ignores a second Finish Session click while the first is still in flight', async () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    const onFinish = vi.fn();
    renderChecklistHub(container, session, vi.fn(), onFinish, vi.fn());

    const finishButton = container.querySelector<HTMLButtonElement>('#finish-button')!;
    finishButton.click();
    finishButton.click();
    await flushMicrotasks();

    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('ignores a Discard-confirm click that arrives while Finish Session is still in flight, leaving Finish to complete', async () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    const onFinish = vi.fn();
    const onDiscard = vi.fn();

    // Make saveSession resolve only when we say so, so we can click Discard-confirm
    // while the Finish action is still pending.
    let resolveSave: () => void;
    vi.mocked(saveSession).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      })
    );

    renderChecklistHub(container, session, vi.fn(), onFinish, onDiscard);

    container.querySelector<HTMLButtonElement>('#finish-button')!.click();

    // Navigate to the discard-confirmation view and tap Discard while Finish is in flight.
    container.querySelector<HTMLButtonElement>('#discard-button')!.click();
    container.querySelector<HTMLButtonElement>('#confirm-discard-button')!.click();
    await flushMicrotasks();

    // The discard tap should have been ignored entirely (Finish tapped first, still in flight).
    expect(clearSession).not.toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();

    // Now let Finish Session's saveSession resolve.
    resolveSave!();
    await flushMicrotasks();

    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('ignores a Cancel click that arrives while a Discard is still in flight, letting the discard complete', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    const onDiscard = vi.fn();

    // Make clearSession resolve only when we say so, so we can click Cancel
    // while the Discard action is still pending.
    let resolveClear: () => void;
    vi.mocked(clearSession).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveClear = resolve;
      })
    );

    renderChecklistHub(container, session, vi.fn(), vi.fn(), onDiscard);

    container.querySelector<HTMLButtonElement>('#discard-button')!.click();
    container.querySelector<HTMLButtonElement>('#confirm-discard-button')!.click();

    // Tap Cancel while the discard is still in flight.
    container.querySelector<HTMLButtonElement>('#cancel-discard-button')!.click();
    await flushMicrotasks();

    // Cancel should have been ignored entirely: still on the confirm-discard view.
    expect(container.querySelector('#confirm-discard-button')).not.toBeNull();
    expect(container.querySelector('#finish-button')).toBeNull();
    expect(onDiscard).not.toHaveBeenCalled();

    // Now let the original discard's clearSession resolve.
    resolveClear!();
    await flushMicrotasks();

    expect(clearSession).toHaveBeenCalledWith(session.id);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});

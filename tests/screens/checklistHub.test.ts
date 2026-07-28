import { describe, it, expect, vi } from 'vitest';
import { createSession, addPhoto } from '../../src/session/session';
import { renderChecklistHub } from '../../src/screens/checklistHub';

function fakeBlob(): Blob {
  return new Blob(['x'], { type: 'image/jpeg' });
}

describe('renderChecklistHub', () => {
  it('disables Finish Session until every required category has a photo', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderChecklistHub(container, session, vi.fn(), vi.fn());

    const finishButton = container.querySelector<HTMLButtonElement>('#finish-button')!;
    expect(finishButton.disabled).toBe(true);
  });

  it('enables Finish Session once all required categories are covered', () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    renderChecklistHub(container, session, vi.fn(), vi.fn());

    const finishButton = container.querySelector<HTMLButtonElement>('#finish-button')!;
    expect(finishButton.disabled).toBe(false);
  });

  it('shows the photo count for a category that has photos', () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    session = addPhoto(session, 'front', fakeBlob());
    session = addPhoto(session, 'front', fakeBlob());
    renderChecklistHub(container, session, vi.fn(), vi.fn());

    const row = container.querySelector('[data-category="front"]')!;
    expect(row.textContent).toContain('2 photos');
  });

  it('calls onOpenCategory with the category key when a row is clicked', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    const onOpenCategory = vi.fn();
    renderChecklistHub(container, session, onOpenCategory, vi.fn());

    container.querySelector<HTMLDivElement>('[data-category="leftSide"]')!.click();

    expect(onOpenCategory).toHaveBeenCalledWith('leftSide');
  });

  it('calls onFinish when Finish Session is clicked while enabled', () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    const onFinish = vi.fn();
    renderChecklistHub(container, session, vi.fn(), onFinish);

    container.querySelector<HTMLButtonElement>('#finish-button')!.click();

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});

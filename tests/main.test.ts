import { describe, it, expect, vi, beforeEach } from 'vitest';

// main.ts's init() runs as a top-level side effect on import, so we mock
// sessionStore the same way screen tests do (e.g. tests/screens/captureScreen.test.ts)
// and dynamically re-import the module per test after resetting the module registry.
vi.mock('../src/session/sessionStore', () => ({
  getActiveSession: vi.fn(),
}));

import { getActiveSession } from '../src/session/sessionStore';

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('main init', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
    vi.mocked(getActiveSession).mockReset();
  });

  it('falls back to the start screen instead of leaving the app blank when session resume fails', async () => {
    vi.mocked(getActiveSession).mockRejectedValue(new Error('IndexedDB unavailable'));

    await import('../src/main');
    await flushMicrotasks();

    const container = document.getElementById('app')!;
    // The start screen (the "no saved session" fallback) must have rendered —
    // the container must not be left blank.
    expect(container.textContent).toContain('New Session');
    expect(container.querySelector('[data-choice="vehicle"]')).not.toBeNull();
    // And the user gets some visible indication something went wrong, per the
    // codebase's existing inline-warning pattern (see captureScreen.ts).
    expect(container.textContent).toContain('Could not resume your previous session');
  });

  it('renders the start screen normally when there is no saved session', async () => {
    vi.mocked(getActiveSession).mockResolvedValue(undefined);

    await import('../src/main');
    await flushMicrotasks();

    const container = document.getElementById('app')!;
    expect(container.textContent).toContain('New Session');
    expect(container.textContent).not.toContain('Could not resume your previous session');
  });
});

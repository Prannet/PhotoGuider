import { describe, it, expect, beforeEach } from 'vitest';
import { createSession } from '../src/session/session';
import {
  saveSession,
  getActiveSession,
  clearSession,
  wasIdentifierUsedToday,
  recordIdentifierSent,
  __resetForTests,
} from '../src/session/sessionStore';

beforeEach(async () => {
  await __resetForTests();
});

describe('saveSession / getActiveSession', () => {
  it('returns undefined when no session has been saved', async () => {
    expect(await getActiveSession()).toBeUndefined();
  });

  it('returns the saved in-progress session', async () => {
    const session = createSession('vehicle', 'unit', '11802');
    await saveSession(session);
    const active = await getActiveSession();
    expect(active?.id).toBe(session.id);
    expect(active?.identifier).toBe('11802');
  });

  it('returns a session marked complete (finished but not yet sent)', async () => {
    const session = { ...createSession('vehicle', 'unit', '11802'), status: 'complete' as const };
    await saveSession(session);
    const active = await getActiveSession();
    expect(active?.id).toBe(session.id);
  });
});

describe('clearSession', () => {
  it('removes the session so it is no longer active', async () => {
    const session = createSession('vehicle', 'unit', '11802');
    await saveSession(session);
    await clearSession(session.id);
    expect(await getActiveSession()).toBeUndefined();
  });
});

describe('wasIdentifierUsedToday / recordIdentifierSent', () => {
  it('is false until an identifier has been recorded for that day', async () => {
    expect(await wasIdentifierUsedToday('11802', '2026-07-27')).toBe(false);
    await recordIdentifierSent('11802', '2026-07-27');
    expect(await wasIdentifierUsedToday('11802', '2026-07-27')).toBe(true);
  });

  it('is scoped per day', async () => {
    await recordIdentifierSent('11802', '2026-07-27');
    expect(await wasIdentifierUsedToday('11802', '2026-07-28')).toBe(false);
  });
});

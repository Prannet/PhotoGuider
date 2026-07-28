import { describe, it, expect } from 'vitest';
import { resolveInitialState } from '../src/app';
import { createSession } from '../src/session/session';

describe('resolveInitialState', () => {
  it('starts at the start screen when there is no saved session', () => {
    expect(resolveInitialState(undefined)).toEqual({ screen: 'start' });
  });

  it('resumes at the checklist hub when a session is already in progress', () => {
    const session = createSession('vehicle', 'unit', '11802');
    expect(resolveInitialState(session)).toEqual({ screen: 'hub', session });
  });

  it('resumes at review & send when a session has been finished but not yet sent', () => {
    const session = { ...createSession('vehicle', 'unit', '11802'), status: 'complete' as const };
    expect(resolveInitialState(session)).toEqual({ screen: 'review', session });
  });
});

import { describe, it, expect } from 'vitest';
import { isSessionReadyToClear, type SendStatusMap } from '../src/session/sendStatus';

describe('isSessionReadyToClear', () => {
  it('is false when nothing has been attempted yet', () => {
    const statuses: SendStatusMap = { sharepoint: 'idle', email: 'idle' };
    expect(isSessionReadyToClear(statuses)).toBe(false);
  });

  it('is true when the only attempted action succeeded', () => {
    const statuses: SendStatusMap = { sharepoint: 'sent', email: 'idle' };
    expect(isSessionReadyToClear(statuses)).toBe(true);
  });

  it('is false while an attempted action is still sending', () => {
    const statuses: SendStatusMap = { sharepoint: 'sending', email: 'idle' };
    expect(isSessionReadyToClear(statuses)).toBe(false);
  });

  it('is false when an attempted action failed, even if the other succeeded', () => {
    const statuses: SendStatusMap = { sharepoint: 'sent', email: 'failed' };
    expect(isSessionReadyToClear(statuses)).toBe(false);
  });

  it('is true once both attempted actions succeed', () => {
    const statuses: SendStatusMap = { sharepoint: 'sent', email: 'sent' };
    expect(isSessionReadyToClear(statuses)).toBe(true);
  });
});

export type SendActionStatus = 'idle' | 'sending' | 'sent' | 'failed';
export type SendActionKey = 'sharepoint' | 'email';
export type SendStatusMap = Record<SendActionKey, SendActionStatus>;

export function isSessionReadyToClear(statuses: SendStatusMap): boolean {
  const attempted = Object.values(statuses).filter((s) => s !== 'idle');
  if (attempted.length === 0) return false;
  return attempted.every((s) => s === 'sent');
}

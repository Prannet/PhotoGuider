import type { Session } from '../types';
import { categoriesFor } from '../constants';
import { photoCountFor } from '../session/session';
import { buildSessionZip } from '../zip/buildZip';
import { zipFilename, dateOnly } from '../naming';
import { uploadZipToSharePoint } from '../upload/sharepointUpload';
import { shareZipViaEmail } from '../upload/shareEmail';
import { clearSession, recordIdentifierSent } from '../session/sessionStore';
import { isSessionReadyToClear, type SendStatusMap, type SendActionKey } from '../session/sendStatus';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderReviewSendScreen(container: HTMLElement, session: Session, onDone: () => void): void {
  const statuses: SendStatusMap = { sharepoint: 'idle', email: 'idle' };
  let zipCache: { blob: Blob; filename: string } | null = null;

  async function getZip() {
    if (!zipCache) {
      const blob = await buildSessionZip(session);
      const filename = zipFilename(session.identifier, session.sessionType, session.createdAt);
      zipCache = { blob, filename };
    }
    return zipCache;
  }

  function statusLabel(status: SendStatusMap[SendActionKey]): string {
    switch (status) {
      case 'idle':
        return '';
      case 'sending':
        return 'Uploading…';
      case 'sent':
        return 'Sent ✓';
      case 'failed':
        return 'Failed — Retry';
    }
  }

  async function handleAction(key: SendActionKey) {
    statuses[key] = 'sending';
    draw();

    try {
      const { blob, filename } = await getZip();
      if (key === 'sharepoint') {
        await uploadZipToSharePoint(filename, blob);
      } else {
        await shareZipViaEmail(filename, blob);
      }
      statuses[key] = 'sent';
      await recordIdentifierSent(session.identifier, dateOnly(session.createdAt));
    } catch {
      statuses[key] = 'failed';
    }

    if (isSessionReadyToClear(statuses)) {
      await clearSession(session.id);
      draw();
      onDone();
      return;
    }

    draw();
  }

  function draw() {
    const summary = categoriesFor(session.sessionType)
      .map((c) => `<li>${escapeHtml(c.label)}: ${photoCountFor(session, c.key)}</li>`)
      .join('');

    container.innerHTML = `
      <h1>Review Session — ${escapeHtml(session.identifier)}</h1>
      <ul>${summary}</ul>
      <button id="send-sharepoint" ${statuses.sharepoint === 'sending' ? 'disabled' : ''}>
        Send to SharePoint ${statusLabel(statuses.sharepoint)}
      </button>
      <button id="send-email" ${statuses.email === 'sending' ? 'disabled' : ''}>
        Send via Email ${statusLabel(statuses.email)}
      </button>
    `;

    container.querySelector<HTMLButtonElement>('#send-sharepoint')!.addEventListener('click', () => {
      handleAction('sharepoint');
    });
    container.querySelector<HTMLButtonElement>('#send-email')!.addEventListener('click', () => {
      handleAction('email');
    });
  }

  draw();
}
